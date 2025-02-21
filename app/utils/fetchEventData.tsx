export async function fetchEventWithSchedules(eventId: string) {
    if (!eventId) return null;
  
    try {
      // `new URL()` には絶対URLを渡す
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
      const url = `${baseUrl}/api/events?eventId=${eventId}`;
  
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error("イベント情報の取得に失敗しました");
  
      return res.json();
    } catch (error) {
      console.error("fetchEventWithSchedules エラー:", error);
      return null;
    }
  }