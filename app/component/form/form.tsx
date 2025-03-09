"use client";

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import styles from './index.module.scss';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiTrash2, FiPlus, FiAlertCircle, FiSend, FiMove, FiCheckCircle } from 'react-icons/fi';
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
        <div className={styles.scheduleInputGroup}>
          <div className={styles.scheduleInputWrapper}>
            <label className={styles.scheduleLabel}>日付</label>
            <input
              type="date"
              {...register(`schedules.${index}.date`)}
              value={schedule.date}
              onChange={(e) => onDateChange(index, e.target.value)}
              className={styles.dateInput}
              onClick={handleDateInputClick}
            />
          </div>
          <div className={styles.scheduleInputWrapper}>
            <label className={styles.scheduleLabel}>時間</label>
            <select
              {...register(`schedules.${index}.time`)}
              value={schedule.time}
              onChange={(e) => onTimeChange(index, e.target.value)}
              className={styles.timeSelect}
            >
              {timeOptions.map((time: string) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {/* 最初の日程項目（index === 0）では削除ボタンを非表示にする */}
      {index !== 0 && (
        <button
          type="button"
          onClick={() => onRemove(schedule.id)}
          className={`${styles.deleteButton} ${styles.mobileDeleteButton}`}
          aria-label="日程を削除"
        >
          <FiTrash2 />
        </button>
      )}
    </div>
  );
};

// フォームデータのインターフェース名を変更し名前衝突を解消
interface ScheduleFormData {
  date: string;
  time: string;
}

interface EventFormData {
  event_name: string;
  memo: string;
  schedules: ScheduleFormData[];
}

export default function Form({ categoryName }: { categoryName: string }) {
  const [schedules, setSchedules] = useState([
    { id: Date.now(), date: '', time: '19:00' }, // 初期のスケジュールデータ
  ]);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null | React.ReactNode>(null); // JSXも受け取れるように修正
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(true); // 初期状態は無効
  const [file, setFile] = useState<File | null>(null);
  const [hasHistory, setHasHistory] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // DnD用のセンサーを設定
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // form-hookの設定
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    trigger,
    reset,
    watch,
    getValues,
  } = useForm<ScheduleSchemaType>({
    resolver: zodResolver(ScheduleSchema),
    defaultValues: {
      event_name: '',
      memo: '',
      schedules: [{ date: '', time: '19:00' }],
    },
  });

  // フォームの値をwatch
  const eventNameValue = watch('event_name');
  const memoValue = watch('memo');

  // クライアントサイドの処理を行うための処理
  useEffect(() => {
    setIsClient(true);
    
    // グローバル関数として保存関数を公開
    if (typeof window !== 'undefined') {
      (window as any).saveEventFormData = function() {
        try {
          // 明示的に現在のスケジュールを取得
          const schedulesData = schedules.map(schedule => ({
            date: schedule.date,
            time: schedule.time
          }));
          
          // フォームデータを手動で構築
          const formData = {
            event_name: eventNameValue || '',
            memo: memoValue || '',
            schedules: schedulesData
          };
          
          // localStorageに保存
          localStorage.setItem('temp_form_data', JSON.stringify(formData));
          console.log('グローバル関数: フォームデータを保存しました:', formData);
          return true;
        } catch (error) {
          console.error('グローバル関数: フォームデータの保存に失敗しました:', error);
          return false;
        }
      };
    }
    
    // コンポーネントのアンマウント時にグローバル関数を削除
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).saveEventFormData;
      }
    };
  }, [schedules, eventNameValue, memoValue]);

  // localStorageにフォームデータを保存する関数
  const saveFormDataToLocalStorage = () => {
    try {
      // 現在のスケジュールを取得
      const schedulesData = schedules.map(schedule => ({
        date: schedule.date,
        time: schedule.time
      }));
      
      // フォームデータを構築
      const formData = {
        event_name: eventNameValue || '',
        memo: memoValue || '',
        schedules: schedulesData
      };
      
      // localStorageに保存
      localStorage.setItem('temp_form_data', JSON.stringify(formData));
      console.log('フォームデータをlocalStorageに保存しました:', formData);
      return true;
    } catch (error) {
      console.error('フォームデータの保存に失敗しました:', error);
      return false;
    }
  };

  // イメージリサイズページから戻ってきたかどうかを検出
  useEffect(() => {
    // クライアントサイドでのみ実行
    if (typeof window !== 'undefined') {
      // URLパラメータからfrom_resizeを取得
      const urlParams = new URLSearchParams(window.location.search);
      const fromResize = urlParams.get('from_resize') === 'true';
      
      if (fromResize) {
        // localStorageからフォームデータを復元
        try {
          const savedFormData = localStorage.getItem('temp_form_data');
          
          if (savedFormData) {
            const formData: EventFormData = JSON.parse(savedFormData);
            
            // フォームの各フィールドを復元
            if (formData.event_name) {
              setValue('event_name', formData.event_name);
            }
            
            if (formData.memo) {
              setValue('memo', formData.memo);
            }
            
            if (formData.schedules && Array.isArray(formData.schedules)) {
              // スケジュールの数を合わせる
              const newSchedules = formData.schedules.map((schedule, index) => ({
                id: Date.now() + index,
                date: schedule.date || '',
                time: schedule.time || '19:00'
              }));
              
              setSchedules(newSchedules);
              
              // react-hook-formにも値を設定
              formData.schedules.forEach((schedule, index) => {
                setValue(`schedules.${index}`, {
                  date: schedule.date || '',
                  time: schedule.time || '19:00'
                });
              });
            }
            
            // フォームデータを利用後は削除
            localStorage.removeItem('temp_form_data');
            
            // URLパラメータをクリア（履歴に残さず現在のURLを置き換え）
            const newUrl = window.location.pathname;
            window.history.replaceState({}, document.title, newUrl);
          }
        } catch (error) {
          console.error('フォームデータの復元に失敗しました:', error);
        }
      }
    }
  }, [setValue]);

  // 日程を追加するボタンクリック時の処理
  const AddSchedule = () => {
    const newSchedule = { id: Date.now(), date: '', time: '19:00' };
    setSchedules((prevSchedules) => [
      ...prevSchedules,
      newSchedule
    ]);
    
    // 追加した日程のfieldArrayへの追加
    setValue(`schedules.${schedules.length}`, { date: '', time: '19:00' });
    
    // 日程が追加されたら、バリデーションを再評価する
    setTimeout(() => {
      trigger('schedules');
      setIsSubmitDisabled(!checkFormValidity());
    }, 0);
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

  // フォームの入力が有効かチェックする関数
  const checkFormValidity = useCallback(() => {
    // イベント名が空でないことを確認
    if (!eventNameValue || eventNameValue.trim() === '') {
      return false;
    }

    // 少なくとも1つの日程が指定されていることを確認
    const hasValidSchedule = schedules.some(schedule => 
      schedule.date && schedule.date.trim() !== ''
    );

    if (!hasValidSchedule) {
      return false;
    }

    // バリデーションエラーがないことを確認
    if (validationError) {
      return false;
    }

    return true;
  }, [eventNameValue, schedules, validationError]);

  // 子から受け取ったデータを更新する関数
  const handleChildData = (data: File) => {
    // ファイルサイズのチェック (1MB = 1024 * 1024 bytes)
    if (data.size > 1 * 1024 * 1024) {
      // フォームの現在の値をlocalStorageに保存
      saveFormDataToLocalStorage();
      
      setFile(data); // ファイルは一旦セットしておく
      
      // 大きいサイズのファイルを検出したときのエラーメッセージ
      // アイコン画像の下に表示されるよう修正
      setTimeout(() => {
        handleValidationError(
          <span>
            画像サイズは1MB以下にしてください。
            <Link href="/image-resize?from_form=true" className="text-blue-500 underline">
              画像圧縮ツールで圧縮する
            </Link>
          </span>
        );
      }, 10);
      return;
    }
    
    setFile(data);
  };

  const handleValidationError = (error: string | null | React.ReactNode) => {
    setValidationError(error);
    // エラーが更新されたら、ボタンの状態も更新
    setTimeout(() => {
      setIsSubmitDisabled(!checkFormValidity());
    }, 0);
  };

  const onSubmit = async (params: EventFormData) => {
    const formData = new FormData();
    formData.append("event_name", params.event_name);
    formData.append("schedules", JSON.stringify(params.schedules));
    formData.append("memo", params.memo);

    // オーバーレイを表示し、送信中状態にする
    setIsSubmitting(true);

    // 画面の最上部にスクロール
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });

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
        
        
        // 3秒後にモーダルを閉じて遷移
        setTimeout(() => {
          router.push(`/event?eventId=${eventId}`);
        }, 3000);
      } else {
        setLoading(false);
        setIsSubmitting(false); // エラー時はオーバーレイを解除
        setIsOpen(true);
        alert(response.statusText);
      }
    } catch (error) {
      setLoading(false);
      setIsSubmitting(false); // エラー時はオーバーレイを解除
      setIsOpen(true);
      alert(error);
    } finally {
      setLoading(false);
      // 注意: 成功時はオーバーレイを残すため、ここではオーバーレイを解除しない
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

  // フォームの入力値が変更されたときにバリデーションを実行
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      // 日程のバリデーションを強制的に実行
      if (schedules.some(s => !s.date)) {
        trigger('schedules');
      }
      setIsSubmitDisabled(!checkFormValidity());
    }, 300); // 少し遅延を入れることでレンダリングが落ち着いてから評価

    return () => clearTimeout(timeoutId);
  }, [eventNameValue, schedules, memoValue, validationError, checkFormValidity, trigger]);

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
              placeholder="参加者へ伝えたい事があれば入力してください"
              {...register('memo')}
              maxLength={300}
            />
            <div className={styles.textareaFooter}>
              <span className={`${styles.charCount} ${memoValue && memoValue.length > 280 ? styles.charCountExceeded : ''}`}>
                {memoValue ? memoValue.length : 0}/300文字
              </span>
            </div>
          </div>

          <div className={styles.formStepDivider}></div>

          <div className={styles.formStep}>
            <div className={styles.stepNumber}>2</div>
            <h2 className={styles.stepTitle}>日程の選択</h2>
            <span className={styles.badgeRequired}>必須</span>
          </div>

          <div className={styles.formGroup}>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={schedules.map(s => s.id)} strategy={verticalListSortingStrategy}>
                <div className={styles.scheduleList}>
                  {schedules.map((schedule, index) => (
                    <SortableScheduleItem
                      key={schedule.id}
                      schedule={schedule}
                      index={index}
                      onRemove={handleRemove}
                      onDateChange={handleDateChange}
                      onTimeChange={handleTimeChange}
                      timeOptions={generateTimeOptions()}
                      register={register}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            <button 
              type="button" 
              onClick={AddSchedule} 
              className={styles.addScheduleBtn}
            >
              <FiPlus /> 日程を追加
            </button>

            {errors.schedules && (
              <span className={styles.errorMessage}>
                {errors.schedules.message || 
                 (schedules.some(s => !s.date) ? "すべての日程に日付を入力してください" : "")}
              </span>
            )}
          </div>

          <div className={styles.formStepDivider}></div>

          {/* 画像アップロード - コメントが入力されている場合のみ表示 */}
          {memoValue && memoValue.trim() !== '' && (
            <>
              <div className={styles.formStep}>
                <div className={styles.stepNumber}>3</div>
                <h2 className={styles.stepTitle}>アイコン画像</h2>
                <span className={styles.badgeOptional}>任意</span>
              </div>

              <div className={styles.formGroup}>
                <CropImg onDataChange={handleChildData} setValidationError={handleValidationError} />
                {validationError && (
                  <span className={styles.errorMessage}>{validationError}</span>
                )}
              </div>
            </>
          )}
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
        return null;
      })()}
      
      {/* 履歴セクション - クライアントサイドのみ表示（表示・非表示はHistory内部で制御） */}
      {isClient && (
        <div className={`${styles.historySection} ${hasHistory ? styles.hasHistory : ''}`}>
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