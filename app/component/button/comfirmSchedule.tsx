import { useState } from "react";

export function ConfirmScheduleButton({ scheduleId, eventId }: {scheduleId: string, eventId: string}) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);

    const response = await fetch("/api/schedule/confirm", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scheduleId, eventId }),
    });

    if (response.ok) {
      alert("スケジュールが決定されました！");
    } else {
      alert("エラーが発生しました");
    }

    setLoading(false);
  };

  return (
    <button onClick={handleConfirm} disabled={loading}>
      {loading ? "処理中..." : "このスケジュールを決定"}
    </button>
  );
}
