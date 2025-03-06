"use client";

import React, { useState } from "react";
import Link from "next/link";
import { FiMenu, FiX } from "react-icons/fi";
import styles from './index.module.scss'

const Header: React.FC = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const toggleMobileMenu = () => {
        setMobileMenuOpen(!mobileMenuOpen);
    };

    return (
        <header className={styles.modernHeader}>
            <div className={styles.headerContainer}>
                <Link href="/" className={styles.logoLink}>
                    <img src="/logo.png" alt="調整ちゃんロゴ" className={styles.logoImage} />
                    <div className={styles.logoText}>
                        <h1 className={styles.logoTitle}>調整ちゃん</h1>
                        <p className={styles.logoTagline}>プライベートでも仕事でも<br className={styles.spOnly} />2ステップで簡単日程調整！</p>
                    </div>
                </Link>

                <nav className={`${styles.navMenu} ${mobileMenuOpen ? styles.menuOpen : ''}`}>
                    <Link href="/" className={styles.navLink}>ホーム</Link>
                    <Link href="/description" className={styles.navLink}>使い方</Link>
                    <Link href="/rule" className={styles.navLink}>利用規約</Link>
                    <Link href="/privacy" className={styles.navLink}>プライバシー</Link>
                    <Link href="https://docs.google.com/forms/d/e/1FAIpQLSffPUwB7SL08Xsmca9q8ikV5JySbMMVwpFV-btWcZ8nuQbTPQ/viewform?usp=dialog" 
                          className={styles.navLink} 
                          target="_blank">
                        お問い合わせ
                    </Link>
                </nav>

                <button className={styles.mobileMenuButton} onClick={toggleMobileMenu}>
                    {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
                </button>
            </div>
            
            <div className={styles.headerDescription}>
                <p>
                    本アプリは、Googleカレンダーと連携することで、ユーザーがスケジュールを簡単に管理できます。
                    GoogleカレンダーAPIを利用し、ユーザーの許可を得た上でイベントを作成・編集・削除する機能を提供します。
                    詳しくは <Link href="/privacy" className={styles.textLink}>プライバシーポリシー</Link> をご覧ください。
                </p>
            </div>
        </header>
    );
};

export default Header;
