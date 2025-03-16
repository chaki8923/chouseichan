import { Metadata } from 'next';
import ImageResize from './ImageResize';

export const metadata: Metadata = {
  title: '画像サイズ変更 | 調整ちゃん',
  description: '画像のサイズを簡単に変更できます。アップロードする画像が大きすぎる場合に、画質を保ちながら適切なサイズに変更することができます。JPEG、PNG、WebP形式に対応しています。',
  keywords: ["画像サイズ変更", "画像変更", "画像サイズ変更ツール"],
  openGraph: {
    title: '画像サイズ変更 | 調整ちゃん',
    description: '画像のサイズを簡単に変更できます。アップロードする画像が大きすぎる場合に、画質を保ちながら適切なサイズに変更することができます。JPEG、PNG、WebP形式に対応しています。',
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: '調整ちゃん - 画像サイズ変更',
      },
    ],
  },
};

export default function Page() {
  return <ImageResize />;
} 