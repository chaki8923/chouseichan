"use client";

import { useState } from "react";
import { useForm, FormProvider } from 'react-hook-form';
import CropImg from "./cropper";
import { zodResolver } from '@hookform/resolvers/zod';
import { ScheduleSchema, ScheduleSchemaType } from '@/schemas/FormSchema';
import AddSchedule from "@/handle/addSchedule";
import styles from "./index.module.scss"

export default function Form() {
  const [isSubmit, setIsSubmit] = useState(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [time, setTime] = useState("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const methods = useForm<ScheduleSchemaType>({
    mode: 'onBlur',
    resolver: zodResolver(ScheduleSchema)
  });

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    console.log("時間変更", event.target.value);
    setValue('time', event.target.value, { shouldValidate: true })
  }


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
    date: string;
    time: string;
    // image: any
  }

  const [childCropData, setChildCropData] = useState<string>(''); // 子から受け取るデータを保持
  // 子から受け取ったデータを更新する関数
  const handleChildData = (data: string) => {
    setChildCropData(data);
  };

  const closeModal = () => {
    setIsSuccess(false);
  };

  const onSubmit = async (params: FormData) => {
    setIsSubmit(true);
    const data = {
      event_name: params.event_name,
      date: params.date,
      image: childCropData,
      time: params.time,
    };
    reset();
    await fetch(`/api/schedule/`, {
      method: "POST",
      headers: {
        Accept: "application/json, text/plain",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }).then((res) => {
      if (res.status === 200) {
        setIsLoading(false);
        setIsSuccess(true);
      }
    }).catch(() => {
      alert("メール送信エラー。もう一度お試しください")
    })
  };

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isValid, isSubmitting },
  } = methods

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

            <div>
              <CropImg onDataChange={handleChildData} isSubmit={isSubmit} />
            </div>
          </div>

          <div>
            <h2 className={styles.formH2}>STEP2: 日程登録</h2>
            <div className={styles.scheduleInput}>
              <input type="date" className={styles.formInputDate} {...register('date')} />
              <select
                {...register("time", {
                  onChange: (event) => {
                    const selectedTime = event.target.value;
                    console.log("時間変更", selectedTime);
                    setTime(selectedTime);
                  },
                })}
                value={time} // React の状態と同期
                className={styles.fromInputTime}
              >
                {timeOptions.map((timeOption) => (
                  <option key={timeOption} value={timeOption}>
                    {timeOption}
                  </option>
                ))}
              </select>
              <span className={styles.timeFrom}>〜</span>
              <span className={styles.scheduleRemove}>削除</span>
            </div>
            <span className={styles.addSchedule} onClick={AddSchedule}>追加</span>
          </div>
        </div>
        <button
          type="submit"
          disabled={!isValid || isSubmitting}
          className={`w-full rounded bg-lime-600 p-3 text-white transition ${!isValid || isSubmitting ? "cursor-not-allowed opacity-60" : "hover:bg-lime-700"
            }`}
        >
          登録
        </button>
      </form>
    </FormProvider>
  )

}