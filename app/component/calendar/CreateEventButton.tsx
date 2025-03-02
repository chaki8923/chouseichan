"use client";

import { useState } from "react";
import { Schedule } from "@/types/schedule";
import { Event } from "@/types/event";
import { FcGoogle } from "react-icons/fc";
// import { signOut } from "next-auth/react";
import Modal from "../modal/modal";
import styles from "./index.module.scss"


export function CreateEventButton({ accessToken, refreshToken, confirmedSchedule, event }: { accessToken: string, refreshToken: string, confirmedSchedule: Schedule, event: Event }) {
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  if (!confirmedSchedule) return;
  const handleCreateEvent = async () => {
    setLoading(true);
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
        setIsOpen(true);
        setTimeout(function () {
          setIsOpen(false);

        }, 1500);
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
        {loading ?
          <div className={styles.loader}>
            <p>追加中</p>
            <div className={`${styles.loaderInner} ${styles.ballPulse}`}>
              <div></div>
              <div></div>
              <div></div>
            </div>
          </div> : <span className={styles.addEvent}><FcGoogle className={styles.google} />開催日をカレンダーに追加</span>}
      </button>
      {/* <button onClick={async () => {
        await signOut();
      }}>
        ログアウト
      </button> */}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <h2 className={styles.modalTitle}>カレンダーに追加しました</h2>
      </Modal>
    </>
  );
}