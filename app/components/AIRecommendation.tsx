'use client';

import { useEffect, useState } from 'react';
import { FiClock, FiCalendar, FiThumbsUp, FiPlus } from 'react-icons/fi';
import styles from './AIRecommendation.module.scss';
import { getUserId } from '@/app/utils/strages';

type RecommendedDate = {
  date: string;
  time: string;
  confidence: number;
};

interface AIRecommendationProps {
  userId?: string;
  onSelectDate: (date: string, time: string) => void;
}

const AIRecommendation: React.FC<AIRecommendationProps> = ({ userId: propsUserId, onSelectDate }) => {
  const [recommendedDates, setRecommendedDates] = useState<RecommendedDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDefault, setIsDefault] = useState(false);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // propsから受け取ったuserIdがあれば優先、なければlocal storageから取得
        const userId = propsUserId || getUserId();
        
        // userIdのあるなしに関わらずAPIを呼び出す
        const response = await fetch(`/api/recommendation${userId ? `?userId=${userId}` : ''}`);
        
        if (!response.ok) {
          throw new Error('推薦の取得に失敗しました');
        }
        
        const data = await response.json();
        setRecommendedDates(data.recommendations || []);
        setIsDefault(data.isDefault || false);
      } catch (err) {
        console.error('推薦取得エラー:', err);
        setError('日程の推薦を取得できませんでした');
      } finally {
        setLoading(false);
      }
    };
    
    fetchRecommendations();
  }, [propsUserId]);

  // 信頼度をパーセント表示に変換
  const formatConfidence = (confidence: number): string => {
    return `${Math.round(confidence * 100)}%`;
  };
  
  // 日付を「○月○日(曜日)」形式にフォーマット
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    const weekday = weekdays[date.getDay()];
    
    return `${month}月${day}日(${weekday})`;
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>最適な日程を分析中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p>{error}</p>
      </div>
    );
  }

  return (
    !isDefault && (

      <div className={styles.container}>
        
        <div className={styles.header}>
          <h3>AI推薦の日程</h3>
          <p className={styles.subtext}>
            {isDefault 
              ? '一般的に人気の高い日程を提案しています' 
              : 'あなたの過去の予定と参加状況から導き出した最適な日程です'}
          </p>
        </div>
        
        <div className={styles.recommendationsContainer}>
          {recommendedDates.length > 0 ? (
            recommendedDates.map((recommendation, index) => (
              <div 
                key={`${recommendation.date}-${recommendation.time}-${index}`}
                className={styles.recommendationCard}
                onClick={() => onSelectDate(recommendation.date, recommendation.time)}
              >
                <div className={styles.recommendationInfo}>
                  <div className={styles.dateInfo}>
                    <FiCalendar className={styles.icon} />
                    <span>{formatDate(recommendation.date)}</span>
                  </div>
                  <div className={styles.timeInfo}>
                    <FiClock className={styles.icon} />
                    <span>{recommendation.time}</span>
                  </div>
                </div>
                
                <div className={styles.confidenceContainer}>
                  <div className={styles.confidenceWrapper}>
                    <div 
                      className={styles.confidenceBar} 
                      style={{ width: `${Math.round(recommendation.confidence * 100)}%` }}
                    ></div>
                  </div>
                  <div className={styles.confidenceValue}>
                    <FiThumbsUp className={styles.thumbsIcon} />
                    <span>推薦度: {formatConfidence(recommendation.confidence)}</span>
                  </div>
                </div>
                
                <button 
                  className={styles.addButton}
                  onClick={(e) => {
                    e.stopPropagation(); // 親要素のクリックイベントが発火するのを防止
                    onSelectDate(recommendation.date, recommendation.time);
                    
                    // 日程入力セクションまでスクロール
                    setTimeout(() => {
                      // まず特定のIDを持つセクションを探す
                      const scheduleSection = document.getElementById('schedule-section');
                      
                      if (scheduleSection) {
                        // セクションが見つかった場合、その位置までスクロール
                        scheduleSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      } else {
                        // セクションが見つからない場合、ページ上部にスクロール
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }, 100); // 少し遅延させてDOMの更新を待つ
                  }}
                >
                  <FiPlus className={styles.addIcon} />
                  追加する
                </button>
              </div>
            ))
          ) : (
            <div className={styles.noRecommendations}>
              <p>推薦可能な日程がありません</p>
            </div>
          )}
        </div>
      </div>
    )
    );
};

export default AIRecommendation; 