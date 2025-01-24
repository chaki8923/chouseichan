'use client'

import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

import Image from "next/image";
import styles from "./index.module.scss"
import { FaRegCircle } from "react-icons/fa";
import { RxCross2 } from "react-icons/rx";
import { IoTriangleOutline } from "react-icons/io5";
import { Schedule } from "@/types/schedule";
import Form from "./form";

export default function EventDetails() {
  const [eventData, setEventData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const eventId = searchParams.get("eventId"); // クエリパラメーターからeventIdを取得

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
        console.log("data", data);

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
    <>
      <div className={styles.eventContainer}>
        <div>
          <section className={styles.eventTitleSection}>
            {eventData.image && (
              <Image src={eventData.image}
                width={50}
                height={50}
                alt="Event Crop Image" />
            )}
            <h1 className={styles.eventName}>{eventData.name}</h1>
          </section>
          <h2 className={styles.h2Title}>スケジュール</h2>


          <div className={`relative overflow-x-auto shadow-md sm:rounded-lg ${styles.table}`}>
            <table className={styles.tableDesign}>
              <tbody>
                <tr>
                  <th>候補日</th>
                  <th><FaRegCircle className={styles.reactIcon} /></th>
                  <th><IoTriangleOutline className={styles.reactIcon} /></th>
                  <th><RxCross2 className={styles.reactIcon} /></th>
                  <th>合計人数</th>
                </tr>
                {eventData.schedules.map((schedule: Schedule) => {
                  // 日付と時刻のフォーマット
                  const formattedDate = new Date(schedule.date).toLocaleDateString("ja-JP", {
                    year: "numeric",
                    month: "numeric",
                    day: "numeric",
                    weekday: "short", // 曜日を短縮形で表示
                  });

                  // responses のカウント
                  const attendCount = schedule.responses.filter((res) => res.response === "ATTEND").length;
                  const undecidedCount = schedule.responses.filter((res) => res.response === "UNDECIDED").length;
                  const declineCount = schedule.responses.filter((res) => res.response === "DECLINE").length;
                  const totalCount = schedule.responses.length;
                  return (
                    <tr key={schedule.id}>
                      <td>{formattedDate} - {schedule.time}</td>
                      <td>{attendCount}人</td>
                      <td>{undecidedCount}人</td>
                      <td>{declineCount}人</td>
                      <td>{totalCount}人</td>
                    </tr>
                  )
                })}

              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div className={styles.eventContainer}>
        <Form schedules={eventData.schedules} />
      </div>
    </>
  );
}
