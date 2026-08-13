import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role: "ADMIN" | "TEAM_LEAD";
  }

  interface Session {
    user: {
      id: string;
      role: "ADMIN" | "TEAM_LEAD";
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: "ADMIN" | "TEAM_LEAD";
  }
}
