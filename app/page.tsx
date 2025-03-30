import Form from "./component/form/form";
import styles from "./index.module.scss"
import { getDefaultWebsiteStructuredData } from "./lib/structured-data";
import type { Metadata } from "next";
import AppealSection from "./component/appeal/AppealSection";

// メインページ用のメタデータを静的に定義
export const generateMetadata = (): Metadata => {
  return {
    // 既存のメタデータは layout.tsx から継承されるので、
    // 追加や上書きしたいものだけ定義
    title: "調整ちゃん | 簡単日程調整",
  };
};

// 構造化データを静的に生成
export const generateJsonLd = () => {
  const jsonLd = getDefaultWebsiteStructuredData();
  return jsonLd;
};

export default function Home() {
  // 構造化データを取得
  const jsonLd = generateJsonLd();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className={styles.mainContent}>
        <AppealSection />
        <div className={styles.formContainer}>
          <Form categoryName="イベント" defaultTime={19}/>
        </div>
      </div>
    </>
  );
}
