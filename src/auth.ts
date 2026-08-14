import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations";
import { clearLoginLock, consumeSignupToken, isLocked, recordFailedLogin } from "@/lib/auth-security";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 7,
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
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            image: user.avatarUrl,
          };
        }

        const parsed = loginSchema.safeParse(credentials);
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

        await clearLoginLock(user.id);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.avatarUrl,
        };
      },
    }),
  ],
});
