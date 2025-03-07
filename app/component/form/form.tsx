"use client";

import React, { useState, useEffect, useCallback } from 'react';
import styles from './index.module.scss';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiTrash2, FiPlus, FiAlertCircle, FiSend, FiMove } from 'react-icons/fi';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import History from '../strage/history';
import CropImg from './cropper';
import { ScheduleSchema, ScheduleSchemaType } from '@/schemas/FormSchema';
import { setOwnerEvent } from "@/app/utils/strages";
import Modal from "../modal/modal";
import SpinLoader from "../loader/spin";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { UseFormRegister } from 'react-hook-form';

// ドラッグ可能な日程項目のコンポーネント
interface SortableScheduleItemProps {
  schedule: { id: number; date: string; time: string };
  index: number;
  onRemove: (id: number) => void;
  onDateChange: (index: number, value: string) => void;
  onTimeChange: (index: number, value: string) => void;
  timeOptions: string[];
  register: UseFormRegister<ScheduleSchemaType>; // react-hook-formのregister関数
}

const SortableScheduleItem: React.FC<SortableScheduleItemProps> = ({
  schedule,
  index,
  onRemove,
  onDateChange,
  onTimeChange,
  timeOptions,
  register
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition
  } = useSortable({ id: schedule.id });

  // 入力フィールドクリック時にカレンダーを表示する関数
  const handleDateInputClick = (e: React.MouseEvent<HTMLInputElement>) => {
    // カレンダーアイコン以外の部分がクリックされた場合にshowPickerを呼び出す
    if (e.target instanceof HTMLInputElement) {
      e.currentTarget.showPicker();
    }
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={styles.scheduleItem}
    >
      <div className={styles.dragHandle} {...attributes} {...listeners}>
        <FiMove />
      </div>
      <div className={styles.scheduleInputs}>
        <input
          type="date"
          {...register(`schedules.${index}.date`)}
          value={schedule.date}
          onChange={(e) => onDateChange(index, e.target.value)}
          className={styles.formInput}
          onClick={handleDateInputClick}
        />
        <select
          {...register(`schedules.${index}.time`)}
          value={schedule.time}
          onChange={(e) => onTimeChange(index, e.target.value)}
          className={styles.formInput}
        >
          {timeOptions.map((time: string) => (
            <option key={time} value={time}>
              {time}
            </option>
          ))}
        </select>
        {/* 最初の日程項目（index === 0）では削除ボタンを非表示にする */}
        {index !== 0 && (
          <button
            type="button"
            onClick={() => onRemove(schedule.id)}
            className={styles.deleteButton}
          >
            <FiTrash2 />
          </button>
        )}
      </div>
    </div>
  );
};

export default function Form({ categoryName }: { categoryName: string }) {
  const [schedules, setSchedules] = useState([
    { id: Date.now(), date: '', time: '19:00' }, // 初期のスケジュールデータ
  ]);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null); // 初期値をnullに変更
  const [memoLength, setMemoLength] = useState(0);
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(true); // 初期状態は無効
  const [file, setFile] = useState<File | null>(null);
  const [hasHistory, setHasHistory] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // DnD用のセンサーを設定
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const methods = useForm<ScheduleSchemaType>({
    mode: 'onChange',
    resolver: zodResolver(ScheduleSchema)
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = methods;

  // 本文の文字数を監視
  const memoValue = watch("memo", "");  // デフォルト値を設定
  const eventNameValue = watch("event_name", "");  // デフォルト値を設定

  useEffect(() => {
    if (memoValue) {
      setMemoLength(memoValue.length);
    } else {
      setMemoLength(0);
    }
  }, [memoValue]);

  // 日程を追加するボタンクリック時の処理
  const AddSchedule = () => {
    setSchedules((prevSchedules) => [
      ...prevSchedules,
      { id: Date.now(), date: '', time: '19:00' }
    ]);
  };

  // 日程を削除する処理
  const handleRemove = (id: number) => {
    // 削除後に少なくとも1つのスケジュールが残るようにする
    if (schedules.length > 1) {
      // スケジュールを更新
      const updatedSchedules = schedules.filter((s) => s.id !== id);
      setSchedules(updatedSchedules);
      
      // react-hook-formのフィールドを更新
      // まず現在のschedules配列をリセット
      setValue('schedules', []);
      
      // 更新後のスケジュールでschedulesフィールドを再構築
      updatedSchedules.forEach((schedule, index) => {
        setValue(`schedules.${index}.date`, schedule.date);
        setValue(`schedules.${index}.time`, schedule.time);
      });
      
      // フォームのバリデーションを再評価
      trigger('schedules');

    } else {
      // 最後の1つは削除せず、値をリセットする
      const resetSchedule = { id: Date.now(), date: '', time: '19:00' };
      setSchedules([resetSchedule]);
      
      // react-hook-formのフィールドもリセット
      setValue('schedules', [{ date: '', time: '19:00' }]);
      trigger('schedules');
    }
  };

  // ドラッグ終了時の処理
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setSchedules((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);

        const newSchedules = arrayMove(items, oldIndex, newIndex);

        // react-hook-formのフィールドも更新
        newSchedules.forEach((schedule, index) => {
          setValue(`schedules.${index}.date`, schedule.date);
          setValue(`schedules.${index}.time`, schedule.time);
        });

        return newSchedules;
      });
    }
  };

  // 時間変更ハンドラー
  const handleTimeChange = (index: number, value: string) => {
    const updatedSchedules = [...schedules];
    updatedSchedules[index].time = value;
    setSchedules(updatedSchedules);

    // react-hook-form に値をセットし、バリデーションをトリガー
    setValue(`schedules.${index}.time`, value);
    trigger(`schedules.${index}.time`);
  };

  // 時間リストを生成（00:00 から 23:30 を 30 分刻み）
  const generateTimeOptions = () => {
    const times: string[] = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const formattedTime = `${String(hour).padStart(2, "0")}:${String(
          minute
        ).padStart(2, "0")}`;
        times.push(formattedTime);
      }
    }
    return times;
  };

  const timeOptions = generateTimeOptions();

  interface FormData {
    event_name: string;
    memo: string;
    schedules: {
      date: string;
      time: string;
    }[];
  }

  // 子から受け取ったデータを更新する関数
  const handleChildData = (data: File) => {
    setFile(data);
  };

  const handleValidationError = (error: string | null) => {
    setValidationError(error);
    // エラーが更新されたら、ボタンの状態も更新
    setTimeout(() => {
      setIsSubmitDisabled(!checkFormValidity());
    }, 0);
  };

  const onSubmit = async (params: FormData) => {
    const formData = new FormData();
    formData.append("event_name", params.event_name);
    formData.append("schedules", JSON.stringify(params.schedules));
    formData.append("memo", params.memo);

    // ファイルは任意のため、存在する場合のみ追加
    if (file) {
      formData.append("image", file); // Fileとして送信
    }

    reset();
    setLoading(true);
    try {
      const response = await fetch(`/api/schedule/`, {
        method: "POST",
        headers: {
          Accept: "application/json, text/plain"
        },
        body: formData
      });

      if (response.ok) {
        const result = await response.json(); // レスポンスをJSONとしてパース
        const eventId = result.id; // レスポンスに含まれるIDを取得
        setLoading(false);
        setOwnerEvent(eventId, result.name, result.schedules);
        // 必要に応じてページ遷移
        router.push(`/event?eventId=${eventId}`);
      } else {
        setLoading(false);
        setIsOpen(true);
        alert(response.statusText);
      }
    } catch (error) {
      setLoading(false);
      setIsOpen(true);
      alert(error);
    } finally {
      setLoading(false);
    }
  };

  // 📌 日付が入力されたら `isValid` を更新する処理
  const handleDateChange = (index: number, value: string) => {
    const updatedSchedules = [...schedules];
    updatedSchedules[index].date = value;
    setSchedules(updatedSchedules);

    // ✅ react-hook-form に値をセットし、バリデーションをトリガー
    setValue(`schedules.${index}.date`, value);
    trigger(`schedules.${index}.date`);  // ✅ 強制的にバリデーションを再評価
  };

  // フォームのバリデーション状態をチェックする関数
  const checkFormValidity = useCallback(() => {
    // イベント名が入力されているか
    const titleValid = eventNameValue.trim().length > 0;

    // 少なくとも1つのスケジュールが有効か（日付と時間が入力されているか）
    const hasValidSchedule = schedules.some(s => s.date && s.time);

    // メモが最大文字数以内か
    const memoValid = memoValue.length <= 200;

    // バリデーションエラーがないか（cropperからのエラーのみ）
    const noValidationError = !validationError;

    // デバッグログ
    // console.log({
    //   titleValid,
    //   hasValidSchedule,
    //   memoValid,
    //   noValidationError,
    //   formValid: titleValid && hasValidSchedule && memoValid && noValidationError
    // });

    // すべての必須条件を満たしていればtrueを返す（ファイルは任意）
    return titleValid && hasValidSchedule && memoValid && noValidationError;
  }, [eventNameValue, schedules, memoValue, validationError]);

  // フォームの入力値が変更されたときにバリデーションを実行
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setIsSubmitDisabled(!checkFormValidity());
    }, 300); // 少し遅延を入れることでレンダリングが落ち着いてから評価

    return () => clearTimeout(timeoutId);
  }, [eventNameValue, schedules, memoValue, validationError, checkFormValidity]);

  // クライアントサイドのみで実行されるようにする
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleHistoryExists = useCallback((exists: boolean) => {
    // 確実に状態を更新するために一度古い値をリセット
    setHasHistory(false);
    // 非同期で状態を更新（確実に更新を反映するため）
    setTimeout(() => {
      setHasHistory(exists);
    }, 0);
  }, []);

  if (loading) {
    return <SpinLoader></SpinLoader>;
  }

  // クライアントサイドでのみレンダリングを行う
  if (!isClient) {
    return null; // サーバーサイドレンダリング時は何も表示しない
  }

  return (
    <div className={styles.formContainer}>
      <h1 className={styles.pageTitle}>{categoryName}の登録</h1>
      <form onSubmit={handleSubmit(onSubmit)} className={styles.modernForm}>
        <div className={styles.formCard}>
          <div className={styles.formStep}>
            <div className={styles.stepNumber}>1</div>
            <h2 className={styles.stepTitle}>{categoryName}登録</h2>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              {categoryName}名
              <span className={styles.badgeRequired}>必須</span>
            </label>
            <input
              type="text"
              className={styles.modernInput}
              placeholder={`${categoryName}の名前を入力してください`}
              {...register('event_name')}
            />
            {errors.event_name && (
              <span className={styles.errorMessage}>{errors.event_name.message}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              メモ
              <span className={styles.badgeOptional}>任意</span>
              <span className={styles.charCount} data-exceeded={memoLength > 200}>
                {memoLength}/200
              </span>
            </label>
            <textarea
              className={styles.modernTextarea}
              placeholder="イベントについての詳細や注意事項を記入してください"
              {...register('memo', {
                maxLength: 200,
                onChange: (e) => setMemoLength(e.target.value.length),
              })}
            />
            {errors.memo && (
              <span className={styles.errorMessage}>{errors.memo.message}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              イメージ画像
              <span className={styles.badgeOptional}>任意</span>
            </label>
            <div className={styles.cropperContainer}>
              <CropImg onDataChange={handleChildData} setValidationError={handleValidationError} />
            </div>
            {validationError && (
              <div className={styles.formValidationError}>
                <FiAlertCircle style={{ marginRight: '8px' }} />
                {validationError}
              </div>
            )}
          </div>

          <div className={styles.formStepDivider}></div>

          <div className={styles.formStep}>
            <div className={styles.stepNumber}>2</div>
            <h2 className={styles.stepTitle}>日程登録<span className={styles.badgeRequired}>必須</span></h2>
          </div>

          <div className={styles.scheduleList}>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={schedules.map(s => s.id)} strategy={verticalListSortingStrategy}>
                {schedules.map((schedule, index) => (
                  <SortableScheduleItem
                    key={schedule.id}
                    schedule={schedule}
                    index={index}
                    onRemove={handleRemove}
                    onDateChange={handleDateChange}
                    onTimeChange={handleTimeChange}
                    timeOptions={timeOptions}
                    register={register}
                  />
                ))}
              </SortableContext>
            </DndContext>

            <button
              type="button"
              onClick={AddSchedule}
              className={styles.addScheduleBtn}
            >
              <FiPlus />
              日程を追加
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitDisabled}
          className={`${styles.submitButton} ${isSubmitDisabled ? styles.disabled : styles.enableSubmit}`}
        >
          <FiSend style={{ marginRight: '8px' }} />
          {isSubmitDisabled ? `入力情報を確認してください` : `${categoryName}を登録する`}
        </button>
      </form>

      {/* デバッグ情報 - 開発時のみ表示 */}
      {(() => { 
        console.log("Form component - hasHistory:", hasHistory, "isClient:", isClient);
        return null;
      })()}
      
      {/* 履歴セクション - クライアントサイドのみ表示（表示・非表示はHistory内部で制御） */}
      {isClient && (
        <div className={styles.historySection}>
          <History onHistoryExists={handleHistoryExists} />
        </div>
      )}

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <div className={styles.modalContent}>
          <FiAlertCircle size={50} color="#FF6B6B" style={{ marginBottom: '1rem' }} />
          <h2 className={styles.modalTitle}>エラーが発生しました</h2>
          <p>予期せぬエラーが発生しました。</p>
          <p>もう一度お試しいただくか、問題が解決しない場合はお問い合わせください。</p>
          <div className={styles.modalActions}>
            <Link href="/contact" className={styles.modalLink}>
              お問い合わせフォーム
            </Link>
          </div>
        </div>
      </Modal>
    </div>
  );
}