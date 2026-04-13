import { NextFunction, Response } from "express";
import { Server } from "socket.io";
import { Events } from "../enums/event/event.enum.js";
import { AuthenticatedRequest } from "../interfaces/auth/auth.interface.js";
import { prisma } from "../lib/prisma.lib.js";
import { joinMembersInChatRoom } from "../utils/chat.util.js";
import { CustomError } from "../utils/error.utils.js";
import { sendPushNotification } from "../utils/generic.js";
import { emitEvent, emitEventToRoom } from "../utils/socket.util.js";
import { ChatFactory } from "../factories/chat.factory.js";

/**
 * Strategy interface for handling friend request actions.
 */
export interface RequestActionStrategy {
    execute: (req: AuthenticatedRequest, res: Response, next: NextFunction, isExistingRequest: any) => Promise<any>;
}

export class AcceptRequestStrategy implements RequestActionStrategy {
    async execute(req: AuthenticatedRequest, res: Response, next: NextFunction, isExistingRequest: any) {
        const existingChat = await prisma.chat.findFirst({
            where: {
                isGroupChat: false,
                ChatMembers: {
                    every: {
                        userId: { in: [isExistingRequest.senderId, isExistingRequest.receiverId] }
                    }
                }
            }
        });

        if (existingChat) {
            return next(new CustomError("Your private chat already exists", 400));
        }

        const io: Server = req.app.get('io');
        const newChat = await ChatFactory.createPrivateChat(io, isExistingRequest.senderId, isExistingRequest.receiverId);

        const newFriendEntry = await prisma.friends.create({
            data: {
                user1: { connect: { id: isExistingRequest.senderId } },
                user2: { connect: { id: isExistingRequest.receiverId } }
            },
            include: {
                user1: true,
                user2: true,
            }
        });

        let sender = newFriendEntry.user1;
        if (sender.id != isExistingRequest.senderId) {
            sender = newFriendEntry.user2;
        }

        if (sender.notificationsEnabled && sender.fcmToken) {
            sendPushNotification({ fcmToken: sender.fcmToken, body: `${req.user.username} has accepted your friend request 😃` });
        }

        joinMembersInChatRoom({ io, memberIds: [isExistingRequest.senderId, isExistingRequest.receiverId], roomToJoin: newChat.id });

        await prisma.friendRequest.delete({
            where: { id: isExistingRequest.id }
        });

        emitEventToRoom({ data: { ...newChat, typingUsers: [] }, event: Events.NEW_CHAT, io, room: newChat.id });
        return res.status(200).json({ id: isExistingRequest.id });
    }
}

export class RejectRequestStrategy implements RequestActionStrategy {
    async execute(req: AuthenticatedRequest, res: Response, next: NextFunction, isExistingRequest: any) {
        const deletedRequest = await prisma.friendRequest.delete({
            where: { id: isExistingRequest.id },
            include: {
                sender: {
                    select: {
                        isOnline: true,
                        fcmToken: true,
                        notificationsEnabled: true,
                    }
                }
            }
        });

        const sender = deletedRequest.sender;
        if (sender.fcmToken && sender.notificationsEnabled) {
            sendPushNotification({ fcmToken: sender.fcmToken, body: `${req.user.username} has rejected your friend request ☹️` });
        }
        return res.status(200).json({ id: deletedRequest.id });
    }
}
