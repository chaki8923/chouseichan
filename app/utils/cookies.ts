import { setCookie, getCookie } from "cookies-next";

// ✅ クライアントサイドで eventId を Cookie に保存
export function setEventIdCookie(eventId: string) {
  // 既存の eventId を取得（JSON 文字列 → 配列に変換）
  const eventIdsString = (getCookie("eventIds") as string) ?? "[]"; 

  // 新しい eventId を追加（重複を防ぐ）
  const updatedEvents = Array.from(new Set([...eventIdsString, eventId]));

  // Cookie に JSON 文字列として保存
  setCookie("eventIds", JSON.stringify(updatedEvents), {
    maxAge: 60 * 60 * 24 * 30, // 30日間有効
    path: "/",
  });
}

// ✅ クライアントサイドで Cookie から eventId を取得
export function getEventIdFromCookie() {
  return getCookie("eventId");
}

export function isEventOwner(eventId: string): boolean {
  // ✅ `getCookie()` の戻り値を確実に `string` にする
  const eventIdsString = (getCookie("eventIds") as string) ?? "[]"; 

  // ✅ JSON パースして `string[]` に変換
  const eventIds: string[] = JSON.parse(eventIdsString);
  console.log("eventIds", eventIds);
  console.log("eventId", eventId);
  
  // 指定した eventId が含まれているか判定
  return eventIds.includes(eventId);
}