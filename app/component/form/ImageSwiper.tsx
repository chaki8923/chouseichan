import React, { useState, useEffect, useRef } from 'react';
import { FiX, FiTrash2 } from 'react-icons/fi';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, A11y, EffectFade, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/a11y';
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
  images: { imagePath?: string; id?: string; url?: string; }[];
  title?: string;
  onClose: () => void;
  debugId?: string;
  onDelete?: (index: number) => void;
  // 音声設定オプション
  audio?: {
    enabled?: boolean;        // 音声を有効にするかどうか（デフォルト: true）
    src?: string;             // 音声ファイルのパス（デフォルト: '/audio/oda.m4a'）
    volume?: number;          // 音量（0.0〜1.0、デフォルト: 0.5）
  };
};

export default function ImageSwiper({ 
  images = [], 
  title = '登録した画像', 
  onClose, 
  debugId, 
  onDelete,
  audio = { enabled: true, src: '/audio/oda.m4a', volume: 0.3 }
}: Props) {
  const [normalizedImages, setNormalizedImages] = useState<string[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  useEffect(() => {
    // デバッグログを出力

    // 画像URLを正規化
    const processed = images
      .filter(img => img) // null/undefinedをフィルタリング
      .map(img => normalizeImageUrl(img));
    
    setNormalizedImages(processed);
    
  }, [images, debugId]);
  
  // 音声再生のためのEffect
  useEffect(() => {
    // 音声が無効になっている場合は何もしない
    if (!audio || audio.enabled === false) return;
    
    const audioSrc = audio.src || '/audio/oda.m4a';
    const audioVolume = typeof audio.volume === 'number' ? audio.volume : 0.5;
    
    // audioRefが初期化されていない場合は作成
    if (!audioRef.current) {
      audioRef.current = new Audio(audioSrc);
      audioRef.current.volume = audioVolume; // ボリュームを設定
    } else {
      // 既存のAudio要素に新しい設定を適用
      audioRef.current.src = audioSrc;
      audioRef.current.volume = audioVolume;
    }
    
    // コンポーネントがマウントされたときに音声を再生
    const playAudio = async () => {
      try {
        if (audioRef.current) {
          // 再生が終了している場合は再度再生時間を0に戻す
          audioRef.current.currentTime = 0;
          await audioRef.current.play();
        }
      } catch (error) {
        // ブラウザによっては自動再生ポリシーにより再生がブロックされる場合がある
        console.warn('音声の自動再生がブラウザにより制限されました:', error);
      }
    };
    
    playAudio();
    
    // クリーンアップ関数
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, [audio]); // audioオプションが変更されたときにも再実行
  
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
                  src={image} 
                  alt={`${title} - イメージ ${index + 1}`}
                  className={styles.albumImage}
                />
                
                {onDelete && (
                  <button 
                    className={styles.deleteButton}
                    onClick={() => onDelete(index)}
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