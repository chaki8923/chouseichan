import React, { useState, useRef } from 'react'
import styles from "./index.module.scss";
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  Crop,
  PixelCrop,
} from 'react-image-crop'
import { canvasPreview } from './canvasPreview'
import { useDebounceEffect } from './useDebounceEffect'
import { FiUpload, FiCrop, FiImage, FiAlertCircle } from 'react-icons/fi'
import Link from 'next/link'

import 'react-image-crop/dist/ReactCrop.css'

// This is to demonstate how to make and center a % aspect crop
// which is a bit trickier so we use some helper functions.
function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 50,
        height: 50,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  )
}


// Props の型定義
type onDataChange = {
  onDataChange: (data: File) => void; // 親に通知する関数の型
  setValidationError: (error: string | null | React.ReactNode) => void;
};


export default function App(props: onDataChange) {
  const [imgSrc, setImgSrc] = useState('')
  const previewCanvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const hiddenAnchorRef = useRef<HTMLAnchorElement>(null)
  const cropContainerRef = useRef<HTMLDivElement>(null)
  const blobUrlRef = useRef('')
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 50, // 初期サイズを適切に設定
    height: 50, // 正方形にする
    x: 25,
    y: 25,
  });

  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const [isCrop, setIsCrop] = useState<boolean>(false);
  const [fileError, setFileError] = useState<string | null>(null); // ファイルエラー状態を追加
  const [isDragging, setIsDragging] = useState<boolean>(false); // ドラッグ状態を追加
  
  // コンポーネントがマウントされたとき、画像は任意なのでエラーを消去
  React.useEffect(() => {
    const { setValidationError } = props;
    setValidationError(null);
  }, [props.setValidationError]);

  // ドラッグ&ドロップ用のハンドラ
  const handleDragEnter = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) {
      setIsDragging(true);
    }
  };
  
  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  // ファイル処理のロジックを共通関数として抽出
  const processFile = (file: File) => {
    // setCrop(undefined) // Makes crop preview update between images.
    setIsCrop(false);
    setFileError(null); // エラーをリセット
    
    // 画像のバリデーションをここで実行
    if (!file.type.startsWith('image/')) {
      const errorMsg = '画像形式が不正です。画像ファイルをアップロードしてください';
      setFileError(errorMsg);
      props.setValidationError(errorMsg);
      return;
    }

    const maxSize = 1024 * 1024 * 1; // 1MB
    if (file.size > maxSize) {
      const errorMsg = 'ファイルサイズが1MBを超えています。より小さい画像を選択してください。';
      setFileError(errorMsg);
      props.setValidationError(
        <div className={styles.errorContainer}>
          <FiAlertCircle className={styles.errorIcon} />
          <div className={styles.errorMessage}>
            {errorMsg}
            <div className={styles.resizeToolWrapper}>
              <Link 
                href="/image-resize?from_form=true" 
                className={styles.resizeToolLink}
                onClick={(e) => {
                  e.preventDefault(); // デフォルトのリンク遷移を防止
                  saveFormDataAndNavigate(e); // データを保存
                  // 少し遅延させてデータの保存を確実にしてから遷移
                  setTimeout(() => {
                    window.location.href = "/image-resize?from_form=true";
                  }, 100);
                }}
              >
                <FiCrop className={styles.resizeToolIcon} />
                画像リサイズツールを使用する
              </Link>
              <p className={styles.resizeToolHint}>
                リサイズツールで画像を小さくしてから再度アップロードしてください！
              </p>
            </div>
          </div>
        </div>
      );
      return;
    }
    
    // バリデーションが通ったらエラーをクリア
    setFileError(null);
    props.setValidationError(null);

    const reader = new FileReader()
    reader.addEventListener('load', () =>
      setImgSrc(reader.result?.toString() || ''),
    )
    reader.readAsDataURL(file)
  };

  function onSelectFile(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  }

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget
    // 画像の読み込み時にクロップを設定
    const initialCrop = centerAspectCrop(width, height, 1)
    setCrop(initialCrop)
    
    // 初期クロップをcompletedCropにも設定（これにより生成関数が動作可能になる）
    const pixelCrop: PixelCrop = {
      x: Math.round(initialCrop.x * width / 100),
      y: Math.round(initialCrop.y * height / 100),
      width: Math.round(initialCrop.width * width / 100),
      height: Math.round(initialCrop.height * height / 100),
      unit: 'px'
    }
    
    setCompletedCrop(pixelCrop)
    
    // 画像が読み込まれた直後に少し遅延を持たせて自動クロップを実行
    // useDebounceEffectが完了するのを待つため、遅延時間を長めに設定
    setTimeout(() => {
      try {
        if (imgRef.current && previewCanvasRef.current && completedCrop) {
          // まずcanvasPreviewを手動で実行して確実に描画する
          canvasPreview(
            imgRef.current,
            previewCanvasRef.current,
            pixelCrop
          )
          // その後クロップを実行
          generateCroppedImage().catch(err => {
            console.warn("初期クロップ処理中にエラーが発生しました", err);
          });
        }
      } catch (error) {
        console.warn("初期クロップ設定中にエラーが発生しました", error);
      }
    }, 500) // 十分な遅延を設定
  }

  async function generateCroppedImage() {
    // クロップ前のスクロール位置を保存
    const scrollPosition = window.scrollY;
    
    const image = imgRef.current
    const previewCanvas = previewCanvasRef.current
    
    // エラーをスローする代わりに早期リターン
    if (!image || !previewCanvas || !completedCrop) {
      console.warn("クロップに必要な要素が見つかりません");
      return;
    }

    // This will size relative to the uploaded image
    // size. If you want to size according to what they
    // are looking at on screen, remove scaleX + scaleY
    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height

    const offscreen = new OffscreenCanvas(
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
    )
    const ctx = offscreen.getContext('2d')
    if (!ctx) {
      throw new Error('No 2d context')
    }

    ctx.drawImage(
      previewCanvas,
      0,
      0,
      previewCanvas.width,
      previewCanvas.height,
      0,
      0,
      offscreen.width,
      offscreen.height,
    )

    const blob = await new Promise<Blob>((resolve) =>
      previewCanvas.toBlob((b) => resolve(b!), "image/png")
    );

    // BlobをFileに変換（ファイル名を適当につける）
    const file = new File([blob], "cropped-image.png", { type: "image/png" });

    // ここでファイルサイズをチェック
    const maxSize = 1024 * 1024 * 1; // 1MB
    if (file.size > maxSize) {
      const errorMsg = 'クロップ後の画像が1MBを超えています。より小さく切り取るか、別の画像を選択してください。';
      setFileError(errorMsg);
      props.setValidationError(errorMsg);
      return;
    }

    // バリデーションが通過したらエラーをクリア
    setFileError(null);
    props.setValidationError(null);
    
    // 親コンポーネントにFileを送る
    props.onDataChange(file);

    setIsCrop(true);
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current)
    }
    blobUrlRef.current = URL.createObjectURL(blob)


    if (hiddenAnchorRef.current) {
      hiddenAnchorRef.current.href = blobUrlRef.current
      hiddenAnchorRef.current.click()
    }
    
    // DOM更新後にスクロール位置を復元するため、setTimeout を使用
    setTimeout(() => {
      // 切り取り前の画像の高さを考慮したスクロール位置に調整
      const adjustedPosition = Math.max(0, scrollPosition);
      window.scrollTo({
        top: adjustedPosition,
        behavior: 'auto'
      });
    }, 0);
  }

  useDebounceEffect(
    async () => {
      if (
        completedCrop?.width &&
        completedCrop?.height &&
        imgRef.current &&
        previewCanvasRef.current
      ) {
        // We use canvasPreview as it's much faster than imgPreview.
        canvasPreview(
          imgRef.current,
          previewCanvasRef.current,
          completedCrop,
        )
      }
    },
    100,
    [completedCrop, 1, 0],
  )

  // リサイズページへ移動する前にフォームデータを保存する関数
  const saveFormDataAndNavigate = (e: React.MouseEvent<HTMLAnchorElement> | React.SyntheticEvent) => {

    
    try {
      // 優先順位1: 親コンポーネントが公開した関数を使用
      if (typeof window !== 'undefined' && (window as any).saveEventFormData) {
        const saved = (window as any).saveEventFormData();
        if (saved) {
          setTimeout(() => {
            window.location.href = '/image-resize?from_form=true';
          }, 100);
          return;
        }
      }
      
      
      // 複数のセレクタを試してフォーム要素を取得
      let formElement = document.querySelector('form.modernForm');
      if (!formElement) {
        formElement = document.querySelector('form');
      }
      
      
      if (formElement) {
        // フォームからデータを取得
        const eventNameInput = formElement.querySelector('input[name="event_name"]');
        const memoTextarea = formElement.querySelector('textarea[name="memo"]');
        
        // スケジュール情報を取得
        const dateInputs = formElement.querySelectorAll('input[type="date"]');
        const timeInputs = formElement.querySelectorAll('select[name^="time"]');
        
        const schedules = [];
        const datesLength = dateInputs.length;
        
        for (let i = 0; i < datesLength; i++) {
          schedules.push({
            date: dateInputs[i] ? (dateInputs[i] as HTMLInputElement).value || '' : '',
            time: timeInputs[i] ? (timeInputs[i] as HTMLInputElement).value || '' : ''
          });
        }
        
        const formData = {
          event_name: eventNameInput ? (eventNameInput as HTMLInputElement).value || '' : '',
          memo: memoTextarea ? (memoTextarea as HTMLTextAreaElement).value || '' : '',
          schedules: schedules
        };
        
        localStorage.setItem('temp_form_data', JSON.stringify(formData));
      } else {
        console.warn('フォーム要素が見つかりません');
        
        // フォーム要素が見つからない場合は個別の要素を探す
        const eventNameInput = document.querySelector('input[name="event_name"]');
        const memoTextarea = document.querySelector('textarea[name="memo"]');
        const dateInputs = document.querySelectorAll('input[type="date"]');
        const timeInputs = document.querySelectorAll('select[name^="time"]');
        
        const schedules = [];
        const datesLength = Math.min(dateInputs.length, timeInputs.length);
        
        for (let i = 0; i < datesLength; i++) {
          schedules.push({
            date: dateInputs[i] ? (dateInputs[i] as HTMLInputElement).value || '' : '',
            time: timeInputs[i] ? (timeInputs[i] as HTMLInputElement).value || '' : ''
          });
        }
        
        const formData = {
          event_name: eventNameInput ? (eventNameInput as HTMLInputElement).value || '' : '',
          memo: memoTextarea ? (memoTextarea as HTMLTextAreaElement).value || '' : '',
          schedules: schedules
        };
        
        localStorage.setItem('temp_form_data', JSON.stringify(formData));
      }
    } catch (error) {
      console.error('フォームデータの保存中にエラーが発生しました:', error);
    }
    
    // 遷移を遅延させて、データ保存を確実に行う
    setTimeout(() => {
      window.location.href = '/image-resize?from_form=true';
    }, 100);
  };

  return (
    <div className={styles.cropperWrapper}>
      <div className={styles.cropperControls}>
        {!imgSrc ? (
          <div className={styles.imageUploadArea}>
            <label 
              htmlFor="cropImageUpload" 
              className={`${styles.uploadImageLabel} ${isDragging ? styles.dragActive : ''}`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <FiImage className={styles.uploadImageIcon} />
              <span>{isDragging ? 'ここに画像をドロップ' : '画像を選択またはドラッグ＆ドロップ'}</span>
              <input
                id="cropImageUpload"
                type="file"
                accept="image/*"
                onChange={onSelectFile}
                className={styles.fileInput}
              />
            </label>
            <p className={styles.uploadImageHint}>
              <strong>制限:</strong> 1MB以下の画像をアップロードしてください
            </p>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setImgSrc('');
              setIsCrop(false);
            }}
            className={styles.changeImageBtn}
          >
            <FiUpload /> 別の画像を選択
          </button>
        )}
      </div>

      {/* クロップエリアとクロップ済み画像のレイアウトを整理 */}
      {!!imgSrc && (
        <div className={styles.imageEditContainer}>
          {/* クロップエリア - 常に表示 */}
          <div className={styles.cropContainer} ref={cropContainerRef}>
            <p className={styles.cropInstructions}>画像の表示範囲を調整できます（円形にクロップされます）</p>
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={1}
              minWidth={50}
              minHeight={50}
              circularCrop
              className={styles.reactCrop}
            >
              <img
                ref={imgRef}
                alt="クロップする画像"
                src={imgSrc}
                style={{ transform: `scale(${1}) rotate(${0}deg)` }}
                onLoad={onImageLoad}
                className={styles.cropperImage}
              />
            </ReactCrop>

            {!!completedCrop && (
              <div className={styles.cropActions}>
                {/* プレビューcanvasは非表示にする（必要だが表示しない） */}
                <canvas
                  ref={previewCanvasRef}
                  className={styles.previewCanvas}
                  style={{
                    position: 'absolute',
                    visibility: 'hidden',
                    width: completedCrop.width,
                    height: completedCrop.height,
                  }}
                />
                <button type="button" className={styles.cropBtn} onClick={generateCroppedImage}>
                  <FiCrop /> 切り取る
                </button>
              </div>
            )}
          </div>

          {/* アイコンプレビュー - クロップ完了後に表示 */}
          {isCrop && (
            <div className={styles.previewCropped}>
              <p className={styles.previewTitle}>アイコンプレビュー</p>
              <div className={styles.previewImageContainer}>
                <img
                  alt="切り取り後の画像"
                  className={styles.previewImage}
                  src={blobUrlRef.current}
                />
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* エラーメッセージ表示エリア */}
      {fileError && (
        <div className={styles.errorContainer}>
          <FiAlertCircle className={styles.errorIcon} />
          <div className={styles.errorMessage}>
            {fileError}
            {fileError.includes('1MB') && (
              <div className={styles.resizeToolWrapper}>
                <Link 
                  href="/image-resize?from_form=true" 
                  className={styles.resizeToolLink}
                  onClick={(e) => {
                    e.preventDefault(); // デフォルトのリンク遷移を防止
                    saveFormDataAndNavigate(e); // データを保存
                    // 少し遅延させてデータの保存を確実にしてから遷移
                    setTimeout(() => {
                      window.location.href = "/image-resize?from_form=true";
                    }, 100);
                  }}
                >
                  <FiCrop className={styles.resizeToolIcon} />
                  画像リサイズツールを使用する
                </Link>
                <p className={styles.resizeToolHint}>
                  リサイズツールで画像を小さくしてから再度アップロードしてください！
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}