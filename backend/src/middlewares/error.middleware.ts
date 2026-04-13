import { NextFunction, Request, Response } from "express";
import { CustomError } from "../utils/error.utils.js";
import { ZodError } from "zod";
import jwt from 'jsonwebtoken';
import { MulterError } from "multer";

/**
 * Interface for Error Handlers in the Chain of Responsibility.
 */
interface IErrorHandler {
    setNext(handler: IErrorHandler): IErrorHandler;
    handle(err: any): { statusCode: number; message: string } | null;
}

/**
 * Base class for Error Handlers.
 */
abstract class BaseErrorHandler implements IErrorHandler {
    private nextHandler: IErrorHandler | null = null;

    setNext(handler: IErrorHandler): IErrorHandler {
        this.nextHandler = handler;
        return handler;
    }

    handle(err: any): { statusCode: number; message: string } | null {
        if (this.nextHandler) {
            return this.nextHandler.handle(err);
        }
        return null; // End of chain
    }
}

/**
 * Handles Zod validation errors.
 */
class ZodErrorHandler extends BaseErrorHandler {
    handle(err: any) {
        if (err instanceof ZodError) {
            return {
                statusCode: 400,
                message: err.issues.map(issue => issue.message).join(", ")
            };
        }
        return super.handle(err);
    }
}

/**
 * Handles application-specific CustomErrors.
 */
class AppCustomErrorHandler extends BaseErrorHandler {
    handle(err: any) {
        if (err instanceof CustomError) {
            return {
                statusCode: err.statusCode,
                message: err.message
            };
        }
        return super.handle(err);
    }
}

/**
 * Handles JWT related errors.
 */
class JwtErrorHandler extends BaseErrorHandler {
    handle(err: any) {
        if (err instanceof jwt.TokenExpiredError) {
            return { statusCode: 401, message: "Token expired, please login again" };
        }
        if (err instanceof jwt.JsonWebTokenError) {
            return { statusCode: 401, message: "Invalid Token, please login again" };
        }
        return super.handle(err);
    }
}

/**
 * Handles Multer upload errors.
 */
class MulterErrorHandler extends BaseErrorHandler {
    handle(err: any) {
        if (err instanceof MulterError) {
            if (err.code === 'LIMIT_UNEXPECTED_FILE') {
                return { statusCode: 400, message: 'Too many files uploaded. Maximum 5 files allowed.' };
            }
            return { statusCode: 400, message: err.message };
        }
        return super.handle(err);
    }
}

/**
 * Fallback for any unhandled generic errors.
 */
class GlobalErrorHandler extends BaseErrorHandler {
    handle(err: any) {
        return {
            statusCode: 500,
            message: err.message || "Internal Server Error"
        };
    }
}

// Initialize the chain
const zodHandler = new ZodErrorHandler();
const customHandler = new AppCustomErrorHandler();
const jwtHandler = new JwtErrorHandler();
const multerHandler = new MulterErrorHandler();
const globalHandler = new GlobalErrorHandler();

zodHandler
    .setNext(customHandler)
    .setNext(jwtHandler)
    .setNext(multerHandler)
    .setNext(globalHandler);

export const errorMiddleware = (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    console.error(err);

    const result = zodHandler.handle(err);
    
    // Safety fallback if the chain somehow fails to return a result
    const statusCode = result?.statusCode || 500;
    const message = result?.message || "Internal Server Error";

    return res.status(statusCode).json({ message });
};