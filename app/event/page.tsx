import { auth } from "@/auth";
import { Metadata } from "next";
import { fetchEventWithSchedules } from "@/app/utils/fetchEventData";
import EventDetails from "@/app/event/presenter";

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

  return {
    title: `${eventData.name} | 調整ちゃん`,
    description: eventData.memo || "イベントの詳細情報",
    openGraph: {
      title: `${eventData.name} | 調整ちゃん`,
      description: eventData.memo || `${eventData.name}`,
      images: eventData.image ? [eventData.image] : [],
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

  return <EventDetails eventId={eventId} session={session} />;
}