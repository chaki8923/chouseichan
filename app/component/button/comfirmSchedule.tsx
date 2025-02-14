import { useState } from "react";
import styles from "./index.module.scss"

export function ConfirmScheduleButton({ scheduleId, eventId, onConfirm }: {scheduleId: number, eventId: string, onConfirm: (scheduleId: number) => void;}) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);

    const response = await fetch("/api/schedule/", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scheduleId, eventId }),
    });

    if (response.ok) {
      // alert("スケジュールが決定されました！");
      onConfirm(scheduleId)
    } else {
      alert("エラーが発生しました");
    }

    setLoading(false);
  };

  return (
    
    <button className={styles.confirmBtn} onClick={handleConfirm} disabled={loading}>
      
      {loading ? "処理中..." : <span className={styles.confirmText}>この日に決定</span>}
    </button>

  );
}
