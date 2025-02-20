import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Header from "./header";
import Footer from "./footer";
import Head from "next/head";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "調整ちゃん | 日程登録",
  description: "たったの2ステップでイベント登録",
  keywords: ["イベント", "スケジュール", "調整", "日程調整"],
  robots: "index, follow",
  openGraph: {
    type: "website",
    url: "https://www.chouseichan.com/",
    title: "調整ちゃん | 日程登録",
    description: "たったの2ステップでイベント登録",
    images: [
      {
        url: "/logo.png", // `public` フォルダの画像を使用
        width: 1200,
        height: 630,
        alt: "調整ちゃんロゴ",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@your_twitter_handle", // 公式アカウントがあれば追加
    title: "調整ちゃん | 日程登録",
    description: "たったの2ステップでイベント登録",
    images: ["/logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Head>
        <title>調整ちゃん | イベント登録</title>

        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.chouseichan.com/" />
        <meta property="og:image" content="./logo.png" />
        <meta property="og:title" content="調整ちゃん" />
      </Head>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <Header />
          {children}
          <Footer />
        </body>
      </html>
    </>
  );
}
