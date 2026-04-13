import { User } from "@prisma/client";

export const toSecureUser = (user: User) => {
    return {
        id: user.id,
        name: user.name,
        username: user.username,
        avatar: user.avatar,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        emailVerified: user.emailVerified,
        publicKey: user.publicKey,
        notificationsEnabled: user.notificationsEnabled,
        verificationBadge: user.verificationBadge,
        fcmToken: user.fcmToken,
        oAuthSignup: user.oAuthSignup
    };
};
