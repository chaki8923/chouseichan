"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { FiHome, FiCalendar, FiInfo, FiFile, FiLock, FiImage, FiMail } from "react-icons/fi";
import styles from './index.module.scss'
import { usePathname } from 'next/navigation';

const Header: React.FC = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const pathname = usePathname();
    const logoRef = useRef<HTMLImageElement>(null);
    const [scrollY, setScrollY] = useState(0);

    // パスが変わったときにメニューを閉じる
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [pathname]);

    // スクロールイベントのリスナーを追加
    useEffect(() => {
        const handleScroll = () => {
            setScrollY(window.scrollY);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    // スクロール位置に基づいてロゴのアニメーションを更新
    useEffect(() => {
        if (!logoRef.current) return;
        
        // サイン波を使って上下の動きを計算（ふわふわ効果）
        const floatY = Math.sin(scrollY * 0.05) * 5; // スクロール量に応じてサイン波で上下移動
        
        // 少しの回転も加える
        const rotation = Math.sin(scrollY * 0.03) * 3; // スクロール量に応じてサイン波で回転
        
        // スケール（サイズ）の変化を追加
        const scale = 1 + Math.sin(scrollY * 0.02) * 0.05; // 1.0〜1.05の間で緩やかに変化
        
        // 明るさの変化も追加
        const brightness = 100 + Math.sin(scrollY * 0.04) * 10; // 90%〜110%の間で変化
        
        // X軸方向の移動も追加（左右の揺れ）
        const floatX = Math.sin(scrollY * 0.04) * 3; // 左右にも少し揺れる
        
        // ロゴに変換とフィルターを適用
        logoRef.current.style.transform = `translate(${floatX}px, ${floatY}px) rotate(${rotation}deg) scale(${scale})`;
        logoRef.current.style.filter = `brightness(${brightness}%)`;
    }, [scrollY]);

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
                    <img 
                        ref={logoRef}
                        src="/logo.png" 
                        alt="調整ちゃんロゴ" 
                        className={`${styles.logoImage} ${styles.floatingLogo}`} 
                    />
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
