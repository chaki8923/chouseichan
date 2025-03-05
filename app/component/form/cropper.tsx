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
    console.log("切り取り");

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
    // You might want { type: "image/jpeg", quality: <0 to 1> } to
    // Blobを生成
    // const blob = await offscreen.convertToBlob({
    //   type: "image/png",
    // });

    const blob = await new Promise<Blob>((resolve) =>
      previewCanvas.toBlob((b) => resolve(b!), "image/png")
    );

    // BlobをFileに変換（ファイル名を適当につける）
    const file = new File([blob], "cropped-image.png", { type: "image/png" });

    // バリデーションチェック
    if (!file.type.startsWith('image/')) {
      setIsValid(true);
      props.setValidationError('Invalid file format. Please upload an image file.');
      return;
    }

    const maxSize = 1024 * 1024 * 1; // 1MB
    console.log("file.size", file.size);
    console.log("maxSize", maxSize);

    if (file.size > maxSize) {
      console.log("入った");
      setIsValid(true);
      props.setValidationError('File size exceeds the limit of 1MB.');
      return;
    }

    console.log("入った2");
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
    <div className="App">
      <div className="Crop-Controls">
        <input type="file" accept="image/*" onChange={onSelectFile} onClick={() => setIsCrop(false)} />
      </div>
      {(!!imgSrc && !isCrop) && (
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
            alt="Crop me"
            src={imgSrc}
            style={{ transform: `scale(${1}) rotate(${0}deg)` }}
            onLoad={onImageLoad}
          />
        </ReactCrop>
      )}
      {(!!completedCrop) && (
        <>
          <div>
            <canvas
              ref={previewCanvasRef}
              style={{
                border: '1px solid black',
                objectFit: 'contain',
                width: completedCrop.width,
                height: completedCrop.height,
              }}
              className={styles.cropCanvas}
            />
          </div>
          <div>

          </div>
          <span className={`${styles.cropBtn}`} onClick={generateCroppedImage}>切り取り</span>
        </>
      )}
    </div>
  )
}