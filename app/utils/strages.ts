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

// ユーザーIDをlocal storageに保存する関数
export function saveUserId(userId: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem("userId", userId);
}

// ユーザーIDをlocal storageから取得する関数
export function getUserId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem("userId");
}

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
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    // 両方のストレージからデータを取得してマージする
    let allEvents: EventWithExpiry[] = [];
    
    // まず "eventHistory" からデータを取得
    const historyData = localStorage.getItem("eventHistory");
    
    if (historyData && historyData !== '[]' && historyData !== '') {
      try {
        const historyParsed = JSON.parse(historyData);
        if (Array.isArray(historyParsed)) {
          // 既存のイベントをマージ前に処理（expiryが欠けている場合に追加）
          allEvents = historyParsed.map(event => {
            // expiryプロパティが存在しない場合は追加
            if (!('expiry' in event)) {
              return { ...event, expiry: Date.now() + ONE_YEAR_IN_MS } as EventWithExpiry;
            }
            return event as EventWithExpiry;
          });
        } else if (historyParsed && typeof historyParsed === 'object') {
          // 単一オブジェクトの場合
          const singleEvent = historyParsed as Event;
          const withExpiry = !('expiry' in singleEvent) 
            ? { ...singleEvent, expiry: Date.now() + ONE_YEAR_IN_MS } 
            : singleEvent as EventWithExpiry;
          allEvents = [withExpiry];
        }
      } catch (e) {
        console.error("getEventList - Parse error for eventHistory:", e);
      }
    }
    
    // 続いて "events" からデータを取得
    const eventsData = localStorage.getItem("events");
    
    if (eventsData && eventsData !== '[]' && eventsData !== '') {
      try {
        const eventsParsed = JSON.parse(eventsData);
        if (Array.isArray(eventsParsed)) {
          // 重複を避けるためにeventIdで確認
          eventsParsed.forEach((event: Event | EventWithExpiry) => {
            if (!allEvents.some(existing => existing.eventId === event.eventId)) {
              // expiryプロパティがない場合は追加
              const withExpiry = !('expiry' in event) 
                ? { ...event, expiry: Date.now() + ONE_YEAR_IN_MS } 
                : event as EventWithExpiry;
              allEvents.push(withExpiry);
            }
          });
        } else if (eventsParsed && typeof eventsParsed === 'object') {
          if (!allEvents.some(existing => existing.eventId === eventsParsed.eventId)) {
            const event = eventsParsed as Event;
            const withExpiry = !('expiry' in event) 
              ? { ...event, expiry: Date.now() + ONE_YEAR_IN_MS } 
              : event as EventWithExpiry;
            allEvents.push(withExpiry);
          }
        }
      } catch (e) {
        console.error("getEventList - Parse error for events:", e);
      }
    }
    
    // マージしたデータを eventHistory に保存して同期を保つ
    if (allEvents.length > 0) {
      localStorage.setItem("eventHistory", JSON.stringify(allEvents));
    }
    
    return allEvents;
  } catch (e) {
    console.error("getEventList - General error:", e);
    return [];
  }
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

// イベント履歴から特定のイベントを削除する
export function removeEvent(eventId: string) {
  // サーバーサイドでは実行しない
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    // eventHistoryからイベントを削除
    const existingHistory = localStorage.getItem("eventHistory");
    let success = false;
    
    if (existingHistory) {
      try {
        const parsed = JSON.parse(existingHistory);
        const historyArray = Array.isArray(parsed) ? parsed : [parsed];

        // 指定されたIDのイベントを除外
        const filteredHistory = historyArray.filter(
          (item: Event) => item.eventId !== eventId
        );

        // 更新された履歴を保存
        localStorage.setItem("eventHistory", JSON.stringify(filteredHistory));
        success = true;
      } catch (e) {
        console.error("履歴データのパースに失敗しました:", e);
      }
    }
    
    // 従来のキー "events" からも削除
    const existingEvents = localStorage.getItem("events");
    if (existingEvents) {
      try {
        const parsed = JSON.parse(existingEvents);
        const eventsArray = Array.isArray(parsed) ? parsed : [parsed];
        
        // 指定されたIDのイベントを除外
        const filteredEvents = eventsArray.filter(
          (item: Event) => item.eventId !== eventId
        );
        
        // 更新された履歴を保存
        localStorage.setItem("events", JSON.stringify(filteredEvents));
        success = true;
      } catch (e) {
        console.error("eventsデータのパースに失敗しました:", e);
      }
    }

    return success;
  } catch (e) {
    console.error("イベント履歴の削除に失敗しました:", e);
    return false;
  }
}

// イベント履歴に新しいイベントを追加する
export function addEventToHistory(eventId: string, eventName: string, schedules: { date: string; time: string }[]) {
  if (typeof window === 'undefined') return false;
  
  try {
    // ローカルストレージから履歴を取得
    const existingHistory = localStorage.getItem("eventHistory") || "[]";
    let eventHistory = [];
    
    try {
      eventHistory = JSON.parse(existingHistory);
      if (!Array.isArray(eventHistory)) eventHistory = [eventHistory];
    } catch (e) {
      console.error("履歴の解析に失敗しました:", e);
      eventHistory = [];
    }
    
    // 新しいイベント情報を作成
    const newEvent = { eventId, eventName, schedules, timestamp: new Date().toISOString() };
    
    // 重複を防ぐために既存のイベントを削除
    const filteredHistory = eventHistory.filter((event: Event | EventWithExpiry) => event.eventId !== eventId);
    
    // 新しいイベントを先頭に追加
    filteredHistory.unshift(newEvent);
    
    // 最大10件まで保持
    const trimmedHistory = filteredHistory.slice(0, 10);
    
    // 更新された履歴を保存
    localStorage.setItem("eventHistory", JSON.stringify(trimmedHistory));
    
    // 互換性のために従来のキー "events" にも保存
    localStorage.setItem("events", JSON.stringify(trimmedHistory));
    
    
    return true;
  } catch (error) {
    console.error("履歴の追加に失敗しました:", error);
    return false;
  }
}
