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

// イベントスキーママークアップを生成する関数
function generateEventSchema(eventData: any) {
  if (!eventData) return null;
  
  // イベントステータスの対応付け
  const getEventStatus = () => {
    if (!eventData.schedules || eventData.schedules.length === 0) return "EventScheduled";
    
    // いずれかの日程が確定されている場合
    const hasConfirmedSchedule = eventData.schedules.some((s: any) => s.isConfirmed);
    if (hasConfirmedSchedule) return "EventScheduled";
    
    return "EventScheduled"; // デフォルトは予定通り
  };
  
  // イベント開催場所の生成（仮）
  const location = {
    "@type": "Place",
    "name": "未定",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "未定"
    }
  };
  
  // 確定済みの日程があればその日時を使用、なければ最初の日程を使用
  const confirmedSchedule = eventData.schedules?.find((s: any) => s.isConfirmed);
  const schedule = confirmedSchedule || eventData.schedules?.[0];
  
  if (!schedule) return null;
  
  // 日時のフォーマット
  const scheduleDate = new Date(schedule.date);
  const [hours, minutes] = schedule.time.split(':').map(Number);
  
  const startDate = new Date(scheduleDate);
  startDate.setHours(hours, minutes, 0);
  
  // イベント終了は2時間後と仮定
  const endDate = new Date(startDate);
  endDate.setHours(endDate.getHours() + 2);
  
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    "name": eventData.name,
    "description": eventData.memo || `${eventData.name}の詳細ページです。`,
    "startDate": startDate.toISOString(),
    "endDate": endDate.toISOString(),
    "eventStatus": `https://schema.org/${getEventStatus()}`,
    "location": location,
    "image": eventData.image || "https://www.chouseichan.com/default-event-image.jpg",
    "organizer": {
      "@type": "Person",
      "name": eventData.user?.name || "主催者"
    },
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "JPY",
      "availability": "https://schema.org/InStock",
      "validFrom": new Date().toISOString()
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
  
  // JSONLDデータを生成
  const eventSchemaData = generateEventSchema(eventData);
  
  return (
    <>
      {/* JSON-LDスキーママークアップを追加 */}
      {eventSchemaData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(eventSchemaData) }}
        />
      )}
      <EventDetails eventId={eventId} session={session} />
    </>
  );
}