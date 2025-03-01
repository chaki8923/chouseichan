import React, { ChangeEvent, useEffect, useState } from "react";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Crop } from "react-image-crop";
import styles from "./index.module.scss";

// Props の型定義
type onDataChange = {
  onDataChange: (data: string) => void; // 親に通知する関数の型
  isSubmit: boolean;
};
const CropImg = (props: onDataChange) => {
  const [fileData, setFileData] = useState<File | undefined>();
  const [objectUrl, setObjectUrl] = useState<string | undefined>();
  const [isCrop, setIsCrop] = useState<boolean>(false);

  //プロフィールイメージ
  const [profileImg, setProfileImg] = useState<string>("");

  //Crop
  const [crop, setCrop] = useState<Crop>({
    unit: "px", // 'px' または '%' にすることができます
    x: 0,
    y: 0,
    width: 200,
    height: 200,
  });

  //アップロードした画像のObjectUrlをステイトに保存する
  useEffect(() => {
    if (fileData instanceof File) {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
      setObjectUrl(URL.createObjectURL(fileData));
    } else {
      setObjectUrl(undefined);
    }
  }, [fileData]);

  //切り取った画像のObjectUrlを作成し、ステイトに保存する
  const makeProfileImgObjectUrl = async () => {
    if (objectUrl) {
      const canvas = document.createElement("canvas");
      canvas.width = crop.width;
      canvas.height = crop.height;
      const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
      ctx.beginPath();
      
      ctx.clip();

      const img = await loadImage(objectUrl);
      const scaleX = img.naturalWidth / img.width;
      const scaleY = img.naturalHeight / img.height;
      const pixelRatio = window.devicePixelRatio;
      canvas.width = (crop?.width ?? 0) * scaleX * pixelRatio;
      canvas.height = (crop?.height ?? 0) * scaleY * pixelRatio;
      ctx.drawImage(
        img,
        (crop?.x ?? 0) * scaleX,
        (crop?.y ?? 0) * scaleY,
        (crop?.width ?? 0) * scaleX,
        (crop?.height ?? 0) * scaleY,
        0,
        0,
        (crop?.width ?? 0) * scaleX,
        (crop?.height ?? 0) * scaleY
      );

      canvas.toBlob((result) => {
        if (result instanceof Blob) {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64Data = reader.result as string;
            setProfileImg(base64Data); // Base64 データを状態に保存
            props.onDataChange(base64Data); // 親コンポーネントに渡す
          };
          reader.readAsDataURL(result);
        }
      });

    }
  };

  // canvasで画像を扱うため
  // アップロードした画像のObjectUrlをもとに、imgのHTMLElementを作る
  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = src;
      img.onload = () => resolve(img);
    });
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-2">
        アイコン登録<span className={styles.tagNoRequire}>任意</span>
      </label>
      <input
        type="file"
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            setFileData(file); // File を確実にセット
            setIsCrop(false)
          }
        }}
      />
      
      <div className={styles.cropArea}>
        {(objectUrl && !props.isSubmit && !isCrop) && (
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            aspect={1}
            // circularCrop={true}
            keepSelection={true}
          >
            <img src={objectUrl} alt="" style={{ width: "100%" }} />
          </ReactCrop>
        )}
      </div>
      {(objectUrl && !props.isSubmit && !isCrop) && (
        <span className={`${styles.cropBtn}`} onClick={() => { makeProfileImgObjectUrl(); }}>切り取り</span>
      )}
      <div>
        {profileImg && !props.isSubmit ? (
          <img className={styles.croppedImage} src={profileImg} alt="プロフィール画像" />
        ) : null}
      </div>
    </div>
  );
};

export default CropImg;
