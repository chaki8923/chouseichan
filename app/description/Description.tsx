"use client";

import { useState } from "react";
import styles from './index.module.scss'

export default function Description() {
    // 画像オーバーレイの状態管理
    const [isOverlayOpen, setIsOverlayOpen] = useState(false);
    const [currentImage, setCurrentImage] = useState<string>("");
    
    // 画像クリック時のハンドラー
    const handleImageClick = (imageSrc: string) => {
        setCurrentImage(imageSrc);
        setIsOverlayOpen(true);
        // スクロールを無効化
        document.body.style.overflow = 'hidden';
    };
    
    // オーバーレイを閉じる
    const closeOverlay = () => {
        setIsOverlayOpen(false);
        // スクロールを再度有効化
        document.body.style.overflow = 'auto';
    };
   
    return (
        <>
            <section className={styles.section}>
                <h1>調整ちゃんとは?</h1>
                <h2>誰でも2ステップでイベントを開催</h2>
                <p>交流会や飲み会、勉強会などの予定を簡単に仲間と合わせられるサービスです！</p>
                <p>イベントを作成して生成されたURLを仲間と共有するだけで簡単に出欠の確認が取れます。</p>
                <h2>直感的なUIで使いやすい</h2>
                <p>予定登録画面や出欠登録画面ではシンプルでわかりやすいデザインで誰でも使いやすくなっています。</p>
                <p>開催日が決定した日や主役が参加する日も一目で分かりやすくなっています。</p>
                <img 
                    src="./kettei.png" 
                    alt="ハイライト画像" 
                    className={styles.clickableImage}
                    onClick={() => handleImageClick("./kettei.png")}
                />
                <br></br>
                <img 
                    src="./response.png" 
                    alt="スケジュール調整" 
                    className={styles.clickableImage}
                    onClick={() => handleImageClick("./response.png")}
                />
                <h2>主役設定機能</h2>
                <p>どれだけ参加する人が集まっても主役がいなければ意味はありません！調整ちゃんなら主役が参加できる日もすぐにわかります！</p>
                <img 
                    src="./main.png" 
                    alt="主役決定ボタン" 
                    className={styles.clickableImage}
                    onClick={() => handleImageClick("./main.png")}
                />
                <br></br>
                <img 
                    src="./main_kettei.png" 
                    alt="主役決定モーダル" 
                    className={styles.clickableImage}
                    onClick={() => handleImageClick("./main_kettei.png")}
                />
                <br></br>
                <img 
                    src="./suguwakaru.png" 
                    alt="主役の参加日がすぐわかる" 
                    className={styles.clickableImage}
                    onClick={() => handleImageClick("./suguwakaru.png")}
                />
                <h2>Googleカレンダーとの連携</h2>
                <p>調整ちゃんは開催日が決定した後にGoogle連携をすることでGoogleカレンダーと連携することができます。ボタンを押すだけで開催日がGoogleカレンダーに登録されて、通知が来るのでとても便利です！もちろんGoogleと連携をしなくても使えます。</p>
                <img 
                    src="./google.png" 
                    alt="Googleカレンダーの連携もOK" 
                    className={styles.clickableImage}
                    onClick={() => handleImageClick("./google.png")}
                />
                <h2>回答期限を設定</h2>
                <p>イベントの幹事さんには嬉しい、回答期限を設定できます。余裕を持ってイベントの参加人数を管理することができます。</p>
                <img 
                    src="./kigen.png" 
                    alt="回答期限設定機能" 
                    className={styles.clickableImage}
                    onClick={() => handleImageClick("./kigen.png")}
                />
                <h2>お店選び投票機能</h2>
                <p>こちらも幹事さんには嬉しい機能です！日程調整とお店選びをこの「調整ちゃん」の中だけで管理できます！</p>
                <img 
                    src="./tohyo.png" 
                    alt="お店選びへのリンク" 
                    className={styles.clickableImage}
                    onClick={() => handleImageClick("./tohyo.png")}
                />
                <br></br>
                <img 
                    src="./tohyo2.png" 
                    alt="お店を皆んなで選ぼう！" 
                    className={styles.clickableImage}
                    onClick={() => handleImageClick("./tohyo2.png")}
                />
                <h2>イベントカレンダー</h2>
                <p>Googleカレンダーと連携をしなくてもサービス内では訪問したことのあるイベントをカレンダー形式で表示することができます。</p>
                <img 
                    src="./event-calendar.png" 
                    alt="イベントカレンダー" 
                    className={styles.clickableImage}
                    onClick={() => handleImageClick("./event-calendar.png")}
                />
                <p>カレンダーからもイベントの簡単な情報や同日のイベントを確認することができます。</p>
                <img 
                    src="./event-calendar2.png" 
                    alt="イベントカレンダー" 
                    className={styles.clickableImage}
                    onClick={() => handleImageClick("./event-calendar2.png")}
                />
                <h2>アルバム機能</h2>
                <p>イベント開催当日以降になると画像を投稿できるようになります。イベント開催後も仲間と盛り上がる為のツールの一つとしてお使いください。</p>
                <img 
                    src="./upload.png" 
                    alt="アルバムアップロード機能もあります" 
                    className={styles.clickableImage}
                    onClick={() => handleImageClick("./upload.png")}
                />
                <br></br>
                <img 
                    src="./swiper.png" 
                    alt="アルバム機能。みんなで見返して盛り上がれます" 
                    className={styles.clickableImage}
                    onClick={() => handleImageClick("./swiper.png")}
                />
                <h2>画像サイズの変更</h2>
                <p>せっかくアップロードしたい画像も大きすぎてアップロードできないということはありません。</p>
                <p>画像サイズを変更してアップロードすることができます。</p>
                <img 
                    src="./resize.png" 
                    alt="画像リサイズ機能があるので安心" 
                    className={`${styles.clickableImage} mt-10`}
                    onClick={() => handleImageClick("./resize.png")}
                />
                <h2>お役立ち情報</h2>
                <p>一番下のご利用シーンごとのリンクから、それぞれのシーンに合わせたお役立ち情報もあり、今後もどんどん増えていきます！イベント開催前に是非一度目を通していただきお役立てください！</p>
                <img 
                    src="./footer.png" 
                    alt="ブログ情報も満載！" 
                    className={`${styles.clickableImage} mt-10`}
                    onClick={() => handleImageClick("./footer.png")}
                />
            </section>
            
            {/* 画像オーバーレイ */}
            {isOverlayOpen && (
                <div className={styles.imageOverlay} onClick={closeOverlay}>
                    <div className={styles.overlayContent} onClick={(e) => e.stopPropagation()}>
                        <button className={styles.closeButton} onClick={closeOverlay}>×</button>
                        <img 
                            src={currentImage} 
                            alt="拡大表示" 
                            className={styles.enlargedImage}
                        />
                    </div>
                </div>
            )}
        </>
    );
} 