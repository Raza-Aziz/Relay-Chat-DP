import { Request } from "express";
import { Prisma } from "@prisma/client";

export interface AuthenticatedRequest extends Request {
    user: any
    file?: any
    query: any
}

export interface OAuthAuthenticatedRequest extends Request {
    user?: Prisma.UserCreateInput & { newUser: boolean, googleId: string }
}

export interface IAvatar {
    secureUrl: string,
    publicId: string
}

export interface IGithub {
    id: string
    displayName: string
    username: string
    photos: Array<{ value: string }>
    _json: { email: string }
}