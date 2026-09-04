import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations";
import {
  consumeSignupToken,
  isLocked,
  recordFailedLogin,
  rotateSessionVersion,
} from "@/lib/auth-security";

const SESSION_MAX_AGE_SEC = 60 * 60 * 24; // 24 hours

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE_SEC,
  },
  callbacks: {
    async jwt({ token, user }) {
      // New sign-in: always re-read sessionVersion from DB (custom authorize
      // fields are not always forwarded onto `user` by Auth.js).
      if (user?.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: {
            sessionVersion: true,
            role: true,
            name: true,
            avatarUrl: true,
            status: true,
          },
        });
        if (!dbUser || dbUser.status !== "APPROVED") {
          return { ...token, error: "InvalidSession" };
        }
        return {
          ...token,
          id: user.id,
          email: user.email,
          role: dbUser.role,
          name: dbUser.name,
          picture: dbUser.avatarUrl,
          sessionVersion: dbUser.sessionVersion,
          error: undefined,
        };
      }

      const userId = (token.id as string | undefined) ?? token.sub;
      if (!userId || typeof token.sessionVersion !== "number") {
        return { ...token, error: "InvalidSession" };
      }

      try {
        const dbUser = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            sessionVersion: true,
            status: true,
            role: true,
            name: true,
            avatarUrl: true,
          },
        });

        if (
          !dbUser ||
          dbUser.status !== "APPROVED" ||
          dbUser.sessionVersion !== token.sessionVersion
        ) {
          return { ...token, error: "SessionReplaced" };
        }

        return {
          ...token,
          id: userId,
          role: dbUser.role,
          name: dbUser.name,
          picture: dbUser.avatarUrl,
          error: undefined,
        };
      } catch {
        // Keep the existing token if DB is briefly unreachable.
        return token;
      }
    },
    session({ session, token }) {
      if (
        token.error ||
        !token.id ||
        typeof token.sessionVersion !== "number" ||
        !token.role
      ) {
        return {
          ...session,
          user: undefined as unknown as typeof session.user,
          expires: new Date(0).toISOString(),
        };
      }
      session.user = {
        ...session.user,
        id: token.id as string,
        role: token.role as "ADMIN" | "TEAM_LEAD",
        name: token.name,
        email: (token.email as string | undefined) ?? session.user?.email ?? "",
        image: token.picture,
      };
      return session;
    },
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        signupToken: { label: "Signup token", type: "text" },
      },
      async authorize(credentials) {
        const signupToken =
          typeof credentials?.signupToken === "string" ? credentials.signupToken : "";
        if (signupToken) {
          const user = await consumeSignupToken(signupToken);
          if (!user) return null;
          const sessionUser = await rotateSessionVersion(user.id);
          return {
            id: sessionUser.id,
            email: sessionUser.email,
            name: sessionUser.name,
            role: sessionUser.role,
            image: sessionUser.avatarUrl,
            sessionVersion: sessionUser.sessionVersion,
          };
        }

        const parsed = loginSchema.safeParse({
          email: credentials?.email,
          password: credentials?.password,
        });
        if (!parsed.success) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email.toLowerCase() },
        });

        if (!user) {
          return null;
        }

        if (user.status !== "APPROVED") {
          return null;
        }

        if (isLocked(user.lockedUntil)) {
          return null;
        }

        const passwordMatches = await bcrypt.compare(
          parsed.data.password,
          user.password
        );

        if (!passwordMatches) {
          await recordFailedLogin(user.id);
          return null;
        }

        // New login wins — bump version so other devices are signed out.
        const sessionUser = await rotateSessionVersion(user.id);

        return {
          id: sessionUser.id,
          email: sessionUser.email,
          name: sessionUser.name,
          role: sessionUser.role,
          image: sessionUser.avatarUrl,
          sessionVersion: sessionUser.sessionVersion,
        };
      },
    }),
  ],
});
