import React from "react";
import Link from "next/link";
import styles from "./index.module.scss";
import { FaSquareXTwitter } from "react-icons/fa6";

const Footer: React.FC = () => {
  return (
    <footer className={styles.footer}>
      <nav className={styles.nav}>
        <Link href="/rule" className={styles.link}>利用規約</Link>
        <Link href="/privacy" className={styles.link}>プライバシーポリシー</Link>
        <Link target="_blank" href="https://docs.google.com/forms/d/e/1FAIpQLSffPUwB7SL08Xsmca9q8ikV5JySbMMVwpFV-btWcZ8nuQbTPQ/viewform?usp=dialog" className={styles.link}>お問い合わせ</Link>
        <Link href="https://x.com/" className={styles.link} target="_blank" rel="noopener noreferrer"><FaSquareXTwitter /></Link>
      </nav>
      <p className={styles.copyright}>© 2025 調整ちゃん</p>
    </footer>
  );
};

export default Footer;
