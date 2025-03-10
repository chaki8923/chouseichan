"use client"
// app/not-found.tsx
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './not-found.module.scss';
import { FiHome, FiArrowLeft } from 'react-icons/fi';

export default function NotFound() {
  const router = useRouter();
  const [count, setCount] = useState(30);
  const [hovered, setHovered] = useState(false);

  // カウントダウン効果（30秒）
  useEffect(() => {
    if (count <= 0) {
      router.push('/');
      return;
    }
    
    const timer = setTimeout(() => {
      setCount(count - 1);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [count, router]);

  return (
    <main className={styles.notFoundContainer}>
      <div className={styles.notFoundContent}>
        <div className={styles.errorCode}>
          <span className={styles.digit}>4</span>
          <div 
            className={styles.illustrationWrapper}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
          >
            <div className={styles.illustration}>
              <div className={styles.circle}></div>
              <div className={styles.face}>
                <div className={styles.eyes}>
                  <div className={styles.eye}></div>
                  <div className={styles.eye}></div>
                </div>
                <div className={`${styles.mouth} ${hovered ? styles.sad : ''}`}></div>
              </div>
            </div>
          </div>
          <span className={styles.digit}>4</span>
        </div>
        
        <h1 className={styles.title}>ページが見つかりませんでした</h1>
        
        <p className={styles.description}>
          お探しのページは削除されたか、URLが変更された可能性があります。
        </p>

        <div className={styles.actions}>
          <Link href="/" className={styles.homeButton}>
            <FiHome className={styles.buttonIcon} />
            ホームに戻る {count > 0 && `(${count}秒後に自動的に移動します)`}
          </Link>
          <button 
            onClick={() => window.history.back()} 
            className={styles.backButton}
          >
            <FiArrowLeft className={styles.buttonIcon} />
            前のページに戻る
          </button>
        </div>
      </div>
    </main>
  );
}