'use client'

import {  useEffect } from "react";
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserResponseSchema, UserResponseSchemaType } from '@/schemas/UserResponse';
import styles from "./index.module.scss";

type Schedule = {
  id: number;
  date: string;
  time: string;
  responses: Array<{
    user: {
      id: string;
      name: string;
      comment: string;
    };
    response: string;
  }>;
};

type SchedulesProp = {
  onSuccess: () => void;
  onCreate: () => void;
  schedules: Array<Schedule>;
  userId?: string;
  userName?: string;
};

export default function Form(props: SchedulesProp) {
  const { userId, userName, schedules } = props;
  const methods = useForm<UserResponseSchemaType>({
    mode: 'onChange', // バリデーションのタイミングを変更
    resolver: zodResolver(UserResponseSchema),
    defaultValues: {
      user_name: '',
      schedules: props.schedules.map((schedule) => {
        const userResponse = schedule.responses.find(
          (response) => response.user.id === props.userId
        );

        return {
          id: schedule.id,
          response: userResponse ? userResponse.response : 'ATTEND', // 該当レスポンスがなければデフォルト値
        };
      }),
    },
  });

  useEffect(() => {
    if (userId) {
      // スケジュールを更新
      const updatedSchedules = schedules.map((schedule) => {
        // 該当ユーザーのレスポンスを取得
        const userResponse = schedule.responses.find(
          (response) => response.user.id === userId
        );

        return {
          ...schedule,
          response: userResponse ? userResponse.response : "ATTEND", // 該当レスポンスがない場合デフォルト値を設定
          comment: userResponse ? userResponse.user.comment : "ああああ",
        };
      });

      // フォームをリセット
      methods.reset({
        schedules: updatedSchedules.map((schedule) => ({
          id: schedule.id,
          response: schedule.response, // 必須プロパティ
        })),
      });
    }
  }, [userId, schedules, methods]);


  const { register, handleSubmit, setValue, reset, formState: { errors, isValid, isSubmitting } } = methods;

  useEffect(() => {
    if (userId && userName) {
      const userResponse = schedules
        .flatMap((schedule) => schedule.responses)
        .find((response) => response.user.id === userId);

      if (userResponse) {
        setValue("comment", userResponse.user.comment || ""); // コメントを直接設定
        setValue("user_name", userResponse.user.name);        // ユーザー名も設定
      }
    }
  }, [userId, userName, setValue]);


  const handleIconClick = (index: number, value: string) => {
    setValue(`schedules.${index}.response`, value, { shouldValidate: true });
  };

  const handleClickCreate = () => {
    setValue("comment", '');
    setValue("user_name", '');
    // スケジュールのレスポンスを初期値に戻す
    props.schedules.forEach((schedule, index) => {
      setValue(`schedules.${index}.response`, 'ATTEND', { shouldValidate: true });
    });

    props.onCreate();
  }


  const onSubmit = async (params: UserResponseSchemaType) => {

    // APIに送信するデータ
    const data = {
      userId: userId, // userIdを追加して送信
      user_name: params.user_name,
      schedules: params.schedules,
      comment: params.comment,
    };    

    reset();

    try {
      // userIdの有無でHTTPメソッドを切り替え
      const method = userId ? "PUT" : "POST";

      const response = await fetch(`/api/response/`, {
        method: method,
        headers: {
          Accept: "application/json, text/plain",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {     
        setValue("comment", '');
        setValue("user_name", '');
        // スケジュールのレスポンスを初期値に戻す
        props.schedules.forEach((schedule, index) => {
          setValue(`schedules.${index}.response`, 'ATTEND', { shouldValidate: true });
        });
    
        props.onCreate();   
        props.onSuccess();
      } else {
        console.error("Error:", response.status, response.statusText);
      }
    } catch (error) {
      console.log("Fetch エラー:", error);
    } finally {
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)}>
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

                    <img src={`${methods.getValues(`schedules.${index}.response`) === "ATTEND" ? 'circle_selected.png' : 'circle_no.png'
                      }`} alt="Service Logo" className={styles.userResponse} onClick={() => handleIconClick(index, "ATTEND")} />

                    <img src={`${methods.getValues(`schedules.${index}.response`) === "UNDECIDED" ? 'triangle_selected.png' : 'triangle_no.png'
                      }`} alt="Service Logo" className={styles.userResponse_triangle} onClick={() => handleIconClick(index, "UNDECIDED")} />

                    <img src={`${methods.getValues(`schedules.${index}.response`) === "ABSENT" ? 'batu_selected.png' : 'batu_no.png'
                      }`} alt="Service Logo" className={styles.userResponse_batu} onClick={() => handleIconClick(index, "ABSENT")} />
                  </div>
                );
              })}
              <p className="text-gray-600">コメント<span className={styles.tagNoRequire}>任意</span></p>
              <textarea
                className={styles.formTextarea}
                {...register('comment')}
              />
              {errors.comment && (
                <span className="self-start text-xs text-red-500">{errors.comment.message}</span>
              )}
            </div>
          </div>
        </div>
        <button
          type="submit"
          disabled={!isValid || isSubmitting}
          className={`${styles.formSubmit} ${!isValid || isSubmitting ? `${styles.disabled}` : `${styles.enableSubmit}`
            }`}
        >
          {userId ? "編集完了" : "新規登録"}
        </button>
        {userId && (
          <span onClick={() => handleClickCreate()} className={styles.createBtn}>キャンセル</span>
        )}
      </form>
    </FormProvider>
  );
}
