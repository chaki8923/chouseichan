'use client'

import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

import Image from "next/image";
import styles from "./index.module.scss"
import { FaRegCircle } from "react-icons/fa";
import { RxCross2 } from "react-icons/rx";
import { IoTriangleOutline } from "react-icons/io5";
import { Schedule } from "@/types/schedule";
import { User } from "@/types/user";
import Form from "./form";


export default function EventDetails() {
  const [eventData, setEventData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isCreateForm, setIsCreateForm] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>();
  const [userName, setUserName] = useState<string>();
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

  const changeUpdate = (userId: string, userName: string) => {
    console.log(userId);
    setUserId(userId)
    setUserName(userName)
    setIsCreateForm(false)
    
  };

  const handleCreate = () => {
    console.log("子が押した");
    
    setUserId('');
    setUserName('');
    setIsCreateForm(true);
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
          <h2>{eventData.memo}</h2>
          <h2 className={styles.h2Title}>スケジュール</h2>


          <div className={`relative overflow-x-auto shadow-md sm:rounded-lg ${styles.table}`}>
            <table className={styles.tableDesign}>
              <tbody>
                <tr>
                  <th>候補日</th>
                  <th><FaRegCircle className={styles.reactIcon} /></th>
                  <th><IoTriangleOutline className={styles.reactIcon} /></th>
                  <th><RxCross2 className={styles.reactIcon} /></th>
                  {/** `userId` をキーとして利用 */}
                  {Array.from(
                    new Map<number, { id: string; name: string; response: string }>(
                      eventData.schedules
                        .flatMap((schedule: Schedule) =>
                          schedule.responses.map((response) => ({
                            id: response.user.id,
                            name: response.user.name,
                            response: response.response, // 必須プロパティ response を含める
                          }))
                        )
                        .map((user: User) => [user.id, user]) // Map のキーとして user.id を指定
                    ).values()
                  ).map((user) => (
                    <th key={user.id} onClick={() => changeUpdate(user.id, user.name)} className={styles.userName}>
                      {user.name}
                    </th>
                  ))}
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
                  const declineCount = schedule.responses.filter((res) => res.response === "ABSENT").length;
                  // const totalCount = schedule.responses.length;
                  // ユーザーごとの response を取得
                  const userResponses = schedule.responses.reduce((acc, res) => {
                    if (res.user) {
                      acc[res.user.name] = res.response;
                    }
                    return acc;
                  }, {} as Record<string, string>);
                  return (
                    <tr key={schedule.id}>
                      <td>{formattedDate} - {schedule.time}</td>
                      <td>{attendCount}人</td>
                      <td>{undecidedCount}人</td>
                      <td>{declineCount}人</td>
                      {Array.from(
                        new Set<string>(
                          eventData.schedules.flatMap((schedule: Schedule) =>
                            schedule.responses.map((response) => response.user?.name)
                          )
                        )
                      ).map((userName) => (
                        <td key={`${schedule.id}-${userName}`}>
                          {userResponses[userName] === "ATTEND" && <FaRegCircle className={styles.reactIcon} />}
                          {userResponses[userName] === "UNDECIDED" && <IoTriangleOutline className={styles.reactIcon} />}
                          {userResponses[userName] === "ABSENT" && <RxCross2 className={styles.reactIcon} />}
                        </td>
                      ))}
                    </tr>
                  )
                })}

              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div className={styles.eventContainer}>
      {isCreateForm ? (
          <Form onCreate={handleCreate} schedules={eventData.schedules} />
        ) : (
          <Form onCreate={handleCreate} schedules={eventData.schedules} userId={userId} userName={userName}/>
        )}
      </div>
    </>
  );
}
