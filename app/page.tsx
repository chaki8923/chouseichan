import Form from "./component/form/form";
import styles from "./index.module.scss"
import Script from 'next/script';

export default function Home() {
  // JSONLDデータ
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: '調整ちゃん',
    url: 'https://www.chouseichan.com',
    description: '「調整ちゃん」はたったの2ステップでイベント登録。Googleカレンダーと連携し、ユーザーがスケジュールを簡単に管理できるサービスです。',
    applicationCategory: 'SchedulingApplication',
    operatingSystem: 'All',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'JPY'
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '120',
      bestRating: '5',
      worstRating: '1'
    },
    keywords: 'イベント,幹事,スケジュール,調整,日程調整,カレンダー,予定,出欠',
    potentialAction: {
      '@type': 'CreateAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://www.chouseichan.com',
        description: 'イベントを作成する'
      }
    }
  };

  return (
    <>
      <Script
        id="json-ld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className={styles.container}>
        <Form categoryName="イベント" defaultTime={19}/>
      </div>
    </>
  );
}
