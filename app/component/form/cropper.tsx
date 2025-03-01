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
  onDataChange: (data: string) => void; // 親に通知する関数の型
  isSubmit: boolean;
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

  function onSelectFile(e: React.ChangeEvent<HTMLInputElement>) {
    console.log("入った");
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
    console.log("width", width);
    console.log("height", height);

    setCrop(centerAspectCrop(width, height, 1))
  }

  async function generateCroppedImage() {
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
    // reduce image size
    const blob = await offscreen.convertToBlob({
      type: 'image/png',
    })

    // Base64で出力
    const croppedDataUrl = previewCanvas.toDataURL("image/png");
    props.onDataChange(croppedDataUrl);
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
      console.log("completedCrop", completedCrop);

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
        <input type="file" accept="image/*" onChange={onSelectFile} onClick={()=>setIsCrop(false)}/>
      </div>
      {(!!imgSrc && !isCrop) && (
        <ReactCrop
          crop={crop}
          onChange={(_, percentCrop) => setCrop(percentCrop)}
          onComplete={(c) => setCompletedCrop(c)}
          aspect={1}
          minWidth={0}
          minHeight={0}
        circularCrop
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