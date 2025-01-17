'use client'

import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";
import styles from "./index.module.scss"

export default function EventDetails() {
  const [eventData, setEventData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const eventId = searchParams.get("eventId"); // クエリパラメーターからeventIdを取得
  const [isCardVisible, setIsCardVisible] = useState(false);

  const openEvent = async () => {
    setIsCardVisible(true);
  }
  const closeEvent = async () => {
    setIsCardVisible(false);
  }

  async function fetchEventWithSchedules(eventId: string) {
    try {
      const response = await fetch(`/api/events?eventId=${eventId}`);

      if (!response.ok) {
        throw new Error(`エラーが発生しました: ${response.status}`);
      }

      const data = await response.json();

      return data;
    } catch (error) {
      console.error("Error fetching event data:", error);
      throw error; // エラーを呼び出し元に伝える
    }
  }

  useEffect(() => {
    // データ取得
    const getEventData = async () => {
      setLoading(true);
      try {
        const data = await fetchEventWithSchedules(eventId!);

        setEventData(data);
        setError(null); // エラーをリセット
      } catch (err: any) {
        setError(err.message || "データ取得中にエラーが発生しました");
      } finally {
        setLoading(false);
      }
    };

    getEventData();
  }, [eventId]);

  if (loading) {
    return <p>読み込み中...</p>;
  }

  if (error) {
    return <p>エラー: {error}</p>;
  }

  if (!eventData) {
    return <p>データが見つかりません</p>;
  }

  return (
    <div>
      <h1>{eventData.name}</h1>
      {eventData.image && (
        <Image src={eventData.image}
          width={50}
          height={50}
          alt="Event Crop Image" />
      )}
      <h2>スケジュール</h2>
      <ul>
        {eventData.schedules.map((schedule: any) => {
          // 日付と時刻のフォーマット
          const formattedDate = new Date(schedule.date).toLocaleDateString("ja-JP", {
            year: "numeric",
            month: "numeric",
            day: "numeric",
            weekday: "short", // 曜日を短縮形で表示
          });

          return (
            <li key={schedule.id}>
              {formattedDate} - {schedule.time}
            </li>
          );
        })}
      </ul>
    
    </div>
  );
}
