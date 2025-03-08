'use client'

import { useEffect, useState } from "react";
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserResponseSchema, UserResponseSchemaType } from '@/schemas/UserResponse';
import styles from "./index.module.scss";
import Modal from "@/app/component/modal/modal";
import { FiCheckCircle } from 'react-icons/fi';

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
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isEditSuccessModalOpen, setIsEditSuccessModalOpen] = useState(false);
  const [isNameValid, setIsNameValid] = useState(!!userName); // ユーザー名が渡されている場合は初期値trueに
  
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
          comment: userResponse ? userResponse.user.comment : "",
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


  const { register, handleSubmit, setValue, reset, formState: { errors, isSubmitting }, watch } = methods;

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
  }, [userId, userName, setValue, schedules]);

  // ユーザー名の入力状態を監視
  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name === 'user_name' || name === undefined) {
        const userName = value.user_name;
        setIsNameValid(!!userName && userName.trim() !== '');
      }
    });
    return () => subscription.unsubscribe();
  }, [watch]);

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
    
        // 編集モードかどうかで表示するモーダルを切り替え
        if (userId) {
          setIsEditSuccessModalOpen(true);
          // 3秒後に自動的に閉じる
          setTimeout(() => {
            setIsEditSuccessModalOpen(false);
            props.onCreate();   
            props.onSuccess();
          }, 2000);
        } else {
          setIsSuccessModalOpen(true);
          // 3秒後に自動的に閉じる
          setTimeout(() => {
            setIsSuccessModalOpen(false);
            props.onCreate();   
            props.onSuccess();
          }, 2000);
        }
      } else {
        console.error("Error:", response.status, response.statusText);
      }
    } catch (error) {
      console.log("Fetch エラー:", error);
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

      {/* 成功モーダル（新規登録時） */}
      <Modal isOpen={isSuccessModalOpen} onClose={() => setIsSuccessModalOpen(false)} type="info">
        <div className={styles.modalContent}>
          <FiCheckCircle size={50} color="#4BB543" style={{ marginBottom: '1rem' }} />
          <h2 className={styles.modalTitle}>参加登録が完了しました</h2>
          <p>イベントへの参加情報が正常に登録されました。</p>
        </div>
      </Modal>
      
      {/* 編集完了モーダル */}
      <Modal isOpen={isEditSuccessModalOpen} onClose={() => setIsEditSuccessModalOpen(false)} type="info">
        <div className={styles.modalContent}>
          <FiCheckCircle size={50} color="#4BB543" style={{ marginBottom: '1rem' }} />
          <h2 className={styles.modalTitle}>編集が完了しました</h2>
          <p>参加情報の編集が正常に完了しました。</p>
        </div>
      </Modal>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className={styles.modernFormCard}>
          <div className={styles.formHeading}>
            <h3 className={styles.formTitle}>{userId ? `${userName}さんの回答を編集` : "参加登録"}</h3>
            {userId && (
              <button 
                type="button" 
                onClick={handleClickCreate} 
                className={styles.cancelButton}
              >
                新規登録へ戻る
              </button>
            )}
          </div>

          <div className={styles.formSection}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                お名前 <span className={styles.badgeRequired}>必須</span>
              </label>
              <input
                type="text"
                placeholder="あなたのお名前を入力してください"
                className={styles.modernInput}
                {...register('user_name')}
              />
              {errors.user_name && (
                <span className={styles.errorMessage}>{errors.user_name.message}</span>
              )}
            </div>
          </div>

          <div className={styles.formSection}>
            <h4 className={styles.sectionTitle}>参加可否</h4>
            <div className={styles.scheduleGrid}>
              {props.schedules.map((schedule, index) => {
                const formattedDate = new Date(schedule.date).toLocaleDateString("ja-JP", {
                  year: "numeric",
                  month: "numeric",
                  day: "numeric",
                  weekday: "short",
                });

                const responseValue = methods.getValues(`schedules.${index}.response`);
                
                return (
                  <div key={schedule.id} className={styles.scheduleCard}>
                    <input type="hidden" {...register(`schedules.${index}.id`)} />
                    <div className={styles.scheduleDate}>
                      {formattedDate} - {schedule.time}
                    </div>
                    <div className={styles.responseOptions}>
                      <button
                        type="button"
                        className={`${styles.responseOption} ${responseValue === "ATTEND" ? styles.responseSelected : ''}`}
                        onClick={() => handleIconClick(index, "ATTEND")}
                      >
                        <div className={styles.responseIcon}>
                          <span className={styles.circleIcon}>○</span>
                        </div>
                        <span className={styles.responseText}>参加</span>
                      </button>
                      
                      <button
                        type="button"
                        className={`${styles.responseOption} ${responseValue === "UNDECIDED" ? styles.responseSelected : ''}`}
                        onClick={() => handleIconClick(index, "UNDECIDED")}
                      >
                        <div className={styles.responseIcon}>
                          <span className={styles.triangleIcon}>△</span>
                        </div>
                        <span className={styles.responseText}>未定</span>
                      </button>
                      
                      <button
                        type="button"
                        className={`${styles.responseOption} ${responseValue === "ABSENT" ? styles.responseSelected : ''}`}
                        onClick={() => handleIconClick(index, "ABSENT")}
                      >
                        <div className={styles.responseIcon}>
                          <span className={styles.crossIcon}>×</span>
                        </div>
                        <span className={styles.responseText}>不参加</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className={styles.formSection}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                コメント <span className={styles.badgeOptional}>任意</span>
              </label>
              <textarea
                placeholder="伝えたいことがあれば入力してください"
                className={styles.modernTextarea}
                {...register('comment')}
              />
              {errors.comment && (
                <span className={styles.errorMessage}>{errors.comment.message}</span>
              )}
            </div>
          </div>

          <div className={styles.formActions}>
            <button
              type="submit"
              disabled={isSubmitting || !isNameValid}
              className={`${styles.submitButton} ${(!isNameValid || isSubmitting) ? styles.disabled : ''}`}
            >
              {isSubmitting ? "送信中..." : userId ? "編集を完了する" : "登録する"}
            </button>
          </div>
        </div>
      </form>
    </FormProvider>
  );
}
