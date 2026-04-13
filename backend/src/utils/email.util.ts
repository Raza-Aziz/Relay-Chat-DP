import { transporter } from "../config/nodemailer.config.js"
import { otpVerificationBody, privateKeyRecoveryBody,resetPasswordBody, welcomeEmailBody } from "../constants/emails/email.body.js"
import { otpVerificationSubject, privateKeyRecoverySubject, resetPasswordSubject, welcomeEmailSubject } from "../constants/emails/email.subject.js"
import type { EmailType } from "../interfaces/email/email.interface.js"
import { env } from "../schemas/env.schema.js"

export const sendMail = async(to:string,username:string,type:EmailType,resetUrl?:string,otp?:string,verificationUrl?:string)=>{
    const emailStrategies: Record<EmailType, () => { subject: string; html: string }> = {
        OTP: () => ({
            subject: otpVerificationSubject,
            html: otpVerificationBody(username, otp!)
        }),
        resetPassword: () => ({
            subject: resetPasswordSubject,
            html: resetPasswordBody(username, resetUrl!)
        }),
        welcome: () => ({
            subject: welcomeEmailSubject,
            html: welcomeEmailBody(username)
        }),
        privateKeyRecovery: () => ({
            subject: privateKeyRecoverySubject,
            html: privateKeyRecoveryBody(username, verificationUrl!)
        })
    };

    const { subject, html } = emailStrategies[type]();

    await transporter.sendMail({
        from: env.EMAIL,
        to,
        subject,
        html,
    });
}