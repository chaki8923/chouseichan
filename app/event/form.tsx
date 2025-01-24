'use client'

import { useState } from "react";
import { useForm, FormProvider, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserResponseSchema, UserResponseSchemaType } from '@/schemas/UserResponse';
import { FaRegCircle } from "react-icons/fa";
import { LuTriangle } from "react-icons/lu";
import { RxCross2 } from "react-icons/rx";
import styles from "./index.module.scss";

type SchedulesProp = {
  schedules: Array<{
    id: number;
    date: string;
    time: string;
    response: string;
  }>;
};

export default function Form(props: SchedulesProp) {
  const [isSubmit, setIsSubmit] = useState(false);
  const methods = useForm<UserResponseSchemaType>({
    mode: 'onChange', // バリデーションのタイミングを変更
    resolver: zodResolver(UserResponseSchema),
    defaultValues: {
      user_name: '',
      schedules: props.schedules.map((schedule) => ({
        id: schedule.id,
        response: schedule.response || 'ATTEND',
      })),
    },
  });

  const { register, handleSubmit, setValue, reset, formState: { errors, isValid, isSubmitting } } = methods;

  const handleIconClick = (index: number, value: string) => {
    setValue(`schedules.${index}.response`, value, { shouldValidate: true });
  };

  const onSubmit = async (params: UserResponseSchemaType) => {
    setIsSubmit(true);
    const data = {
      user_name: params.user_name,
      schedules: params.schedules,
    };

    reset();

    try {
      const response = await fetch(`/api/response/`, {
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

      } else {
        console.error("Error:", response.status, response.statusText);
      }
    } catch (error) {
      console.log("Fetch エラー:", error);
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
            <div className={styles.formInner}>
              {props.schedules.map((schedule, index) => {
                const formattedDate = new Date(schedule.date).toLocaleDateString("ja-JP", {
                  year: "numeric",
                  month: "numeric",
                  day: "numeric",
                  weekday: "short",
                });
                return (
                  <div key={schedule.id} className={styles.flex}>
                    <p className={styles.date}>{formattedDate} - {schedule.time}</p>
                    <input type="hidden" {...register(`schedules.${index}.id`)} />

                    <FaRegCircle
                      className={`${styles.reactIcon} ${methods.getValues(`schedules.${index}.response`) === "ATTEND" ? styles.selected : ''
                        }`}
                      onClick={() => handleIconClick(index, "ATTEND")}
                    />

                    <LuTriangle
                      className={`${styles.reactIcon} ${methods.getValues(`schedules.${index}.response`) === "UNDECIDED" ? styles.selected : ''
                        }`}
                      onClick={() => handleIconClick(index, "UNDECIDED")}
                    />

                    <RxCross2
                      className={`${styles.reactIcon} ${methods.getValues(`schedules.${index}.response`) === "ABSENT" ? styles.selected : ''
                        }`}
                      onClick={() => handleIconClick(index, "ABSENT")}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <button
          type="submit"
          disabled={!isValid || isSubmitting}
          className={`${styles.formSubmit} ${!isValid || isSubmitting ? "cursor-not-allowed opacity-60" : "hover:bg-rose-700"}`}
        >
          登録
        </button>
      </form>
    </FormProvider>
  );
}
