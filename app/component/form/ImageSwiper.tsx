import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, A11y, EffectFade, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';
import styles from './index.module.scss';

// Cloudflareの画像URLを適切に処理する関数
const normalizeImageUrl = (url: string | null | undefined | object) => {
  // nullまたはundefinedの場合、空文字を返す
  if (!url) {
    return '';
  }

  // オブジェクトの場合、適切なプロパティを抽出
  if (typeof url === 'object') {
    // imagePath プロパティがあればそれを使用
    if ('imagePath' in url && typeof url.imagePath === 'string') {
      return url.imagePath;
    }
    // id プロパティがあれば文字列に変換して返す（このケースは避けるべき）
    console.warn('画像URLがオブジェクト形式で、適切な文字列プロパティが見つかりません:', url);
    return '';
  }
  
  // 既にCDN URLの場合はそのまま返す
  if (typeof url === 'string' && url.includes('imagedelivery.net')) {
    return url;
  }
  
  // ローカルパスの場合、CDN URLに変換
  if (typeof url === 'string' && url.startsWith('/')) {
    return `${process.env.NEXT_PUBLIC_CLOUDFLARE_DELIVERY_URL}${url}`;
  }
  
  return url;
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
  images: (string | { imagePath?: string; id?: string; url?: string })[];
  title?: string;
  onClose: () => void;
  debugId?: string;
};

export default function ImageSwiper({ images = [], title = '登録した画像', onClose, debugId }: Props) {
  const [normalizedImages, setNormalizedImages] = useState<string[]>([]);
  
  useEffect(() => {
    // デバッグログを出力
    if (debugId) {
      console.log(`ImageSwiper(${debugId}) - 受け取った画像:`, images);
    }
    
    // 画像URLを正規化
    const processed = images
      .filter(img => img) // null/undefinedをフィルタリング
      .map(img => normalizeImageUrl(img));
    
    setNormalizedImages(processed);
    
    if (debugId) {
      console.log(`ImageSwiper(${debugId}) - 処理後の画像:`, processed);
    }
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
    autoplay: {
      delay: 2500,
      disableOnInteraction: false,
      pauseOnMouseEnter: true
    }
  };
  
  const currentDate = getFormattedDate();
  
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
            {[...Array(12)].map((_, i) => (
              <div className={styles.hole} key={`top-${i}`} />
            ))}
          </div>
          
          <div className={styles.filmLightStrips}></div>
          
          <div className={styles.noImages}>
            <p>登録された画像がありません</p>
            <p className={styles.noImagesSubtext}>イベント登録時に画像をアップロードしてください</p>
          </div>
          
          <div className={`${styles.filmHoles} ${styles.bottom}`}>
            {[...Array(12)].map((_, i) => (
              <div className={styles.hole} key={`bottom-${i}`} />
            ))}
          </div>
          <div className={styles.filmTextBottom}>PRODUCTION: ShukkeTU CAMERA CO., LTD.</div>
        </div>
        
        <div className={styles.filmProductionInfo}>
          <span>ISO 400</span>
          <span>COLOR NEGATIVE 36 EXP.</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className={styles.albumContainer}>
      <div className={styles.albumHeader}>
        <h2 className={styles.albumTitle}>{title}</h2>
        <button className={styles.closeButton} onClick={onClose}>
          <FiX />
        </button>
      </div>
      
      <Swiper
        {...swiperParams}
        className={styles.albumSwiper}
        modules={swiperParams.modules}
        navigation={{
          nextEl: `.${styles.swiperButtonNext}`,
          prevEl: `.${styles.swiperButtonPrev}`
        }}
        pagination={{
          clickable: true,
          dynamicBullets: true,
          bulletClass: styles.swiperPaginationBullet,
          bulletActiveClass: styles.swiperPaginationBulletActive
        }}
        autoplay={swiperParams.autoplay}
      >
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
                  src={image} 
                  alt={`${title} - イメージ ${index + 1}`}
                  className={styles.albumImage}
                />
                
                <div className={styles.caption}>
                  <p>{title} - フレーム {index + 1}</p>
                </div>
              </div>
              
              <div className={styles.filmPerforationRight}>
                {[...Array(6)].map((_, i) => (
                  <div className={styles.perforation} key={`right-${i}`} />
                ))}
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
      
      <div className={`${styles.swiperButtonNext} swiper-button-next`}></div>
      <div className={`${styles.swiperButtonPrev} swiper-button-prev`}></div>
      
      <div className={styles.filmTextTop}>FILM: ShukkeTU-400 | EXP: {currentDate}</div>
      <div className={styles.filmTextBottom}>MADE IN JAPAN | © 出欠管理ちゃん</div>
      
      <div className={`${styles.filmHoles} ${styles.top}`}>
        {[...Array(12)].map((_, i) => (
          <div className={styles.hole} key={`top-${i}`} />
        ))}
      </div>
      
      <div className={`${styles.filmHoles} ${styles.bottom}`}>
        {[...Array(12)].map((_, i) => (
          <div className={styles.hole} key={`bottom-${i}`} />
        ))}
      </div>
      
      <div className={styles.filmLightStrips}></div>
      
      <div className={styles.filmProductionInfo}>
        <span>ShukkeTU FILM</span>
        <span>出欠管理ちゃん</span>
      </div>
    </div>
  );
}