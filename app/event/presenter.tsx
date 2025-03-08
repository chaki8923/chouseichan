'use client'

import { useState, useEffect, useRef, useCallback } from "react";
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
import { FaRegCopy, FaEdit } from "react-icons/fa";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { FiCamera, FiAlertTriangle } from 'react-icons/fi';

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
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [modalText, setModalText] = useState<string>('');
  const [formattedDate, setFormattedDate] = useState<string>();
  const [isImageSwiperOpen, setIsImageSwiperOpen] = useState(false);
  const [isImageUploadModalOpen, setIsImageUploadModalOpen] = useState(false);
  const [eventImages, setEventImages] = useState<{ imagePath?: string; id?: string; url?: string }[]>([]);
  const [isOrganizer, setIsOrganizer] = useState(false);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedMemo, setEditedMemo] = useState("");
  const [editMessage, setEditMessage] = useState<{ type: string; message: string }>({ type: "", message: "" });
  const [redirectTimer, setRedirectTimer] = useState<NodeJS.Timeout | null>(null);
  const [eventNotFound, setEventNotFound] = useState(false);
  const [isTableScrollable, setIsTableScrollable] = useState(false);

  const user = session?.user ?? { id: "", name: "ゲストユーザー", };
  const accessToken = user.accessToken ?? "";
  const refreshToken = user.refreshToken ?? "";

  const containerRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  async function fetchEventWithSchedules(eventId: string) {
    try {
      const response = await fetch(`/api/events?eventId=${eventId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "エラーが発生しました");
      }

      return data;
    } catch (error) {
      console.error("Error fetching event:", error);
      throw error;
    }
  }

  // コンポーネントのアンマウント時にタイマーをクリア
  useEffect(() => {
    return () => {
      if (redirectTimer) {
        clearTimeout(redirectTimer);
      }
    };
  }, [redirectTimer]);

  // ページ遷移を処理する関数
  const redirectToHome = useCallback(() => {
    const timer = setTimeout(() => {
      window.location.href = '/';
    }, 5000); // 5秒後に遷移
    setRedirectTimer(timer);
  }, []);

  const getEventData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchEventWithSchedules(eventId!);
      
      if (!data) {
        // イベントが見つからない場合の処理
        setError("指定されたイベントが見つかりませんでした");
        setEventNotFound(true);
        // 5秒後にTOPページに遷移
        redirectToHome();
        return;
      }
      
      setEventData(data);
      setError(null); // エラーをリセット
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("データ取得中に予期しないエラーが発生しました");
      }
      
      // エラー発生時も同様の処理
      setEventNotFound(true);
      redirectToHome();
    } finally {
      setLoading(false);
    }
  }, [eventId, redirectToHome]);

  const fetchSchedules = useCallback(async () => {
    try {
      const data = await fetchEventWithSchedules(eventId);
      
      if (data) {
        addEvent({ eventId: eventId, eventName: data.name, schedules: data.schedules });
        setEventData(data);
        
        // 画像データはイベントデータに含まれているので直接設定
        if (data && data.images) {
          setEventImages(Array.isArray(data.images) ? [...data.images] : []);
        }

        // 編集モードから戻る（ユーザー名、IDをリセットして新規登録モードへ）
        setUserId('');
        setUserName('');
        setIsCreateForm(true);
      }
    } catch (error) {
      console.error("スケジュールの取得中にエラーが発生しました:", error);
      setError("データの取得に失敗しました");
    }
  }, [eventId]);

  useEffect(() => {
    getEventData();
  }, [getEventData]);

  useEffect(() => {
    fetchSchedules(); // 初回ロード時に取得
  }, [fetchSchedules]);

  useEffect(() => {
    if (eventId) {
      setIsOrganizer(isEventOwner(eventId)); // ✅ クライアントサイドで実行
    }
  }, [eventId]);

  useEffect(() => {
    // ブラウザ環境でのみ実行
    if (typeof window !== 'undefined') {
      // ローカルストレージからデータを取得
      const uploadFlag = localStorage.getItem(`image_uploaded_${eventId}`);
      const uploadTime = localStorage.getItem(`image_upload_time_${eventId}`);
      
      // フラグが存在する場合の処理
      if (uploadFlag === 'true' && uploadTime) {
        // 最近アップロードされた場合（10分以内）
        const uploadTimeNum = parseInt(uploadTime);
        const now = Date.now();
        if (now - uploadTimeNum < 10 * 60 * 1000) {
          // ローカルストレージをクリア
          localStorage.removeItem(`image_uploaded_${eventId}`);
          localStorage.removeItem(`image_upload_time_${eventId}`);
          
          // スケジュール取得完了後に画像データを取得し、Swiperを表示
          // 少し待ってからSwiperを表示
          setTimeout(() => {
            // すでにデータは取得されているはずなので、そのままSwiperを表示
            setIsImageSwiperOpen(true);
          }, 1000);
        }
      }
    }
  }, [eventId]);

  useEffect(() => {
    const checkTableScrollable = () => {
      if (tableRef.current) {
        const isScrollable = tableRef.current.scrollWidth > tableRef.current.clientWidth;
        setIsTableScrollable(isScrollable);
        if (isScrollable) {
          tableRef.current.classList.add('scrollable');
          
          // モバイルデバイスでのスクロールヒントを強化（データが多いことを示す）
          if (window.innerWidth <= 768) {
            // スクロールアフォーダンス（ユーザーに横スクロールができることを示すヒント）
            const scheduleCount = eventData?.schedules?.length || 0;
            console.log(`Table is scrollable with ${scheduleCount} schedules`);
          }
        } else {
          tableRef.current.classList.remove('scrollable');
        }
      }
    };

    // ブラウザ環境でのみ実行
    if (typeof window !== 'undefined') {
      // 初期読み込み時にチェック
      checkTableScrollable();
      
      // DOM完全読み込み後に再チェック（より確実に）
      setTimeout(checkTableScrollable, 500);
      setTimeout(checkTableScrollable, 1000);  // 念のためもう一度

      // ウィンドウサイズが変更されたときにチェック
      window.addEventListener('resize', checkTableScrollable);
      
      // コンテンツが変わる可能性があるので、eventDataが変わったときもチェック
      if (eventData && eventData.schedules) {
        checkTableScrollable();
      }
      
      return () => {
        window.removeEventListener('resize', checkTableScrollable);
      };
    }
  }, []);

  if (!eventId) return <p>イベントidがありません</p>

  if (eventNotFound) {
    return (
      <div className={styles.eventNotFoundContainer}>
        <div className={styles.eventNotFoundCard}>
          <FiAlertTriangle size={60} color="#FF6B6B" />
          <h1 className={styles.eventNotFoundTitle}>イベントが見つかりません</h1>
          <p className={styles.eventNotFoundText}>該当のイベントは削除されました。トップページに戻ります</p>
          <div className={styles.redirectCountdown}>
            <div className={styles.countdownBar}></div>
          </div>
          <button 
            className={styles.redirectButton}
            onClick={() => window.location.href = '/'}
          >
            今すぐトップページへ
          </button>
        </div>
      </div>
    );
  }

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
  
  // eventData.imagesの構造を詳しく確認
  // if (eventData.images && eventData.images.length > 0) {
  //   console.log("First image structure:", JSON.stringify(eventData.images[0]));
  // }

  // イベント編集を開始する関数
  const handleStartEdit = () => {
    setEditedTitle(eventData.name);
    setEditedMemo(eventData.memo || "");
    setIsEditing(true);
  };

  // イベント編集をキャンセルする関数
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditMessage({ type: "", message: "" });
  };

  // イベント編集を保存する関数
  const handleSaveEdit = async () => {
    if (!editedTitle.trim()) {
      setEditMessage({ type: "error", message: "イベント名は必須です" });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/events`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventId: eventData.id,
          name: editedTitle,
          memo: editedMemo,
        }),
      });

      if (!response.ok) {
        throw new Error("更新に失敗しました");
      }

      // localStorageのイベント履歴も更新する
      if (typeof window !== 'undefined') {
        try {
          // eventHistoryを更新
          const historyData = localStorage.getItem("eventHistory");
          if (historyData) {
            const history = JSON.parse(historyData);
            const updatedHistory = Array.isArray(history) 
              ? history.map(event => 
                  event.eventId === eventData.id 
                    ? { ...event, eventName: editedTitle } 
                    : event
                )
              : history;
            localStorage.setItem("eventHistory", JSON.stringify(updatedHistory));
          }

          // eventsも更新（互換性のため）
          const eventsData = localStorage.getItem("events");
          if (eventsData) {
            const events = JSON.parse(eventsData);
            const updatedEvents = Array.isArray(events) 
              ? events.map(event => 
                  event.eventId === eventData.id 
                    ? { ...event, eventName: editedTitle } 
                    : event
                )
              : events;
            localStorage.setItem("events", JSON.stringify(updatedEvents));
          }

          // ownerEventsも更新
          const ownerEventsData = localStorage.getItem("ownerEvents");
          if (ownerEventsData) {
            const ownerEvents = JSON.parse(ownerEventsData);
            const updatedOwnerEvents = Array.isArray(ownerEvents) 
              ? ownerEvents.map(event => 
                  event.eventId === eventData.id 
                    ? { ...event, eventName: editedTitle } 
                    : event
                )
              : ownerEvents;
            localStorage.setItem("ownerEvents", JSON.stringify(updatedOwnerEvents));
          }
        
        } catch (err) {
          console.error("ローカルストレージの更新に失敗しました:", err);
        }
      }

      // 編集完了モーダルを表示
      setIsEditing(false);
      
      // モーダルを表示して少し待ってからリロード
      setTimeout(() => {
        // リロードする代わりに直接データを取得
        const fetchData = async () => {
          try {
            const data = await fetchEventWithSchedules(eventId);
            if (data) {
              setEventData(data);
              if (data.images) {
                setEventImages(Array.isArray(data.images) ? [...data.images] : []);
              }
            }
          } catch (error) {
            console.error("データ更新に失敗:", error);
          }
        };
        fetchData();
      }, 1500);
    } catch (error) {
      console.error("イベント更新エラー:", error);
      setEditMessage({ type: "error", message: "更新に失敗しました。再度お試しください。" });
    } finally {
      setIsLoading(false);
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

  // イベントリンクをコピーする関数
  const handleCopyLink = async (eventId: string) => {
    const url = `${process.env.NEXT_PUBLIC_BASE_URL}/event?eventId=${eventId}`;
    try {
      await navigator.clipboard.writeText(url);
      setIsCopyModal(true);
      setTimeout(function () {
        setIsCopyModal(false);
      }, 1500);
    } catch (err) {
      console.error("リンクのコピーに失敗しました", err);
    }
  };

  // URLの表示/非表示を切り替える関数
  const toggleUrlDisplay = () => {
    setShowUrlInput(!showUrlInput);
  };

  // フォーム作成モードを切り替える関数
  const handleCreate = () => {
    setUserId('');
    setUserName('');
    setIsCreateForm(true);
  };

  // ユーザー情報を更新する関数
  const changeUpdate = (userId: string, userName: string) => {
    setUserId(userId);
    setUserName(userName);
    setIsCreateForm(false);
    
    // 回答フォームまでスクロール
    const responseArea = document.getElementById('response_area');
    if (responseArea) {
      responseArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // スケジュール確定処理の関数
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

  // 画像アップロード後に画像リストを更新
  const handleImageUploaded = async () => {
    // アップロード成功を示すフラグをローカルストレージに保存
    // リロード後もアップロード完了を認識できるようにする
    localStorage.setItem(`image_uploaded_${eventId}`, 'true');
    localStorage.setItem(`image_upload_time_${eventId}`, Date.now().toString());
    
    // 画像データ取得の代わりに既存のイベントデータAPIを使用
    try {
      const response = await fetch(`/api/events?eventId=${eventId}&_t=${Date.now()}`);
      if (response.ok) {
        const data = await response.json();
        if (data && data.images) {
          setEventImages([...data.images]);
        }
      }
    } catch (error) {
      console.error("画像データの更新に失敗:", error);
    }
  };

  // フォーム送信後の処理
  const handleFormSuccess = () => {
    // 完了モーダルを表示
    // 2秒後に閉じる
    setTimeout(() => {
    }, 2000);
    
    // スケジュールとイベントデータを再取得（fetchSchedules関数に記述されているリセット処理は実行される）
    fetchSchedules();
  };

  // 画像の削除処理関数を追加
  const handleDeleteImage = async (index: number) => {
    if (!eventData || !eventData.id || !eventImages[index]) return;
    
    // ユーザーに確認
    if (!confirm('この画像を削除してもよろしいですか？')) {
      return;
    }

    try {
      // APIを呼び出して画像を削除
      const imageId = typeof eventImages[index] === 'object' && eventImages[index].id 
        ? eventImages[index].id
        : null;
        
      if (!imageId) {
        console.error('画像IDが取得できません');
        return;
      }
      
      const response = await fetch(`/api/delete-event-image`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId: eventData.id,
          imageId
        })
      });

      if (response.ok) {
        // 成功したら、画像リストから削除
        const newImages = [...eventImages];
        newImages.splice(index, 1);
        setEventImages(newImages);
        
        // 画像がなくなったらSwiperを閉じる
        if (newImages.length === 0) {
          setIsImageSwiperOpen(false);
        }
      } else {
        const errorData = await response.json();
        alert(`削除に失敗しました: ${errorData.message || 'エラーが発生しました'}`);
      }
    } catch (error) {
      console.error('画像削除エラー:', error);
      alert('画像の削除中にエラーが発生しました');
    }
  };

  return (
    <>
      <div className={`${styles.eventContainer} ${eventNotFound ? styles.blurContainer : ''}`} ref={containerRef}>
        <div>
          
          {isEditing ? (
            <div className={styles.editContainer}>
              <h2 className={styles.editTitle}>イベント情報の編集</h2>
              <div className={styles.editForm}>
                <div className={styles.formGroup}>
                  <label className={styles.editLabel}>
                    イベント名 <span className={styles.tagRequire}>必須</span>
                  </label>
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className={styles.editInput}
                    maxLength={100}
                    placeholder="イベント名（100文字以内）"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.editLabel}>
                    メモ <span className={styles.tagNoRequire}>任意</span>
                  </label>
                  <textarea
                    value={editedMemo}
                    onChange={(e) => setEditedMemo(e.target.value)}
                    className={styles.editTextarea}
                    maxLength={500}
                    placeholder="メモ（500文字以内）"
                  />
                </div>
                {editMessage.type && (
                  <p className={editMessage.type === "error" ? "text-red-500" : "text-green-500"}>
                    {editMessage.message}
                  </p>
                )}
                <div className={styles.editActions}>
                  <button
                    onClick={handleCancelEdit}
                    className={styles.cancelButton}
                    disabled={isLoading}
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className={styles.saveButton}
                    disabled={isLoading}
                  >
                    {isLoading ? "保存中..." : "変更を保存"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.eventTitleContainer}>
              <h1 className={styles.eventName}>{eventData.name}</h1>
              {isOrganizer && (
                <button
                  onClick={handleStartEdit}
                  className={styles.editButton}
                  title="イベント情報を編集"
                >
                  <FaEdit />
                </button>
              )}
            </div>
          )}

          <section className={styles.eventTitleSection}>
            {!isEditing && eventData.memo && (
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

          <div className={styles.eventDetailsContainer}>
            
            {/* イベント共有ボタン - イベント名の下に配置 */}
            <div className={styles.shareContainer}>
              <button 
                className={styles.eventShareButton} 
                onClick={toggleUrlDisplay}
                aria-label="イベントURLを共有"
              >
                <FaRegCopy className={styles.copyIcon} />
                仲間と予定を共有する
              </button>
              
              {showUrlInput && (
                <div className={styles.eventLinkDisplay}>
                  <span className={styles.urlText}>{`${baseUrl}/event?eventId=${eventData.id}`}</span>
                  <button 
                    className={styles.copyButton} 
                    onClick={() => handleCopyLink(eventData.id)}
                  >
                    コピー
                  </button>
                </div>
              )}
            </div>
            
          </div>

          {/* テーブルの前にスワイプ案内を移動し、シンプルな表示に変更 */}
          {eventData.schedules.length > 0 && isTableScrollable && (
            <div className={styles.mobileScrollHint} style={{ width: '100%', maxWidth: '100%', overflow: 'visible', position: 'relative', left: 0, right: 0 }}>
              <span className={styles.swipeText}>スワイプできます</span>
            </div>
          )}
          
          <div className={`relative overflow-x-auto ${styles.table} ${isTableScrollable ? styles.scrollable : ''}`} ref={tableRef}>
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
                    <th key={user.id} onClick={() => changeUpdate(user.id, user.name)} className={styles.userName} role="button" title={`${user.name}さんの回答を編集する`}>
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
                        <td className="min-w-[180px]">
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
      <div id="response_area" className="mt-12">
        <h2 className={styles.h2Title}>回答フォーム</h2>
        {isCreateForm ? (
          <Form 
            onSuccess={handleFormSuccess} 
            onCreate={handleCreate} 
            schedules={eventData.schedules.map((schedule) => ({
              ...schedule,
              responses: schedule.responses.map((response) => ({
                ...response,
                user: {
                  ...response.user,
                  comment: response.user.comment || "", 
                },
              })),
            }))} 
            userId={userId} 
            userName={userName} 
          />
        ) : (
          <Form 
            onSuccess={handleFormSuccess} 
            onCreate={handleCreate} 
            schedules={eventData.schedules.map((schedule) => ({
              ...schedule,
              responses: schedule.responses.map((response) => ({
                ...response,
                user: {
                  ...response.user,
                  comment: response.user.comment || "", 
                },
              })),
            }))} 
            userId={userId} 
            userName={userName} 
          />
        )}
      </div>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <h2 className={styles.modalTitle}>{modalText}</h2>
        <p className={styles.modalText}>{formattedDate}</p>
      </Modal>
      
      {isCopyModal && (
        <div className={styles.copySuccess}>
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
          </svg>
          コピーしました
        </div>
      )}
      
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
        <div className={styles.disabledImageUploader}>
          画像はイベント開催日以降に投稿できます
        </div>
      )}
      
      {/* 画像がある場合のみボタンを表示 */}
      {eventData && eventData.images && eventData.images.length > 0 && (
        <button 
          onClick={async () => {
            // 強制的に最新データを取得してからSwiperを開く
            if (eventData && eventData.id) {
              try {
                const response = await fetch(`/api/events?eventId=${eventData.id}&_t=${Date.now()}`);
                if (response.ok) {
                  const data = await response.json();
                  if (data && data.images) {
                    setEventImages([...data.images]);
                    setIsImageSwiperOpen(true);
                  }
                }
              } catch (error) {
                console.error("画像データの取得中にエラー発生:", error);
              }
            }
          }}
          className={styles.viewImagesBtn}
        >
          <FiCamera /> イベント画像を表示
        </button>
      )}

      {isImageSwiperOpen && (
        <ImageSwiper 
          images={eventImages} 
          title={`${eventData.name}の画像`}
          onClose={() => setIsImageSwiperOpen(false)}
          debugId={eventData.id}
          onDelete={isOrganizer ? handleDeleteImage : undefined} // オーナーのみ削除可能
        />
      )}
    </>
  );
}