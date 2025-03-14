'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Plus, Pencil, Trash2, ExternalLink, ThumbsUp, AlertCircle, X, Check, Loader2, Utensils, Upload } from 'lucide-react';
import { FiTrash2, FiCheck, FiX } from 'react-icons/fi';
import styles from './page.module.css';
import { isEventOwner } from "@/app/utils/strages";
import { Restaurant, RestaurantFormData } from '@/types/restaurant';
import {
  getAnonymousId,
  hasVoted,
  saveVote,
  removeVote,
  getEventVote
} from '@/app/utils/voteStorage';
import { use } from 'react';

export default function RestaurantVotePage({ params }: { params: { eventId: string } | Promise<{ eventId: string }> }) {
  // React.use()でparamsをアンラップ
  const { eventId } = use(params instanceof Promise ? params : Promise.resolve(params));
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [event, setEvent] = useState<{ title: string, name: string } | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState<RestaurantFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [votedRestaurantId, setVotedRestaurantId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [voteInProgress, setVoteInProgress] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [decisionStatusModal, setDecisionStatusModal] = useState<{
    show: boolean;
    success: boolean;
    title: string;
    message: string;
  }>({
    show: false,
    success: true,
    title: '',
    message: ''
  });
  const [hasConfirmedStore, setHasConfirmedStore] = useState<boolean>(false);

  // フォーム状態
  const [formData, setFormData] = useState<RestaurantFormData>({
    name: '',
    imageUrl: '',
    websiteUrl: '',
    description: '',
    eventId: eventId
  });

  // フィールド変更時のバリデーション
  const validateField = (name: string, value: string) => {
    let error = '';

    switch (name) {
      case 'name':
        if (!value.trim()) {
          error = '店舗名は必須です';
        } else if (value.length > 50) {
          error = '店舗名は50文字以内で入力してください';
        }
        break;

      case 'websiteUrl':
        if (value && !value.match(/^(https?:\/\/)[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}(:[0-9]{1,5})?(\/.*)?$/i)) {
          error = '有効なウェブサイトURLを入力してください';
        }
        break;

      case 'description':
        if (value.length > 200) {
          error = '説明は200文字以内で入力してください';
        }
        break;
    }

    return error;
  };

  // ファイルのバリデーション
  const validateFile = (file: File) => {
    let error = '';

    // ファイルタイプの確認
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      error = '画像ファイル（JPG, PNG, GIF, WEBP）のみアップロードできます';
      return error;
    }

    // ファイルサイズの確認 (2MB制限)
    if (file.size > 2 * 1024 * 1024) {
      error = '画像サイズは2MB以下にしてください';
      return error;
    }

    return error;
  };

  // フィールド変更ハンドラ
  const handleFieldChange = (name: string, value: string) => {
    // フォームデータを更新
    setFormData(prev => ({ ...prev, [name]: value }));

    // フィールドエラーの更新
    const error = validateField(name, value);
    setFieldErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  // ファイル選択ハンドラ
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    handleFileSelection(file);
  };

  // ドラッグ&ドロップハンドラ
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    handleFileSelection(file);
  };

  // ファイル選択処理
  const handleFileSelection = (file: File) => {
    const error = validateFile(file);
    if (error) {
      setFieldErrors(prev => ({
        ...prev,
        file: error
      }));
      return;
    }

    setSelectedFile(file);
    setFieldErrors(prev => ({
      ...prev,
      file: ''
    }));

    // プレビュー表示
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // ファイル選択ボタンクリック
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // フォームの全体バリデーション
  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    // 名前は必須
    if (!formData.name.trim()) {
      errors.name = '店舗名は必須です';
    }

    // 画像ファイル検証
    if (selectedFile) {
      const fileError = validateFile(selectedFile);
      if (fileError) {
        errors.file = fileError;
      }
    }

    // ウェブサイトURLのバリデーション（入力されている場合）
    if (formData.websiteUrl && !formData.websiteUrl.match(/^(https?:\/\/)[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}(:[0-9]{1,5})?(\/.*)?$/i)) {
      errors.websiteUrl = '有効なウェブサイトURLを入力してください';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // CloudflareR2へ画像アップロード
  const uploadImageToCloudflare = async (file: File): Promise<string> => {
    // FormDataの作成
    const formData = new FormData();
    formData.append('file', file);
    formData.append('eventId', eventId);
    // restaurant-imagesフォルダに保存するよう指定
    formData.append('folder', 'restaurant-images');

    try {
      // アップロード処理
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'アップロードに失敗しました');
      }

      const data = await response.json();
      console.log('アップロード成功:', data); // デバッグログ
      // アップロード成功時にURLを返す
      return data.url;
    } catch (error) {
      console.error('アップロードエラー:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (eventId) {
      setIsOrganizer(isEventOwner(eventId)); // ✅ クライアントサイドで実行
    }
  }, [eventId]);

  // イベント情報と店舗一覧を取得
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // イベント情報を取得
        const eventResponse = await fetch(`/api/events?eventId=${eventId}`);
        if (!eventResponse.ok) {
          const errorData = await eventResponse.json().catch(() => ({}));
          console.error('イベント取得エラー:', errorData);
          throw new Error(`イベント情報の取得に失敗しました: ${eventResponse.status} ${errorData.error || ''}`);
        }

        const eventData = await eventResponse.json();
        setEvent(eventData);

        // イベントオーナーかどうかをローカルストレージから確認
        const storedEventId = localStorage.getItem('eventId');
        setIsOwner(storedEventId === eventId);

        // 店舗一覧を取得
        const restaurantResponse = await fetch(`/api/restaurants?eventId=${eventId}`);
        if (!restaurantResponse.ok) {
          const errorData = await restaurantResponse.json().catch(() => ({}));
          console.error('店舗情報取得エラー:', errorData);
          throw new Error(`店舗情報の取得に失敗しました: ${restaurantResponse.status} ${errorData.error || ''}`);
        }

        const restaurantData = await restaurantResponse.json();
        setRestaurants(restaurantData);
        
        // 確定済み店舗があるかチェック
        const confirmedStore = restaurantData.some((restaurant: Restaurant) => restaurant.decisionFlag);
        setHasConfirmedStore(confirmedStore);

        // 投票状態を取得
        const votedId = getEventVote(eventId);
        setVotedRestaurantId(votedId);

      } catch (err: any) {
        console.error('データ取得エラー:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [eventId]);

  // ESCキーでフォームを閉じる
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        resetForm();
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, []);

  // フォーム送信処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // バリデーション
    if (!validateForm()) {
      // フォームにエラーがある場合はここで処理を中断
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      let imageUrl = formData.imageUrl;

      // 新しい画像がある場合はアップロード
      if (selectedFile) {
        imageUrl = await uploadImageToCloudflare(selectedFile);
      }

      const url = editingRestaurant?.id
        ? '/api/restaurants'
        : '/api/restaurants';

      const method = editingRestaurant?.id ? 'PATCH' : 'POST';

      // 編集時に古い画像を削除する必要があるか確認
      const shouldDeleteOldImage = selectedFile && editingRestaurant?.imageUrl &&
        editingRestaurant.imageUrl !== imageUrl;

      // リクエストボディの作成
      const requestBody = editingRestaurant?.id
        ? {
          ...formData,
          id: editingRestaurant.id,
          imageUrl,
          oldImageUrl: shouldDeleteOldImage ? editingRestaurant.imageUrl : undefined
        }
        : { ...formData, imageUrl };

      console.log('送信データ:', requestBody); // デバッグ用

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '保存に失敗しました');
      }

      const savedRestaurant = await response.json();

      // 店舗一覧を更新
      if (editingRestaurant?.id) {
        setRestaurants(restaurants.map(r =>
          r.id === editingRestaurant.id ? savedRestaurant : r
        ));
      } else {
        setRestaurants([...restaurants, savedRestaurant]);
      }

      // フォームをリセット
      resetForm();

    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // 投票処理
  const handleVote = async (restaurantId: string) => {
    // 投票中の場合は処理をスキップ
    if (voteInProgress) return;

    try {
      setVoteInProgress(true);

      // 既に投票済みかチェック
      if (hasVoted(eventId)) {
        // 同じ店舗への投票なら取り消し
        if (votedRestaurantId === restaurantId) {
          await fetch(`/api/votes?eventId=${eventId}&voterToken=${getAnonymousId()}`, {
            method: 'DELETE',
          });

          removeVote(eventId);
          setVotedRestaurantId(null);

          // 投票数を更新 - 一度リセットして最新状態を取得
          await refreshRestaurantList();
          return;
        }

        // 別の店舗に投票する場合は一度削除
        await fetch(`/api/votes?eventId=${eventId}&voterToken=${getAnonymousId()}`, {
          method: 'DELETE',
        });

        // 前の投票状態をリセット
        removeVote(eventId);
      }

      // 新しい投票を登録
      const response = await fetch('/api/votes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId,
          restaurantId,
          voterToken: getAnonymousId()
        }),
      });

      if (!response.ok) {
        throw new Error('投票に失敗しました');
      }

      // ローカルストレージに保存
      saveVote(eventId, restaurantId);
      setVotedRestaurantId(restaurantId);

      // 最新のレストラン一覧を取得して反映
      await refreshRestaurantList();

    } catch (err: any) {
      setError(err.message);
    } finally {
      setVoteInProgress(false);
    }
  };

  // 最新の店舗一覧を取得
  const refreshRestaurantList = async () => {
    try {
      const response = await fetch(`/api/restaurants?eventId=${eventId}`);
      if (!response.ok) {
        throw new Error('レストラン情報の更新に失敗しました');
      }

      const data = await response.json();
      setRestaurants(data);
      
      // 確定済み店舗があるかチェック
      const confirmedStore = data.some((restaurant: Restaurant) => restaurant.decisionFlag);
      setHasConfirmedStore(confirmedStore);

    } catch (err: any) {
      console.error('レストラン一覧更新エラー:', err);
    }
  };

  // 削除確認ダイアログを表示
  const confirmDelete = (id: string) => {
    setShowDeleteConfirm(id);
  };

  // 削除をキャンセル
  const cancelDelete = () => {
    setShowDeleteConfirm(null);
  };

  // 店舗削除処理
  const handleDelete = async (id: string) => {
    try {
      setSubmitting(true);

      const restaurantToDelete = restaurants.find(r => r.id === id);

      if (!restaurantToDelete) {
        throw new Error('店舗情報が見つかりません');
      }

      // 投票数をチェック
      const voteCount = restaurantToDelete._count?.votes || 0;
      if (voteCount > 0) {
        throw new Error(`投票がない店舗のみ削除できます。`);
      }

      const response = await fetch(`/api/restaurants?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        // 403エラーの場合は投票があるため削除できない
        if (response.status === 403) {
          throw new Error(`投票がない店舗のみ削除できます。`);
        }

        throw new Error(errorData.error || '削除に失敗しました');
      }

      // 店舗一覧から削除
      setRestaurants(restaurants.filter(r => r.id !== id));

      // 削除した店舗に投票していた場合は投票を取り消し
      if (votedRestaurantId === id) {
        removeVote(eventId);
        setVotedRestaurantId(null);
      }

      // 削除確認ダイアログを閉じる
      setShowDeleteConfirm(null);

    } catch (err: any) {
      setError(err.message);
      setShowDeleteConfirm(null); // エラー時もダイアログを閉じる
    } finally {
      setSubmitting(false);
    }
  };

  // 編集モード開始
  const handleEdit = (restaurant: Restaurant) => {
    setEditingRestaurant({
      id: restaurant.id,
      name: restaurant.name,
      imageUrl: restaurant.imageUrl || '',
      websiteUrl: restaurant.websiteUrl || '',
      description: restaurant.description || '',
      eventId
    });

    setFormData({
      name: restaurant.name,
      imageUrl: restaurant.imageUrl || '',
      websiteUrl: restaurant.websiteUrl || '',
      description: restaurant.description || '',
      eventId
    });

    // 画像プレビューを設定
    if (restaurant.imageUrl) {
      setImagePreview(restaurant.imageUrl);
    }

    setShowForm(true);

    // フィールドエラーをリセット
    setFieldErrors({});
    setSelectedFile(null);
  };

  // フォームリセット
  const resetForm = () => {
    setFormData({
      name: '',
      imageUrl: '',
      websiteUrl: '',
      description: '',
      eventId
    });
    setEditingRestaurant(null);
    setShowForm(false);
    setFieldErrors({});
    setImagePreview(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // フラグを切り替える関数
  const toggleDecisionFlag = async (id: string, newStatus: boolean) => {
    try {
      setSubmitting(true);

      const response = await fetch('/api/restaurants/toggle-decision', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          decisionFlag: newStatus,
          eventId  // イベントIDも送信
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || '更新に失敗しました');
      }

      const updatedRestaurant = await response.json();
      
      // 成功モーダルを表示
      setDecisionStatusModal({
        show: true,
        success: true,
        title: newStatus ? '確定完了' : 'キャンセル完了',
        message: newStatus 
          ? `${updatedRestaurant.name}を確定済みとして登録しました`
          : `${updatedRestaurant.name}の確定をキャンセルしました`
      });

      // 全レストランリストを更新 - 他のレストランの状態も変わっている可能性があるため
      await refreshRestaurantList();

    } catch (error: any) {
      console.error('確定ステータス更新エラー:', error);
      
      // エラーモーダルを表示
      setDecisionStatusModal({
        show: true,
        success: false,
        title: 'エラーが発生しました',
        message: error.message || 'ステータスの更新に失敗しました'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // モーダルを閉じる関数
  const closeStatusModal = () => {
    setDecisionStatusModal(prev => ({
      ...prev,
      show: false
    }));
  };

  // モーダル表示時のタイマー設定
  useEffect(() => {
    let timerId: NodeJS.Timeout;
    
    if (decisionStatusModal.show) {
      // 3秒後に自動的にモーダルを閉じる
      timerId = setTimeout(() => {
        closeStatusModal();
      }, 3000);
    }
    
    // クリーンアップ関数
    return () => {
      if (timerId) {
        clearTimeout(timerId);
      }
    };
  }, [decisionStatusModal.show]);

  // 一般的なローディング表示
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingContent}>
          <Loader2 className={styles.loadingSpinner} size={40} />
          <p>読み込み中...</p>
        </div>
      </div>
    );
  }

  // エラー表示
  if (error && !showForm) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorContent}>
          <AlertCircle className={styles.errorIcon} size={40} />
          <h2 className={styles.errorTitle}>エラーが発生しました</h2>
          <p className={styles.errorMessage}>{error}</p>
          <button
            className={styles.backButton}
            onClick={() => router.push(`/event?eventId=${eventId}`)}
          >
            <ArrowLeft size={16} />
            イベントページに戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* ヘッダー */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>店舗投票</h1>
          <p className={styles.eventTitle}>
            {event?.title || event?.name || 'イベント名不明'}
          </p>
        </div>

        <div className={styles.buttonContainer}>
          <button
            className={styles.backButton}
            onClick={() => router.push(`/event?eventId=${eventId}`)}
          >
            <ArrowLeft size={16} />
            戻る
          </button>

          {isOrganizer && (
            <button
              className={styles.addButton}
              onClick={() => setShowForm(true)}
            >
              <Plus size={16} />
              店舗追加
            </button>
          )}
        </div>
      </div>

      {/* エラーメッセージ (インライン表示) */}
      {error && showForm && (
        <div className={styles.inlineError}>
          <AlertCircle size={16} />
          <span>{error}</span>
          <button
            className={styles.closeErrorButton}
            onClick={() => setError(null)}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* 店舗リスト */}
      {restaurants.length > 0 ? (
        <div className={styles.restaurantGrid}>
          {restaurants.map((restaurant) => (
            <div key={restaurant.id} className={styles.restaurantCard}>

              {restaurant.imageUrl ? (
                <div className={styles.restaurantImage}>
                  <Image
                    src={restaurant.imageUrl}
                    alt={restaurant.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    style={{ objectFit: 'cover' }}
                  />
                  {/* 確定スタンプ */}
                  {restaurant.decisionFlag && (
                    <div className={styles.confirmStampContainer}>
                      <div className={styles.confirmStamp}>
                        <FiCheck className={styles.confirmStampIcon} />
                        <span>確定</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className={`${styles.restaurantImage} ${styles.noImage}`}>
                  <Utensils size={40} />
                  {/* 確定スタンプ（画像がない場合） */}
                  {restaurant.decisionFlag && (
                    <div className={styles.confirmStampContainer}>
                      <div className={styles.confirmStamp}>
                        <FiCheck className={styles.confirmStampIcon} />
                        <span>確定</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className={styles.restaurantInfo}>
                <h3 className={styles.restaurantName}>{restaurant.name}</h3>

                {restaurant.description && (
                  <p className={styles.restaurantDescription}>
                    {restaurant.description}
                  </p>
                )}

                {restaurant.websiteUrl && (
                  <a
                    href={restaurant.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.urlLink}
                  >
                    <ExternalLink size={16} />
                    ウェブサイトを開く
                  </a>
                )}

                <div className={styles.voteCount}>
                  <ThumbsUp size={16} />
                  <span>{restaurant._count?.votes || 0}票</span>
                </div>

                <div className={styles.actionButtons}>
                  {isOrganizer && (
                    <>
                      {!restaurant.decisionFlag ? (
                        <button
                          className={styles.confirmButton}
                          onClick={() => toggleDecisionFlag(restaurant.id, true)}
                          disabled={submitting}
                        >
                          {submitting ? (
                            <Loader2 className={styles.loadingIcon} size={16} />
                          ) : (
                            <FiCheck size={16} />
                          )}
                          確定する
                        </button>
                      ) : (
                        <button
                          className={styles.cancelDecisionButton}
                          onClick={() => toggleDecisionFlag(restaurant.id, false)}
                          disabled={submitting}
                        >
                          {submitting ? (
                            <Loader2 className={styles.loadingIcon} size={16} />
                          ) : (
                            <FiX size={16} />
                          )}
                          キャンセル
                        </button>
                      )}

                      {(restaurant._count?.votes || 0) > 0 ? (
                        <div className={styles.tooltipWrapper}>
                          <button
                            className={`${styles.deleteButton} ${styles.disabledButton}`}
                            disabled={true}
                          >
                            <AlertCircle size={16} />
                            編集不可
                          </button>
                          <div className={styles.tooltip}>
                            投票がない店舗のみ編集できます。
                          </div>
                        </div>
                      ) : (

                        <button
                          className={styles.editButton}
                          onClick={() => handleEdit(restaurant)}
                        >
                          <Pencil size={16} />
                          編集
                        </button>
                      )}


                      {(restaurant._count?.votes || 0) > 0 ? (
                        <div className={styles.tooltipWrapper}>
                          <button
                            className={`${styles.deleteButton} ${styles.disabledButton}`}
                            disabled={true}
                          >
                            <AlertCircle size={16} />
                            削除不可
                          </button>
                          <div className={styles.tooltip}>
                            投票がない店舗のみ削除できます。
                          </div>
                        </div>
                      ) : (
                        <button
                          className={styles.deleteButton}
                          onClick={() => confirmDelete(restaurant.id)}
                        >
                          <Trash2 size={16} />
                          削除
                        </button>
                      )}
                    </>
                  )}

                  {/* 投票ボタン - 確定済み店舗がある場合は非表示 */}
                  {!hasConfirmedStore && (
                    <button
                      className={`${styles.voteButton} ${votedRestaurantId === restaurant.id ? styles.voted : styles.notVoted}`}
                      onClick={() => handleVote(restaurant.id)}
                      disabled={voteInProgress}
                    >
                      {voteInProgress && votedRestaurantId === restaurant.id ? (
                        <Loader2 className={styles.loadingIcon} size={16} />
                      ) : (
                        <ThumbsUp size={16} />
                      )}
                      {votedRestaurantId === restaurant.id ? '投票済み' : '投票する'}
                    </button>
                  )}
                </div>

                {/* 確定済み店舗がある場合のメッセージ */}
                {hasConfirmedStore && restaurant.decisionFlag && (
                  <div className={styles.confirmedMessage}>
                    <FiCheck size={16} /> この店舗に決定しました
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.noRestaurants}>
          <Utensils size={40} />
          <p>まだ店舗が登録されていません</p>
          {isOrganizer && (
            <button
              className={styles.addButton}
              onClick={() => setShowForm(true)}
            >
              <Plus size={16} />
              店舗を登録する
            </button>
          )}
        </div>
      )}

      {/* フォームオーバーレイ */}
      {showForm && (
        <div className={styles.modalOverlay}>
          <div className={styles.formContainer}>
            {/* フォームヘッダー */}
            <div className={styles.formHeader}>
              <h2 className={styles.formTitle}>
                {editingRestaurant ? '店舗情報を編集' : '新しい店舗を登録'}
              </h2>
              <button
                className={styles.closeFormButton}
                onClick={resetForm}
              >
                <X size={24} />
              </button>
            </div>

            {/* フォーム */}
            <form
              ref={formRef}
              className={styles.form}
              onSubmit={handleSubmit}
            >
              {/* 店舗名 */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  店舗名 <span className={styles.requiredBadge}>必須</span>
                </label>
                <input
                  type="text"
                  className={`${styles.formInput} ${fieldErrors.name ? styles.inputError : ''}`}
                  value={formData.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  placeholder="店舗名を入力"
                  maxLength={50}
                />
                {fieldErrors.name && (
                  <span className={styles.fieldError}>{fieldErrors.name}</span>
                )}
                <span className={styles.charCount}>{formData.name.length}/50</span>
              </div>

              {/* 画像アップロード */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  店舗画像
                </label>
                <div
                  className={`${styles.dropArea} ${isDragging ? styles.dragging : ''} ${fieldErrors.file ? styles.dropError : ''}`}
                  onDragEnter={handleDragEnter}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={triggerFileInput}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    className={styles.fileInput}
                  />

                  {imagePreview ? (
                    <div className={styles.previewContainer}>
                      <img
                        src={imagePreview}
                        alt="プレビュー"
                        className={styles.previewImage}
                      />
                        <button
                        type="button"
                        className={styles.removeImageButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          setImagePreview(null);
                          setSelectedFile(null);
                          if (editingRestaurant) {
                            setFormData(prev => ({ ...prev, imageUrl: '' }));
                          }
                          if (fileInputRef.current) {
                            fileInputRef.current.value = '';
                          }
                        }}
                    >
                      <FiTrash2 />
                    </button>
                     
                    </div>
                  ) : (
                    <div className={styles.uploadPlaceholder}>
                      <Upload size={40} />
                      <p>画像をドラッグ&ドロップまたはクリックして選択</p>
                      <span>JPG, PNG, GIF, WEBP (最大2MB)</span>
                    </div>
                  )}
                </div>
                {fieldErrors.file && (
                  <span className={styles.fieldError}>{fieldErrors.file}</span>
                )}
              </div>

              {/* ウェブサイトURL */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  ウェブサイトURL
                </label>
                <input
                  type="url"
                  className={`${styles.formInput} ${fieldErrors.websiteUrl ? styles.inputError : ''}`}
                  value={formData.websiteUrl}
                  onChange={(e) => handleFieldChange('websiteUrl', e.target.value)}
                  placeholder="https://example.com"
                />
                {fieldErrors.websiteUrl && (
                  <span className={styles.fieldError}>{fieldErrors.websiteUrl}</span>
                )}
              </div>

              {/* 説明 */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  説明
                </label>
                <textarea
                  className={`${styles.formTextarea} ${fieldErrors.description ? styles.inputError : ''}`}
                  value={formData.description || ''}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  placeholder="店舗の説明を入力"
                  maxLength={200}
                />
                {fieldErrors.description && (
                  <span className={styles.fieldError}>{fieldErrors.description}</span>
                )}
                <span className={styles.charCount}>{(formData.description || '').length}/200</span>
              </div>

              {/* 送信ボタン */}
              <div className={styles.formActions}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={resetForm}
                  disabled={submitting}
                >
                  キャンセル
                </button>

                <button
                  type="submit"
                  className={styles.saveButton}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className={styles.loadingIcon} size={16} />
                      保存中...
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      {editingRestaurant ? '更新する' : '登録する'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 削除確認モーダル */}
      {showDeleteConfirm && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContainer}>
            <h2 className={styles.modalTitle}>削除の確認</h2>
            <p className={styles.modalText}>この店舗を削除しますか？この操作は元に戻せません。</p>

            <div className={styles.modalButtons}>
              <button
                className={styles.modalCancelButton}
                onClick={cancelDelete}
                disabled={submitting}
              >
                キャンセル
              </button>

              <button
                className={styles.modalDeleteButton}
                onClick={() => handleDelete(showDeleteConfirm)}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className={styles.loadingIcon} size={16} />
                    削除中...
                  </>
                ) : (
                  '削除する'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ステータス変更モーダル */}
      {decisionStatusModal.show && (
        <div className={styles.modalOverlay}>
          <div className={styles.decisionStatusModal}>
            <div className={`${styles.statusIcon} ${decisionStatusModal.success ? styles.success : styles.error}`}>
              {decisionStatusModal.success ? <FiCheck size={48} /> : <FiX size={48} />}
            </div>
            <h3 className={styles.statusTitle}>{decisionStatusModal.title}</h3>
            <p className={styles.statusMessage}>{decisionStatusModal.message}</p>
            <button
              className={styles.statusButton}
              onClick={closeStatusModal}
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 