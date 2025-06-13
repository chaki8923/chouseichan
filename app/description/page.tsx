import { Metadata } from 'next';
import Description from './Description';
import { getWebPageStructuredData } from "../lib/structured-data";

// 構造化データを生成する関数
function generateStructuredData() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.atumaruchan.com';
  
  return getWebPageStructuredData({
      title: "使い方 | 調整ちゃん",
      description: "調整ちゃんの使い方を説明するページです。",
      url: `${baseUrl}/description`
  });
}


export const metadata: Metadata = {
  title: '使い方 | 調整ちゃん',
  description: '調整ちゃんは、交流会や飲み会、勉強会などの予定を簡単に仲間と合わせられるサービスです。イベントを作成してURLを共有するだけで簡単に出欠の確認が取れます。その他にも、Googleカレンダーと連携できる機能や、回答期限を設定できる機能、お店選び投票機能やイベントカレンダー機能などがあります。',
  alternates: {
    canonical: '/description',
  },
  openGraph: {
    title: '使い方 | 調整ちゃん',
    description: '調整ちゃんは、交流会や飲み会、勉強会などの予定を簡単に仲間と合わせられるサービスです。イベントを作成してURLを共有するだけで簡単に出欠の確認が取れます。その他にも、Googleカレンダーと連携できる機能や、回答期限を設定できる機能、お店選び投票機能やイベントカレンダー機能などがあります。',
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: '調整ちゃん - イベント調整サービス',
      },
    ],
  },
};

export default function Page() {
  const structuredData = generateStructuredData();
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Description />
    </>
  );
} 