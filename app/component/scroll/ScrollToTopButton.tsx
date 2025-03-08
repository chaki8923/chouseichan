"use client"

import { useState, useEffect } from 'react';
import { FiArrowUp } from 'react-icons/fi';
import styles from './scrollToTop.module.scss';

const ScrollToTopButton = () => {
  const [isVisible, setIsVisible] = useState(false);

  // スクロール位置に応じてボタンの表示/非表示を切り替える
  useEffect(() => {
    const toggleVisibility = () => {
      // 200px以上スクロールしたらボタンを表示
      if (window.scrollY > 200) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    // スクロールイベントのリスナーを追加
    window.addEventListener('scroll', toggleVisibility);

    // 初期表示時にも確認
    toggleVisibility();

    // クリーンアップ関数
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  // ページトップにスクロールする関数
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <>
      {isVisible && (
        <button 
          onClick={scrollToTop} 
          className={styles.scrollToTopBtn}
          aria-label="ページトップへスクロール"
        >
          <div className={styles.buttonContent}>
            <FiArrowUp size={20} className={styles.arrowIcon} />
            <span className={styles.buttonText}>TOP</span>
          </div>
        </button>
      )}
    </>
  );
};

export default ScrollToTopButton; 