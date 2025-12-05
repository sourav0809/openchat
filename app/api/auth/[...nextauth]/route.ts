import NextAuth, { NextAuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";

import { userService } from "@/services/user.service";
import { eq } from "drizzle-orm";
import { User } from "@/schema/user";

export const authOptions: NextAuthOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],

  pages: {
    signIn: "/auth",
  },

  callbacks: {
    async signIn({ user }) {
      if (!user.email || !user.name) return false;

      const res = await userService.getAUser(eq(User.email, user.email));

      if (!res) {
        await userService.createUser({
          name: user.name,
          email: user.email,
          image: user.image,
        });
      }
      return true;
    },

    async jwt({ token, user }) {
      if (user?.email) {
        const dbUser = await userService.getAUser(eq(User.email, user.email));
        if (dbUser) {
          token.sub = dbUser.id; // Use DB UUID instead of GitHub/Google ID
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
