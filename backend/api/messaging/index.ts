/**
 * Messaging Routes — Uses Decorator Pattern
 * 
 * Route handlers are wrapped with decorators for:
 * - Error handling (withAsyncErrorHandling)
 * - Channel validation (withChannelValidation)
 * - Sender authorization (withSenderAuth)
 * 
 * This keeps the core business logic clean and focused.
 */

import express, { Request, Response } from 'express';

import db from '../../db';
import { PUBLIC_KEY_COLLECTION, MESSAGE_COLLECTION } from '../../db/const';
import { SOCKET_TOPIC, socketEmit } from '../../socket.io';
import getClientInstance from '../../socket.io/clients';
import EventBus from '../../socket.io/EventBus';
import { EVENTS } from '../../socket.io/listeners';
import {
    ChatMessageType, GetPublicKeyResponse, MessageResponse, SharePublicKeyResponse, UsersInChannelResponse
} from './types';
import {
    withAsyncErrorHandling,
    withChannelValidation,
    withSenderAuth,
    compose
} from '../../middleware/decorators';

const router = express.Router({ mergeParams: true });
const clients = getClientInstance();

/**
 * POST /message
 * Decorated with: ErrorHandling → ChannelValidation → SenderAuth → Core Logic
 */
const sendMessageHandler = async (req: Request, res: Response): Promise<Response<MessageResponse>> => {
  const { message, sender, channel, image } = req.body;

  if (!message) {
    return res.send(400);
  }

  const receiver = clients.getReceiverIDBySenderID(sender, channel);
  if (!receiver) {
    console.error('No receiver is in the channel');
    return res.status(404).send({ error: "Receiver not found" });
  }

  const id = new Date().valueOf();
  const timestamp = new Date().valueOf();
  const dataToPublish: ChatMessageType = {
    channel,
    sender,
    message,
    id,
    timestamp
  };

  if (image) {
    return res.status(400).send({ message: "Image not supported" });
  }
  const receiverSid = clients.getSIDByIDs(receiver, channel).sid;
  socketEmit<SOCKET_TOPIC.CHAT_MESSAGE>(SOCKET_TOPIC.CHAT_MESSAGE, receiverSid, dataToPublish);

  // Publish event for background logging (Observer Pattern)
  EventBus.getInstance().publish(EVENTS.MESSAGE_RECEIVED_ON_SERVER, dataToPublish);

  return res.send({ message: "message sent", id, timestamp });
};

// Apply decorators: compose applies right-to-left
router.post(
  "/message",
  compose(
    withAsyncErrorHandling,
    withChannelValidation,
    withSenderAuth
  )(sendMessageHandler)
);

/**
 * POST /share-public-key
 * Decorated with: ErrorHandling → ChannelValidation → Core Logic
 */
const sharePublicKeyHandler = async (req: Request, res: Response): Promise<Response<SharePublicKeyResponse>> => {
  const { aesKey, publicKey, sender, channel } = req.body;

  const existing = await db.findOneFromDB<{ aesKey: string | null }>({ channel, user: sender }, PUBLIC_KEY_COLLECTION);
  if (existing) {
    if (existing.aesKey) {
      return res.status(409).send({ error: "Key already registered for this session" });
    }
    await db.updateOneFromDb({ channel, user: sender }, { aesKey }, PUBLIC_KEY_COLLECTION);
    return res.send({ status: "ok" });
  }
  await db.insertInDb({ aesKey, publicKey, user: sender, channel }, PUBLIC_KEY_COLLECTION);
  return res.send({ status: "ok" });
};

router.post(
  "/share-public-key",
  compose(
    withAsyncErrorHandling,
    withChannelValidation
  )(sharePublicKeyHandler)
);

/**
 * GET /get-public-key
 * Decorated with: ErrorHandling → ChannelValidation → Core Logic
 */
const getPublicKeyHandler = async (req: Request, res: Response): Promise<Response<GetPublicKeyResponse>> => {
  const { userId, channel } = req.query;

  const receiverID = clients.getReceiverIDBySenderID(userId as string, channel as string);
  const data = await db.findOneFromDB<GetPublicKeyResponse>({ channel, user: receiverID }, PUBLIC_KEY_COLLECTION);
  return res.send(data || {
    publicKey: null,
    aesKey: null
  });
};

router.get(
  "/get-public-key",
  compose(
    withAsyncErrorHandling,
    withChannelValidation
  )(getPublicKeyHandler)
);

/**
 * GET /get-users-in-channel
 * Decorated with: ErrorHandling → ChannelValidation → Core Logic
 */
const getUsersInChannelHandler = async (req: Request, res: Response): Promise<Response<UsersInChannelResponse>> => {
  const { channel } = req.query;

  const data = clients.getClientsByChannel(channel as string);
  const usersInChannel = data ? Object.keys(data).map((userId) => ({ uuid: userId })) : [];
  return res.send(usersInChannel);
};

router.get(
  "/get-users-in-channel",
  compose(
    withAsyncErrorHandling,
    withChannelValidation
  )(getUsersInChannelHandler)
);

/**
 * GET /logs/:channel
 * Verification route: Returns the encrypted chat logs stored on the server.
 * This proves that the server only sees 'garbage' ciphertext.
 */
const getChatLogsHandler = async (req: Request, res: Response): Promise<Response> => {
  const { channel } = req.params;

  // Retrieve all messages for this channel
  const messages = await db.findFromDB({ channel }, MESSAGE_COLLECTION);
  
  return res.send(messages);
};

router.get(
  "/logs/:channel",
  compose(
    withAsyncErrorHandling,
    withChannelValidation
  )(getChatLogsHandler as any)
);

export default router;
