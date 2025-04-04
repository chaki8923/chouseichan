import React from 'react';
import styles from './index.module.scss';
import EventCalendar from './components/EventCalendar';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'イベントカレンダー | あつ丸ちゃん',
  description: '開催予定や確定したイベントをカレンダーで一覧できます。イベントの日程を簡単に把握して、参加しやすくなります。',
  openGraph: {
    title: 'イベントカレンダー | イベント日程を視覚的に管理',
    description: 'あつ丸ちゃんで作成されたイベントを月別カレンダーで確認できます。開催が決まったイベントを探して参加しましょう。',
    images: ['/images/events-calendar-og.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'イベントカレンダー | あつ丸ちゃん',
    description: 'イベントの日程を視覚的にカレンダーで確認できます。日程調整から参加まで、シームレスなイベント体験を。',
    images: ['/images/events-calendar-og.jpg'],
  },
  alternates: {
    canonical: 'https://www.atumaruchan.com/events-calendar',
  },
};

export default function EventsCalendarPage() {
  return (
    <div className={styles.calendarContainer}>
      <h1 className={styles.pageTitle}>イベントカレンダー</h1>
      <p className={styles.pageDescription}>
        あなたが過去に訪問したイベントのスケジュールをカレンダーで確認できます。
        プライバシー保護のため、一度もアクセスしたことのないイベントは表示されません。
        新しいイベントを見るには、まずイベントページを訪問する必要があります。
      </p>
      
      {/* 構造化データ（Schema.org） */}
      <div className={styles.structuredData} aria-hidden="true">
        <script type="application/ld+json">{`
          {
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "イベントカレンダー",
            "description": "あつ丸ちゃんで作成されたイベントを月別カレンダーで確認できます。",
            "breadcrumb": {
              "@type": "BreadcrumbList",
              "itemListElement": [
                {
                  "@type": "ListItem",
                  "position": 1,
                  "name": "ホーム",
                  "item": "https://www.atumaruchan.com"
                },
                {
                  "@type": "ListItem",
                  "position": 2,
                  "name": "イベントカレンダー",
                  "item": "https://www.atumaruchan.com/events-calendar"
                }
              ]
            }
          }
        `}</script>
      </div>
      
      {/* イベントカレンダーコンポーネント */}
      <EventCalendar />
    </div>
  );
} 