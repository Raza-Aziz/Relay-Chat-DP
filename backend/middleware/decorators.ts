import { Request, Response, NextFunction } from 'express';
import channelValid from '../api/chatHash/utils/validateChannel';
import getClientInstance from '../socket.io/clients';

type AsyncRouteHandler = (req: Request, res: Response, next?: NextFunction) => Promise<any>;

export const withAsyncErrorHandling = (handler: AsyncRouteHandler): AsyncRouteHandler => {
  return async (req: Request, res: Response, next?: NextFunction) => {
    try {
      return await handler(req, res, next);
    } catch (e: any) {
      console.error(e);
      const message = process.env.NODE_ENV === 'production' ? 'Internal server error' : e.message;
      return res.status(500).send({ error: message });
    }
  };
};

export const withChannelValidation = (handler: AsyncRouteHandler): AsyncRouteHandler => {
  return async (req: Request, res: Response, next?: NextFunction) => {
    const channel = req.body?.channel || req.query?.channel || req.params?.channel;

    if (!channel) {
      return res.status(400).send({ error: "Channel is required" });
    }

    const { valid } = await channelValid(channel as string);
    if (!valid) {
      return res.sendStatus(404);
    }

    // Channel is valid — proceed to the wrapped handler
    return handler(req, res, next);
  };
};

export const withSenderAuth = (handler: AsyncRouteHandler): AsyncRouteHandler => {
  const clients = getClientInstance();

  return async (req: Request, res: Response, next?: NextFunction) => {
    const { sender, channel } = req.body;

    if (!sender || !channel) {
      return res.status(400).send({ error: "Sender and channel are required" });
    }

    if (!clients.isSenderInChannel(channel, sender)) {
      console.error('Sender is not in channel');
      return res.status(401).send({ error: "Permission denied" });
    }

    // Sender is authenticated — proceed to the wrapped handler
    return handler(req, res, next);
  };
};

export const compose = (...decorators: Array<(h: AsyncRouteHandler) => AsyncRouteHandler>) => {
  return (handler: AsyncRouteHandler): AsyncRouteHandler => {
    return decorators.reduceRight((h, decorator) => decorator(h), handler);
  };
};
