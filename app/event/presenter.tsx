'use client'

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Session } from "@auth/core/types";
import SigninButton from "@/app/component/calendar/SignInButton"
import ImageUploadSection from "../component/form/imageUploader";
import { CreateEventButton } from "../component/calendar/CreateEventButton";
import { ConfirmScheduleButton } from "../component/button/confirmSchedule";
import styles from "./index.module.scss"
import { FaRegCircle } from "react-icons/fa";
import { RxCross2 } from "react-icons/rx";
import Scroll from "../component/scroll/arrow";
import { IoTriangleOutline } from "react-icons/io5";
import { Schedule } from "@/types/schedule";
import { Response } from "@/types/response";
import { User } from "@/types/user";
import { Event } from "@/types/event";
import Form from "./form";
import Modal from "../component/modal/modal";
import SpinLoader from "../component/loader/spin";
import { isEventOwner, addEvent } from "@/app/utils/strages";
import ImageSwiper from "../component/form/ImageSwiper";
import { FaRegCopy } from "react-icons/fa";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

type maxAttend = {
  id: number;
  attendCount: number
}

export default function EventDetails({ eventId, session }: { eventId: string, session: Session | null }) {

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
  const [isImageSwiperOpen, setIsImageSwiperOpen] = useState(false);
  const [isImageUploadModalOpen, setIsImageUploadModalOpen] = useState(false);
  const [eventImages, setEventImages] = useState<any[]>([]);
  const [isOrganizer, setIsOrganizer] = useState(false);
  // const searchParams = useSearchParams();
  // const eventId = searchParams.get("eventId"); // URLのクエリパラメータから 
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  const user = session?.user ?? { id: "", name: "ゲストユーザー", };
  const accessToken = user.accessToken ?? "";
  const refreshToken = user.refreshToken ?? "";

  const containerRef = useRef<HTMLDivElement>(null);

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


  useEffect(() => {
    if (eventId) {
      setIsOrganizer(isEventOwner(eventId)); // ✅ クライアントサイドで実行
    }
  }, [eventId]);

  if (!eventId) return <p>イベントidがありません</p>



  async function fetchEventWithSchedules(eventId: string) {
    try {
      const response = await fetch(`/api/events?eventId=${eventId}`);

      if (!response.ok) {
        throw new Error(`エラーが発生しました: ${response.status}`);
      }

      const data = await response.json();

      return {
        ...data,
        images: data.images || [],
      };
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
    setTimeout(function () {
      setIsOpen(false);

    }, 1500);
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
      setTimeout(function () {
        setIsCopyModal(false);

      }, 1200);
    } catch (err) {
      console.error("リンクのコピーに失敗しました", err);
    }
  };

  // イベント画像を更新する関数
  const refreshEventImages = async () => {
    if (eventData && eventData.id) {
      try {
        const response = await fetch(`/api/images/${eventData.id}`);
        if (response.ok) {
          const data = await response.json();
          if (data && data.images) {
            setEventImages(data.images);
            console.log("画像を更新しました:", data.images);
          }
        }
      } catch (error) {
        console.error("画像の更新に失敗しました:", error);
      }
    }
  };

  // 初回と更新時にデータ取得
  const fetchSchedules = async () => {
    const data = await fetchEventWithSchedules(eventId);
    addEvent({ eventId: eventId, eventName: data.name, schedules: data.schedules });
    setEventData(data);
    
    // 画像データも取得
    if (data && data.images) {
      setEventImages(data.images);
    }
  };

  // イベント開催日が確定していて、かつ現在の日付が開催日以降かどうかを確認
  const canUploadImages = () => {
    if (!eventData || !eventData.schedules) return false;
    
    // 確定されたスケジュールを検索
    const confirmedSchedule = eventData.schedules.find(schedule => schedule.isConfirmed === true);
    if (!confirmedSchedule || !confirmedSchedule.date) return false;
    
    // イベント開催日と現在の日付を比較
    const eventDate = new Date(confirmedSchedule.date);
    const today = new Date();
    // 日付のみを比較するため、時刻部分をリセット
    eventDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    // イベント開催日以降の場合にtrueを返す
    return eventDate <= today;
  };

  // 画像アップロードモーダルを表示する関数
  const handleImageUploadClick = () => {
    if (!canUploadImages()) {
      setModalText("画像はイベント開催日以降に投稿できます");
      setIsImageUploadModalOpen(true);
    }
  };

  // 画像アップロード後に画像リストを更新
  const handleImageUploaded = () => {
    // 画像が更新されたら最新の画像を取得
    refreshEventImages();
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
  console.log("eventData", eventData.images);
  
  // eventData.imagesの構造を詳しく確認
  if (eventData.images && eventData.images.length > 0) {
    console.log("First image structure:", JSON.stringify(eventData.images[0]));
  }


  return (
    <>
      <div className={styles.eventContainer}>
        <div>
          <p className={styles.eventLink} onClick={() => handleCopyLink(eventData.id)}><FaRegCopy className={styles.copyIcon} />{`${baseUrl}/event?eventId=${eventData.id}`}</p>
          <h1 className={styles.eventName}>{eventData.name}</h1>
          <section className={styles.eventTitleSection}>
            {eventData.memo && (
              <>
                <Image src={eventData.image ? eventData.image : '/default.png'}
                  width={50}
                  height={50}
                  alt="Event Crop Image"
                  className={styles.eventImage} />
                <h2 className={styles.memo}>{eventData.memo}</h2>
              </>
            )}
          </section>

          <div className={`relative overflow-x-auto ${styles.table}`} ref={containerRef}>
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
                      <td className={`${label} min-w-[310px]`}>{formattedDate} - {schedule.time}</td>
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
            <Scroll containerRef={containerRef} />
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
      <Modal isOpen={isImageUploadModalOpen} onClose={() => setIsImageUploadModalOpen(false)} type="info">
        <div className={styles.modalContent}>
          <h2 className={styles.modalTitle}>画像投稿について</h2>
          <p>画像の投稿は以下の条件を満たす場合のみ可能です：</p>
          <ul className={styles.modalList}>
            <li>イベントの開催日が確定されている</li>
            <li>現在の日付がイベント開催日以降である</li>
          </ul>
          <p>イベント開催後に再度お試しください。</p>
          <div className={styles.modalActions}>
            <button 
              onClick={() => setIsImageUploadModalOpen(false)}
              className={styles.modalButton}
            >
              閉じる
            </button>
          </div>
        </div>
      </Modal>
      
      {canUploadImages() ? (
        // 条件を満たす場合は通常のアップロードセクションを表示
        <ImageUploadSection eventData={eventData} onImageUploaded={handleImageUploaded} />
      ) : (
        // 条件を満たさない場合はクリックするとモーダルを表示するボタンを表示
        <div className={styles.disabledImageUploader} onClick={handleImageUploadClick}>
          画像はイベント開催日以降に投稿できます
        </div>
      )}
      
      <button 
        onClick={() => {
          refreshEventImages(); // 画像を最新の状態に更新してから表示
          setIsImageSwiperOpen(true);
        }} 
        className={styles.viewImagesBtn}
      >
        投稿画像を見る
      </button>
      
      {isImageSwiperOpen && (
        <ImageSwiper 
          images={eventImages} 
          title={eventData.name || "イベント"}
          onClose={() => setIsImageSwiperOpen(false)}
        />
      )}

    </>
  );
}
