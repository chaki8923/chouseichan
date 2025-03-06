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
import { FiUpload, FiCrop, FiCheck, FiImage } from 'react-icons/fi'

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
  isSubmit: boolean;
  setValidationError: (error: string | null) => void;
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
  const [isValid, setIsValid] = useState<boolean>(false);

  function onSelectFile(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      // setCrop(undefined) // Makes crop preview update between images.
      setIsCrop(false);

      const reader = new FileReader()
      reader.addEventListener('load', () =>
        setImgSrc(reader.result?.toString() || ''),
      )
      reader.readAsDataURL(e.target.files[0])
    }
  }

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget
    setCrop(centerAspectCrop(width, height, 1))
  }

  async function generateCroppedImage() {
    // クロップ前のスクロール位置を保存
    const scrollPosition = window.scrollY;
    
    // クロップコンテナの高さを取得
    const cropContainerHeight = cropContainerRef.current?.offsetHeight || 0;
    
    setIsValid(false);
    const image = imgRef.current
    const previewCanvas = previewCanvasRef.current
    if (!image || !previewCanvas || !completedCrop) {
      throw new Error('Crop canvas does not exist')
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

    // バリデーションチェック
    if (!file.type.startsWith('image/')) {
      setIsValid(true);
      props.setValidationError('画像形式が不正です。画像ファイルをアップロードしてください。');
      return;
    }

    const maxSize = 1024 * 1024 * 1; // 1MB
    if (file.size > maxSize) {
      setIsValid(true);
      props.setValidationError('ファイルサイズが1MBを超えています。');
      return;
    }

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
      const adjustedPosition = Math.max(0, scrollPosition - cropContainerHeight * 0.7);
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

  return (
    <div className={styles.cropperWrapper}>
      <div className={styles.cropperControls}>
        {!imgSrc ? (
          <div className={styles.imageUploadArea}>
            <label htmlFor="cropImageUpload" className={styles.uploadImageLabel}>
              <FiImage className={styles.uploadImageIcon} />
              <span>画像を選択</span>
              <input
                id="cropImageUpload"
                type="file"
                accept="image/*"
                onChange={onSelectFile}
                className={styles.fileInput}
              />
            </label>
            <p className={styles.uploadImageHint}>1MB以下の画像をアップロードしてください</p>
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

      {(!!imgSrc && !isCrop) && (
        <div className={styles.cropContainer} ref={cropContainerRef}>
          <p className={styles.cropInstructions}>画像の表示範囲を調整してください（円形にクロップされます）</p>
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
              <div className={styles.previewContainer}>
                <p className={styles.previewLabel}>プレビュー</p>
                <canvas
                  ref={previewCanvasRef}
                  className={styles.previewCanvas}
                  style={{
                    width: completedCrop.width,
                    height: completedCrop.height,
                  }}
                />
              </div>
              <button
                type="button"
                onClick={generateCroppedImage}
                className={styles.cropButton}
              >
                <FiCrop /> この範囲で切り取る
              </button>
            </div>
          )}
        </div>
      )}

      {(!!imgSrc && isCrop) && (
        <div className={styles.croppedImageContainer}>
          <p className={styles.croppedImageLabel}>切り取り済み</p>
          <div className={styles.croppedImagePreview}>
            <img 
              src={blobUrlRef.current} 
              alt="切り取り後の画像" 
              className={styles.croppedImageResult}
            />
            <span className={styles.croppedImageSuccess}>
              <FiCheck /> 切り取り完了
            </span>
          </div>
        </div>
      )}
    </div>
  )
}