"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { FiHome, FiCalendar, FiInfo, FiFile, FiLock, FiImage, FiMail } from "react-icons/fi";
import styles from './index.module.scss'
import { usePathname } from 'next/navigation';

const Header: React.FC = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const pathname = usePathname();

    // パスが変わったときにメニューを閉じる
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [pathname]);

    // 本体スクロールを制御
    useEffect(() => {
        if (mobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        
        return () => {
            document.body.style.overflow = '';
        };
    }, [mobileMenuOpen]);

    const toggleMobileMenu = () => {
        setMobileMenuOpen(!mobileMenuOpen);
    };

    // リンククリック時にメニューを閉じる
    const handleLinkClick = () => {
        setMobileMenuOpen(false);
    };

    return (
        <header className={styles.modernHeader}>
            <div className={styles.headerContainer}>
                <Link href="/" className={styles.logoLink} onClick={handleLinkClick}>
                    <img src="/logo.png" alt="調整ちゃんロゴ" className={styles.logoImage} />
                    <div className={styles.logoText}>
                        <h1 className={styles.logoTitle}>調整ちゃん</h1>
                        <p className={styles.logoTagline}>プライベートでも仕事でも<br className={styles.spOnly} />2ステップで簡単日程調整！</p>
                    </div>
                </Link>

                <nav className={`${styles.navMenu} ${mobileMenuOpen ? styles.menuOpen : ''}`}>
                    <Link href="/" className={styles.navLink} onClick={handleLinkClick}>
                        <FiHome className={styles.navIcon} />
                        <span>ホーム</span>
                    </Link>
                    <Link href="/events-calendar" className={styles.navLink} onClick={handleLinkClick}>
                        <FiCalendar className={styles.navIcon} />
                        <span>イベントカレンダー</span>
                    </Link>
                    <Link href="/description" className={styles.navLink} onClick={handleLinkClick}>
                        <FiInfo className={styles.navIcon} />
                        <span>使い方</span>
                    </Link>
                    <Link href="/rule" className={styles.navLink} onClick={handleLinkClick}>
                        <FiFile className={styles.navIcon} />
                        <span>利用規約</span>
                    </Link>
                    <Link href="/privacy" className={styles.navLink} onClick={handleLinkClick}>
                        <FiLock className={styles.navIcon} />
                        <span>プライバシー</span>
                    </Link>
                    <Link href="/image-resize" className={styles.navLink} onClick={handleLinkClick}>
                        <FiImage className={styles.navIcon} />
                        <span>画像リサイズ</span>
                    </Link>
                    <Link href="https://docs.google.com/forms/d/e/1FAIpQLSffPUwB7SL08Xsmca9q8ikV5JySbMMVwpFV-btWcZ8nuQbTPQ/viewform?usp=dialog" 
                          className={styles.navLink} 
                          target="_blank"
                          onClick={handleLinkClick}>
                        <FiMail className={styles.navIcon} />
                        <span>お問い合わせ</span>
                    </Link>
                </nav>

                <button 
                    className={`${styles.mobileMenuButton} ${mobileMenuOpen ? styles.menuOpen : ''}`} 
                    onClick={toggleMobileMenu} 
                    aria-label="メニュー"
                >
                    <span className={styles.hamburgerLine}></span>
                    <span className={styles.hamburgerLine}></span>
                    <span className={styles.hamburgerLine}></span>
                </button>
                
                {/* オーバーレイ背景 */}
                {mobileMenuOpen && (
                    <div className={styles.menuOverlay} onClick={handleLinkClick}></div>
                )}
            </div>
            
            <div className={styles.headerDescription}>
                <p>
                    本アプリは、Googleカレンダーと連携することで、ユーザーがスケジュールを簡単に管理できます。
                    GoogleカレンダーAPIを利用し、ユーザーの許可を得た上でイベントを作成・編集・削除する機能を提供します。
                    詳しくは <Link href="/privacy" className={styles.textLink} onClick={handleLinkClick}>プライバシーポリシー</Link> をご覧ください。
                </p>
            </div>
        </header>
    );
};

export default Header;
