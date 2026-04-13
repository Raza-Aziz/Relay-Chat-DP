import { Server, Socket } from "socket.io";
import { userSocketIds } from "../index.js";

/**
 * A generic helper to execute an action on a set of user sockets.
 * This implements a variation of the Template Method pattern by 
 * encapsulating the iteration and lookup logic.
 */
const executeOnSocket = (io: Server, memberIds: string[], action: (socket: Socket) => void) => {
    for (const memberId of memberIds) {
        const memberSocketId = userSocketIds.get(memberId);
        if (memberSocketId) {
            const memberSocket = io.sockets.sockets.get(memberSocketId);
            if (memberSocket) {
                action(memberSocket);
            }
        }
    }
};

export const joinMembersInChatRoom = ({
    memberIds,
    roomToJoin,
    io
}: {
    memberIds: string[],
    roomToJoin: string,
    io: Server
}) => {
    executeOnSocket(io, memberIds, (socket) => socket.join(roomToJoin));
};

export const disconnectMembersFromChatRoom = ({
    memberIds,
    roomToLeave,
    io
}: {
    memberIds: string[],
    roomToLeave: string,
    io: Server
}) => {
    executeOnSocket(io, memberIds, (socket) => socket.leave(roomToLeave));
};