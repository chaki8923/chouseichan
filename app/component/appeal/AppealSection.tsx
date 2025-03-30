'use client';

import React from 'react';
import Image from 'next/image';
import styles from './AppealSection.module.scss';

export default function AppealSection() {
  return (
    <div className={styles.appealContainer}>
      <h2 className={styles.appealTitle}>たった2ステップで簡単日程調整</h2>
      
      <div className={styles.stepsContainer}>
        <div className={styles.step}>
          <div className={styles.stepHeader}>
            <div className={styles.stepNumber}>STEP 1</div>
            <h3 className={styles.stepTitle}>イベント情報を入力</h3>
          </div>
          <p className={styles.stepDescription}>
            イベント名と候補日時を入力するだけ。<br />
            詳細情報やアイコンも設定できます。
          </p>
          <div className={styles.stepImageWrapper}>
            <Image
              src="/step1.png"
              alt="ステップ1: イベント情報を入力"
              width={450}
              height={300}
              className={styles.stepImage}
              priority
            />
          </div>
        </div>
        
        <div className={styles.step}>
          <div className={styles.stepHeader}>
            <div className={styles.stepNumber}>STEP 2</div>
            <h3 className={styles.stepTitle}>URLを共有して仲間を招待</h3>
          </div>
          <p className={styles.stepDescription}>
            生成されたURLを友達や仲間に共有するだけ。<br />
            参加者はアカウント登録不要で回答できます。
          </p>
          <div className={styles.stepImageWrapper}>
            <Image
              src="/step2.png"
              alt="ステップ2: URLを共有して仲間を招待"
              width={450}
              height={300}
              className={styles.stepImage}
              priority
            />
          </div>
        </div>
      </div>
      
      <div className={styles.appealFooter}>
        <p className={styles.appealFooterText}>
          ログイン不要・完全無料で使える日程調整ツール
        </p>
      </div>
    </div>
  );
} 