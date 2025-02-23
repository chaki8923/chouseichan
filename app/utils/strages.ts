type Event = {
  eventId: string;
  eventName: string;
  schedules: { date: string; time: string }[];
};

// ✅ イベントとスケジュールを LocalStorage に保存
export function setOwnerEvent(eventId: string, eventName: string, schedules: { date: string; time: string }[]) {
  const eventListString = localStorage.getItem("ownerEvents") ?? "[]";
  let eventList: Event[] = [];

  try {
    eventList = JSON.parse(eventListString);
  } catch (error) {
    console.error("Failed to parse events from localStorage:", error);
  }

  // イベントの重複を防ぐ（同じ eventId の場合は上書き）
  const updatedEvents = Array.from(
    new Map([...eventList, { eventId, eventName, schedules }].map(e => [e.eventId, e])).values()
  );

  localStorage.setItem("ownerEvents", JSON.stringify(updatedEvents));
}

// ✅ LocalStorage からイベントリストを取得
export function getEventList(): Event[] {
  const eventsString = localStorage.getItem("events") ?? "[]";
  let events: Event[] = [];

  try {
    events = JSON.parse(eventsString);
  } catch (error) {
    console.error("Failed to parse events from localStorage:", error);
  }

  return events;
}

// ✅ 指定の `eventId` が LocalStorage にない場合は追加
export function addEvent(newEvent: Event) {
  const events = getEventList();

  if (events.some(event => event.eventId === newEvent.eventId)) {
    console.log("Event already exists in LocalStorage. Skipping...");
    return;
  }

  events.push(newEvent);
  localStorage.setItem("events", JSON.stringify(events));
}

// ✅ 指定の eventId のオーナーかどうか判定
export function isEventOwner(eventId: string): boolean {
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
