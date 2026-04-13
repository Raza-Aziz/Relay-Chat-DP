import { Server } from "socket.io";
import { Events } from "../enums/event/event.enum.js";
import { prisma } from "../lib/prisma.lib.js";
import { joinMembersInChatRoom } from "../utils/chat.util.js";
import { emitEventToRoom } from "../utils/socket.util.js";

/**
 * Factory for creating different types of chats.
 * Implements the Factory Method pattern to encapsulate chat creation complexity.
 */
export class ChatFactory {
    /**
     * Creates a private (one-to-one) chat.
     */
    static async createPrivateChat(io: Server, senderId: string, receiverId: string) {
        return await prisma.chat.create({
            data: {
                ChatMembers: {
                    create: [
                        { user: { connect: { id: senderId } } },
                        { user: { connect: { id: receiverId } } }
                    ]
                }
            },
            omit: {
                avatarCloudinaryPublicId: true,
            },
            include: this.getChatInclude(senderId) // receiverId or senderId? Usually the requester
        });
    }

    /**
     * Creates a group chat.
     */
    static async createGroupChat(io: Server, adminId: string, memberIds: string[], name: string, avatar: string, avatarPublicId: string | null) {
        const newChat = await prisma.chat.create({
            data: {
                avatar,
                avatarCloudinaryPublicId: avatarPublicId,
                isGroupChat: true,
                adminId: adminId,
                name,
            },
            select: { id: true }
        });

        await prisma.chatMembers.createMany({
            data: memberIds.map(id => ({
                chatId: newChat.id,
                userId: id
            }))
        });

        const populatedChat = await prisma.chat.findUnique({
            where: { id: newChat.id },
            omit: { avatarCloudinaryPublicId: true },
            include: this.getChatInclude(adminId)
        });

        joinMembersInChatRoom({ memberIds, roomToJoin: newChat.id, io });
        emitEventToRoom({ event: Events.NEW_CHAT, io, room: newChat.id, data: { ...populatedChat, typingUsers: [] } });

        return populatedChat;
    }

    /**
     * Shared include logic for chat objects to ensure consistency.
     */
    private static getChatInclude(currentUserId: string) {
        return {
            ChatMembers: {
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                            avatar: true,
                            isOnline: true,
                            publicKey: true,
                            lastSeen: true,
                            verificationBadge: true,
                        }
                    },
                },
                omit: {
                    chatId: true,
                    userId: true,
                    id: true,
                }
            },
            UnreadMessages: {
                where: { userId: currentUserId },
                select: {
                    count: true,
                    message: {
                        select: {
                            isTextMessage: true,
                            url: true,
                            attachments: { select: { secureUrl: true } },
                            isPollMessage: true,
                            createdAt: true,
                            textMessageContent: true,
                        }
                    },
                    sender: {
                        select: {
                            id: true,
                            username: true,
                            avatar: true,
                            isOnline: true,
                            publicKey: true,
                            lastSeen: true,
                            verificationBadge: true
                        }
                    },
                }
            },
            latestMessage: {
                include: {
                    sender: {
                        select: { id: true, username: true, avatar: true }
                    },
                    attachments: { select: { secureUrl: true } },
                    poll: true,
                    reactions: {
                        include: {
                            user: { select: { id: true, username: true, avatar: true } },
                        },
                        omit: {
                            id: true,
                            createdAt: true,
                            updatedAt: true,
                            userId: true,
                            messageId: true
                        }
                    },
                }
            }
        };
    }
}
