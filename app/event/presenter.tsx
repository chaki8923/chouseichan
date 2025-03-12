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
import { Event } from "@/types/event";
import Form from "./form";
import Modal from "../component/modal/modal";
import SpinLoader from "../component/loader/spin";
import { isEventOwner, addEvent, removeEvent } from "@/app/utils/strages";
import ImageSwiper from "../component/form/ImageSwiper";
import { FaRegCopy, FaEdit } from "react-icons/fa";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { FiCamera, FiAlertTriangle, FiTrash2, FiCheck, FiMove, FiClock } from 'react-icons/fi';
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import RestaurantVoteLink from "../components/RestaurantVoteLink";

type maxAttend = {
  id: number;
  attendCount: number
}

type LocalStorageEvent = {
  id: string;
  name?: string;
  date?: string;
  [key: string]: string | number | boolean | null | undefined; // その他の可能性のあるプロパティ
};

// 編集データの一時保存用インターフェース
interface EventEditTempData {
  title?: string;
  memo?: string;
}

// 型定義の追加
interface SortableScheduleItemProps {
  schedule: { id: number; date: string; time: string; hasResponses: boolean };
  index: number;
  hasResponses: boolean;
  isMarkedForDeletion: boolean;
  onDateChange: (index: number, field: 'date' | 'time', value: string) => void;
  onTimeChange: (index: number, field: 'date' | 'time', value: string) => void;
  onToggleDelete: (id: number) => void;
}

interface NewScheduleItemProps {
  schedule: { date: string; time: string; id: string; displayOrder: number };
  index: number;
  onRemove: (index: number) => void;
  onChange: (index: number, field: 'date' | 'time', value: string) => void;
}

// 時間のオプションを生成する関数
const generateTimeOptions = () => {
  const times = [];
  const startHour = 0;
  const endHour = 23;
  const interval = 30; // 分単位

  for (let hour = startHour; hour <= endHour; hour++) {
    const intervals = [0, interval];
    for (const minute of intervals) {
      const formattedHour = hour.toString().padStart(2, '0');
      const formattedMinute = minute.toString().padStart(2, '0');
      const formattedTime = `${formattedHour}:${formattedMinute}`;
      times.push(formattedTime);
    }
  }
  return times;
};

// 並べ替え可能なスケジュールアイテムコンポーネント
const SortableScheduleItem: React.FC<SortableScheduleItemProps> = ({
  schedule,
  index,
  hasResponses,
  isMarkedForDeletion,
  onDateChange,
  onTimeChange,
  onToggleDelete
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ 
    id: schedule.id.toString(),
    // ドラッグ中のプレビューを強化するための設定
    animateLayoutChanges: () => false, // 自動レイアウト変更を無効化
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1000 : 1,
    opacity: isDragging ? 0.3 : 1, // ドラッグ中の不透明度を下げる（元のアイテムが薄くなる）
    position: 'relative' as const,
    boxShadow: isDragging ? '0 8px 16px rgba(0, 0, 0, 0.2)' : 'none',
    border: isDragging ? '1px solid #666' : undefined,
    backgroundColor: isDragging ? '#f0f0f0' : undefined,
    transformOrigin: '0 0', // 変形の起点を左上に設定
  };

  // 時間選択肢を生成
  const timeOptions = generateTimeOptions();

  // ドラッグ中は入力フィールドへのインタラクションを防止
  const handleInputInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    if (isDragging) {
      e.stopPropagation();
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${styles.scheduleItem} ${isMarkedForDeletion ? styles.scheduleDeleted : ''} ${hasResponses ? styles.scheduleDisabled : ''} ${isDragging ? styles.dragging : ''}`}
      {...attributes}
      {...listeners}
    >
      <div className={styles.dragHandle}>
        <FiMove />
      </div>
      <div
        className={styles.scheduleInputs}
        onClick={handleInputInteraction}
        onTouchStart={handleInputInteraction}
      >
        <input
          type="date"
          value={schedule.date}
          onChange={(e) => onDateChange(index, 'date', e.target.value)}
          className={styles.editInput}
          disabled={hasResponses || isMarkedForDeletion}
        />
        <select
          value={schedule.time}
          onChange={(e) => onTimeChange(index, 'time', e.target.value)}
          className={styles.editInput}
          disabled={hasResponses || isMarkedForDeletion}
        >
          {timeOptions.map((time) => (
            <option key={time} value={time}>{time}</option>
          ))}
        </select>
      </div>
      {hasResponses && !isMarkedForDeletion && (
        <div className={styles.scheduleStatus}>
          <span className={styles.scheduleStatusText}>回答あり</span>
        </div>
      )}
      {!hasResponses && (
        !isMarkedForDeletion ? (
          <button
            type="button"
            onClick={() => onToggleDelete(schedule.id)}
            className={`${styles.scheduleActionButton} ${styles.deleteButton}`}
            disabled={isDragging}
          >
            <FiTrash2 className={styles.buttonIcon} />
            削除
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onToggleDelete(schedule.id)}
            className={`${styles.scheduleActionButton} ${styles.restoreButton}`}
            disabled={isDragging}
          >
            <FiCheck className={styles.buttonIcon} />
            復元
          </button>
        )
      )}

    </div>
  );
};

// 新しい日程アイテムコンポーネント（ドラッグ可能）
const SortableNewScheduleItem: React.FC<NewScheduleItemProps> = ({
  schedule,
  index,
  onRemove,
  onChange
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ 
    id: schedule.id,
    // ドラッグ中のプレビューを強化するための設定
    animateLayoutChanges: () => false, // 自動レイアウト変更を無効化
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1000 : 1,
    opacity: isDragging ? 0.3 : 1, // ドラッグ中の不透明度を下げる（元のアイテムが薄くなる）
    position: 'relative' as const,
    boxShadow: isDragging ? '0 8px 20px rgba(222, 49, 99, 0.25)' : 'none',
    border: isDragging ? '1px solid #de3163' : undefined,
    backgroundColor: isDragging ? '#fff8f9' : undefined,
    transformOrigin: '0 0', // 変形の起点を左上に設定
  };

  // 時間選択肢を生成
  const timeOptions = generateTimeOptions();

  // ドラッグ中は入力フィールドへのインタラクションを防止
  const handleInputInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    if (isDragging) {
      e.stopPropagation();
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${styles.scheduleItem} ${styles.newScheduleItem} ${isDragging ? styles.dragging : ''}`}
      {...attributes}
      {...listeners}
    >
      <div className={styles.dragHandle}>
        <FiMove />
      </div>
      <div
        className={styles.scheduleInputs}
        onClick={handleInputInteraction}
        onTouchStart={handleInputInteraction}
      >
        <input
          type="date"
          value={schedule.date}
          onChange={(e) => onChange(index, 'date', e.target.value)}
          className={styles.editInput}
        />
        <select
          value={schedule.time}
          onChange={(e) => onChange(index, 'time', e.target.value)}
          className={styles.editInput}
        >
          {timeOptions.map((time) => (
            <option key={time} value={time}>{time}</option>
          ))}
        </select>
      </div>
      <button
        type="button"
        onClick={() => onRemove(index)}
        className={`${styles.scheduleActionButton} ${styles.deleteButton}`}
        disabled={isDragging}
      >
        <>
          <FiTrash2 className={styles.buttonIcon} />
          削除
        </>
      </button>
    </div>
  );
};

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
  const [isDeleteCompleteModal, setIsDeleteCompleteModal] = useState(false);
  const [eventImages, setEventImages] = useState<{ imagePath?: string; id?: string; url?: string }[]>([]);
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [eventNotFound, setEventNotFound] = useState(false);
  const [isTableScrollable, setIsTableScrollable] = useState(false);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState<string>("");
  const [editedMemo, setEditedMemo] = useState<string>("");
  const [editedIcon, setEditedIcon] = useState<string>("");
  const [editedResponseDeadline, setEditedResponseDeadline] = useState<string>("");
  const [selectedIconFile, setSelectedIconFile] = useState<File | null>(null);
  const [previewIcon, setPreviewIcon] = useState<string>("");
  const [editedSchedules, setEditedSchedules] = useState<{ id: number; date: string; time: string; hasResponses: boolean; displayOrder: number }[]>([]);
  const [newSchedules, setNewSchedules] = useState<{ id: string; date: string; time: string; displayOrder: number }[]>([]);
  const [scheduleToDelete, setScheduleToDelete] = useState<number[]>([]);
  const [editMessage, setEditMessage] = useState<{ type: string; message: string }>({ type: "", message: "" });
  const [redirectTimer, setRedirectTimer] = useState<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleteCompleteModalOpen, setIsDeleteCompleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  // 状態変数定義に追加
  const [isEditCompleteModalOpen, setIsEditCompleteModalOpen] = useState(false);
  const [tempMovedSchedules, setTempMovedSchedules] = useState<number[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState<any | null>(null);
  const [isDeadlinePassed, setIsDeadlinePassed] = useState<boolean>(false);
  // ステート定義部分に確定スケジュール用の状態変数を追加
  const [confirmedSchedule, setConfirmedSchedule] = useState<Schedule | undefined>(undefined);
  // 追加の状態変数
  const [editedResponseDeadlineDate, setEditedResponseDeadlineDate] = useState("");
  const [editedResponseDeadlineTime, setEditedResponseDeadlineTime] = useState("");

  // DnDkit用のセンサーをコンポーネントのトップレベルで定義
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // ドラッグを開始するのに必要な移動距離（ピクセル）
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const user = session?.user ?? { id: "", name: "ゲストユーザー", };
  const accessToken = user.accessToken ?? "";
  const refreshToken = user.refreshToken ?? "";

  const containerRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (eventId) {
      setIsOrganizer(isEventOwner(eventId)); // ✅ クライアントサイドで実行
    }
  }, [eventId]);

  async function fetchEventWithSchedules(eventId: string) {
    setLoading(true);

    try {
      const response = await fetch(`/api/events?eventId=${eventId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch event data");
      }

      const eventData = await response.json();
      setEventData(eventData);
      
      // 回答期限が過ぎているかチェック
      if (eventData.responseDeadline) {
        const now = new Date();
        const deadline = new Date(eventData.responseDeadline);
        setIsDeadlinePassed(now > deadline);
      } else {
        setIsDeadlinePassed(false);
      }

      // if (eventData.userId && session?.user?.id) {
      //   // イベントの所有者の場合
      //   if (eventData.userId === session.user.id) {
      //     setIsOrganizer(true);
      //   } else {
      //     setIsOrganizer(false);
      //   }
      // } else {
      //   setIsOrganizer(false);
      // }

      // イベント画像を設定
      if (eventData.images) {
        setEventImages(Array.isArray(eventData.images) 
          ? eventData.images.map((img: string) => ({ url: img })) 
          : []);
      }
      
      setLoading(false);
      return eventData; // イベントデータを返す
    } catch (error) {
      console.error("Error fetching event:", error);
      setError("イベントが開かない場合は再読み込みしてみてください");
      setEventNotFound(true);
      setLoading(false);
      return null; // エラー時はnullを返す
    }
  }

  // fetchEventImages関数がある場合は更新（呼び出されているため）
  async function fetchEventImages(eventId: string) {
    try {
      const response = await fetch(`/api/events/images?eventId=${eventId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch event images");
      }
      
      const images = await response.json();
      if (images && Array.isArray(images)) {
        setEventImages(images.map((img: string) => ({ url: img })));
      }
    } catch (error) {
      console.error("Error fetching event images:", error);
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
      // fetchEventWithSchedulesの戻り値を受け取り、それを利用する
      const data = await fetchEventWithSchedules(eventId!);

      if (!data) {
        // イベントが見つからない場合の処理
        console.log("イベントデータがありません - モーダル表示準備");
        setError("指定されたイベントが見つかりませんでした");
        setEventNotFound(true);

        // localStorage からも該当のイベント情報を削除
        if (typeof window !== 'undefined' && eventId) {
          try {
            // localStorageの「recent_events」キーから該当のイベントを削除
            const recentEvents = JSON.parse(localStorage.getItem('recent_events') || '[]');
            const filteredEvents = recentEvents.filter((event: LocalStorageEvent) => event.id !== eventId);
            localStorage.setItem('recent_events', JSON.stringify(filteredEvents));
          } catch (error) {
            console.error('LocalStorageからの削除に失敗:', error);
          }
        }

        // 5秒後に自動的にトップページへリダイレクト
        redirectToHome();
        return;
      }

      // スケジュールをdisplayOrderでソート
      if (data.schedules) {
        data.schedules.sort((a: { displayOrder?: number }, b: { displayOrder?: number }) => {
          const orderA = a.displayOrder ?? 0;
          const orderB = b.displayOrder ?? 0;
          return orderA - orderB;
        });
      }

      setEventData(data);
    } catch (error) {
      console.error("Error fetching event data:", error);
      setError("データの取得中にエラーが発生しました");
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
    } catch {
      // エラーが発生した場合でもUIにはメッセージを表示
      setError("データの取得に失敗しました");
    } finally {
      // 処理完了時は必ずローディング状態を解除
      setLoading(false);
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
      // URLパラメータを確認
      const urlParams = new URLSearchParams(window.location.search);
      const noAutoSwiper = urlParams.get('noAutoSwiper');

      // noAutoSwiperフラグがある場合は、Swiperを自動表示しない
      if (noAutoSwiper === 'true') {
        return; // 何もせずに終了
      }

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
            // const scheduleCount = eventData?.schedules?.length || 0;
            // console.log(`Table is scrollable with ${scheduleCount} schedules`);
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

  // イメージリサイズページから戻ってきたかチェック
  useEffect(() => {
    // クライアントサイドでのみ実行
    if (typeof window !== 'undefined' && isEditing) {
      // URLパラメータからfrom_resizeを取得
      const urlParams = new URLSearchParams(window.location.search);
      const fromResize = urlParams.get('from_resize') === 'true';

      if (fromResize) {
        try {
          // localStorage から一時保存データを取得
          const savedIconData = localStorage.getItem('temp_event_edit_data');

          if (savedIconData) {
            const editData: EventEditTempData = JSON.parse(savedIconData);

            // 保存された値を復元
            if (editData.title) {
              setEditedTitle(editData.title);
            }

            if (editData.memo !== undefined) {
              setEditedMemo(editData.memo);
            }

            // 画像情報は既に圧縮済みの新しい画像を選択するため復元しない

            // データを利用したらクリア
            localStorage.removeItem('temp_event_edit_data');

            // URLパラメータをクリア（履歴に残さず現在のURLを置き換え）
            const newUrl = `${window.location.pathname}?eventId=${eventId}`;
            window.history.replaceState({}, document.title, newUrl);
          }
        } catch (error) {
          console.error('編集データの復元に失敗しました:', error);
        }
      }
    }
  }, [isEditing, eventId]);

  // 削除完了モーダルが表示されたときのリダイレクト処理
  useEffect(() => {
    if (isDeleteCompleteModalOpen) {
      // モーダルCountdownBarのアニメーションが終了する3秒後にトップページへリダイレクト
      const redirectTimer = setTimeout(() => {
        window.location.href = '/';
      }, 3000);

      // コンポーネントのアンマウント時やモーダルが閉じられたときにタイマーをクリア
      return () => clearTimeout(redirectTimer);
    }
  }, [isDeleteCompleteModalOpen]);

  // イベントが見つからない場合のリダイレクト処理
  useEffect(() => {
    if (eventNotFound) {
      console.log("eventNotFoundフラグがtrueです - カウントダウン開始");
      // countdownBarのアニメーションが終了する5秒後に自動的にトップページへリダイレクト
      const redirectTimer = setTimeout(() => {
        console.log("カウントダウン完了 - トップページへリダイレクト");
        window.location.href = '/';
      }, 5000);

      // コンポーネントのアンマウント時にタイマーをクリア
      return () => clearTimeout(redirectTimer);
    }
  }, [eventNotFound]);

  useEffect(() => {
    if (eventData && eventData.schedules) {
      const foundConfirmedSchedule = eventData.schedules.find(
        (schedule: any) => schedule.isConfirmed
      );
      setConfirmedSchedule(foundConfirmedSchedule);
    }
  }, [eventData]);

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
    setEditedIcon(eventData.image || "");
    setPreviewIcon(eventData.image || "");
    
    // 回答期限の初期化（存在する場合はフォーマットして設定）
    if (eventData.responseDeadline) {
      const deadline = new Date(eventData.responseDeadline);
      // ISO形式で取得
      const isoString = deadline.toISOString();
      // 日付部分 (YYYY-MM-DD)
      const datePart = isoString.split('T')[0];
      // 時間部分 (HH)
      const timePart = deadline.getHours().toString().padStart(2, '0');
      
      // 個別のフィールドに設定
      setEditedResponseDeadlineDate(datePart);
      setEditedResponseDeadlineTime(timePart);
      
      // 従来のフィールドにも設定（API互換性のため）
      setEditedResponseDeadline(`${datePart}T${timePart}:00`);
    } else {
      setEditedResponseDeadlineDate("");
      setEditedResponseDeadlineTime("");
      setEditedResponseDeadline("");
    }

    // 日程情報を初期化
    const schedules = eventData.schedules.map((schedule, index) => {
      // 各日程にレスポンスがあるかどうかを確認
      const hasResponses = schedule.responses && schedule.responses.length > 0;

      // 日付をHTML input用のフォーマットに変換 (YYYY-MM-DD)
      const date = new Date(schedule.date);
      const formattedDate = date.toISOString().split('T')[0];

      return {
        id: schedule.id,
        date: formattedDate,
        time: schedule.time,
        hasResponses,
        displayOrder: schedule.displayOrder !== undefined ? schedule.displayOrder : index // 既存の表示順序またはインデックスを使用
      };
    });

    setEditedSchedules(schedules);
    setNewSchedules([]);
    setScheduleToDelete([]);
    setIsEditing(true);
  };

  // イベント編集をキャンセルする関数
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditMessage({ type: "", message: "" });
    setSelectedIconFile(null);
    setPreviewIcon("");
    setEditedResponseDeadline("");
    // 日程編集関連の状態をリセット
    setEditedSchedules([]);
    setNewSchedules([]);
    setScheduleToDelete([]);
  };

  // アイコン画像が選択された時の処理
  const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // ファイルサイズのチェック (1MB = 1024 * 1024 bytes)
      if (file.size > 1 * 1024 * 1024) {
        // 現在の編集データを一時保存
        const tempEditData: EventEditTempData = {
          title: editedTitle,
          memo: editedMemo
        };
        localStorage.setItem('temp_event_edit_data', JSON.stringify(tempEditData));

        // エラーメッセージを表示し、リンクを追加
        setEditMessage({
          type: "error",
          message: "画像サイズは1MB以下にしてください。画像を圧縮するには[画像圧縮ツール](/image-resize?from_event=true)をご利用ください。"
        });
        e.target.value = ''; // 入力をクリア
        return;
      }

      setSelectedIconFile(file);

      // プレビュー用のURL生成
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewIcon(reader.result as string);
      };
      reader.readAsDataURL(file);

      // エラーメッセージがあれば消去
      if (editMessage.type === "error") {
        setEditMessage({ type: "", message: "" });
      }
    }
  };

  // イベント編集を保存する関数
  const handleSaveEdit = async () => {
    if (!editedTitle.trim()) {
      setEditMessage({ type: "error", message: "イベント名は必須です" });
      return;
    }

    // 日程のバリデーション
    const hasInvalidDate = editedSchedules.some(schedule => !schedule.date || !schedule.time);
    const hasInvalidNewDate = newSchedules.some(schedule => !schedule.date || !schedule.time);

    if (hasInvalidDate || hasInvalidNewDate) {
      setEditMessage({ type: "error", message: "すべての日程に日付と時間を設定してください" });
      return;
    }

    setIsLoading(true);
    try {
      // 画像ファイルが選択されている場合はアップロード
      let iconPath = editedIcon;
      if (selectedIconFile) {
        // ファイルサイズの再確認
        if (selectedIconFile.size > 1 * 1024 * 1024) {
          // 現在の編集データを一時保存
          const tempEditData: EventEditTempData = {
            title: editedTitle,
            memo: editedMemo
          };
          localStorage.setItem('temp_event_edit_data', JSON.stringify(tempEditData));

          // エラーメッセージを設定
          setEditMessage({
            type: "error",
            message: "画像サイズは1MB以下にしてください。画像を圧縮するには[画像圧縮ツール](/image-resize?from_event=true)をご利用ください。"
          });
          setIsLoading(false);
          return;
        }

        // 古い画像がある場合は削除
        if (eventData.image && eventData.image !== '/default.png') {
          try {
            // 古い画像のURLからCloudflareのパスを抽出
            const oldImageUrl = eventData.image;
            console.log("古い画像を削除します:", oldImageUrl);

            // 古い画像を削除するAPIを呼び出す
            const deleteResponse = await fetch(`/api/delete-event-icon`, {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ imageUrl: oldImageUrl }),
            });
            
            if (!deleteResponse.ok) {
              console.warn("古い画像の削除中にエラーが発生しましたが、処理を続行します");
            } else {
              console.log("古い画像を正常に削除しました");
            }
          } catch (error) {
            console.error("古い画像の削除に失敗しました", error);
            // エラーが発生しても処理を続行
          }
        }

        // 新しい画像をアップロード
        const formData = new FormData();
        formData.append("file", selectedIconFile);
        formData.append("eventId", eventId);
        formData.append("folder", "images"); // 正しいフォルダ名に修正
        
        // 古い画像URLがある場合は送信
        if (eventData.image) {
          formData.append("oldImageUrl", eventData.image);
        }

        console.log("新しい画像をアップロードします");
        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error("アイコン画像のアップロードに失敗しました");
        }

        const uploadData = await uploadResponse.json();
        iconPath = uploadData.url;
        console.log("新しい画像のURL:", iconPath);
      }

      // イベント情報の更新
      console.log("イベント情報を更新します:", {
        eventId,
        name: editedTitle,
        memo: editedMemo,
        iconPath,
      });
      
      const eventUpdateResponse = await fetch("/api/events", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventId,
          name: editedTitle,
          memo: editedMemo,
          iconPath,
          responseDeadline: editedResponseDeadline || null, // 回答期限
          schedules: {
            // 更新する既存の日程（id: -999かつ削除マークされていないものだけを含む）
            update: editedSchedules.filter(s => 
              // 削除予定リストにないもの
              !scheduleToDelete.includes(s.id) && 
              // IDが正の値（既存のDB上のスケジュール）
              s.id > 0
            ).map(s => ({
              id: s.id,
              date: s.date,
              time: s.time,
              displayOrder: s.displayOrder // 表示順序を追加
            })),
            // 削除する日程
            delete: scheduleToDelete,
            // 新規追加する日程
            create: [
              ...newSchedules.map((s, index) => {
                // 既存のスケジュールの最大displayOrderを取得
                const maxDisplayOrder = editedSchedules.length > 0 
                  ? Math.max(...editedSchedules.map(es => es.displayOrder)) 
                  : -1;

                return {
                  date: s.date,
                  time: s.time,
                  displayOrder: maxDisplayOrder + 1 + index // 既存の最大値より大きい値を設定
                };
              }),
              // id: -999のスケジュール（新規から既存に移動したもの）も新規作成対象に追加
              // ただし削除マークされていないものだけ
              ...editedSchedules.filter(s => 
                s.id === -999 && 
                !scheduleToDelete.includes(s.id)
                // tempMovedSchedules.includes(s.id) 条件を削除
              ).map(s => ({
                date: s.date,
                time: s.time,
                displayOrder: s.displayOrder
              }))
            ]
          }
        }),
      });

      if (!eventUpdateResponse.ok) {
        throw new Error("イベント情報の更新に失敗しました");
      }
      
      console.log("イベント情報の更新に成功しました");

      // 更新されたイベントデータを取得して状態を更新
      const updatedEventData = await eventUpdateResponse.json();
      console.log("更新されたイベントデータ:", updatedEventData);

      // スケジュールをdisplayOrderでソートする
      if (updatedEventData && updatedEventData.schedules) {
        updatedEventData.schedules.sort((a: Schedule, b: Schedule) => {
          // displayOrderが設定されていない場合はidでソート
          const orderA = a.displayOrder !== undefined ? a.displayOrder : a.id;
          const orderB = b.displayOrder !== undefined ? b.displayOrder : b.id;
          return orderA - orderB;
        });
      }

      // ローカルストレージの情報を更新する
      // 閲覧履歴とイベントオーナー情報の更新
      if (updatedEventData && updatedEventData.schedules) {
        try {
          // 動的インポートを使用
          const stragesModule = await import('../utils/strages');
          const { addEventToHistory, setOwnerEvent } = stragesModule;

          // 日程情報をフォーマット
          const formattedSchedules = updatedEventData.schedules.map((s: Schedule) => ({
            date: new Date(s.date).toISOString().split('T')[0],
            time: s.time
          }));

          // 閲覧履歴に追加
          addEventToHistory(eventId, updatedEventData.name || "", formattedSchedules);

          // オーナー情報も更新
          setOwnerEvent(eventId, updatedEventData.name || "", formattedSchedules);

          console.log("ローカルストレージのイベント情報を更新しました");
        } catch (error) {
          console.error("ローカルストレージの更新に失敗しました:", error);
        }
      }

      // 成功メッセージを設定
      setEditMessage({ type: "success", message: "イベント情報を更新しました" });

      // editEventDataを新しいデータに更新
      setEventData(updatedEventData);

      // 編集完了モーダルを表示
      setIsEditCompleteModalOpen(true);

      // 1.5秒後にモーダルを閉じて編集モードを終了し、ページをリロード
      setTimeout(() => {
        setIsEditCompleteModalOpen(false);
        setIsEditing(false);
        setEditMessage({ type: "", message: "" });

        // ページをリロードして回答フォームの状態をリセット
        window.location.reload();
      }, 1500); // 1.5秒に短縮
    } catch (error) {
      console.error("イベント更新エラー:", error);
      setEditMessage({ type: "error", message: "イベント情報の更新に失敗しました" });
    } finally {
      setIsLoading(false);
    }
  };

  // 日程を追加する関数
  const handleAddSchedule = () => {
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    const tempId = `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // 既存のnewSchedulesの最大displayOrderを取得
    const maxDisplayOrder = newSchedules.length > 0
      ? Math.max(...newSchedules.map(s => s.displayOrder))
      : (editedSchedules.length > 0
        ? Math.max(...editedSchedules.map(s => s.displayOrder))
        : -1);

    setNewSchedules([
      ...newSchedules,
      {
        id: tempId,
        date: formattedDate,
        time: "12:00",
        displayOrder: maxDisplayOrder + 1
      }
    ]);
  };

  // ドラッグアンドドロップの処理関数を更新
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const activeId = active.id.toString();
    const overId = over.id.toString();

    // 新規スケジュールの並び替え
    if (activeId.startsWith('new-') && overId.startsWith('new-')) {
      setNewSchedules((schedules) => {
        const oldIndex = schedules.findIndex(s => s.id === activeId);
        const newIndex = schedules.findIndex(s => s.id === overId);

        const newSchedules = arrayMove(schedules, oldIndex, newIndex);

        return newSchedules.map((schedule, index) => ({
          ...schedule,
          displayOrder: index
        }));
      });
    }
    // 既存スケジュールの並び替え
    else if (!activeId.startsWith('new-') && !overId.startsWith('new-')) {
      setEditedSchedules((schedules) => {
        const oldIndex = schedules.findIndex(s => s.id.toString() === activeId);
        const newIndex = schedules.findIndex(s => s.id.toString() === overId);

        const newSchedules = arrayMove(schedules, oldIndex, newIndex);

        return newSchedules.map((schedule, index) => ({
          ...schedule,
          displayOrder: index
        }));
      });
    }
    // 新規と既存の間での並び替え（複雑なケース）
    else {
      console.log("activeId", activeId);
      console.log("overId", overId);

      // activeが新規、overが既存の場合
      if (activeId.startsWith('new-') && !overId.startsWith('new-')) {
        const movedItem = newSchedules.find(s => s.id === activeId);
        if (!movedItem) return;

        // 新規リストから削除
        setNewSchedules(prev => {
          // displayOrderを再計算
          const filtered = prev.filter(s => s.id !== activeId);
          return filtered.map((item, idx) => ({ ...item, displayOrder: idx }));
        });

        // 既存リストに追加 - 新規から移動したことを明確にするために特別なIDフラグを設定
        const tempId = -999; // 新規から既存に移動したスケジュールを示す特別なID

        setEditedSchedules(prev => {
          const overIndex = prev.findIndex(s => s.id.toString() === overId);
          const newItems = [...prev];
          newItems.splice(overIndex, 0, {
            id: tempId,
            date: movedItem.date,
            time: movedItem.time,
            hasResponses: false,
            displayOrder: movedItem.displayOrder
          });

          // displayOrderを再計算
          return newItems.map((item, idx) => ({ ...item, displayOrder: idx }));
        });

        // 重要: 特定のID（-999）を持つスケジュールの追跡リストを保持
        // これは後でスケジュールが削除された際に、tempIdのスケジュールが再表示されないようにするために使用
        setTempMovedSchedules(prev => [...prev, tempId]);
      }
      // activeが既存、overが新規の場合
      else if (!activeId.startsWith('new-') && overId.startsWith('new-')) {
        const movedItem = editedSchedules.find(s => s.id.toString() === activeId);
        if (!movedItem) return;

        console.log("movedItem.id", movedItem.id);
        // 既存リストから削除（削除予定に追加）
        if (movedItem.id > 0) { // -999などの一時IDは削除予定に追加しない
          setScheduleToDelete(prev => [...prev, movedItem.id]);
          console.log("scheduleToDelete", scheduleToDelete);
        } else if (movedItem.id === -999) {
          // -999の一時IDを持つアイテムが移動された場合、tempMovedSchedulesからも削除
          setTempMovedSchedules(prev => prev.filter(id => id !== movedItem.id));
        }

        setEditedSchedules(prev => {
          // displayOrderを再計算
          const filtered = prev.filter(s => s.id.toString() !== activeId);
          return filtered.map((item, idx) => ({ ...item, displayOrder: idx }));
        });

        // 新規リストに追加
        setNewSchedules(prev => {
          const overIndex = prev.findIndex(s => s.id === overId);
          const newItems = [...prev];
          newItems.splice(overIndex, 0, {
            id: `moved-${movedItem.id}-${Date.now().toString().slice(-4)}`, // ユニークなIDを生成
            date: movedItem.date,
            time: movedItem.time,
            displayOrder: movedItem.displayOrder
          });

          // displayOrderを再計算
          return newItems.map((item, idx) => ({ ...item, displayOrder: idx }));
        });
      }
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
    }, 3500);

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

    // キャッシュを回避するためのタイムスタンプを追加
    const timestamp = new Date().getTime();

    // まず専用の画像APIから取得を試みる
    try {
      const imagesResponse = await fetch(`/api/event/images?eventId=${eventId}&_t=${timestamp}`);
      if (imagesResponse.ok) {
        const imageData = await imagesResponse.json();
        console.log("アップロード後のイメージAPI応答:", imageData);

        // 応答形式に応じて適切に処理
        if (Array.isArray(imageData)) {
          console.log("画像データは配列形式です:", imageData.length);
          setEventImages(imageData);
        } else if (imageData.images && Array.isArray(imageData.images)) {
          console.log("画像データはオブジェクトのimagesプロパティにあります:", imageData.images.length);
          setEventImages(imageData.images);
        } else {
          // イベントAPI経由で取得を試みる
          const response = await fetch(`/api/events?eventId=${eventId}&_t=${timestamp}`);
          if (response.ok) {
            const data = await response.json();
            console.log("アップロード後のイベントAPI応答:", data);
            if (data && data.images && Array.isArray(data.images)) {
              console.log("イベントデータから画像取得:", data.images.length);
              setEventImages(data.images);
            }
          }
        }
      }

      // 画像が取得できたらSwiperを表示
      setTimeout(() => {
        setIsImageSwiperOpen(true);
      }, 500);
    } catch (error) {
      console.error("画像データの更新に失敗:", error);
    }
  };

  // フォーム送信後の処理
  const handleFormSuccess = async () => {
    // リロードしてページの状態を更新
    if (eventId) {
      try {
        // イベントデータの再取得
        const data = await fetchEventWithSchedules(eventId);

        if (data) {
          addEvent({ eventId: eventId, eventName: data.name, schedules: data.schedules });
          setEventData(data);

          // 画像データはイベントデータに含まれているので直接設定
          if (data && data.images) {
            setEventImages(Array.isArray(data.images) ? data.images.map((img: string) => ({ url: img })) : []);
          }

          // 確定済みスケジュールを検索する部分を削除
          // const foundConfirmedSchedule = data.schedules.filter((res: any) => res.isConfirmed === true)[0];
          // ここでは状態を更新しない（setConfirmedScheduleは使用しない）

          // 編集モードから戻る（ユーザー名、IDをリセットして新規登録モードへ）
          setIsCreateForm(true);
          setUserName("");
          setUserId("");
        }
      } catch (error) {
        console.error("Error reloading data after form submission:", error);
      }
    }
  };

  // 画像の削除処理関数を追加
  const handleDeleteImage = async (imageId: string) => {
    if (!eventData || !eventData.id || !imageId) return;

    // ユーザーに確認
    if (!confirm('この画像を削除してもよろしいですか？')) {
      return;
    }

    try {
      // APIを呼び出して画像を削除
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
        // 削除完了通知を表示
        setIsDeleteCompleteModal(true);

        // 成功したら、画像リストから削除
        const newImages = [...eventImages];
        const index = newImages.findIndex(image => image.id === imageId);
        if (index !== -1) {
          newImages.splice(index, 1);
          setEventImages(newImages);

          // 画像がなくなったらSwiperを閉じる
          if (newImages.length === 0) {
            // Swiperを閉じるタイミングを調整（通知アニメーションが終わる前に）
            setTimeout(() => {
              setIsImageSwiperOpen(false);
            }, 2000);
          }
        }

        // 2.5秒後に通知を閉じる（アニメーションが完了した後）
        setTimeout(() => {
          setIsDeleteCompleteModal(false);
        }, 2500);
      } else {
        console.error('画像の削除に失敗しました');
      }
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  };

  // イベント削除ハンドラー
  const handleDeleteEvent = async () => {
    // 作成者でない場合は削除できない
    if (!isOrganizer) {
      setDeleteError("イベントの削除権限がありません");
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      // 1. イベント画像をAPIで削除
      if (eventImages.length > 0) {
        await fetch(`/api/event/images?eventId=${eventId}`, {
          method: 'DELETE'
        });
      }

      // 2. イベント自体を削除
      const response = await fetch(`/api/events?eventId=${eventId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "イベントの削除に失敗しました");
      }

      // 3. localStorage内のイベントデータを削除
      removeEvent(eventId);

      // 削除成功モーダルを表示
      setIsDeleteModalOpen(false);
      setIsDeleteCompleteModalOpen(true);

      // 3秒後にトップページへリダイレクト
      const timer = setTimeout(() => {
        router.push('/');
      }, 3000);

      setRedirectTimer(timer);

    } catch (error) {
      console.error("イベント削除エラー:", error);
      setDeleteError(error instanceof Error ? error.message : "イベントの削除中にエラーが発生しました");
    } finally {
      setIsDeleting(false);
    }
  };

  // 削除確認モーダルを表示
  const showDeleteConfirmation = () => {
    if (!isOrganizer) {
      setDeleteError("イベントの削除権限がありません");
      return;
    }
    setIsDeleteModalOpen(true);
  };

  // 既存の日程を更新する関数
  const handleScheduleChange = (index: number, field: 'date' | 'time', value: string) => {
    const updatedSchedules = [...editedSchedules];
    updatedSchedules[index] = {
      ...updatedSchedules[index],
      [field]: value
    };
    setEditedSchedules(updatedSchedules);
  };

  // 新しい日程の入力値を更新する関数
  const handleNewScheduleChange = (index: number, field: 'date' | 'time', value: string) => {
    const updatedNewSchedules = [...newSchedules];
    updatedNewSchedules[index] = {
      ...updatedNewSchedules[index],
      [field]: value
    };
    setNewSchedules(updatedNewSchedules);
  };

  // 新しい日程を削除する関数
  const handleRemoveNewSchedule = (index: number) => {
    const updatedNewSchedules = [...newSchedules];
    updatedNewSchedules.splice(index, 1);
    setNewSchedules(updatedNewSchedules);
  };

  // 既存の日程を削除する関数
  const handleMarkScheduleForDeletion = (id: number) => {
    console.log("handleMarkScheduleForDeletion", id);
    setScheduleToDelete(prev => {
      if (prev.includes(id)) {
        return prev.filter(scheduleId => scheduleId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // ドラッグ開始時の処理を追加
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const activeId = active.id.toString();
    
    setActiveId(activeId);
    
    // ドラッグしているアイテムの情報を取得
    if (activeId.startsWith('new-')) {
      const item = newSchedules.find(s => s.id === activeId);
      if (item) {
        setActiveItem({
          ...item,
          isNewSchedule: true,
        });
      }
    } else {
      const item = editedSchedules.find(s => s.id.toString() === activeId);
      if (item) {
        setActiveItem({
          ...item,
          isNewSchedule: false,
          isMarkedForDeletion: scheduleToDelete.includes(item.id)
        });
      }
    }
  };

  // ドロップアニメーションの設定
  const dropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: '0.5',
        },
      },
    }),
  };

  // 回答期限のフォーマット関数
  const formatDeadline = (dateStr: string | Date) => {
    const date = new Date(dateStr);
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
                    アイコン画像 <span className={styles.tagNoRequire}>任意</span>
                  </label>
                  <div className={styles.iconEditContainer}>
                    {previewIcon ? (
                      <div className={styles.previewIconContainer}>
                        <Image
                          src={previewIcon}
                          width={80}
                          height={80}
                          alt="イベントアイコンプレビュー"
                          className={styles.previewIcon}
                        />
                      </div>
                    ) : (
                      <div className={styles.noIconPreview}>
                        <FiCamera size={24} />
                      </div>
                    )}
                    <div className={styles.iconUploadButtons}>
                      <label className={styles.iconUploadLabel}>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleIconChange}
                          className={styles.iconInput}
                        />
                        画像を選択
                      </label>
                      {previewIcon && (
                        <button
                          type="button"
                          onClick={() => {
                            setPreviewIcon("");
                            setSelectedIconFile(null);
                            setEditedIcon("");
                          }}
                          className={styles.removeIconButton}
                        >
                          削除
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                {editMessage.type && (
                  <div className={editMessage.type === "error" ? "text-red-500" : "text-green-500"}>
                    {editMessage.message.includes("画像圧縮ツール") ? (
                      <p>
                        画像サイズは1MB以下にしてください。画像を圧縮するには
                        <Link href={`/image-resize?from_event=true&eventId=${eventData.id}`} className="underline font-medium">
                          画像圧縮ツール
                        </Link>
                        をご利用ください。
                      </p>
                    ) : (
                      <p>{editMessage.message}</p>
                    )}
                  </div>
                )}

                <div className={styles.formGroup}>
                  <label className={styles.editLabel}>
                    回答期限 <span className={styles.tagNoRequire}>任意</span>
                  </label>
                  <div className={styles.dateTimeSelectContainer}>
                    <div className={styles.dateSelectWrapper}>
                      <label className={styles.dateTimeLabel}>日付</label>
                      <input
                        type="date"
                        value={editedResponseDeadlineDate}
                        min={new Date().toISOString().split('T')[0]}
                        onClick={(e) => {
                          // 日付フィールドをクリックしたらカレンダーを表示
                          const input = e.target as HTMLInputElement;
                          input.showPicker();
                        }}
                        onChange={(e) => {
                          const dateValue = e.target.value;
                          setEditedResponseDeadlineDate(dateValue);
                          
                          if (dateValue && editedResponseDeadlineTime) {
                            // 日付と時間を組み合わせてISO形式の文字列を作成
                            setEditedResponseDeadline(`${dateValue}T${editedResponseDeadlineTime}:00`);
                          } else if (!dateValue) {
                            setEditedResponseDeadline("");
                          }
                        }}
                        className={styles.dateInput}
                      />
                    </div>
                    <div className={styles.timeSelectWrapper}>
                      <label className={styles.dateTimeLabel}>時間</label>
                      <select
                        value={editedResponseDeadlineTime}
                        onChange={(e) => {
                          const timeValue = e.target.value;
                          setEditedResponseDeadlineTime(timeValue);
                          
                          if (editedResponseDeadlineDate && timeValue) {
                            // 日付と時間を組み合わせてISO形式の文字列を作成
                            setEditedResponseDeadline(`${editedResponseDeadlineDate}T${timeValue}:00`);
                          }
                        }}
                        className={styles.timeSelect}
                      >
                        <option value="">--</option>
                        {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                          <option key={hour} value={`${hour.toString().padStart(2, '0')}`}>
                            {hour.toString().padStart(2, '0')}時
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <p className={styles.formHint}>期限を過ぎると参加者は回答できなくなります</p>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.editLabel}>
                    メモ <span className={styles.tagNoRequire}>任意</span>
                  </label>
                  <textarea
                    value={editedMemo}
                    onChange={(e) => setEditedMemo(e.target.value)}
                    className={styles.editTextarea}
                    placeholder="メモ（任意）"
                    maxLength={500}
                  />
                </div>

                {/* スケジュール編集セクション */}
                <div className={styles.formGroup}>
                  <label className={styles.editLabel}>
                    候補日程 <span className={styles.tagRequire}>必須</span>
                  </label>

                  {/* すべてのスケジュールをドラッグ可能に統合 */}
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    modifiers={[]}
                  >
                    {/* 既存のスケジュール */}
                    {editedSchedules.length > 0 && (
                      <div className={styles.schedulesContainer}>
                        <h4 className={styles.scheduleSubheading}>既存の候補日程 <small>（ドラッグ&ドロップで順番を変更できます）</small></h4>
                        <SortableContext
                          items={editedSchedules.map(schedule => schedule.id.toString())}
                          strategy={verticalListSortingStrategy}
                        >
                          {editedSchedules.map((schedule, index) => (
                            <SortableScheduleItem
                              key={schedule.id}
                              schedule={schedule}
                              index={index}
                              hasResponses={schedule.hasResponses}
                              isMarkedForDeletion={scheduleToDelete.includes(schedule.id)}
                              onDateChange={handleScheduleChange}
                              onTimeChange={handleScheduleChange}
                              onToggleDelete={handleMarkScheduleForDeletion}
                            />
                          ))}
                        </SortableContext>
                      </div>
                    )}

                    {/* 新規追加のスケジュール */}
                    {newSchedules.length > 0 && (
                      <div className={styles.schedulesContainer}>
                        <h4 className={styles.scheduleSubheading}>新規追加の候補日程 <small>（ドラッグ&ドロップで順番を変更できます）</small></h4>
                        <SortableContext
                          items={newSchedules.map(schedule => schedule.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          {newSchedules.map((schedule, index) => (
                            <SortableNewScheduleItem
                              key={schedule.id}
                              schedule={schedule}
                              index={index}
                              onRemove={handleRemoveNewSchedule}
                              onChange={handleNewScheduleChange}
                            />
                          ))}
                        </SortableContext>
                      </div>
                    )}

                    {/* ドラッグ中のオーバーレイ表示 */}
                    <DragOverlay dropAnimation={dropAnimation} className={styles.dragOverlayWrapper}>
                      {activeId && activeItem && (
                        activeItem.isNewSchedule ? (
                          <div 
                            className={`${styles.scheduleItem} ${styles.newScheduleItem} ${styles.dragging}`}
                            style={{
                              width: '98%',
                              boxShadow: '0 10px 25px rgba(222, 49, 99, 0.3)',
                              border: '2px solid #de3163',
                              backgroundColor: '#fff8f9',
                              transform: 'scale(1.02)',
                              zIndex: 2000,
                            }}
                          >
                            <div className={styles.dragHandle}>
                              <FiMove />
                            </div>
                            <div className={styles.scheduleInputs}>
                              <input
                                type="date"
                                value={activeItem.date}
                                readOnly
                                className={styles.editInput}
                              />
                              <select
                                value={activeItem.time}
                                disabled
                                className={styles.editInput}
                              >
                                <option value={activeItem.time}>{activeItem.time}</option>
                              </select>
                            </div>
                            <div className={`${styles.scheduleActionButton} ${styles.deleteButton}`}>
                              <FiTrash2 className={styles.buttonIcon} />
                              削除
                            </div>
                          </div>
                        ) : (
                          <div 
                            className={`${styles.scheduleItem} ${activeItem.isMarkedForDeletion ? styles.scheduleDeleted : ''} ${styles.dragging}`}
                            style={{
                              width: '98%',
                              boxShadow: '0 10px 20px rgba(0, 0, 0, 0.2)',
                              border: '2px solid #666',
                              backgroundColor: '#f8f8f8',
                              transform: 'scale(1.02)',
                              zIndex: 2000,
                            }}
                          >
                            <div className={styles.dragHandle}>
                              <FiMove />
                            </div>
                            <div className={styles.scheduleInputs}>
                              <input
                                type="date"
                                value={activeItem.date}
                                readOnly
                                className={styles.editInput}
                              />
                              <select
                                value={activeItem.time}
                                disabled
                                className={styles.editInput}
                              >
                                <option value={activeItem.time}>{activeItem.time}</option>
                              </select>
                            </div>
                            <div className={`${styles.scheduleActionButton} ${activeItem.isMarkedForDeletion ? styles.restoreButton : styles.deleteButton}`}>
                              {activeItem.isMarkedForDeletion ? (
                                <>
                                  <FiCheck className={styles.buttonIcon} />
                                  復元
                                </>
                              ) : (
                                <>
                                  <FiTrash2 className={styles.buttonIcon} />
                                  削除
                                </>
                              )}
                            </div>
                          </div>
                        )
                      )}
                    </DragOverlay>
                  </DndContext>

                  {/* 日程追加ボタン */}
                  <button
                    type="button"
                    onClick={handleAddSchedule}
                    className={styles.addScheduleButton}
                  >
                    <span className={styles.buttonIcon}>+</span>
                    候補日程を追加
                  </button>
                </div>

                {/* エラーメッセージ */}
                {editMessage.message && (
                  <div className={`${styles.editMessage} ${styles[editMessage.type]}`}>
                    {editMessage.message}
                  </div>
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
              <div className={styles.titleContent}>
                <h1 className={styles.eventName}>
                  {eventData.name}
                </h1>
                {eventData.responseDeadline && (
                  <div className={`${styles.deadlineBadge} ${isDeadlinePassed ? styles.deadlinePassed : ''}`}>
                    <FiClock className={styles.deadlineIcon} />
                    回答期限: {formatDeadline(eventData.responseDeadline)}
                    {isDeadlinePassed ? ' (終了)' : ''}
                  </div>
                )}
              </div>
              {isOrganizer && (
                <div className={styles.actionButtons}>
                  <button
                    className={styles.editButton}
                    onClick={handleStartEdit}
                    title="イベントを編集"
                  >
                    <FaEdit />
                  </button>

                  <button
                    className={styles.deleteButton}
                    onClick={showDeleteConfirmation}
                    title="イベントを削除"
                  >
                    <FiTrash2 />
                  </button>
                </div>
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

          {/* 店舗投票へのリンク */}
          {!isEditing && (
            <RestaurantVoteLink eventId={eventData.id} />
          )}

          {/* テーブルの前にスワイプ案内 */}
          {eventData.schedules.length > 0 && isTableScrollable && (
            <div style={{ fontSize: '0.8rem', color: '#666', textAlign: 'center', marginBottom: '0.5rem' }}>
              ← スワイプできます →
            </div>
          )}

          <div className={`relative overflow-x-auto ${styles.table} ${isTableScrollable ? styles.scrollable : ''}`} ref={tableRef}>
            <table className={styles.tableDesign}>
              <tbody>
                <tr>
                  {isOrganizer && (
                    <th className="min-w-[150px]"></th>
                  )}
                  <th className="min-w-[220px]">候補日</th>
                  <th className="min-w-[60px]"><FaRegCircle className={styles.reactIconTable} /></th>
                  <th className="min-w-[60px]"><IoTriangleOutline className={styles.reactIconTable} /></th>
                  <th className="min-w-[60px]"><RxCross2 className={styles.reactIconTable} /></th>
                  {/* ユーザー名のリストを表示 */}
                  {eventData.schedules
                    .flatMap(schedule =>
                      schedule.responses.map(response => ({
                        id: response.user.id,
                        name: response.user.name
                      }))
                    )
                    // 重複を排除
                    .filter((user, index, self) =>
                      index === self.findIndex(u => u.id === user.id)
                    )
                    .map(user => (
                      <th
                        key={user.id}
                        onClick={() => changeUpdate(user.id, user.name)}
                        className={`${styles.userName} max-w-[40px]`}
                        role="button"
                        title={`${user.name}さんの回答を編集する`}
                      >
                        {user.name}
                      </th>
                    ))
                  }
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
                        <td className="max-w-[70px]">
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
                      <td className={`${label} max-w-[120px]`}>{formattedDate} - {schedule.time}</td>
                      <td className={`max-w-[20px] ${styles.declineCount}`}>{attendCount}人</td>
                      <td className={`max-w-[20px] ${styles.declineCount}`}>{undecidedCount}人</td>
                      <td className={`max-w-[20px] ${styles.declineCount}`}>{declineCount}人</td>
                      {/* 各ユーザーの回答を表示 */}
                      {eventData.schedules
                        .flatMap(s => s.responses)
                        .map(response => response.user.name)
                        // 重複を排除
                        .filter((name, index, self) => self.indexOf(name) === index)
                        .map(userName => (
                          <td key={`${schedule.id}-${userName}`} className="max-w-[40px]">
                            {userResponses[userName] === "ATTEND" && (
                              <FaRegCircle 
                                className={styles.reactIcon} 
                                title={`${userName}さんは参加可能です`} 
                              />
                            )}
                            {userResponses[userName] === "UNDECIDED" && (
                              <IoTriangleOutline 
                                className={styles.reactIcon} 
                                title={`${userName}さんは未定です`} 
                              />
                            )}
                            {userResponses[userName] === "ABSENT" && (
                              <RxCross2 
                                className={styles.reactIcon} 
                                title={`${userName}さんは不参加です`} 
                              />
                            )}
                          </td>
                        ))
                      }
                    </tr>
                  )
                })}
                <tr>
                  {isOrganizer ?
                    <td colSpan={5} className={styles.colspan1}>コメント</td> :
                    <td colSpan={4} className={styles.colspan1}>コメント</td>
                  }
                  {/* ユーザーのコメントを表示 */}
                  {eventData.schedules
                    .flatMap(schedule =>
                      schedule.responses.map(response => ({
                        id: response.user.id,
                        name: response.user.name,
                        comment: response.user.comment || ""
                      }))
                    )
                    // 重複を排除
                    .filter((user, index, self) =>
                      index === self.findIndex(u => u.id === user.id)
                    )
                    .map(user => (
                      <td key={`comment-${user.id}`} className={styles.userComment}>
                        {user.comment}
                      </td>
                    ))
                  }
                </tr>
              </tbody>
            </table>
            <Scroll containerRef={containerRef} />
            {accessToken ?
              <CreateEventButton 
                accessToken={accessToken} 
                refreshToken={refreshToken} 
                confirmedSchedule={confirmedSchedule || null as any} 
                event={eventData} 
              /> :
              <SigninButton />
            }
          </div>
        </div>
      </div>
      <div id="response_area" className="mt-12">
        <h2 className={styles.h2Title}>回答フォーム</h2>
        {isDeadlinePassed ? (
          <div className={styles.deadlinePassedMessage}>
            <p>回答期限が過ぎているため、回答は受け付けていません。</p>
          </div>
        ) : (
          isCreateForm ? (
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
          )
        )}
      </div>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <h2 className={styles.modalTitle}>{modalText}</h2>
        <p className={styles.modalText}>{formattedDate}</p>
      </Modal>

      {isCopyModal && (
        <div className={styles.copySuccess}>
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" />
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

      {/* 削除完了用の特別なオーバーレイ通知（albumContainerの上に表示） */}
      {isDeleteCompleteModal && (
        <div className={styles.deleteCompleteOverlay}>
          <div className={styles.deleteCompleteContent}>
            <div className={styles.deleteCompleteIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className={styles.deleteCompleteTitle}>画像を削除しました</h3>
          </div>
        </div>
      )}

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
            if (eventData && eventData.id) {
              try {
                // イベント画像を取得 (キャッシュ回避のためにタイムスタンプを追加)
                const timestamp = new Date().getTime();
                const imagesResponse = await fetch(`/api/event/images?eventId=${eventData.id}&_t=${timestamp}`);
                const imagesData = await imagesResponse.json();

                console.log("取得した画像データ:", imagesData);

                // API応答がそのままの配列の場合と、images配列にネストされている場合の両方に対応
                if (Array.isArray(imagesData)) {
                  // console.log("画像データは配列です、件数:", imagesData.length);
                  setEventImages(imagesData);
                } else if (imagesData.images && Array.isArray(imagesData.images)) {
                  // console.log("画像データはオブジェクトのimagesプロパティにあります、件数:", imagesData.images.length);
                  setEventImages(imagesData.images);
                } else {
                  // console.log("不明な形式の画像データです:", imagesData);

                  // イベントデータAPIから画像を再取得してみる
                  try {
                    const eventResponse = await fetch(`/api/events?eventId=${eventData.id}&_t=${timestamp}`);
                    const eventDataFromApi = await eventResponse.json();
                    console.log("イベントデータAPIから取得:", eventDataFromApi);

                    if (eventDataFromApi && eventDataFromApi.images && Array.isArray(eventDataFromApi.images)) {
                      console.log("イベントデータから画像取得成功:", eventDataFromApi.images.length);
                      setEventImages(eventDataFromApi.images);
                    } else {
                      setEventImages([]);
                    }
                  } catch (err) {
                    console.error("イベントデータ取得エラー:", err);
                    setEventImages([]);
                  }
                }

                setIsImageSwiperOpen(true);
              } catch (error) {
                console.error("画像データの取得中にエラー発生:", error);
              }
            }
          }}
          className={styles.viewImagesBtn}
        >
          <FiCamera className={styles.cameraIcon} />
          <span>✨ 思い出アルバムを開く ✨</span>
        </button>
      )}

      {isImageSwiperOpen && (
        (console.log("ImageSwiperに渡すデータ:", eventImages),
          <ImageSwiper
            images={eventImages}
            title={`${eventData.name}の画像`}
            onClose={() => {
              // Swiperを閉じるときにローカルストレージのフラグをクリア
              localStorage.removeItem(`image_uploaded_${eventId}`);
              localStorage.removeItem(`image_upload_time_${eventId}`);
              setIsImageSwiperOpen(false);
            }}
            onDelete={isOrganizer ? handleDeleteImage : undefined} // オーナーのみ削除可能
          />)
      )}

      {/* 削除確認モーダル */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        type="warning"
        showCloseButton={!isDeleting}
      >
        <div className={styles.modalContent}>
          <FiAlertTriangle size={50} color="#FF6B6B" style={{ marginBottom: '1rem' }} />
          <h2 className={styles.modalTitle}>イベントを削除しますか？</h2>
          <p className={styles.modalText}>
            このイベント「{eventData?.name}」を完全に削除します。<br />
            この操作は<strong>元に戻せません</strong>。関連するスケジュール、参加情報、画像もすべて削除されます。
          </p>
          {deleteError && (
            <p className={styles.errorMessage}>{deleteError}</p>
          )}
          <div className={styles.modalActions}>
            <button
              className={`${styles.cancelButton} ${isDeleting ? styles.disabled : ''}`}
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isDeleting}
            >
              キャンセル
            </button>
            <button
              className={`${styles.deleteButton} ${isDeleting ? styles.loading : ''}`}
              onClick={handleDeleteEvent}
              disabled={isDeleting}
            >
              {isDeleting ? '削除中...' : 'イベントを削除する'}
            </button>
          </div>
        </div>
      </Modal>

      {/* 削除完了モーダル */}
      <Modal
        isOpen={isDeleteCompleteModalOpen}
        onClose={() => setIsDeleteCompleteModalOpen(false)}
        type="info"
        showCloseButton={false}
      >
        <div className={styles.modalContent}>
          <FiCheck size={50} color="#4BB543" style={{ marginBottom: '1rem' }} />
          <h2 className={styles.modalTitle}>削除が完了しました</h2>
          <p className={styles.modalText}>
            イベント「{eventData?.name}」の削除が完了しました。<br />
            まもなくトップページへ移動します...
          </p>
          <div className={styles.modalCountdown}>
            <div className={styles.modalCountdownBar}></div>
          </div>
        </div>
      </Modal>

      {/* 編集完了モーダル */}
      <Modal
        isOpen={isEditCompleteModalOpen}
        onClose={() => setIsEditCompleteModalOpen(false)}
        type="info"
        showCloseButton={false}
      >
        <div className={styles.modalContent}>
          <FiCheck size={50} color="#4BB543" style={{ marginBottom: '1rem' }} />
          <h2 className={styles.modalTitle}>編集が完了しました</h2>
          <p className={styles.modalText}>
            イベント「{eventData?.name}」の編集が完了しました。<br />
            まもなくイベントページへ戻ります...
          </p>
          <div className={styles.modalCountdown}>
            <div className={styles.modalCountdownBar}></div>
          </div>
        </div>
      </Modal>
    </>
  );
}