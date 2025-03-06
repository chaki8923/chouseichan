"use client";

import React, { useState, useEffect } from 'react';
import styles from './index.module.scss';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiTrash2, FiPlus, FiAlertCircle, FiSend } from 'react-icons/fi';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import History from '../strage/history';
import CropImg from './cropper';
import { ScheduleSchema, ScheduleSchemaType } from '@/schemas/FormSchema';
import { setOwnerEvent } from "@/app/utils/strages";
import Modal from "../modal/modal";
import SpinLoader from "../loader/spin";

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

  const methods = useForm<ScheduleSchemaType>({
    mode: 'onChange',
    resolver: zodResolver(ScheduleSchema)
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,  // ✅ react-hook-form の値を更新するための関数
    trigger,   // ✅ バリデーションを手動で実行
    formState: { errors },
  } = methods

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
    reset({
      schedules: updatedSchedules.map((schedule) => ({
        date: schedule.date || '',
        time: schedule.time || '',
      })),
    });
    setSchedules((prevSchedules) =>
      prevSchedules.filter((schedule) => schedule.id !== id)
    );
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
      // isConfirmed: boolean;
    }[];
    // image: any
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
        // console.error("Error:", response.status, response.statusText);
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
    let currentValidationError: string | null = null;

    // 各項目のバリデーションチェック
    if (eventNameValue.trim().length === 0) {
      currentValidationError = `${categoryName}名を入力してください`;
    } else if (!schedules.some(s => s.date && s.time)) {
      currentValidationError = "少なくとも1つの日程を設定してください";
    } else if (memoValue.length > 200) {
      currentValidationError = "メモは200文字以内で入力してください";
    }

    // validationErrorを更新（cropperのエラーは上書きしない）
    if (currentValidationError) {
      setValidationError(currentValidationError);
    } else if (validationError &&
      !validationError.includes('画像形式') &&
      !validationError.includes('ファイルサイズ')) {
      // cropperからのエラーでなければクリア
      setValidationError(null);
    }

    // 最終的なバリデーション結果に基づいて送信ボタンの状態を更新
    setIsSubmitDisabled(!checkFormValidity());

  }, [eventNameValue, schedules, memoValue, categoryName, validationError, file]);

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
            {schedules.map((schedule, index) => (
              <div key={schedule.id} className={styles.scheduleItem}>
                <div className={styles.scheduleInputGroup}>
                  <div className={styles.scheduleInputWrapper}>
                    <label className={styles.scheduleLabel}>
                      日付
                    </label>
                    <input
                      type="date"
                      {...register(`schedules.${index}.date`, { required: true })}
                      onChange={(e) => handleDateChange(index, e.target.value)}
                      value={schedule.date}
                      className={styles.dateInput}
                    />
                    {errors?.schedules?.[index]?.date && (
                      <span className={styles.errorMessage}>
                        {errors.schedules[index]?.date?.message}
                      </span>
                    )}
                  </div>

                  <div className={styles.scheduleInputWrapper}>
                    <label className={styles.scheduleLabel}>
                      時間
                    </label>
                    <select
                      className={styles.timeSelect}
                      {...register(`schedules.${index}.time`)}
                      value={schedule.time}
                      onChange={(e) => {
                        const updatedSchedules = [...schedules];
                        updatedSchedules[index].time = e.target.value;
                        setSchedules(updatedSchedules);
                      }}
                    >
                      {timeOptions.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemove(schedule.id)}
                  className={styles.removeScheduleBtn}
                >
                  <FiTrash2 />
                  削除
                </button>
              </div>
            ))}

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

      <div className={styles.historySection}>
        <h2 className={styles.sectionTitle}>過去の{categoryName}</h2>
        <History />
      </div>

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