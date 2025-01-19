'use client'

import { useState } from "react";
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserResponseSchema, UserResponseSchemaType } from '@/schemas/UserResponse';
import styles from "./index.module.scss";

// Props の型定義
type Schedules = {
  schedules: Array<{
    id: number;
    date: string;
    time: string;
  }>;
};

export default function Form(props: Schedules) {
  const [isSubmit, setIsSubmit] = useState(false);
  const methods = useForm<UserResponseSchemaType>({
    mode: 'onBlur',
    resolver: zodResolver(UserResponseSchema)
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid, isSubmitting },
  } = methods


  interface FormData {
    user_name: string;
    response: string;
    schedules: {
      id: number;
      response: string;
    }[];
    // image: any
  }

  const onSubmit = async (params: FormData) => {
    setIsSubmit(true);
    const data = {
      user_name: params.user_name,
      schedules: params.schedules,
      response: params.response
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

        console.log("Event ID:", eventId);

        // 必要に応じてページ遷移
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
          <div className={styles.formInner}>
            <p className="text-gray-600">お名前<span className={styles.tagRequire}>必須</span></p>
            <input
              type="text"
              className={styles.formInput}
              {...register('user_name')}
            />
            {errors.user_name && (
              <span className="self-start text-xs text-red-500">{errors.user_name.message}</span>
            )}
          </div>

          <div>
            <h2 className={styles.formH2}>STEP2: 日程登録<span className={styles.tagRequire}>必須</span></h2>
            <div className={styles.formInner}>
              {props.schedules.map((schedule: any, index) => {
                // 日付と時刻のフォーマット
                const formattedDate = new Date(schedule.date).toLocaleDateString("ja-JP", {
                  year: "numeric",
                  month: "numeric",
                  day: "numeric",
                  weekday: "short", // 曜日を短縮形で表示
                });
                return (
                  <div key={schedule.id} >
                    <p>{formattedDate} - {schedule.time}</p>
                    <input type="hidden" {...register(`schedules.${index}.id`)} />
                    <input type="hidden" {...register(`schedules.${index}.response`)} />
                    <label>
                      <input
                        type="image"
                        value=""
                        {...register(`schedules.${index}.response`)}
                      />
                      
                    </label>
                    <label>
                      <input
                        type="image"
                        value=""
                        {...register(`schedules.${index}.response`)}
                      />
                      
                    </label>
                    <label>
                      <input
                        type="image"
                        value="×"
                        {...register(`schedules.${index}.response`)}
                      />
                      ×
                    </label>
                  </div>
                )
              })}
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