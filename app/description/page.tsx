import { Metadata } from 'next';
import Description from './Description';

export const metadata: Metadata = {
  title: '使い方 | 調整ちゃん',
  description: '調整ちゃんは、交流会や飲み会、勉強会などの予定を簡単に仲間と合わせられるサービスです。イベントを作成してURLを共有するだけで簡単に出欠の確認が取れます。その他にも、Googleカレンダーと連携できる機能や、回答期限を設定できる機能、お店選び投票機能やイベントカレンダー機能などがあります。',
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
  return <Description />;
} 