"use client";

import React, { useState, useEffect, useRef } from 'react';
import { FaTrash, FaCalendarAlt, FaClock, FaChevronLeft, FaChevronRight, FaHistory } from 'react-icons/fa';
import styles from './index.module.scss';
import Link from 'next/link';
import { removeEvent, getEventList } from '@/app/utils/strages';
// Swiperのインポート
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import type { Swiper as SwiperType } from 'swiper';

type Event = {
  id: string;
  title: string;
  schedules: { date: string; time: string }[];
};

export const BrowsingHistory = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState('');
  const prevRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadEvents = () => {
      try {
        // getEventList関数を使用してイベント履歴を取得
        const eventData = getEventList();
        
        // イベントデータを変換
        const formattedEvents = eventData.map(event => ({
          id: event.eventId,
          title: event.eventName,
          schedules: event.schedules
        }));
        
        // 最新のイベントが先頭に来るようにソート
        setEvents(formattedEvents);
      } catch (error) {
        console.error('Error loading event history:', error);
        setEvents([]);
      }
    };

    loadEvents();
  }, []);

  const handleDelete = (id: string) => {
    setSelectedEventId(id);
    setIsModalOpen(true);
  };

  const confirmDelete = () => {
    if (selectedEventId) {
      removeEvent(selectedEventId);
      setEvents((prevEvents) => prevEvents.filter((event) => event.id !== selectedEventId));
      setIsModalOpen(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'short'
      });
    } catch (error) {
      return dateStr;
    }
  };

  // Swiperの設定
  const swiperSettings = {
    modules: [Navigation, Pagination, Autoplay],
    spaceBetween: 20,
    slidesPerView: 1,
    navigation: {
      prevEl: prevRef.current,
      nextEl: nextRef.current,
    },
    pagination: {
      clickable: true,
    },
    autoplay: {
      delay: 5000,
      disableOnInteraction: true,
    },
    breakpoints: {
      640: { slidesPerView: 1 },
      768: { slidesPerView: 2 },
      1024: { slidesPerView: 3 },
      1280: { slidesPerView: 4 },
    },
    onBeforeInit: (swiper: SwiperType) => {
      if (swiper && swiper.params) {
        // @ts-ignore
        swiper.params.navigation.prevEl = prevRef.current;
        // @ts-ignore
        swiper.params.navigation.nextEl = nextRef.current;
        swiper.navigation.update();
      }
    },
  };

  return (
    <section className={styles.historySection}>
      <h2 className={styles.historyTitle}>閲覧履歴</h2>
      
      {events.length === 0 ? (
        <div className={styles.emptyState}>
          <FaHistory size={50} />
          <h3>閲覧履歴がありません</h3>
          <p>イベントを閲覧すると、ここに表示されます。</p>
          <Link href="/event" className={styles.emptyStateButton}>
            イベントを作成する
          </Link>
        </div>
      ) : (
        <div className={styles.swiperContainer}>
          <div className={styles.swiperNavPrev} ref={prevRef}>
            <FaChevronLeft />
          </div>
          
          <Swiper
            {...swiperSettings}
            className={styles.eventSwiper}
          >
            {events.map((event) => (
              <SwiperSlide key={event.id} className={styles.eventSlide}>
                <div className={styles.eventCard}>
                  <div className={styles.eventHeader}>
                    <h3 className={styles.eventTitle}>{event.title}</h3>
                    <button
                      className={styles.trashButton}
                      onClick={() => handleDelete(event.id)}
                      aria-label="Delete event"
                    >
                      <FaTrash />
                    </button>
                  </div>
                  
                  <div className={styles.scheduleList}>
                    <div className={styles.scheduleWrapper}>
                      {event.schedules.length === 0 ? (
                        <p className={styles.noSchedules}>スケジュールはありません</p>
                      ) : (
                        <>
                          {event.schedules.slice(0, 3).map((schedule, idx) => (
                            <div key={idx} className={styles.scheduleItem}>
                              <div className={styles.scheduleDate}>
                                <FaCalendarAlt className={styles.scheduleIcon} />
                                {formatDate(schedule.date)}
                              </div>
                              <div className={styles.scheduleTime}>
                                <FaClock className={styles.scheduleIcon} />
                                {schedule.time}
                              </div>
                            </div>
                          ))}
                          {event.schedules.length > 3 && (
                            <p className={styles.moreSchedules}>他 {event.schedules.length - 3} 件のスケジュール</p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  
                  <Link href={`/event/?eventId=${event.id}`} className={styles.viewEventButton}>
                    イベント詳細を見る
                  </Link>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
          
          <div className={styles.swiperNavNext} ref={nextRef}>
            <FaChevronRight />
          </div>
        </div>
      )}
      
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3 className={styles.modalTitle}>イベントの削除</h3>
            <p className={styles.modalText}>
              このイベントを閲覧履歴から削除しますか？
            </p>
            <div className={styles.modalButtons}>
              <button
                className={`${styles.modalButton} ${styles.cancelButton}`}
                onClick={() => setIsModalOpen(false)}
              >
                キャンセル
              </button>
              <button
                className={`${styles.modalButton} ${styles.deleteButton}`}
                onClick={confirmDelete}
              >
                削除する
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default BrowsingHistory;