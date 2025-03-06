import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/scrollbar';
import styles from './index.module.scss';

const ImageSwiper: React.FC<{ imageUrls: string[] }> = ({ imageUrls }) => {
  return (
    <Swiper spaceBetween={10} slidesPerView={1} navigation pagination={{ clickable: true }}>
      {imageUrls.map((url, index) => (
        <SwiperSlide key={index}>
          <img src={url} alt={`Uploaded image ${index + 1}`} className={styles.swiperImage} />
        </SwiperSlide>
      ))}
    </Swiper>
  );
};

export default ImageSwiper;