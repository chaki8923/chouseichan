import React from "react";
import Link from "next/link";
import styles from './index.module.scss'

const Header: React.FC = () => {
    return (
        <header className={styles.header}>
            <div className={styles.logoContainer}>
                <Link href="/" className={styles.flex}>
                    <img src="/logo.png" alt="Service Logo" className={styles.logo} />
                    <h1 className={styles.serviceName}>調整ちゃん</h1>
                </Link>
                <div>
                    <p className={styles.serviceDescription}>プライベートでも仕事でも</p>
                    <p className={styles.serviceDescription}>2ステップで簡単日程調整！</p>
                </div>
            <div className={styles.description}>
                <p>本アプリは、Googleカレンダーと連携することで、ユーザーがスケジュールを簡単に管理できます。
                GoogleカレンダーAPIを利用し、ユーザーの許可を得た上でイベントを作成・編集・削除する機能を提供します。</p>
                <p>詳しくは <a className={styles.privacy} href="/privacy">プライバシーポリシー</a> をご覧ください。</p>
            </div>
            </div>
        </header>
    );
};

export default Header;
