import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/prisma";

// 認証APIのベースパス
export const BASE_PATH = "/api/auth";

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
      console.log("🔹 jwt callback - 初期 token:", token);
      console.log("🔹 jwt callback - user:", user);
      console.log("🔹 jwt callback - account:", account);

      // `user` や `account` がある場合のみ更新（認証時のみ）
      if (account) {
        console.log("✅ account あり -> アクセストークンをセット");
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
      } else {
        console.log("⚠️ account は undefined");
      }

      if (user) {
        console.log("✅ user あり -> ユーザー情報をセット");
        token.user = user;
        token.role = (user as any).role ?? "user";
      } else {
        console.log("⚠️ user は undefined");
      }

      // `role` が未設定ならDBから取得（セッション更新時）
      if (!token.role) {
        console.log("🔍 データベースから role を取得");
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { role: true },
        });
        token.role = dbUser?.role ?? "user";
      }

      console.log("🔹 jwt callback - 更新後 token:", token);
      return token;
    },
    session: async ({ session, token }) => {
      console.log("🟢 session callback - 初期 session:", session);
      console.log("🟢 session callback - token:", token);

      if (!token) {
        console.error("❌ token が undefined");
        return session;
      }

      if (session.user) {
        session.user.role = token.role as string;
        session.user.accessToken = token.accessToken as string;
        session.user.refreshToken = token.refreshToken as string;
      }

      console.log("🟢 session callback - 更新後 session:", session);
      return session;
    },
  },
});
