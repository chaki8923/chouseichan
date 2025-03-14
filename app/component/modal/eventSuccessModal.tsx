import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCalendar, FiStar, FiHeart } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import styles from './eventSuccessModal.module.scss';

interface EventSuccessModalProps {
  eventId: string;
  eventName: string;
  categoryName: string;
  redirectDelay?: number; // リダイレクトまでの時間（秒）
}

const EventSuccessModal: React.FC<EventSuccessModalProps> = ({
  eventId,
  eventName,
  categoryName,
  redirectDelay = 5
}) => {
  const router = useRouter();
  const [countdown, setCountdown] = useState(redirectDelay);
  const [confetti, setConfetti] = useState<{ id: number; x: number; y: number; size: number; color: string; rotation: number }[]>([]);

  // カウントダウン処理
  useEffect(() => {
    if (countdown <= 0) {
      router.push(`/event?eventId=${eventId}`);
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, eventId, router]);

  // キラキラエフェクト生成
  useEffect(() => {
    const newConfetti = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 8 + 2,
      color: [
        '#FFD700', // ゴールド
        '#FF69B4', // ホットピンク
        '#00BFFF', // ディープスカイブルー
        '#7CFC00', // ローングリーン
        '#FF1493', // ディープピンク
        '#9370DB', // ミディアムパープル
      ][Math.floor(Math.random() * 6)],
      rotation: Math.random() * 360
    }));
    setConfetti(newConfetti);
  }, []);

  return (
    <div className={styles.modalOverlay}>
      <motion.div 
        className={styles.modalContent}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      >
        {/* キラキラエフェクト */}
        {confetti.map((particle) => (
          <motion.div
            key={particle.id}
            className={styles.confetti}
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
              x: [particle.x - 10, particle.x, particle.x + 10],
              y: [particle.y - 10, particle.y, particle.y + 10],
              rotate: [0, particle.rotation, 0],
            }}
            transition={{ 
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              repeatType: 'loop',
              ease: 'easeInOut',
              delay: Math.random()
            }}
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              backgroundColor: particle.color,
              borderRadius: Math.random() > 0.5 ? '50%' : '0%',
            }}
          />
        ))}

        {/* ロゴとアイコン */}
        <div className={styles.logoContainer}>
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
          >
            <Image 
              src="/logo.png"
              alt="キュートなロゴ" 
              width={120} 
              height={120}
              className={styles.logoImage}
            />
          </motion.div>
        </div>

        {/* メッセージセクション */}
        <motion.div
          className={styles.messageSection}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <motion.div 
            className={styles.successBadge}
            animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <FiCalendar className={styles.calendarIcon} />
            <span>登録完了！</span>
          </motion.div>
          
          <h2 className={styles.eventTitle}>
            {eventName}
            <motion.span 
              animate={{ rotate: [0, 15, -15, 0] }} 
              transition={{ duration: 1.5, repeat: Infinity, repeatType: 'loop' }}
              className={styles.starIcon}
            >
              <FiStar />
            </motion.span>
          </h2>
          
          <p className={styles.congratsText}>
            新しい{categoryName}の登録が成功しました！
            <motion.span 
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className={styles.heartIcon}
            >
              <FiHeart />
            </motion.span>
            <br />
            みんなに共有して、ワクワクする時間を計画しましょう！
          </p>
        </motion.div>

        {/* カウントダウンセクション */}
        <div className={styles.countdownSection}>
          <p className={styles.countdownText}>
            {countdown}秒後に{categoryName}ページへ移動します...
          </p>
          <div className={styles.countdownBar}>
            <motion.div 
              className={styles.countdownProgress}
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: redirectDelay, ease: "linear" }}
            />
          </div>
        </div>

        {/* ボタンセクション */}
        <div className={styles.buttonSection}>
          <motion.button
            className={styles.redirectButton}
            onClick={() => router.push(`/event?eventId=${eventId}`)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            今すぐ{categoryName}ページへ
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default EventSuccessModal; 