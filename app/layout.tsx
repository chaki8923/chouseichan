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

export const metadata: Metadata = {
  title: "調整ちゃん | 簡単日程調整 ",
  description: "「調整ちゃん」はたったの2ステップでイベント登録。出欠管理が簡単！調整ちゃんはGoogleカレンダーと連携し、ユーザーがスケジュールを簡単に管理できるようにするサービスですGoogleカレンダーAPIを利用し、ユーザーの許可を得た上でイベントを作成・編集・削除する機能を提供します。友達や同僚とのスケジュール調整が簡単に。回答期限の設定、お店選び投票機能、主役設定機能など、幹事の人に役立つ機能がたくさんあります。イベントの画像もみんなで共有できて参加者も楽しめるサービスです。",
  keywords: ["イベント","簡単", "幹事","スケジュール", "調整", "日程調整", "スケジュール調整","カレンダー", "予定", "出欠", "グループ", "チーム", "オンライン"],
  robots: "index, follow",
  metadataBase: new URL('https://www.chouseichan.com'),
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
    url: "https://www.chouseichan.com/",
    title: "調整ちゃん | 日程調整",
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
    site: "@chouseichan2025", // 公式アカウントがあれば追加
    title: "調整ちゃん | 日程調整",
    description: "調整ちゃんはたったの2ステップでイベント登録。友達や同僚との予定調整が簡単に。",
    images: ["/logo.png"],
    creator: "@chousei",
  },
  verification: {
    google: "あなたのGoogle Search Consoleの確認コード", // 必要に応じて実際のコードに置き換えてください
  },
  applicationName: "調整ちゃん",
  category: "イベント管理・スケジュール調整",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 構造化データの作成
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: '調整ちゃん',
    url: 'https://www.chouseichan.com',
    description: '「調整ちゃん」はAIによる最適日程推薦機能を搭載。たった2ステップでイベント登録。Googleカレンダーと連携し、ユーザーがスケジュールを簡単に管理できるサービスです。',
    applicationCategory: 'SchedulingApplication',
    operatingSystem: 'All',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'JPY'
    },
    softwareVersion: '2.0',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '120',
      bestRating: '5',
      worstRating: '1'
    },
    keywords: 'イベント,幹事,スケジュール,調整,日程調整,カレンダー,予定,出欠,AI,最適化,人工知能',
    potentialAction: {
      '@type': 'CreateAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://www.chouseichan.com',
        description: 'AIでイベントを最適化'
      }
    },
    featureList: [
      "AIによる最適日程推薦",
      "Googleカレンダー連携",
      "スケジュール管理",
      "イベント作成の簡素化"
    ]
  };

  // メンテナンスモードが有効な場合はメンテナンス画面を表示
  if (isMaintenanceMode) {
    return (
      <html lang="ja">
        <head>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
          <title>調整ちゃん | メンテナンス中</title>
        </head>
        <body className={`${geistSans.variable} ${geistMono.variable} ${notoSansJP.variable} antialiased`}>
          <MaintenancePage />
        </body>
      </html>
    );
  }

  // 通常のレイアウト
  return (
    <html lang="ja">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <title>調整ちゃん | 簡単日程調整</title>
        <meta name="description" content="「調整ちゃん」はたったの2ステップでイベント登録。調整ちゃんはGoogleカレンダーと連携し、ユーザーがスケジュールを簡単に管理できるサービスです。GoogleカレンダーAPIを利用し、ユーザーの許可を得た上でイベントを作成・編集・削除する機能を提供します。友達や同僚とのスケジュール調整が簡単に。回答期限の設定、お店選び投票機能、主役設定機能など、幹事の人に役立つ機能がたくさんあります。イベントの画像もみんなで共有できて参加者も楽しめるサービスです。" />
        <meta name="keywords" content="イベント,簡単,幹事,スケジュール,調整,日程調整,カレンダー,予定,出欠,グループ,チーム,オンライン" />
        <meta name="robots" content="index, follow" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@chouseichan2025" />
        <meta name="twitter:title" content="調整ちゃん | 日程調整" />
        <meta name="twitter:description" content="調整ちゃんはたったの2ステップでイベント登録。友達や同僚との予定調整が簡単に。" />
        <meta name="twitter:image" content="/logo.png" />
        <meta name="twitter:creator" content="@chousei" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.chouseichan.com/" />
        <meta property="og:title" content="調整ちゃん | 日程調整" />
        <meta property="og:description" content="「調整ちゃん」はたったの2ステップでイベント登録。友達や同僚とのスケジュール調整が簡単に。回答期限の設定、お店選び投票機能、主役設定機能など、幹事の人に役立つ機能がたくさんあります。イベントの画像もみんなで共有できて参加者も楽しめるサービスです。" />
        <meta property="og:site_name" content="調整ちゃん" />
        <meta property="og:image" content="/logo.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:locale" content="ja_JP" />
        <meta name="google-site-verification" content="あなたのGoogle Search Consoleの確認コード" />
        <meta name="application-name" content="調整ちゃん" />
        <meta name="category" content="イベント管理・スケジュール調整" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} ${notoSansJP.variable} antialiased`}>
        <NextTopLoader color="#E195AB" showSpinner={false} />
        <Header />
        <main className="main">{children}</main>
        <Footer /> 
        <Situation />
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
