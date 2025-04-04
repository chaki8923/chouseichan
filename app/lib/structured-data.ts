// サイト全体で使用する基本的な構造化データ
export const getDefaultWebsiteStructuredData = () => {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'あつ丸ちゃん',
    url: 'https://www.atumaruchan.com',
    description: '「あつ丸ちゃん」はAIによる最適日程推薦機能を搭載。たった2ステップでイベント登録。Googleカレンダーと連携し、ユーザーがスケジュールを簡単に管理できるサービスです。回答期限の設定、お店選び投票機能、主役設定機能など、幹事の人に役立つ機能がたくさんあります。イベントの画像もみんなで共有できて参加者も楽しめるサービスです。',
    applicationCategory: 'SchedulingApplication',
    operatingSystem: 'All',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'JPY'
    },
    softwareVersion: '2.0',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '120',
      bestRating: '5',
      worstRating: '1'
    },
    keywords: 'イベント,幹事,スケジュール,調整,日程調整,カレンダー,予定,出欠,AI,最適化,人工知能',
    potentialAction: {
      '@type': 'CreateAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://www.atumaruchan.com',
        description: 'AIでイベントを最適化'
      }
    },
    featureList: [
      "AIによる最適日程推薦",
      "Googleカレンダー連携",
      "スケジュール管理",
      "イベント作成の簡素化"
    ]
  };
};

// 一般的なWebページ用の構造化データを生成する関数
export const getWebPageStructuredData = (page: any) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: page.title || 'あつ丸ちゃん',
    description: page.description || 'あつ丸ちゃんのページです',
    url: page.url || 'https://www.atumaruchan.com',
    isPartOf: {
      '@type': 'WebSite',
      name: 'あつ丸ちゃん',
      url: 'https://www.atumaruchan.com'
    },
    publisher: {
      '@type': 'Organization',
      name: 'あつ丸ちゃん',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.atumaruchan.com/logo.png'
      }
    },
    inLanguage: 'ja-JP'
  };
};

// イベントページ用の構造化データを生成する関数
export const getEventStructuredData = (event: any) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    description: event.description || 'あつ丸ちゃんで作成されたイベント',
    startDate: event.startDate,
    endDate: event.endDate,
    location: {
      '@type': 'Place',
      name: event.location || 'オンライン',
      address: event.address || {
        '@type': 'PostalAddress',
        addressCountry: 'JP'
      }
    },
    organizer: {
      '@type': 'Person',
      name: event.organizer || '主催者'
    },
    url: `https://www.atumaruchan.com/event/${event.id}`
  };
};

// ブログページ用の構造化データを生成する関数
export const getBlogStructuredData = (blog: any) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: blog.title,
    description: blog.description || 'あつ丸ちゃんブログの記事',
    image: blog.image || '/logo.png',
    datePublished: blog.publishedAt,
    dateModified: blog.updatedAt || blog.publishedAt,
    author: {
      '@type': 'Person',
      name: blog.author || 'あつ丸ちゃん'
    },
    publisher: {
      '@type': 'Organization',
      name: 'あつ丸ちゃん',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.atumaruchan.com/logo.png'
      }
    }
  };
}; 