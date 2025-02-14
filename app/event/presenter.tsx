'use client'

import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";
import { Session } from "@auth/core/types";
import SigninButton from "@/app/component/calendar/SignInButton"
import { CreateEventButton } from "../component/calendar/CreateEventButton";
import { ConfirmScheduleButton } from "../component/button/comfirmSchedule";
import styles from "./index.module.scss"
import { FaRegCircle } from "react-icons/fa";
import { RxCross2 } from "react-icons/rx";
import { IoTriangleOutline } from "react-icons/io5";
import { Schedule } from "@/types/schedule";
import { User } from "@/types/user";
import Form from "./form";
import Modal from "../component/modal/modal";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

type maxAttend = {
  id: number;
  attendCount: number
}


export default function EventDetails({ session }: { session: Session | null }) {
  // const session = await auth();
  const [eventData, setEventData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isCreateForm, setIsCreateForm] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>();
  const [userName, setUserName] = useState<string>();
  const [isOpen, setIsOpen] = useState(false);
  const [formattedDate, setFormattedDate] = useState<string>();
  const searchParams = useSearchParams();
  const eventId = searchParams.get("eventId"); // クエリパラメーターからeventIdを取得


  const user = session?.user ?? { id: "", name: "ゲストユーザー", };
  console.log("user>>>>>", user);
  const accessToken = user.accessToken ?? ""
  const refreshToken = user.refreshToken ?? ""

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
    setUserId(userId)
    setUserName(userName)
    setIsCreateForm(false)

  };

  const handleCreate = () => {
    setUserId('');
    setUserName('');
    setIsCreateForm(true);
  }

  const handleConfirmSchedule = (scheduleId: number) => {
    setIsOpen(true);

    setEventData((prev: any) => {
      const confirmedSchedule = prev.schedules.find(
        (schedule: Schedule) => schedule.id === scheduleId
      );

      if (!confirmedSchedule) return prev;

      // `confirmedSchedule.date` と `confirmedSchedule.time` を組み合わせて日時を作成
      const dateTimeString = `${confirmedSchedule.date.split("T")[0]}T${confirmedSchedule.time}:00`;
      const date = new Date(dateTimeString);

      // 日付フォーマット
      const formattedDate = format(date, "yyyy/M/d(E) - HH:mm", { locale: ja });
      setFormattedDate(formattedDate)

      console.log("決定したスケジュール:", formattedDate);

      return {
        ...prev,
        schedules: prev.schedules.map((schedule: Schedule) =>
          schedule.id === scheduleId
            ? { ...schedule, isConfirmed: true }
            : { ...schedule, isConfirmed: false }
        ),
      };
    });
  };


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

  // 初回と更新時にデータ取得
  const fetchSchedules = async () => {
    const data = await fetchEventWithSchedules(eventId!);
    setEventData(data);
  };

  useEffect(() => {
    fetchSchedules(); // 初回ロード時に取得
  }, []);


  if (loading) {
    return <p>読み込み中...</p>;
  }

  if (error) {
    return <p>エラー: {error}</p>;
  }

  if (!eventData) {
    return <p>データが見つかりません</p>;
  }

  const schedulesWithAttendCount = eventData.schedules.map((schedule: Schedule) => ({
    ...schedule,
    attendCount: schedule.responses.filter((res) => res.response === "ATTEND").length,
  }));

  const confirmedSchedule = eventData.schedules.filter((res: Schedule) => res.isConfirmed === true)[0];
  console.log("confirmedSchedule", confirmedSchedule);


  // ✅ ATTEND数が最も多いスケジュールを取得
  const maxAttendCount = Math.max(...schedulesWithAttendCount.map((s: maxAttend) => s.attendCount));
  const highlightScheduleIds = schedulesWithAttendCount
    .filter((s: maxAttend) => s.attendCount === maxAttendCount)
    .map((s: maxAttend) => s.id);


  return (
    <>
      <div className={styles.eventContainer}>
        <div>
          <h1 className={styles.eventName}>{eventData.name}</h1>
          <section className={styles.eventTitleSection}>
            {eventData.image && (
              <Image src={eventData.image}
                width={50}
                height={50}
                alt="Event Crop Image" />
            )}
            <h2 className={styles.memo}>{eventData.memo}</h2>
          </section>

          <p className="mb-1"><span className={styles.confirmedText}>開催決定日</span><span className={styles.attendText}>参加人数が多い</span></p>
          <div className={`relative overflow-x-auto ${styles.table}`}>
            <table className={styles.tableDesign}>
              <tbody>
                <tr>
                  <th>決定</th>
                  <th>候補日</th>
                  <th><FaRegCircle className={styles.reactIconTable} /></th>
                  <th><IoTriangleOutline className={styles.reactIconTable} /></th>
                  <th><RxCross2 className={styles.reactIconTable} /></th>
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
                  // ✅ ハイライトの適用
                  const isHighlighted = highlightScheduleIds.includes(schedule.id);
                  let highlightClass = ''
                  if (schedule.isConfirmed) {
                    highlightClass = styles.confirmed
                  } else if (isHighlighted && confirmedSchedule.length === 0) {
                    highlightClass = styles.attend
                  }
                  // const totalCount = schedule.responses.length;
                  // ユーザーごとの response を取得
                  const userResponses = schedule.responses.reduce((acc, res) => {
                    if (res.user) {
                      acc[res.user.name] = res.response;
                    }
                    return acc;
                  }, {} as Record<string, string>);


                  return (
                    <tr key={schedule.id} className={highlightClass}>
                      <td>
                        {!schedule.isConfirmed ? <ConfirmScheduleButton scheduleId={schedule.id} eventId={eventData.id} onConfirm={handleConfirmSchedule} /> : <span className={styles.confirmText}>決定済み</span>}
                      </td>
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
                <tr>
                  <td colSpan={5} className={styles.colspan1}>コメント</td>

                  {Array.from(
                    new Map<number, { id: string; name: string; comment?: string }>(
                      eventData.schedules
                        .flatMap((schedule: Schedule) =>
                          schedule.responses.map((response) => ({
                            id: response.user.id,
                            name: response.user.name,
                            comment: response.user.comment || "",
                          }))
                        )
                        .map((user: User) => [user.id, user])
                    ).values()
                  ).map((user) => (
                    <td key={`comment-${user.id}`} colSpan={1} className={styles.userComment}>
                      {user.comment}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {accessToken ?
        <CreateEventButton accessToken={accessToken} refreshToken={refreshToken} confirmedSchedule={confirmedSchedule} event={eventData} /> :
        <SigninButton />
      }
      <div className={styles.eventFormContainer}>
        {isCreateForm ? (
          <Form onSuccess={fetchSchedules} onCreate={handleCreate} schedules={eventData.schedules} />
        ) : (
          <Form onSuccess={fetchSchedules} onCreate={handleCreate} schedules={eventData.schedules} userId={userId} userName={userName} />
        )}
      </div>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <h2 className={styles.modalTitle}>以下の日程で決定しました</h2>
        <p className={styles.modalText}>{formattedDate}</p>
      </Modal>
    </>
  );
}
