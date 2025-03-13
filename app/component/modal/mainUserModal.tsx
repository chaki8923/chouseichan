import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// react-iconsの代わりにカスタムアイコンコンポーネントを作成
import styles from './mainUserModal.module.scss';

const CrownIcon = () => (
  <svg
    stroke="currentColor"
    fill="none"
    strokeWidth="2"
    viewBox="0 0 24 24"
    strokeLinecap="round"
    strokeLinejoin="round"
    height="1em"
    width="1em"
    xmlns="http://www.w3.org/2000/svg"
    className={styles.crownIcon}
  >
    <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"></path>
  </svg>
);

const StarIcon = () => (
  <svg
    stroke="currentColor"
    fill="none"
    strokeWidth="2"
    viewBox="0 0 24 24"
    strokeLinecap="round"
    strokeLinejoin="round"
    height="1em"
    width="1em"
    xmlns="http://www.w3.org/2000/svg"
    className={styles.starIcon}
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
  </svg>
);

interface MainUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  userName: string;
  isSettingMain: boolean;
}

const MainUserModal: React.FC<MainUserModalProps> = ({
  isOpen,
  onClose,
  message,
  userName,
  isSettingMain
}) => {
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; size: number; color: string }[]>([]);

  // キラキラエフェクト用のパーティクル生成
  useEffect(() => {
    if (isOpen && isSettingMain) {
      const newParticles = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 8 + 2,
        color: [
          '#FFD700', // ゴールド
          '#FFA500', // オレンジ
          '#FF6347', // トマト
          '#FF1493', // ピンク
          '#9370DB', // 紫
        ][Math.floor(Math.random() * 5)]
      }));
      setParticles(newParticles);
    } else {
      setParticles([]);
    }
  }, [isOpen, isSettingMain]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className={`${styles.modalOverlay} ${!isSettingMain ? styles.simpleOverlay : ''}`} onClick={onClose}>
          <motion.div
            className={`${styles.modalContent} ${!isSettingMain ? styles.simpleModalContent : ''}`}
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ 
              type: isSettingMain ? 'spring' : 'tween', 
              damping: 20, 
              stiffness: 300,
              duration: isSettingMain ? 0.4 : 0.3 
            }}
          >
            {/* キラキラパーティクル - 主役設定時のみ表示 */}
            {isSettingMain && particles.map((particle) => (
              <motion.div
                key={particle.id}
                className={styles.particle}
                initial={{ opacity: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                  x: [particle.x - 10, particle.x, particle.x + 10],
                  y: [particle.y - 10, particle.y, particle.y + 10],
                }}
                transition={{ 
                  duration: Math.random() * 2 + 1,
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
                }}
              />
            ))}

            {/* アイコン - 主役設定時のみアニメーション付き */}
            {isSettingMain ? (
              <motion.div
                className={styles.iconContainer}
                initial={{ y: -20 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.5, type: 'spring', damping: 10 }}
              >
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 10, -10, 0]
                  }}
                  transition={{ 
                    duration: 1.5, 
                    repeat: Infinity,
                    type: "keyframes",
                    ease: "easeInOut" 
                  }}
                >
                  <CrownIcon />
                </motion.div>
              </motion.div>
            ) : (
              <div className={styles.simpleIconContainer}>
                <StarIcon />
              </div>
            )}

            {/* メッセージ */}
            <motion.h2
              className={`${styles.title} ${!isSettingMain ? styles.simpleTitle : ''}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {isSettingMain 
                ? `${userName}さんが主役になりました！`
                : `${userName}さんの主役設定を解除しました`}
            </motion.h2>

            <motion.p
              className={`${styles.message} ${!isSettingMain ? styles.simpleMessage : ''}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {message}
            </motion.p>

            {/* 閉じるボタン */}
            <motion.button
              className={`${styles.closeButton} ${!isSettingMain ? styles.simpleCloseButton : ''}`}
              onClick={onClose}
              whileHover={{ scale: isSettingMain ? 1.05 : 1.02 }}
              whileTap={{ scale: isSettingMain ? 0.95 : 0.98 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              閉じる
            </motion.button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default MainUserModal; 