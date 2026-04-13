/**
 * Call Session Routes — Uses Decorator Pattern
 * 
 * WebRTC session description relay, decorated with validation
 * and authorization middleware.
 */

import express, { Request, Response } from 'express';
import { WebrtcSessionResponse } from '../messaging/types';
import getClientInstance from '../../socket.io/clients';
import { SOCKET_TOPIC, socketEmit } from '../../socket.io';
import {
  withAsyncErrorHandling,
  withChannelValidation,
  withSenderAuth,
  compose
} from '../../middleware/decorators';

const router = express.Router({ mergeParams: true });
const clients = getClientInstance();

/**
 * POST /
 * Decorated with: ErrorHandling → ChannelValidation → SenderAuth → Core Logic
 */
const relaySessionHandler = async (req: Request, res: Response): Promise<Response<WebrtcSessionResponse>> => {
  const { description, sender, channel } = req.body;

  if (!description) {
    return res.send(400);
  }

  const receiver = clients.getReceiverIDBySenderID(sender, channel);
  if (!receiver) {
    console.error('No receiver is in the channel');
    return res.status(406).send({ error: "No user available to accept call" });
  }

  const receiverSid = clients.getSIDByIDs(receiver, channel).sid;
  socketEmit<SOCKET_TOPIC.WEBRTC_SESSION_DESCRIPTION>(SOCKET_TOPIC.WEBRTC_SESSION_DESCRIPTION, receiverSid, description);
  return res.send({ status: "ok" });
};

router.post(
  "/",
  compose(
    withAsyncErrorHandling,
    withChannelValidation,
    withSenderAuth
  )(relaySessionHandler)
);

export default router;