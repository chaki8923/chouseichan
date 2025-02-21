'use client'

import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";
import { Session } from "@auth/core/types";
import SigninButton from "@/app/component/calendar/SignInButton"
import { CreateEventButton } from "../component/calendar/CreateEventButton";
import { ConfirmScheduleButton } from "../component/button/confirmSchedule";
import styles from "./index.module.scss"
import { FaRegCircle } from "react-icons/fa";
import { RxCross2 } from "react-icons/rx";
import { IoTriangleOutline } from "react-icons/io5";
import { Schedule } from "@/types/schedule";
import { Response } from "@/types/response";
import { User } from "@/types/user";
import { Event } from "@/types/event";
import Form from "./form";
import Modal from "../component/modal/modal";
import SpinLoader from "../component/loader/spin";
import { isEventOwner } from "@/app/utils/cookies";
import { FaRegCopy } from "react-icons/fa";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

type maxAttend = {
  id: number;
  attendCount: number
}



export default function EventDetails({ session }: { session: Session | null }) {

  const [eventData, setEventData] = useState<Event | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isCreateForm, setIsCreateForm] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>();
  const [userName, setUserName] = useState<string>();
  const [isOpen, setIsOpen] = useState(false);
  const [isCopyModal, setIsCopyModal] = useState(false);
  const [modalText, setModalText] = useState<string>('');
  const [formattedDate, setFormattedDate] = useState<string>();
  const searchParams = useSearchParams();
  const eventId = searchParams.get("eventId"); // URLのクエリパラメータから 
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  const user = session?.user ?? { id: "", name: "ゲストユーザー", };
  const accessToken = user.accessToken ?? "";
  const refreshToken = user.refreshToken ?? "";

  useEffect(() => {
    // データ取得
    const getEventData = async () => {
      setLoading(true);
      try {
        const data = await fetchEventWithSchedules(eventId!);
        setEventData(data);
        setError(null); // エラーをリセット
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("データ取得中に予期しないエラーが発生しました");
        }
      } finally {
        setLoading(false);
      }
    };

    getEventData();
  }, [eventId]);

  useEffect(() => {
    fetchSchedules(); // 初回ロード時に取得
  }, []);

  if (!eventId) return <p>イベントidがありません</p>
  const isOrganizer = eventId ? isEventOwner(eventId) : false; // ✅ 主催者判定

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
    setEventData((prev: Event | null) => {
      if (!prev) return prev; // prev が null の場合はそのまま返す

      const confirmedSchedule = prev.schedules.find(
        (schedule) => schedule.id === scheduleId
      );

      if (!confirmedSchedule) {
        setModalText("キャンセルしました");
        return {
          ...prev,
          schedules: prev.schedules.map((schedule) => ({
            ...schedule,
            isConfirmed: false,
          })),
        };
      }

      setModalText("以下の日程で決定しました");

      const dateTimeString = `${confirmedSchedule.date.split("T")[0]}T${confirmedSchedule.time}:00`;
      const date = new Date(dateTimeString);
      const formattedDate = format(date, "yyyy/M/d(E) - HH:mm", { locale: ja });

      setFormattedDate(formattedDate);

      return {
        ...prev,
        schedules: prev.schedules.map((schedule) => ({
          ...schedule,
          isConfirmed: schedule.id === scheduleId,
        })),
      };
    });
  };

  const handleCopyLink = async (eventId: string) => {
    const url = `${process.env.NEXT_PUBLIC_BASE_URL}/event?eventId=${eventId}`;
    try {
      await navigator.clipboard.writeText(url);
      setIsCopyModal(true);
    } catch (err) {
      console.error("リンクのコピーに失敗しました", err);
    }
  };


  // 初回と更新時にデータ取得
  const fetchSchedules = async () => {
    const data = await fetchEventWithSchedules(eventId);
    // setEventIdCookie(eventId)
    setEventData(data);
  };


  if (loading) {
    return <SpinLoader></SpinLoader>;
  }

  if (error) {
    return <p>エラー: {error}</p>;
  }

  if (!eventData) {
    return <p>データが見つかりません</p>;
  }

  const schedulesWithAttendCount = eventData.schedules.map((schedule) => ({
    ...schedule,
    attendCount: (schedule.responses as Response[]).filter((res) => res.response === "ATTEND").length,
  }));


  const confirmedSchedule = eventData.schedules.filter((res) => res.isConfirmed === true)[0];

  // ✅ ATTEND数が最も多いスケジュールを取得
  const maxAttendCount = Math.max(...schedulesWithAttendCount.map((s: maxAttend) => s.attendCount));
  const highlightScheduleIds = schedulesWithAttendCount
    .filter((s: maxAttend) => s.attendCount === maxAttendCount && maxAttendCount != 0)
    .map((s: maxAttend) => s.id);


  return (
    <>
      <div className={styles.eventContainer}>
        <div>
          <p className={styles.eventLink} onClick={() => handleCopyLink(eventData.id)}><FaRegCopy className={styles.copyIcon} />{`${baseUrl}/event?eventId=${eventData.id}`}</p>
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

          <div className={`relative overflow-x-auto ${styles.table}`}>
            <table className={styles.tableDesign}>
              <tbody>
                <tr>
                  {isOrganizer && (
                    <th></th>
                  )}
                  <th>候補日</th>
                  <th><FaRegCircle className={styles.reactIconTable} /></th>
                  <th><IoTriangleOutline className={styles.reactIconTable} /></th>
                  <th><RxCross2 className={styles.reactIconTable} /></th>
                  {/** `userId` をキーとして利用 */}
                  {Array.from(
                    new Map<string, { id: string; name: string; response: string }>(
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
                  } else if (isHighlighted && !confirmedSchedule) {
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

                  const label = !schedule.isConfirmed ? "" : styles.confirmedLabel
                  return (
                    <tr key={schedule.id} className={highlightClass}>
                      {isOrganizer && (
                        <td className="min-w-[134px]">
                          {
                            !schedule.isConfirmed ? (
                              <ConfirmScheduleButton
                                scheduleId={schedule.id}
                                eventId={eventData.id}
                                onConfirm={handleConfirmSchedule}
                                buttonText="この日に開催"
                              />
                            ) : (
                              <ConfirmScheduleButton
                                scheduleId={0}
                                eventId={eventData.id}
                                onConfirm={handleConfirmSchedule}
                                buttonText="キャンセル"
                              />
                            )
                          }

                        </td>
                      )}
                      <td className={`${label} min-w-[210px]`}>{formattedDate} - {schedule.time}</td>
                      <td className="min-w-[75px]">{attendCount}人</td>
                      <td className="min-w-[75px]">{undecidedCount}人</td>
                      <td className="min-w-[75px]">{declineCount}人</td>
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
                  {isOrganizer ?
                    <td colSpan={5} className={styles.colspan1}>コメント</td> :
                    <td colSpan={4} className={styles.colspan1}>コメント</td>
                  }

                  {Array.from(
                    new Map<string, { id: string; name: string; comment?: string }>(
                      eventData.schedules
                        .flatMap((schedule: Schedule) =>
                          schedule.responses.map((response) => ({
                            id: response.user.id,
                            name: response.user.name,
                            comment: response.user.comment || "",
                          }))
                        )
                        .map((user) => [user.id, user])
                    ).values()
                  ).map((user) => (
                    <td key={`comment-${user.id}`} colSpan={1} className={styles.userComment}>
                      {user.comment}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
            {accessToken ?
              <CreateEventButton accessToken={accessToken} refreshToken={refreshToken} confirmedSchedule={confirmedSchedule} event={eventData} /> :
              <SigninButton />
            }
          </div>
        </div>
      </div>
      <div className={styles.eventFormContainer}>
        {isCreateForm ? (
          <Form onSuccess={fetchSchedules} onCreate={handleCreate} schedules={eventData.schedules.map((schedule) => ({
            ...schedule,
            responses: schedule.responses.map((response) => ({
              ...response,
              user: {
                ...response.user,
                comment: response.user.comment || "", // undefined を空文字に変換
              },
            })),
          }))} />
        ) : (
          <Form onSuccess={fetchSchedules} onCreate={handleCreate} schedules={eventData.schedules.map((schedule) => ({
            ...schedule,
            responses: schedule.responses.map((response) => ({
              ...response,
              user: {
                ...response.user,
                comment: response.user.comment || "", // undefined を空文字に変換
              },
            })),
          }))} userId={userId} userName={userName} />
        )}
      </div>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <h2 className={styles.modalTitle}>{modalText}</h2>
        <p className={styles.modalText}>{formattedDate}</p>
      </Modal>
      <Modal isOpen={isCopyModal} onClose={() => setIsCopyModal(false)}>
        <h2 className={styles.modalTitle}>コピーしました</h2>
      </Modal>
    </>
  );
}
