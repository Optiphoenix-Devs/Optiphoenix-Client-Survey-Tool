import type { NextAuthConfig } from "next-auth";

// Edge-safe config: no Prisma, no bcrypt, no MySQL.
// Middleware only checks the login cookie.
export const authConfig = {
  // Required on Vercel (middleware + login). Reads AUTH_SECRET from env.
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  trustHost: true,
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24,
  },
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    // Edge-safe: middleware only needs a present cookie. Server `auth()` in
    // auth.ts re-validates sessionVersion against the database.
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
        token.name = user.name;
        token.picture = user.image;
        token.sessionVersion = user.sessionVersion;
        token.error = undefined;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "ADMIN" | "TEAM_LEAD";
        session.user.name = token.name;
        session.user.image = token.picture;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
