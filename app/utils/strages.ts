type Event = {
  eventId: string;
  eventName: string;
  schedules: { date: string; time: string }[];
};

// 型定義
type EventWithExpiry = {
  eventId: string;
  eventName: string;
  schedules: { date: string; time: string }[];
  expiry: number; // 期限（UNIXタイムスタンプ）
};

export function setOwnerEvent(eventId: string, eventName: string, schedules: { date: string; time: string }[]) {
  const eventListString = localStorage.getItem("ownerEvents") ?? "[]";
  let eventList: EventWithExpiry[] = [];

  try {
    eventList = JSON.parse(eventListString).filter((event: EventWithExpiry) => {
      return event.expiry > Date.now(); // 期限切れのデータは除外
    });
  } catch (error) {
    console.error("Failed to parse events from localStorage:", error);
  }

  // 1年後のタイムスタンプを計算（現在時刻 + 365日）
  const expiry = Date.now() + 1000 * 60 * 60 * 24 * 365;

  // イベントの重複を防ぐ（同じ eventId の場合は上書き）
  const updatedEvents = Array.from(
    new Map([...eventList, { eventId, eventName, schedules, expiry }].map(e => [e.eventId, e])).values()
  );

  localStorage.setItem("ownerEvents", JSON.stringify(updatedEvents));
}


export function getEventList(): EventWithExpiry[] {
  const eventListString = localStorage.getItem("events") ?? "[]";
  let eventList: EventWithExpiry[] = [];

  try {
    eventList = JSON.parse(eventListString).filter((event: EventWithExpiry) => event.expiry > Date.now());
  } catch (error) {
    console.error("Failed to parse events from localStorage:", error);
  }

  return eventList;
}

const ONE_YEAR_IN_MS = 365 * 24 * 60 * 60 * 1000; // 1年をミリ秒で定義

export function addEvent(newEvent: Event) {
  const events: EventWithExpiry[] = getEventList();

  // 既存のイベントがある場合はスキップ
  if (events.some(event => event.eventId === newEvent.eventId)) {
    return;
  }

  // 期限を追加して保存
  const eventWithExpiry = { ...newEvent, expiry: Date.now() + ONE_YEAR_IN_MS };
  events.push(eventWithExpiry);
  
  localStorage.setItem("events", JSON.stringify(events));
}

export function isEventOwner(eventId: string): boolean {
  if (typeof window === "undefined") return false; // ✅ サーバーなら false を返す

  const eventsString = localStorage.getItem("ownerEvents") ?? "[]";
  let events: { eventId: string; eventName: string }[] = [];

  try {
    events = JSON.parse(eventsString);
  } catch (error) {
    console.error("Failed to parse owner events from localStorage:", error);
  }

  return events.some(event => event.eventId === eventId);
}

// ✅ 指定した eventId のイベントを削除
export function removeEvent(eventId: string) {
  const events = getEventList();
  const updatedEvents = events.filter(ev => ev.eventId !== eventId);

  if (updatedEvents.length === 0) {
    localStorage.removeItem("events");
  } else {
    localStorage.setItem("events", JSON.stringify(updatedEvents));
  }
}
