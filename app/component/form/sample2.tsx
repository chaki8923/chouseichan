import React, { useState, useRef } from "react";
import ReactCrop, { Crop, PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import styles from "./index.module.scss";

// Props の型定義
type onDataChange = {
  onDataChange: (data: string) => void; // 親に通知する関数の型
  isSubmit: boolean;
};

const CropImg = (props: onDataChange) => {
  const [imgSrc, setImgSrc] = useState<string | undefined>();
  const [crop, setCrop] = useState<Crop>({
    unit: "%",
    x: 25,
    y: 25,
    width: 100,
    height: 100,
    // aspect: 1, // 必ず正方形
  });
  const imgRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.onload = () => setImgSrc(reader.result as string);
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const onCropComplete = (crop: PixelCrop) => setCompletedCrop(crop);

  const generateCroppedImage = () => {
    if (!completedCrop || !imgRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const image = imgRef.current;

    // Canvas のサイズを調整
    canvas.width = completedCrop.width;
    canvas.height = completedCrop.height;
    const ctx = canvas.getContext("2d");

    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 円形にクリップ
      ctx.beginPath();
      ctx.arc(
        completedCrop.width / 2,
        completedCrop.height / 2,
        completedCrop.width / 2,
        0,
        2 * Math.PI
      );
      ctx.clip();

      // クロップ画像を描画
      ctx.drawImage(
        image,
        completedCrop.x,
        completedCrop.y,
        completedCrop.width,
        completedCrop.height,
        0,
        0,
        completedCrop.width,
        completedCrop.height
      );

      // Base64で出力
      const croppedDataUrl = canvas.toDataURL("image/png");
      props.onDataChange(croppedDataUrl);
    }
  };

  return (
    <div>
      <input type="file" accept="image/*" onChange={onSelectFile} />
      {imgSrc && (
        <ReactCrop
          crop={crop}
          onChange={(newCrop) => setCrop(newCrop)}
          onComplete={onCropComplete}
          aspect={1}
        >
          <img ref={imgRef} alt="Crop" src={imgSrc} />
        </ReactCrop>
      )}
      <canvas ref={canvasRef} />
      <span className={`${styles.cropBtn}`} onClick={generateCroppedImage}>切り取り</span>
    </div>
  );
};

export default CropImg;
