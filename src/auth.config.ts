import type { NextAuthConfig } from "next-auth";

// Edge-safe config: no Prisma, no bcrypt, no MySQL.
// Middleware only checks the login cookie.
export const authConfig = {
  trustHost: true,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "ADMIN" | "TEAM_LEAD";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
