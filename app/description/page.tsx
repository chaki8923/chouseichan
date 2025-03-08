import type { Metadata } from "next";
import styles from './index.module.scss'


export const metadata: Metadata = {
    title: "調整ちゃんとは？",
    description: "調整ちゃんとは？",
    keywords: ["イベント", "スケジュール", "調整", "日程調整"],
    robots: "index, follow",
};

export default function Information() {
   
    return (
        <section className={styles.section}>
            <h1>調整ちゃんとは?</h1>
            <h2>誰でも2ステップでイベントを開催</h2>
            <p>交流会や飲み会、勉強会などの予定を簡単に仲間と合わせられるサービスです！</p>
            <p>イベントを作成して生成されたURLを仲間と共有するだけで簡単に出欠の確認が取れます。</p>
            <h2>直感的なUIで使いやすい</h2>
            <p>予定登録画面や出欠登録画面ではシンプルでわかりやすいデザインで誰でも使いやすくなっています。一番参加者が多い日にはハイライトがされます。</p>
            <p>開催日が決定した日も一目で分かりやすくなっています。</p>
            <img src="./kettei.png" alt="ハイライト画像" />
            <img src="./response.png" alt="スケジュール調整" />
            <h2>Googleカレンダーとの連携</h2>
            <p>調整ちゃんは開催日が決定した後にGoogle連携をすることでGoogleカレンダーと連携することができます。ボタンを押すだけで開催日がGoogleカレンダーに登録されて、通知が来るのでとても便利です！もちろんGoogleと連携をしなくても使えます。</p>
            <img src="./google.png" alt="Googleカレンダーの連携もOK" />
            <h2>アルバム機能</h2>
            <p>イベント開催当日以降になると画像を投稿できるようになります。イベント開催後も仲間と盛り上がる為のツールの一つとしてお使いください。</p>
            <img src="./upload.png" alt="アルバムアップロード機能もあります" />
            <img src="./swiper.png" alt="アルバム機能。みんなで見返して盛り上がれます" />
            <h2>お役立ち情報</h2>
            <p>一番下のご利用シーンごとのリンクから、それぞれのシーンに合わせたお役立ち情報もあり、今後もどんどん増えていきます！イベント開催前に是非一度目を通していただきお役立てください！</p>
            <img src="./footer.png" alt="ブログ情報も満載！" className="mt-10" />
        </section>
    );
}
