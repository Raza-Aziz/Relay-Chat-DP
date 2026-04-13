import { UploadApiResponse } from "cloudinary";
import { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../interfaces/auth/auth.interface.js";
import { prisma } from "../lib/prisma.lib.js";
import { deleteFilesFromCloudinary, uploadFilesToCloudinary } from "../utils/auth.util.js";
import { sendMail } from "../utils/email.util.js";
import { CustomError, asyncErrorHandler } from "../utils/error.utils.js";
import { toSecureUser } from "../utils/user.mapper.js";

export const udpateUser  = asyncErrorHandler(async(req:AuthenticatedRequest,res:Response,next:NextFunction)=>{
        
        if(!req.file){
            return next(new CustomError("Please provide an image",400))
        }

        let uploadResults:UploadApiResponse[] | undefined
        const existingAvatarPublicId = req.user.avatarCloudinaryPublicId

        if(!existingAvatarPublicId){
            uploadResults = await uploadFilesToCloudinary({files:[req.file]})
            if(!uploadResults){
                return next(new CustomError("Some error occured",500))
            }
        }
        else{
            const cloudinaryFilePromises = [
                deleteFilesFromCloudinary({publicIds:[existingAvatarPublicId]}),
                uploadFilesToCloudinary({files:[req.file]})
            ]
            const [_,result] = await Promise.all(cloudinaryFilePromises) as [any,UploadApiResponse[] | undefined]
            if(!result) return next(new CustomError("Some error occured",500))
            uploadResults = result
        }
        
        const user = await prisma.user.update({
            where:{
                id:req.user.id
            },
            data:{
                avatar:uploadResults[0].secure_url,
                avatarCloudinaryPublicId:uploadResults[0].public_id
            }
        })

        return res.status(200).json(toSecureUser(user))
    }
)

export const testEmailHandler = asyncErrorHandler(async(req:AuthenticatedRequest,res:Response,next:NextFunction)=>{

    const {emailType} = req.query


    const testEmailStrategies: Record<string, () => Promise<void>> = {
        welcome: () => sendMail(req.user.email, req.user.username, 'welcome'),
        resetPassword: () => sendMail(req.user.email, req.user.username, 'resetPassword', 'https://mernchat.online'),
        otpVerification: () => sendMail(req.user.email, req.user.username, 'OTP', undefined, "3412"),
        privateKeyRecovery: () => sendMail(req.user.email, req.user.username, 'privateKeyRecovery', undefined, undefined, 'https://mernchat.online'),
    };

    const handler = testEmailStrategies[emailType as string];
    if (handler) {
        await handler();
        return res.status(200).json({ message: `sent ${emailType}` });
    }

    res.status(400).json({ message: "Invalid email type" });
})

