'use client'

import {  useEffect, useState } from "react";
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserResponseSchema, UserResponseSchemaType } from '@/schemas/UserResponse';
import styles from "./index.module.scss";
import Modal from "@/app/component/modal/modal";

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
  const [isDuplicateUserModalOpen, setIsDuplicateUserModalOpen] = useState(false);
  const [duplicateUserName, setDuplicateUserName] = useState('');
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

  // ユーザー名の重複をチェックする関数
  const checkDuplicateUserName = async (userName: string): Promise<boolean> => {
    try {
      if (schedules.length === 0) return false;
      
      // すべてのレスポンスからユーザー名を取得
      const existingUserNames = new Set<string>();
      
      schedules.forEach(schedule => {
        schedule.responses.forEach(response => {
          if (response.user && response.user.name) {
            existingUserNames.add(response.user.name);
          }
        });
      });
      
      // 重複チェック（大文字小文字を区別せず比較）
      return Array.from(existingUserNames).some(
        name => name.toLowerCase() === userName.toLowerCase()
      );
    } catch (error) {
      console.error('重複チェックエラー:', error);
      return false; // エラーの場合は重複なしとして処理を続行
    }
  };

  const onSubmit = async (params: UserResponseSchemaType) => {
    // 編集モード（既存ユーザー）の場合は重複チェックをスキップ
    if (!userId) {
      // 新規登録の場合のみ重複チェックを行う
      const isDuplicate = await checkDuplicateUserName(params.user_name);
      
      if (isDuplicate) {
        // 重複がある場合はモーダルを表示
        setDuplicateUserName(params.user_name);
        setIsDuplicateUserModalOpen(true);
        return; // フォーム送信を中止
      }
    }

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
      {/* 重複ユーザー名の警告モーダル */}
      <Modal 
        isOpen={isDuplicateUserModalOpen} 
        onClose={() => setIsDuplicateUserModalOpen(false)}
        type="warning"
      >
        <div className="text-center">
          <h2 className="text-xl font-bold mb-4">同名での登録はできません</h2>
          <p className="mb-4">
            「{duplicateUserName}」という名前のユーザーは既にこのイベントに登録されています。
            <br />
            別の名前を設定してください。
          </p>
          <button
            onClick={() => setIsDuplicateUserModalOpen(false)}
            className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
          >
            閉じる
          </button>
        </div>
      </Modal>

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
