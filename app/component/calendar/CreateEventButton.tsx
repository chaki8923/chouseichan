"use client";

import { useState } from "react";
import { signOut} from "next-auth/react";
import styles from "./index.module.scss"

export function CreateEventButton({ accessToken, refreshToken }: { accessToken: string, refreshToken: string }) {
  const [loading, setLoading] = useState(false);

  const handleCreateEvent = async () => {
    setLoading(true);

    // 📌 登録するイベントデータ
    const eventData = {
      title: "ワイのイベント",
      description: "Google カレンダー API で追加",
      start: new Date().toISOString(), // 開始時刻
      end: new Date(new Date().getTime() + 60 * 60 * 1000).toISOString(), // 終了時刻（1時間後）
    };

    try {
      const response = await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken, eventData, refreshToken }),
      });

      const result = await response.json();
      if (result.success) {
        alert("イベントが作成されました！");
      } else {
        alert("イベント作成に失敗しました");
      }
    } catch (error) {
      console.error("エラー:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <button className={styles.createEventBtn} onClick={handleCreateEvent} disabled={loading}>
      {loading ? "追加中..." : "Googleカレンダーに予定を追加"}
    </button>
    <button onClick={async () => {
        await signOut();
      }}>
        ログアウト
    </button>
    </>
  );
}