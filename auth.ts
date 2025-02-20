import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

// 認証APIのベースパス
export const BASE_PATH = "/api/auth";

// ユーザーの型定義
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export const { auth, handlers, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope:
            "https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events",
        },
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  callbacks: {
    jwt: async ({ token, user, account }) => {
      // `user` や `account` がある場合のみ更新（認証時のみ）
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
      } else {
        // console.log("⚠️ account は undefined");
      }

      if (user) {
        token.user = user;
        token.role = (user as User).role ?? "user";
      } else {
        // console.log("⚠️ user は undefined");
      }

      // `role` が未設定ならDBから取得（セッション更新時）
      if (!token.role) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { role: true },
        });
        token.role = dbUser?.role ?? "user";
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (!token) {
        return session;
      }

      if (session.user) {
        session.user.role = token.role as string;
        session.user.accessToken = token.accessToken as string;
        session.user.refreshToken = token.refreshToken as string;
      }
      return session;
    },
  },
});
