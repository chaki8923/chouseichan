import React from "react";
import Link from "next/link";
import styles from "./index.module.scss";
import { FaSquareXTwitter, FaInstagram, FaLine, FaGithub } from "react-icons/fa6";

const Footer: React.FC = () => {
  return (
    <footer className={styles.modernFooter}>
      <div className={styles.footerContainer}>
        <div className={styles.footerSection}>
          <h3 className={styles.footerHeading}>調整ちゃん</h3>
          <p className={styles.footerDescription}>
            イベントの日程調整をもっと簡単に!
            <br />
            シンプルで使いやすい日程調整サービスです。
          </p>
        </div>

        <div className={styles.footerSection}>
          <h3 className={styles.footerHeading}>リンク</h3>
          <nav className={styles.footerNav}>
            <Link href="/" className={styles.footerLink}>ホーム</Link>
            <Link href="/description" className={styles.footerLink}>使い方</Link>
            <Link href="/events-calendar" className={styles.footerLink}>イベントカレンダー</Link>
            <Link href="/rule" className={styles.footerLink}>利用規約</Link>
            <Link href="/privacy" className={styles.footerLink}>プライバシーポリシー</Link>
            <Link href="/image-resize" className={styles.footerLink}>画像リサイズ</Link>
            <Link href="https://docs.google.com/forms/d/e/1FAIpQLSffPUwB7SL08Xsmca9q8ikV5JySbMMVwpFV-btWcZ8nuQbTPQ/viewform?usp=dialog" 
                  className={styles.footerLink} 
                  target="_blank">
              お問い合わせ
            </Link>
          </nav>
        </div>

        <div className={styles.footerSection}>
          <h3 className={styles.footerHeading}>SNS</h3>
          <div className={styles.socialLinks}>
            <a href="https://x.com/choseichan2025" target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
              <FaSquareXTwitter size={24} />
            </a>
            <a href="https://line.me/S/sticker/30285837" target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
              <FaLine size={24} />
            </a>
          </div>
        </div>
      </div>
      
      <div className={styles.footerBottom}>
        <p className={styles.copyright}>© 2025 調整ちゃん All Rights Reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
