import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { createAuthMiddleware } from "better-auth/api";
import prisma from "./prisma";
import { createSession } from "./auth";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 24 * 30, // 30 days
    },
  },
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      // After OAuth callback completes, create our custom session cookie
      if (ctx.path.startsWith("/callback/")) {
        const newSession = ctx.context.newSession;
        if (newSession?.user?.id) {
          await createSession(newSession.user.id);
        }
      }
    }),
  },
});
