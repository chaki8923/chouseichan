import { setCookie, getCookie, deleteCookie } from "cookies-next";

type Event = {
  eventId: string;
  eventName: string;
}

// ✅ イベントとスケジュールをセットする関数
export function setEventCookie(eventId: string, eventName: string, schedules: { date: string; time: string }[]) {
  // 既存のイベントリストを取得
  const eventListString = (getCookie("events") as string) ?? "[]";
  let eventList: { eventId: string; eventName: string; schedules: { date: string; time: string }[] }[] = [];

  try {
    eventList = JSON.parse(eventListString);
  } catch (error) {
    console.error("Failed to parse events cookie:", error);
  }

  // イベントの重複を防ぐ（同じ eventId の場合は上書き）
  const updatedEvents = Array.from(
    new Map([...eventList, { eventId, eventName, schedules }].map(e => [e.eventId, e])).values()
  );

  // Cookie に JSON 文字列として保存
  setCookie("events", JSON.stringify(updatedEvents), {
    maxAge: 60 * 60 * 24 * 30, // 30日間有効
    path: "/",
  });
}


// ✅ クライアントサイドで Cookie から eventId を取得
export function getEventCookie() {

  // ✅ `getCookie()` の戻り値を確実に `string` にする
  const eventsString = (getCookie("events") as string) ?? "[]";

  // ✅ JSON パースして `eventId` と `eventName` のリストを取得
  let events: { eventId: string; eventName: string; schedules: { date: string; time: string }[] }[] = [];

  try {
    events = JSON.parse(eventsString);
  } catch (error) {
    console.error("Failed to parse events cookie:", error);
  }

  return events
  
}

export function isEventOwner(eventId: string): boolean {
  // ✅ `getCookie()` の戻り値を確実に `string` にする
  const eventsString = (getCookie("events") as string) ?? "[]"; 

  // ✅ JSON パースして `eventId` と `eventName` のリストを取得
  let events: { eventId: string; eventName: string }[] = [];

  try {
    events = JSON.parse(eventsString);
  } catch (error) {
    console.error("Failed to parse events cookie:", error);
  }

  // 指定した eventId が含まれているか判定
  return events.some(event => event.eventId === eventId);
}


// ✅ 指定した eventId のイベントを削除する関数
export function removeEventCookie(eventId: string) {
  const events = getEventCookie();
  const updatedEvents = events.filter((ev: Event) => ev.eventId !== eventId);

  if (updatedEvents.length === 0) {
    // 全て削除された場合は Cookie を完全に削除
    deleteCookie("events");
  } else {
    // 更新後のリストを Cookie に保存
    setCookie("events", JSON.stringify(updatedEvents), {
      maxAge: 60 * 60 * 24 * 30, // 30日間有効
      path: "/",
    });
  }
}