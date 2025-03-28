import { auth } from "@/auth";
import { Metadata } from "next";
import { fetchEventWithSchedules } from "@/app/utils/fetchEventData";
import EventDetails from "@/app/event/presenter";
import { getEventStructuredData } from "@/app/lib/structured-data";

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
      images: [
        {
          url: "/logo.png", // `public` フォルダの画像を使用
          width: 1200,
          height: 630,
          alt: "調整ちゃんロゴ",
        },
      ],
      url: `${baseUrl}/event?eventId=${eventId}`,
      type: 'article',
    },
    alternates: {
      canonical: `/event?eventId=${eventId}`,
    },
  };
}

// イベントスキーママークアップ用のデータを準備する関数
function prepareEventStructuredData(eventData: any) {
  if (!eventData) return null;
  
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
  
  // 構造化データ用のイベントオブジェクトを作成
  const structuredEvent = {
    title: eventData.name,
    description: eventData.memo || `${eventData.name}の詳細ページです。`,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    location: "未定",
    address: {
      addressLocality: "未定"
    },
    organizer: eventData.user?.name || "主催者",
    id: eventData.id
  };
  
  return structuredEvent;
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
  
  // 構造化データ用のイベント情報を準備
  const preparedEventData = prepareEventStructuredData(eventData);
  
  // ヘルパー関数を使用して構造化データを生成
  const eventSchemaData = preparedEventData ? getEventStructuredData(preparedEventData) : null;
  
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