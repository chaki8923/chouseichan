"use client";

import { useState } from "react";
import { Schedule } from "@/types/schedule";
import { Event } from "@/types/event";
import { signOut } from "next-auth/react";
import styles from "./index.module.scss"

export function CreateEventButton({ accessToken, refreshToken, confirmedSchedule, event }: { accessToken: string, refreshToken: string, confirmedSchedule: Schedule, event: Event }) {
  const [loading, setLoading] = useState(false);

  const handleCreateEvent = async () => {
    setLoading(true);

    console.log("confirmedSchedule.date:", confirmedSchedule.date);
    console.log("confirmedSchedule.time:", confirmedSchedule.time);
    // 日付を UTC 文字列から `YYYY-MM-DD` に変換
    const datePart = confirmedSchedule.date.split("T")[0];

    // `YYYY-MM-DDTHH:mm:00` の形式に整える（Zなし）
    const startUTC = new Date(`${datePart}T${confirmedSchedule.time}:00`);
    const startUTCString = startUTC.toISOString();

    // 終了時刻（1時間後）
    const endUTCString = new Date(startUTC.getTime() + 60 * 60 * 1000).toISOString();
    // 📌 登録するイベントデータ
    const eventData = {
      title: event.name,
      description: event.memo,
      start: startUTCString, // 開始時刻
      end: endUTCString, // 終了時刻（1時間後）
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
        {loading ? "追加中..." : "Googleカレンダーに開催日を追加"}
      </button>
      <button onClick={async () => {
        await signOut();
      }}>
        ログアウト
      </button>
    </>
  );
}