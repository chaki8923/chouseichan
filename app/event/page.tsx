import { auth } from "@/auth";
import { Metadata } from "next";
import { fetchEventWithSchedules } from "@/app/utils/fetchEventData";
import EventDetails from "@/app/event/presenter";

type Props = {
  searchParams: { eventId?: string };
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const eventId = searchParams.eventId;

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

export default async function EventPage({ searchParams }: Props) {
  const session = await auth(); // `use` を使わず、async/await で取得
  const eventId = searchParams.eventId;

  if (!eventId) {
    return <p>イベントIDが指定されていません</p>;
  }

  return <EventDetails eventId={eventId} session={session} />;
}
