import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/autoplay';
import styles from './index.module.scss';
import { IoClose } from 'react-icons/io5';
import { useMemo } from 'react';

// eventImageオブジェクトのinterface
interface EventImage {
  id: number;
  eventId: string;
  imagePath: string;
}

type ImageSwiperProps = {
  eventImages: EventImage[] | string[] | any[];
  onClose?: () => void;
};

const ImageSwiper: React.FC<ImageSwiperProps> = ({ eventImages, onClose }) => {
  
  // 画像パスを正規化する
  const normalizedImages = useMemo(() => {
    return eventImages.map((image: any) => {
      // すでにEventImage型の場合
      if (typeof image === 'object' && image.imagePath) {
        return image;
      }
      // 文字列の場合（URL直接）
      if (typeof image === 'string') {
        return {
          id: 0,
          eventId: '',
          imagePath: image
        };
      }
      // その他の場合（安全のため）
      return {
        id: 0,
        eventId: '',
        imagePath: ''
      };
    });
  }, [eventImages]);
  
  if (normalizedImages.length === 0) {
    return (
      <div className={styles.albumContainer}>
        <div className={styles.albumHeader}>
          <h2 className={styles.albumTitle}>MEMORY FILM</h2>
          {onClose && (
            <button onClick={onClose} className={styles.closeButton}>
              <IoClose size={24} />
            </button>
          )}
        </div>
        <div className={styles.noImages}>
          <p>まだ写真がありません</p>
        </div>
      </div>
    );
  }
  
  const swiperParams = {
    modules: [Navigation, Pagination, Autoplay],
    spaceBetween: 20,
    slidesPerView: 1,
    centeredSlides: true,
    initialSlide: 0,
    loop: true,
    watchSlidesProgress: true,
    autoplay: {
      delay: 8000,
      disableOnInteraction: false,
    },
    navigation: true,
    pagination: {
      clickable: true,
    },
    className: styles.albumSwiper,
    onSwiper: (swiper: any) => console.log("Swiper initialized", swiper)
  };

  return (
    <div className={styles.albumContainer}>
      <div className={styles.albumHeader}>
        <h2 className={styles.albumTitle}>MEMORY FILM</h2>
        {onClose && (
          <button onClick={onClose} className={styles.closeButton}>
            <IoClose size={24} />
          </button>
        )}
      </div>
      <Swiper {...swiperParams}>
        <div className={styles.filmHoles + " " + styles.top}>
          {[...Array(10)].map((_, i) => (
            <div key={`top-hole-${i}`} className={styles.hole}></div>
          ))}
        </div>
        <div className={styles.filmHoles + " " + styles.bottom}>
          {[...Array(10)].map((_, i) => (
            <div key={`bottom-hole-${i}`} className={styles.hole}></div>
          ))}
        </div>
        <div className={styles.filmTextTop}>KODAK • VISION3 • 500T • 35MM</div>
        <div className={styles.filmTextBottom}>5231-2023</div>
        {normalizedImages.map((image, index) => (
          <SwiperSlide key={index}>
            <div className={styles.albumSlide}>
              <div className={styles.filmStrip}>
                <div className={styles.filmPerforationLeft}>
                  {[...Array(8)].map((_, i) => (
                    <div key={`left-perf-${i}`} className={styles.perforation}></div>
                  ))}
                </div>
                <div className={styles.imageWrapper}>
                  <img 
                    src={image.imagePath} 
                    alt={`写真 ${index + 1}`} 
                    className={styles.albumImage} 
                  />
                  <div className={styles.filmInfo}>
                    <span className={styles.filmIso}>ISO 400</span>
                    <span className={styles.frameNumber}>{String(index + 1).padStart(2, '0')}</span>
                    <span className={styles.filmEvent}>イベント</span>
                  </div>
                  <div className={styles.caption}>
                    <p>写真 {index + 1}</p>
                  </div>
                </div>
                <div className={styles.filmPerforationRight}>
                  {[...Array(8)].map((_, i) => (
                    <div key={`right-perf-${i}`} className={styles.perforation}></div>
                  ))}
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default ImageSwiper;