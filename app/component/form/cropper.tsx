import React, { ChangeEvent, useEffect, useState, useRef } from "react";
import "react-image-crop/dist/ReactCrop.css";
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  Crop,
  PixelCrop,
  convertToPixelCrop,
} from 'react-image-crop'
import { useDebounceEffect } from './useDebounceEffect'
import { canvasPreview } from './canvasPreview'
import styles from "./index.module.scss";
import { log } from "console";

// Props の型定義
type onDataChange = {
  onDataChange: (data: string) => void; // 親に通知する関数の型
  isSubmit: boolean;
};

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
) {
  console.log("mediaWidth", mediaWidth);
  console.log("mediaHeight", mediaHeight);
  
  return centerCrop(
    makeAspectCrop(
      {
        unit: 'px',
        x: 0,
        y: 0,
        width: 300,
        height: 300,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  )
}

const CropImg = (props: onDataChange) => {
  const [imgSrc, setImgSrc] = useState('')
  const [isCrop, setIsCrop] = useState<boolean>(false);
  const [scale, setScale] = useState(1)
  const [rotate, setRotate] = useState(0)
  const imgRef = useRef<HTMLImageElement>(null)
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const [aspect, setAspect] = useState<number | undefined>(16 / 9)
  const previewCanvasRef = useRef<HTMLCanvasElement>(null)

  //Crop
  const [crop, setCrop] = useState<Crop>()

  function onSelectFile(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      setCrop(undefined) // Makes crop preview update between images.
      const reader = new FileReader()
      reader.addEventListener('load', () =>
        setImgSrc(reader.result?.toString() || ''),
      )
      reader.readAsDataURL(e.target.files[0])
    }
  }

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    if (aspect) {
      const { width, height } = e.currentTarget
      console.log("width", width);
      console.log("height", height);
      
      setCrop(centerAspectCrop(width, height, aspect))
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
          scale,
          rotate,
        )
      }
    },
    100,
    [completedCrop, scale, rotate],
  )

  //切り取った画像のObjectUrlを作成し、ステイトに保存する
  const makeProfileImgObjectUrl = async () => {
    console.log("completedCrop?.width", completedCrop?.width);
    console.log("completedCrop?.height", completedCrop?.height);
    console.log("imgRef.current ", imgRef.current );
    console.log("previewCanvasRef.current", previewCanvasRef.current);
    
    if (
      completedCrop?.width &&
      completedCrop?.height &&
      imgRef.current &&
      previewCanvasRef.current
    ) {
      // Canvasに画像を描画
      canvasPreview(
        imgRef.current,
        previewCanvasRef.current,
        completedCrop,
        scale,
        rotate,
      );
      // Base64データに変換
      const canvas = previewCanvasRef.current;
      const base64Data = canvas.toDataURL("image/png");

      // 親コンポーネントにデータを渡す
      props.onDataChange(base64Data);
      // 表示フラグを切り替え
      setIsCrop(true);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-2">
        アイコン登録<span className={styles.tagNoRequire}>任意</span>
      </label>
      <input
        type="file"
        accept="image/*"
        onChange={onSelectFile}
      />

      <div className={styles.cropArea}>
        {!!imgSrc && (
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            onComplete={(c) => {console.log("c>>>>>>>>>>>>>",c);
             setCompletedCrop(c)}}
            aspect={2}
            minWidth={200}
            minHeight={200}
            circularCrop={true}
            keepSelection={true}
          >
            <img
              ref={imgRef}
              alt="Crop me"
              src={imgSrc}
              style={{ transform: `scale(${scale}) rotate(${rotate}deg)` }}
              onLoad={onImageLoad}
            />
          </ReactCrop>
        )}
      </div>
      {(!!completedCrop) && (

        <canvas
          ref={previewCanvasRef}
          style={{
            display: isCrop ? "block" : "none",
            border: '1px solid black',
            borderRadius: '99999px',
            objectFit: 'contain',
            width: completedCrop.width,
            height: completedCrop.height,
          }}
        />
      )}
      {(!!completedCrop && !props.isSubmit && !isCrop) && (
        <span className={`${styles.cropBtn}`} onClick={() => { makeProfileImgObjectUrl(); }}>切り取り</span>
      )}

    </div>
  );
};

export default CropImg;
