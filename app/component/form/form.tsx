"use client";

import { useState } from "react";
import { useForm, FormProvider } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import CropImg from "./cropper";
import { zodResolver } from '@hookform/resolvers/zod';
import { ScheduleSchema, ScheduleSchemaType } from '@/schemas/FormSchema';
import { CgAddR, CgCloseO } from "react-icons/cg";
import styles from "./index.module.scss"

export default function Form() {
  const [isSubmit, setIsSubmit] = useState(false);
  const [schedules, setSchedules] = useState([
    { id: Date.now(), date: '', time: '' }, // 初期のスケジュールデータ
  ]);
  const router = useRouter();

  const methods = useForm<ScheduleSchemaType>({
    mode: 'onBlur',
    resolver: zodResolver(ScheduleSchema)
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid, isSubmitting },
  } = methods

  const AddSchedule = () => {
    setSchedules((prevSchedules) => [
      ...prevSchedules,
      { id: Date.now(), date: '', time: '' },
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
    }[];
    // image: any
  }

  const [childCropData, setChildCropData] = useState<string>(''); // 子から受け取るデータを保持
  // 子から受け取ったデータを更新する関数
  const handleChildData = (data: string) => {
    setChildCropData(data);
  };


  const onSubmit = async (params: FormData) => {
    setIsSubmit(true);
    const data = {
      event_name: params.event_name,
      schedules: params.schedules,
      memo: params.memo,
      image: childCropData,
    };
  
    reset();
  
    try {
      const response = await fetch(`/api/schedule/`, {
        method: "POST",
        headers: {
          Accept: "application/json, text/plain",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
  
      if (response.ok) {
        const result = await response.json(); // レスポンスをJSONとしてパース
        const eventId = result.id; // レスポンスに含まれるIDを取得
  
        // 必要に応じてページ遷移
        router.push(`/event?eventId=${eventId}`);
      } else {
        console.error("Error:", response.status, response.statusText);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setIsSubmit(false);
    }
  };


  return (

    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className={styles.formContent}>
          <h2 className={styles.formH2}>STEP1: イベント名登録</h2>
          <div className={styles.formInner}>
            <p className="text-gray-600">イベント名<span className={styles.tagRequire}>必須</span></p>
            <input
              type="text"
              className={styles.formInput}
              placeholder="〇〇さん歓迎会！"
              {...register('event_name')}
            />
            {errors.event_name && (
              <span className="self-start text-xs text-red-500">{errors.event_name.message}</span>
            )}
             <p className="text-gray-600">メモ<span className={styles.tagNoRequire}>任意</span></p>
            <textarea 
              className={styles.formTextarea}
              {...register('memo')}
            />
            {errors.memo && (
              <span className="self-start text-xs text-red-500">{errors.memo.message}</span>
            )}

            <div>
              <CropImg onDataChange={handleChildData} isSubmit={isSubmit} />
            </div>
          </div>

          <div>
            <h2 className={styles.formH2}>STEP2: 日程登録<span className={styles.tagRequire}>必須</span></h2>
            <div className={styles.formInner}>
              {schedules.map((schedule, index) => (
                <div key={schedule.id} className={styles.scheduleInput}>
                  <input
                    type="date"
                    {...register(`schedules.${index}.date`)} // ユニークな名前を指定
                    className={styles.formInputDate}
                    value={schedule.date}
                    onChange={(e) => {
                      const updatedSchedules = [...schedules];
                      updatedSchedules[index].date = e.target.value;
                      schedules[index].date = e.target.value;

                      setSchedules(updatedSchedules);
                    }}
                  />
                  <select
                    className={styles.fromInputTime}
                    value={schedule.time}
                    {...register(`schedules.${index}.time`)}
                    onChange={(e) => {
                      const updatedSchedules = [...schedules];
                      updatedSchedules[index].time = e.target.value;
                      setSchedules(updatedSchedules);
                    }}
                  >
                    {timeOptions.map((timeOption) => (
                      <option key={timeOption} value={timeOption}>
                        {timeOption}
                      </option>
                    ))}
                  </select>
                  <span className={styles.timeFrom}>　〜</span>
                  {index > 0 && (
                    <span
                      className={styles.scheduleRemove}
                      onClick={() => handleRemove(schedule.id)}
                    >
                      <CgCloseO />削除
                    </span>
                  )}
                </div>
              ))}
              <span className={styles.addSchedule} onClick={AddSchedule}>
              <CgAddR />候補日を追加
              </span>
            </div>
          </div>
        </div>
        <button
          type="submit"
          disabled={!isValid || isSubmitting}
          className={`${styles.formSubmit} ${!isValid || isSubmitting ? "cursor-not-allowed opacity-60" : "hover:bg-rose-700"
            }`}
        >
          登録
        </button>
      </form>
    </FormProvider>
  )

}