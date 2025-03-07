"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
        <button
          type="button"
          onClick={() => onRemove(schedule.id)}
          className={styles.deleteButton}
        >
          <FiTrash2 />
        </button>
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
  const [validationError, setValidationError] = useState<string | null>(`${categoryName}名と日程を入力してください`);
  const [memoLength, setMemoLength] = useState(0);
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(true); // 初期状態は無効
  const [file, setFile] = useState<File | null>(null);
  const [hasHistory, setHasHistory] = useState(false);

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

  const AddSchedule = () => {
    setSchedules((prevSchedules) => [
      ...prevSchedules,
      { id: Date.now(), date: '', time: '19:00' },
    ]);
  };

  const handleRemove = (id: number) => {
    // 削除対象のインデックスを特定
    const updatedSchedules = schedules.filter((schedule) => schedule.id !== id);
    
    // フォームデータを schedules に同期
    setValue("schedules", updatedSchedules.map((schedule) => ({
      date: schedule.date || '',
      time: schedule.time || '',
    })));
    
    setSchedules(updatedSchedules);
    
    // バリデーションを実行
    trigger("schedules");
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
    console.log("画像データを受信:", data);
    setFile(data);
  };

  const handleValidationError = (error: string | null) => {
    console.log("バリデーションエラーを受信:", error);
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
  const checkFormValidity = () => {
    // イベント名が入力されているか
    const titleValid = eventNameValue.trim().length > 0;

    // 少なくとも1つのスケジュールが有効か（日付と時間が入力されているか）
    const hasValidSchedule = schedules.some(s => s.date && s.time);

    // メモが最大文字数以内か
    const memoValid = memoValue.length <= 200;

    // バリデーションエラーがないか（cropperからのエラーも含む）
    const noValidationError = !validationError;

    // デバッグログ
    console.log({
      titleValid,
      hasValidSchedule,
      memoValid,
      noValidationError,
      file,
      formValid: titleValid && hasValidSchedule && memoValid && noValidationError
    });

    // すべての条件を満たしていればtrueを返す
    return titleValid && hasValidSchedule && memoValid && noValidationError;
  };

  // フォームの入力値が変更されたときにバリデーションを実行
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setIsSubmitDisabled(!checkFormValidity());
    }, 300); // 少し遅延を入れることでレンダリングが落ち着いてから評価

    return () => clearTimeout(timeoutId);
  }, [eventNameValue, schedules, memoValue, validationError, checkFormValidity]);

  // 履歴の有無を確認するコールバック
  const handleHistoryExists = useCallback((exists: boolean) => {
    setHasHistory(exists);
  }, []);

  if (loading) {
    return <SpinLoader></SpinLoader>;
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
            </label>
            <textarea
              className={styles.modernTextarea}
              placeholder="メモや詳細情報を記入してください"
              {...register('memo')}
            />
            <div className={styles.textareaFooter}>
              <span className={`${styles.charCount} ${memoLength > 200 ? styles.charCountExceeded : ''}`}>
                {memoLength}/200
              </span>
            </div>
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
          <>
            <FiSend style={{ marginRight: '8px' }} />
            {isSubmitDisabled ? `入力情報を確認してください` : `${categoryName}を登録する`}
          </>
        </button>
      </form>

      {/* 履歴がある場合のみ表示 */}
      {hasHistory && (
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