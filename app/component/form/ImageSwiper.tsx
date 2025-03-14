import React, { useState, useEffect } from 'react';
import { FiX, FiTrash2 } from 'react-icons/fi';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, A11y, EffectFade, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/a11y';
import 'swiper/css/effect-fade';
import styles from './index.module.scss';

// 画像型の定義
type ImageType = {
  url: string;
  id?: string;
};

// Cloudflareの画像URLを適切に処理する関数
const normalizeImageUrl = (img: string | null | undefined | { imagePath?: string; id?: string; url?: string; }): ImageType => {
  // nullまたはundefinedの場合、空URLを返す
  if (!img) {
    return { url: '' };
  }

  // オブジェクトの場合
  if (typeof img === 'object') {
    const id = img.id;
    let url = '';
    
    // imagePath プロパティがあればそれを使用
    if ('imagePath' in img && typeof img.imagePath === 'string') {
      url = img.imagePath;
    } else if ('url' in img && typeof img.url === 'string') {
      url = img.url;
    } else {
      console.warn('画像URLがオブジェクト形式で、適切な文字列プロパティが見つかりません:', img);
    }
    
    // CDN URLに変換
    if (url && url.startsWith('/')) {
      url = `${process.env.NEXT_PUBLIC_CLOUDFLARE_DELIVERY_URL}${url}`;
    }
    
    return { url, id };
  }
  
  // 文字列の場合
  let url = img;
  
  // ローカルパスの場合、CDN URLに変換
  if (url.startsWith('/')) {
    url = `${process.env.NEXT_PUBLIC_CLOUDFLARE_DELIVERY_URL}${url}`;
  }
  
  return { url };
};

// 現在の日付をフォーマットする関数
const getFormattedDate = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
};

type Props = {
  images: (string | { imagePath?: string; id?: string; url?: string; })[];
  title?: string;
  onClose: () => void;
  debugId?: string;
  onDelete?: (imageId: string) => void;
  // 音声設定オプション
  audio?: {
    enabled?: boolean;        // 音声を有効にするかどうか（デフォルト: true）
    src?: string;             // カスタム音声ファイルのパス
    volume?: number;          // 音量（0.0-1.0）
    playOnOpen?: boolean;     // 開いた時に再生するか（デフォルト: true）
  };
};

export default function ImageSwiper({ 
  images = [], 
  title = '登録した画像', 
  onClose, 
  debugId, 
  onDelete
}: Props) {
  const [normalizedImages, setNormalizedImages] = useState<ImageType[]>([]);
  
  useEffect(() => {
    if (!images || images.length === 0) {
      setNormalizedImages([]);
      return;
    }
    
    // デバッグ情報を出力
    if (debugId) {
      console.debug(`[ImageSwiper:${debugId}] 画像数: ${images.length}`);
    }
    
    // 画像URLを正規化
    const processed = images
      .filter(img => img) // null/undefinedをフィルタリング
      .map(img => normalizeImageUrl(img));
    
    setNormalizedImages(processed);
    
  }, [images, debugId]);
    
  const swiperParams = {
    modules: [Navigation, Pagination, A11y, EffectFade, Autoplay],
    spaceBetween: 50,
    slidesPerView: 1,
    navigation: true,
    pagination: { 
      clickable: true,
      dynamicBullets: true 
    },
    loop: normalizedImages.length > 1,
    fadeEffect: {
      crossFade: true
    },
    effect: 'fade' as const,
    speed: 2200,
    autoplay: {
      delay: 4000,
      disableOnInteraction: false,
      pauseOnMouseEnter: true
    }
  };
  
  const currentDate = getFormattedDate();
  
  // 画像がない場合の表示
  if (!images || images.length === 0) {
    return (
      <div className={styles.albumContainer}>
        <div className={styles.albumHeader}>
          <h2 className={styles.albumTitle}>{title}</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <FiX />
          </button>
        </div>
        
        <div className={styles.albumSwiper}>
          <div className={styles.filmTextTop}>FILM: ShukkeTU-400 | EXP: {currentDate}</div>
          <div className={`${styles.filmHoles} ${styles.top}`}>
            {[...Array(8)].map((_, i) => (
              <div key={`top-hole-${i}`} className={styles.hole}></div>
            ))}
          </div>
          
          <div className={styles.filmLightStrips}></div>
          
          <div className={styles.noImages}>
            <p>画像がありません</p>
            <p className={styles.noImagesSubtext}>画像がアップロードされていないか、削除されています。</p>
          </div>
          
          <div className={styles.filmTextBottom}>PROCESSED BY SHUKKETSU CHAN</div>
          
          <div className={`${styles.filmHoles} ${styles.bottom}`}>
            {[...Array(8)].map((_, i) => (
              <div key={`bottom-hole-${i}`} className={styles.hole}></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 画像がある場合のSwiperを表示
  return (
    <div className={styles.albumContainer}>
      <div className={styles.albumHeader}>
        <h2 className={styles.albumTitle}>{title}</h2>
        <button className={styles.closeButton} onClick={onClose}>
          <FiX />
        </button>
      </div>
      
      <Swiper {...swiperParams} className={styles.albumSwiper}>
        <div className={styles.filmTextTop}>FILM: ShukkeTU-400 | EXP: {currentDate}</div>
        <div className={`${styles.filmHoles} ${styles.top}`}>
          {[...Array(8)].map((_, i) => (
            <div key={`top-hole-${i}`} className={styles.hole}></div>
          ))}
        </div>
        
        <div className={styles.filmLightStrips}></div>
        
        {normalizedImages.map((image, index) => (
          <SwiperSlide key={index} className={styles.albumSlide}>
            <div className={styles.filmStrip}>
              <div className={styles.filmPerforationLeft}>
                {[...Array(6)].map((_, i) => (
                  <div className={styles.perforation} key={`left-${i}`} />
                ))}
              </div>
              
              <div className={styles.imageWrapper}>
                <div className={styles.filmInfo}>
                  <span className={styles.filmIso}>ISO 400</span>
                  <span className={styles.frameNumber}>#{index + 1}</span>
                  <span className={styles.filmEvent}>{title}</span>
                </div>
                
                <img 
                  src={image.url} 
                  alt={`${title} - イメージ ${index + 1}`}
                  className={styles.albumImage}
                />
                
                {onDelete && image.id && (
                  <button 
                    className={styles.deleteButton}
                    onClick={() => image.id && onDelete(image.id)}
                    aria-label="画像を削除"
                  >
                    <FiTrash2 />
                  </button>
                )}
              </div>
              
              <div className={styles.filmPerforationRight}>
                {[...Array(6)].map((_, i) => (
                  <div className={styles.perforation} key={`right-${i}`} />
                ))}
              </div>
            </div>
          </SwiperSlide>
        ))}
        
        <div className={styles.filmTextBottom}>PROCESSED BY SHUKKETSU CHAN</div>
        
        <div className={`${styles.filmHoles} ${styles.bottom}`}>
          {[...Array(8)].map((_, i) => (
            <div key={`bottom-hole-${i}`} className={styles.hole}></div>
          ))}
        </div>
      </Swiper>
    </div>
  );
}