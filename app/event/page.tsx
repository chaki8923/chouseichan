import { auth } from "@/auth";
import { Metadata } from "next";
import { fetchEventWithSchedules } from "@/app/utils/fetchEventData";
import EventDetails from "@/app/event/presenter";
import Script from 'next/script';

interface SearchParams {
  eventId?: string;
}

interface PageProps {
  searchParams: Promise<SearchParams>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams;
  const eventId = params.eventId;

  if (!eventId) {
    return {
      title: "イベントが見つかりません",
      description: "指定されたイベントが存在しません。",
    };
  }

  const eventData = await fetchEventWithSchedules(eventId);

  if (!eventData) {
    return {
      title: "イベントが見つかりません",
      description: "指定されたイベントが存在しません。",
    };
  }

  // アプリケーションのURL取得
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.chouseichan.com';

  return {
    title: `${eventData.name} | 調整ちゃん`,
    description: eventData.memo || "イベントの詳細情報",
    openGraph: {
      title: `${eventData.name} | 調整ちゃん`,
      description: eventData.memo || `${eventData.name}`,
      images: eventData.image ? [eventData.image] : [],
      url: `${baseUrl}/event?eventId=${eventId}`,
      type: 'article',
    },
    alternates: {
      canonical: `/event?eventId=${eventId}`,
    },
  };
}

export default async function EventPage({ searchParams }: PageProps) {
  const session = await auth();
  const params = await searchParams;
  const eventId = params.eventId;

  if (!eventId) {
    return <p>イベントIDが指定されていません</p>;
  }

  // イベントデータの取得
  const eventData = await fetchEventWithSchedules(eventId);
  
  // JSONLDデータの構築
  let jsonLd = null;
  
  if (eventData) {
    // 日付がある場合はISOString形式に変換
    const formatScheduleDate = (schedule: { date?: string; time?: string }) => {
      if (!schedule || !schedule.date) return new Date().toISOString();
      
      try {
        // 日付がYYYY-MM-DDの形式かチェック
        const datePattern = /^\d{4}-\d{2}-\d{2}$/;
        const dateStr = schedule.date;
        
        if (!datePattern.test(dateStr)) {
          // フォーマットが異なる場合はフォールバックとして現在の日付を使用
          console.warn(`Invalid date format: ${dateStr}`);
          return new Date().toISOString();
        }
        
        // 時間が有効な形式かチェック
        let timeStr = schedule.time || '00:00:00';
        if (!/^\d{2}:\d{2}(:\d{2})?$/.test(timeStr)) {
          // 無効な時間形式の場合はデフォルト値を使用
          timeStr = '00:00:00';
        }
        
        const dateObj = new Date(`${dateStr}T${timeStr}`);
        
        // Dateオブジェクトが有効かチェック
        if (isNaN(dateObj.getTime())) {
          console.warn('Created invalid date object', dateStr, timeStr);
          return new Date().toISOString();
        }
        
        return dateObj.toISOString();
      } catch (error) {
        console.error('Error formatting date:', error);
        return new Date().toISOString();
      }
    };
    
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.chouseichan.com';
    const eventUrl = `${baseUrl}/event?eventId=${eventId}`;
    
    jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Event',
      name: eventData.name,
      description: eventData.memo || eventData.name,
      url: eventUrl,
      image: eventData.image || `${baseUrl}/logo.png`,
      eventStatus: 'https://schema.org/EventScheduled',
      organizer: {
        '@type': 'Person',
        name: eventData.organizer?.name || '主催者',
      },
      location: {
        '@type': 'VirtualLocation',
        url: eventUrl
      },
      startDate: eventData.schedules && eventData.schedules.length > 0 ? 
        formatScheduleDate(eventData.schedules.find((s: { isConfirmed?: boolean }) => s.isConfirmed) || eventData.schedules[0]) : 
        new Date().toISOString(),
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'JPY',
        availability: 'https://schema.org/InStock',
        url: eventUrl,
        validFrom: new Date().toISOString()
      }
    };
  }

  return (
    <>
      {jsonLd && (
        <Script
          id="event-jsonld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <EventDetails eventId={eventId} session={session} />
    </>
  );
}