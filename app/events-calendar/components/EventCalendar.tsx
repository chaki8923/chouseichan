'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FiChevronLeft, FiChevronRight, FiCalendar, FiSearch, FiX, FiClock, FiUsers } from 'react-icons/fi';
import Link from 'next/link';
import styles from '../index.module.scss';
import { getEventList } from '@/app/utils/strages';
import { FaCalendarAlt, FaChevronLeft, FaChevronRight, FaSearch } from 'react-icons/fa';

// 型定義
type EventSchedule = {
  id: number;
  date: string;
  time: string;
  isConfirmed: boolean;
  attendCount: number;
  totalResponses: number;
};

type EventOrganizer = {
  id: string;
  name: string;
  image: string | null;
};

type Event = {
  id: string;
  name: string;
  image: string | null;
  memo: string | null;
  createdAt: string;
  updatedAt: string;
  organizer: EventOrganizer | null;
  schedules: EventSchedule[];
};

const EventCalendar: React.FC = () => {
  // 状態管理
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [dateClicked, setDateClicked] = useState<Date | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [visitedEventIds, setVisitedEventIds] = useState<string[]>([]);
  
  // スクロール状態の管理を追加
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [showSwipeAnimation, setShowSwipeAnimation] = useState(false);
  
  // グリッドコンテナへの参照
  const gridContainerRef = useRef<HTMLDivElement>(null);
  
  // 曜日の表示名
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  
  // イベントIDに基づいて色を決定する関数
  const getEventColor = (eventId: string) => {
    // プリセットカラーのリスト
    const colors = [
      '#de3163', // メインカラー
      '#3498db', // ブルー
      '#9b59b6', // パープル
      '#2ecc71', // グリーン
      '#f39c12', // オレンジ
      '#1abc9c', // ターコイズ
      '#e74c3c', // レッド
      '#34495e'  // ダークブルー
    ];
    
    // イベントIDをハッシュ値に変換して、色のインデックスを決定
    let hashCode = 0;
    for (let i = 0; i < eventId.length; i++) {
      hashCode = (hashCode + eventId.charCodeAt(i)) % colors.length;
    }
    
    return colors[hashCode];
  };
  
  // 訪問済みイベントIDの取得
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const eventHistory = getEventList();
      const eventIds = eventHistory.map(event => event.eventId);
      setVisitedEventIds(eventIds);
    }
  }, []); // 初回のみ実行
  
  // イベントデータの取得
  useEffect(() => {
    // 訪問済みイベントがない場合は何も表示しない
    if (visitedEventIds.length === 0 && typeof window !== 'undefined') {
      setLoading(false);
      return;
    }
    
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1; // JavaScriptの月は0から始まるので+1
        
        // 訪問済みイベントIDをクエリパラメータとして含める
        const eventIdsParam = visitedEventIds.length > 0 
          ? `&eventIds=${encodeURIComponent(JSON.stringify(visitedEventIds))}`
          : '';
        
        const response = await fetch(`/api/public-events?year=${year}&month=${month}&query=${searchQuery}${eventIdsParam}`);
        
        if (!response.ok) {
          throw new Error('イベントの取得に失敗しました');
        }
        
        const data = await response.json();
        setEvents(data.events);
        setError(null);
      } catch (err) {
        console.error('イベントの取得中にエラーが発生しました:', err);
        setError('イベントの取得中にエラーが発生しました。後でもう一度お試しください。');
      } finally {
        setLoading(false);
      }
    };
    
    // 訪問済みイベントIDがロードされた後にのみイベントを取得
    if (visitedEventIds.length > 0) {
      fetchEvents();
    }
  }, [currentDate, searchQuery, visitedEventIds]); // visitedEventIdsの変更時にのみ再取得
  
  // 画面サイズに応じた表示件数を取得する関数
  const getMaxEventsToShow = () => {
    if (typeof window === 'undefined') {
      return 3; // サーバーサイドレンダリング時のデフォルト値
    }
    return window.innerWidth <= 480 ? 2 : 3;
  };
  
  // カレンダーグリッドの生成
  const generateCalendarGrid = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // 月の最初の日と最後の日
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    
    // 月の最初の日の曜日（0:日曜日 - 6:土曜日）
    const firstDayOfWeek = firstDayOfMonth.getDay();
    
    // 前月の日数を取得して、カレンダーグリッドの前に表示する日数
    const daysFromPrevMonth = firstDayOfWeek;
    
    // 前月の最後の日
    const lastDayOfPrevMonth = new Date(year, month, 0).getDate();
    
    // カレンダーグリッドの日を格納する配列
    const calendarGrid = [];
    
    // 前月の日を追加
    for (let i = daysFromPrevMonth - 1; i >= 0; i--) {
      const day = lastDayOfPrevMonth - i;
      const date = new Date(year, month - 1, day);
      calendarGrid.push({
        date,
        day,
        isCurrentMonth: false,
        isToday: false,
        events: getEventsForDate(date),
      });
    }
    
    // 現在の月の日を追加
    for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
      const date = new Date(year, month, day);
      const today = new Date();
      const isToday = date.getDate() === today.getDate() &&
                     date.getMonth() === today.getMonth() &&
                     date.getFullYear() === today.getFullYear();
      
      calendarGrid.push({
        date,
        day,
        isCurrentMonth: true,
        isToday,
        events: getEventsForDate(date),
      });
    }
    
    // 次月の日を追加（6週間のグリッドを満たすため）
    const totalDaysInGrid = 42; // 6行 x 7列
    const daysFromNextMonth = totalDaysInGrid - calendarGrid.length;
    
    for (let day = 1; day <= daysFromNextMonth; day++) {
      const date = new Date(year, month + 1, day);
      calendarGrid.push({
        date,
        day,
        isCurrentMonth: false,
        isToday: false,
        events: getEventsForDate(date),
      });
    }
    
    return calendarGrid;
  };
  
  // 特定の日に関連するイベントを取得
  const getEventsForDate = (date: Date) => {
    const eventsForDate = events.filter(event => {
      return event.schedules.some(schedule => {
        const scheduleDate = new Date(schedule.date);
        return scheduleDate.getFullYear() === date.getFullYear() &&
               scheduleDate.getMonth() === date.getMonth() &&
               scheduleDate.getDate() === date.getDate();
      });
    });
    
    return eventsForDate;
  };
  
  // 前月へ移動
  const goToPrevMonth = () => {
    setCurrentDate(prevDate => new Date(prevDate.getFullYear(), prevDate.getMonth() - 1, 1));
  };
  
  // 次月へ移動
  const goToNextMonth = () => {
    setCurrentDate(prevDate => new Date(prevDate.getFullYear(), prevDate.getMonth() + 1, 1));
  };
  
  // 今日へ移動
  const goToToday = () => {
    setCurrentDate(new Date());
  };
  
  // 検索を実行
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // 検索クエリは既にstateに保存されているので、
    // useEffectがトリガーされて検索が実行される
  };
  
  // イベントをクリックしたときの処理
  const handleEventClick = (event: Event, date?: Date) => {
    setSelectedEvent(event);
    
    // 日付が明示的に指定されている場合はその日付を使用
    // そうでない場合は、イベントの最初のスケジュールの日付を使用
    if (date) {
      setDateClicked(date);
    } else if (event.schedules && event.schedules.length > 0) {
      setDateClicked(new Date(event.schedules[0].date));
    }
    
    setModalOpen(true);
  };
  
  // 特定の日付のすべてのイベントを表示
  const handleDateClick = (date: Date) => {
    // その日付のイベントを取得
    const eventsForDate = getEventsForDate(date);
    
    // イベントがある場合、最初のイベントを表示
    if (eventsForDate.length > 0) {
      setSelectedEvent(eventsForDate[0]);
      setDateClicked(date);
      setModalOpen(true);
    }
  };
  
  // モーダルを閉じる
  const closeModal = () => {
    setModalOpen(false);
    setSelectedEvent(null);
    setDateClicked(null);
  };
  
  // スクロール可能かどうかを検出する関数
  const checkScrollability = useCallback(() => {
    const container = gridContainerRef.current;
    if (!container) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = container;
    
    // 左右にスクロール可能かどうかを判定
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10); // 少し余裕を持たせる
  }, []);
  
  // スクロールイベントのリスナー
  useEffect(() => {
    const container = gridContainerRef.current;
    if (!container) return;
    
    // 初期チェック
    checkScrollability();
    
    // スクロールイベントでチェック
    const handleScroll = () => {
      checkScrollability();
    };
    
    container.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', checkScrollability);
    
    return () => {
      container.removeEventListener('scroll', handleScroll);
      window.addEventListener('resize', checkScrollability);
    };
  }, [checkScrollability]);
  
  // 初回表示時にスワイプアニメーションを表示
  useEffect(() => {
    if (!loading && events.length > 0) {
      // モバイルデバイスでのみアニメーションを表示
      if (window.innerWidth <= 768) {
        const container = gridContainerRef.current;
        if (container) {
          // カレンダーを少しだけ右にスクロールして、スクロール可能であることを示す
          setTimeout(() => {
            container.scrollLeft = 10;
            checkScrollability();
          }, 500);
        }
        
        setShowSwipeAnimation(true);
        
        // 3秒後にアニメーションを非表示
        const timeout = setTimeout(() => {
          setShowSwipeAnimation(false);
        }, 3000);
        
        return () => clearTimeout(timeout);
      }
    }
  }, [loading, events, checkScrollability]);
  
  // カレンダーグリッドを取得
  const calendarGrid = generateCalendarGrid();
  
  // 現在の年月を表示用にフォーマット
  const formattedMonth = currentDate.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
  });
  
  return (
    <div>
      {/* カレンダーヘッダー */}
      <div className={styles.calendarHeader}>
        <div className={styles.monthDisplay}>
          <FaCalendarAlt style={{ marginRight: '8px' }} />
          {formattedMonth}
        </div>
        <div className={styles.navButtons}>
          <button className={styles.navButton} onClick={goToPrevMonth} aria-label="前月">
            <FaChevronLeft className={styles.navButtonIcon} />
          </button>
          <button className={styles.todayButton} onClick={goToToday}>
            今月
          </button>
          <button className={styles.navButton} onClick={goToNextMonth} aria-label="翌月">
            <FaChevronRight className={styles.navButtonIcon} />
          </button>
        </div>
      </div>
      
      {/* 検索バー */}
      <div className={styles.searchContainer}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="イベントを検索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
        />
      </div>
        
      {/* ローディング状態 */}
      {loading ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyStateIcon}>
            <FaCalendarAlt />
          </div>
          <p>イベントを読み込み中...</p>
        </div>
      ) : error ? (
        <div className={styles.emptyState}>
          <p>{error}</p>
        </div>
      ) : events.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyStateIcon}>
            <FaCalendarAlt />
          </div>
          <p className={styles.emptyStateText}>表示できるイベントがありません</p>
          <p>このカレンダーには訪問済みのイベントのみ表示されます。</p>
          <p>新しいイベントを見るには、まずイベントページを訪問してください。</p>
        </div>
      ) : (
        /* カレンダーグリッド - イベントがある場合のみ表示し、スクロール可能なコンテナで囲む */
        <>
          {/* スマホ表示時のみスクロールヒントを表示 */}
          <div className={styles.scrollHint}>
            ← 左右にスワイプしてカレンダーをスクロール →
          </div>
          
          <div 
            ref={gridContainerRef}
            className={`${styles.calendarGridContainer} ${canScrollLeft ? styles['scrollable-left'] : ''} ${canScrollRight ? styles['scrollable-right'] : ''}`}
          >
            {/* スワイプアニメーションの表示 */}
            {showSwipeAnimation && (
              <div className={styles.swipeAnimation}>
                <FiChevronRight />
              </div>
            )}
            
            {/* 左右のスクロールインジケーター */}
            {canScrollLeft && (
              <div className={`${styles.scrollIndicator} ${styles.left}`}>
                <FiChevronLeft />
              </div>
            )}
            
            {canScrollRight && (
              <div className={`${styles.scrollIndicator} ${styles.right}`}>
                <FiChevronRight />
              </div>
            )}
            
            <div className={styles.calendarGrid}>
              {/* 曜日ヘッダー */}
              {weekdays.map((day, index) => (
                <div key={index} className={styles.weekdayHeader}>
                  {day}
                </div>
              ))}
              
              {/* カレンダー日グリッド */}
              {calendarGrid.map((day, index) => (
                <div
                  key={index}
                  className={`${styles.calendarDay} ${day.isToday ? styles.today : ''} ${!day.isCurrentMonth ? styles.otherMonth : ''}`}
                  onClick={() => handleDateClick(day.date)}
                >
                  <div className={styles.dayNumber}>{day.day}</div>
                  <div className={styles.dayEvents}>
                    {(() => {
                      const eventsForDate = getEventsForDate(day.date);
                      const maxEventsToShow = getMaxEventsToShow();
                      
                      return (
                        <>
                          {eventsForDate.slice(0, maxEventsToShow).map(event => {
                            // イベントに確定したスケジュールがあるかをチェック
                            const hasConfirmedSchedule = event.schedules.some(schedule => 
                              schedule.isConfirmed && 
                              new Date(schedule.date).toDateString() === day.date.toDateString()
                            );
                            
                            return (
                              <div 
                                key={event.id} 
                                className={`${styles.eventItem} ${hasConfirmedSchedule ? styles.confirmedEvent : ''}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEventClick(event, day.date);
                                }}
                                title={hasConfirmedSchedule ? '開催確定イベント' : ''}
                              >
                                <div 
                                  className={styles.eventColor} 
                                  style={{ backgroundColor: getEventColor(event.id) }}
                                ></div>
                                <span className={styles.eventName}>{event.name}</span>
                                {hasConfirmedSchedule && (
                                  <span className={styles.confirmedBadge} title="開催確定">✓</span>
                                )}
                              </div>
                            );
                          })}
                          
                          {/* イベント数が表示制限を超える場合、残りの件数を表示 */}
                          {eventsForDate.length > maxEventsToShow && (
                            <div className={styles.moreEventsIndicator} onClick={(e) => {
                              e.stopPropagation();
                              handleDateClick(day.date);
                            }}>
                              +{eventsForDate.length - maxEventsToShow}件
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
        
      {/* イベント詳細モーダル */}
      {modalOpen && selectedEvent && (
        <div className={styles.eventModal} onClick={closeModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>{selectedEvent.name}</h3>
              <button className={styles.closeButton} onClick={closeModal}>×</button>
            </div>
            
            <div className={styles.eventDetails}>
              {selectedEvent.schedules && selectedEvent.schedules.length > 0 && (
                <div className={styles.eventDate}>
                  <FiCalendar />
                  <span>
                    {new Date(selectedEvent.schedules[0].date).toLocaleDateString('ja-JP', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                    {selectedEvent.schedules[0].time && ` ${selectedEvent.schedules[0].time}`}
                  </span>
                </div>
              )}
              
              {selectedEvent.organizer && (
                <div className={styles.eventDate}>
                  <FiUsers />
                  <span>主催: {selectedEvent.organizer.name}</span>
                </div>
              )}
              
              {selectedEvent.memo && (
                <div className={styles.eventDescription}>
                  {selectedEvent.memo}
                </div>
              )}
            </div>
            
            {/* 同じ日付の他のイベント */}
            {dateClicked && (
              <div className={styles.relatedEvents}>
                <h4 className={styles.relatedEventsTitle}>同じ日のイベント</h4>
                <div className={styles.relatedEventsList}>
                  {getEventsForDate(dateClicked)
                    .filter(event => event.id !== (selectedEvent?.id || '')) // 現在表示中のイベントを除外
                    .map(event => {
                      // イベントに確定したスケジュールがあるかをチェック
                      const hasConfirmedSchedule = event.schedules.some(schedule => 
                        schedule.isConfirmed && 
                        new Date(schedule.date).toDateString() === dateClicked.toDateString()
                      );
                      
                      return (
                        <div 
                          key={event.id} 
                          className={`${styles.relatedEventItem} ${hasConfirmedSchedule ? styles.confirmedEvent : ''}`}
                          onClick={() => {
                            setSelectedEvent(event);
                            // 日付はそのまま維持
                          }}
                        >
                          <div 
                            className={styles.eventColor} 
                            style={{ backgroundColor: getEventColor(event.id) }}
                          ></div>
                          <span>{event.name}</span>
                          {hasConfirmedSchedule && (
                            <span className={styles.miniConfirmedBadge} title="開催確定">✓</span>
                          )}
                        </div>
                      );
                    })
                  }
                  {getEventsForDate(dateClicked).length <= 1 && (
                    <div className={styles.noRelatedEvents}>
                      他のイベントはありません
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <Link 
              href={`/event?eventId=${selectedEvent.id}`} 
              className={styles.joinButton}
            >
              イベントの詳細を見る
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventCalendar; 