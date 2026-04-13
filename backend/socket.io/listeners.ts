/**
 * Socket Listeners — Uses Observer (Pub/Sub) Pattern
 * 
 * Instead of directly calling socketEmit, listeners now publish
 * events through the EventBus. The socket.io/index.ts module
 * subscribes to these events and handles the actual socket emission.
 */

import getClientInstance from "./clients";
import channelValid from "../api/chatHash/utils/validateChannel";
import { socketEmit, SOCKET_TOPIC, CustomSocket } from "./index";
import EventBus from "./EventBus";
import db from "../db";
import { MESSAGE_COLLECTION } from "../db/const";

const clients = getClientInstance();
const eventBus = EventBus.getInstance();

// Define internal event names for the Pub/Sub system
export const EVENTS = {
  USER_JOINED: 'user:joined',
  USER_DISCONNECTED: 'user:disconnected',
  MESSAGE_DELIVERED: 'message:delivered',
  CHANNEL_LIMIT_REACHED: 'channel:limit-reached',
  MESSAGE_RECEIVED_ON_SERVER: 'message:received-on-server',
} as const;

// ─── Subscribe: Wire EventBus events to socket emissions ───
eventBus.subscribe(EVENTS.USER_JOINED, ({ sid, publicKey }: { sid: string; publicKey: string }) => {
  socketEmit<SOCKET_TOPIC.ON_ALICE_JOIN>(SOCKET_TOPIC.ON_ALICE_JOIN, sid, { publicKey });
});

eventBus.subscribe(EVENTS.USER_DISCONNECTED, ({ sid }: { sid: string }) => {
  socketEmit<SOCKET_TOPIC.ON_ALICE_DISCONNECTED>(SOCKET_TOPIC.ON_ALICE_DISCONNECTED, sid, null);
});

eventBus.subscribe(EVENTS.MESSAGE_DELIVERED, ({ sid, id }: { sid: string; id: string }) => {
  socketEmit<SOCKET_TOPIC.DELIVERED>(SOCKET_TOPIC.DELIVERED, sid, id);
});

eventBus.subscribe(EVENTS.CHANNEL_LIMIT_REACHED, ({ sid }: { sid: string }) => {
  socketEmit<SOCKET_TOPIC.LIMIT_REACHED>(SOCKET_TOPIC.LIMIT_REACHED, sid, null);
});

// Persistence Subscriber: Saves encrypted messages to DB when they arrive on server
eventBus.subscribe(EVENTS.MESSAGE_RECEIVED_ON_SERVER, async (messageData: any) => {
  try {
    await db.insertInDb(messageData, MESSAGE_COLLECTION);
  } catch (err) {
    console.error("Failed to save chat log to DB:", err);
  }
});

// ─── Publish: Socket event handlers publish through EventBus ───
const connectionListener = (socket: CustomSocket, io) => {
  socket.on("chat-join", async (data) => {
    const { userID, channelID, publicKey } = data;

    const { valid } = await channelValid(channelID);
    if (!valid) {
      console.error("Invalid channelID - ", channelID);
      return;
    }
    const usersInChannel = clients.getClientsByChannel(channelID) || {};
    const userCount = Object.keys(usersInChannel).length;

    const receiverSocket = io.sockets.sockets[socket.id];
    if (userCount === 2 && receiverSocket) {
      // Publish limit-reached event instead of direct socketEmit
      eventBus.publish(EVENTS.CHANNEL_LIMIT_REACHED, { sid: socket.id });
      receiverSocket.disconnect();
      return;
    }

    clients.setClientToChannel(userID, channelID, socket.id);
    socket.channelID = channelID;
    socket.userID = userID;

    // Notify existing peer that a new user joined
    const receiverId = Object.keys(usersInChannel).find(user => user !== userID);
    const receiver = receiverId && clients.getSIDByIDs(receiverId, channelID);
    if (receiver) {
      // Publish join event instead of direct socketEmit
      eventBus.publish(EVENTS.USER_JOINED, { sid: receiver.sid, publicKey });
    }
  });

  socket.on("received", ({ channel, sender, id }) => {
    const { sid } = clients.getSIDByIDs(sender, channel);
    // Publish delivery confirmation instead of direct socketEmit
    eventBus.publish(EVENTS.MESSAGE_DELIVERED, { sid, id });
  });

  socket.on("disconnect", () => {
    const { channelID, userID } = socket;
    if (!(channelID && userID)) {
      return;
    }
    try {
      const receiver = clients.getSIDByIDs(userID, channelID);
      if (receiver) {
        clients.deleteClient(userID, channelID);
        // Publish disconnect event instead of direct socketEmit
        eventBus.publish(EVENTS.USER_DISCONNECTED, { sid: receiver.sid });
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log(err);
    }
  });

  socket.emit(SOCKET_TOPIC.MESSAGE, "ping!");
};

export default connectionListener;
