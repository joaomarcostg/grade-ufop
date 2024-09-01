import type { GetServerSidePropsContext, NextApiRequest, NextApiResponse } from "next";
import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import { Adapter } from "next-auth/adapters";

const prisma = new PrismaClient();

export const config: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  pages: {
    signIn: "/auth/login",
    signOut: "/auth/signout",
    error: "/auth/error",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      console.log("SignIn callback triggered", { account, profile });

      if (!account || !profile) {
        console.error("Sign in failed: Missing account or profile information");
        return false;
      }

      if (account.provider !== "google") {
        console.error("Sign in failed: Only Google authentication is supported");
        return false;
      }

      const isAllowedDomain = profile.email?.endsWith("ufop.edu.br");
      if (!isAllowedDomain) {
        console.error("Sign in failed: Email domain not allowed");
        return false;
      }

      console.log("Sign in successful");
      return true;
    },

    async session({ session, user }) {
      console.log("Session callback triggered", { session, user });
      return session;
    },
  },
} satisfies NextAuthOptions;

// Use it in server contexts
export function auth(
  ...args: [GetServerSidePropsContext["req"], GetServerSidePropsContext["res"]] | [NextApiRequest, NextApiResponse] | []
) {
  return getServerSession(...args, config);
}
