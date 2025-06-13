import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Noto_Sans_JP } from "next/font/google";
import NextTopLoader from 'nextjs-toploader';
import Script from 'next/script';
import Header from "./header";
import Footer from "./footer";
import Situation from "./component/footer/situation";
import ScrollToTopButton from "./component/scroll/ScrollToTopButton";
import MaintenancePage from "./component/maintenance/MaintenancePage";
import { isMaintenanceMode } from "./config/features";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: '#000000',
};

// サイト全体の基本的なメタデータ
export const metadata: Metadata = {
  title: "調整ちゃん | 簡単日程調整 ",
  description: "「調整ちゃん」はたったの2ステップでイベント登録。出欠管理が簡単！調整ちゃんはGoogleカレンダーと連携し、ユーザーがスケジュールを簡単に管理できるようにするサービスですGoogleカレンダーAPIを利用し、ユーザーの許可を得た上でイベントを作成・編集・削除する機能を提供します。友達や同僚とのスケジュール調整が簡単に。回答期限の設定、お店選び投票機能、主役設定機能など、幹事の人に役立つ機能がたくさんあります。イベントの画像もみんなで共有できて参加者も楽しめるサービスです。",
  keywords: ["イベント","簡単", "幹事","スケジュール", "調整", "日程調整", "スケジュール調整","カレンダー", "予定", "出欠", "グループ", "チーム", "オンライン", "AI", "日程提案"],
  robots: "index, follow",
  metadataBase: new URL('https://www.atumaruchan.com'),
  alternates: {
    canonical: '/',
    languages: {
      'ja': '/',
    },
  },
  authors: [{ name: '調整ちゃん' }],
  creator: '調整ちゃん',
  publisher: '調整ちゃん',
  openGraph: {
    type: "website",
    url: "https://www.atumaruchan.com/",
    title: "調整ちゃん | 簡単日程調整 ",
    description: "「調整ちゃん」はたったの2ステップでイベント登録。友達や同僚とのスケジュール調整が簡単に。回答期限の設定、お店選び投票機能、主役設定機能など、幹事の人に役立つ機能がたくさんあります。イベントの画像もみんなで共有できて参加者も楽しめるサービスです。",
    siteName: "調整ちゃん",
    images: [
      {
        url: "/logo.png", // `public` フォルダの画像を使用
        width: 1200,
        height: 630,
        alt: "調整ちゃんロゴ",
      },
    ],
    locale: 'ja_JP',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '調整ちゃん',
  },
  twitter: {
    card: "summary_large_image",
    site: "@atumaruchan2025", // 公式アカウントがあれば追加
    title: "調整ちゃん | 日程調整",
    description: "調整ちゃんはたったの2ステップでイベント登録。友達や同僚との予定調整が簡単に。",
    images: ["/logo.png"],
    creator: "@chousei",
  },
  verification: {
    google: "4v1wtxWCoFzykBXd4jYbKO-y4ajR2DA1YcB7iqDthys", // 必要に応じて実際のコードに置き換えてください
  },
  applicationName: "調整ちゃん",
  category: "イベント管理・スケジュール調整",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // メンテナンスモードが有効な場合はメンテナンス画面を表示
  if (isMaintenanceMode) {
    return (
      <html lang="ja">
        <body className={`${geistSans.variable} ${geistMono.variable} ${notoSansJP.variable} antialiased`}>
          <MaintenancePage />
        </body>
      </html>
    );
  }

  // 通常のレイアウト
  return (
    <html lang="ja">
      <body className={`${geistSans.variable} ${geistMono.variable} ${notoSansJP.variable} antialiased`}>
        <NextTopLoader color="#E195AB" showSpinner={false} />
        <Header />
        <main className="main">{children}</main>
        <Situation />
        <Footer /> 
        <ScrollToTopButton />
        <div id="portal-root" style={{ position: 'fixed', top: 0, left: 0, zIndex: 999999 }}></div>
      </body>

      <Script id="google-analytics">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-6B4EN14QYS');
        `}
      </Script>
    </html>
  );
}
