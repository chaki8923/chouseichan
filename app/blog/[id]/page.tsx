// app/blog/[id]/page.tsx
import Link from 'next/link';
import { client } from '@/libs/microcms';
import dayjs from 'dayjs';
import { getBlogPosts } from '@/app/utils/getBlogPosts';
import styles from "./index.module.scss"
import "./index.css"
import { getBlogStructuredData } from '@/app/lib/structured-data';
import Script from 'next/script';


// ブログ記事の型定義
type Props = {
  id: string;
  title: string;
  body: string;
  meta: string;
  publishedAt: string;
  category: { id: string; name: string };
  eyecatch: { url: string };
};

// microCMSから特定の記事を取得
async function getBlogPost(id: string): Promise<Props> {
  const data = await client.get({
    endpoint: `blog/${id}`,
  });
  return data;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {

  const { id } = await params; // IDを取得
  const blogData = await getBlogPost(id);

  if (!blogData) {
    return {
      title: "ブログが見つかりません",
      description: "指定されたイベントが存在しません。",
    };
  }

  return {
    title: `${blogData.title} | あつ丸ちゃん`,
    description: `${blogData.meta}`,
    openGraph: {
      title: `${blogData.title} | あつ丸ちゃん`,
      description: `${blogData.meta}に関する記事です。`,
    },
    alternates: {
      canonical: `/blog/${id}`,
    },
  };
}

// ブログ記事用の構造化データを準備
function prepareBlogStructuredData(post: Props) {
  
  return {
    title: post.title,
    description: `${post.meta}`,
    image: post.eyecatch?.url,
    publishedAt: post.publishedAt,
    author: 'あつ丸ちゃん',
  };
}

// 記事詳細ページの生成
export default async function BlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; // IDを取得
  const post = await getBlogPost(id);

  // `generateMetadata` で取得したデータを再利用
  const relatedPosts = await getBlogPosts(post.category.id);

  //現在表示中の記事は除外する
  const filteredRelatedPosts = relatedPosts.filter((relatedPost) => relatedPost.id !== id);

  // dayjsを使ってpublishedAtをYY.MM.DD形式に変換
  const formattedDate = dayjs(post.publishedAt).format('YY.MM.DD');

  // 構造化データを生成
  const blogData = prepareBlogStructuredData(post);
  const blogJsonLd = getBlogStructuredData(blogData);

  return (
    <>
      {/* 構造化データを追加 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }}
      />
      
      {/* 吹き出しスタイル適用のためのフォールバックスクリプト */}
      <Script src="/blog/scripts/fukidasi.js" strategy="afterInteractive" />
      
      {/* FAQ用のフォールバックスクリプト */}
      <Script src="/blog/scripts/faq.js" strategy="afterInteractive" />
      
      <main className={styles.container}>
        <article className={styles.article}>
          <h1>{post.title}</h1> {/* タイトルを表示 */}
          <img src={post.eyecatch.url} alt="" className={styles.eyecatch} />
          <p>作成日:{formattedDate}</p> {/* 日付を表示 */}
          <div dangerouslySetInnerHTML={{ __html: post.body }} /> {/* 記事本文を表示 */}
        </article>
        <div className={styles.sidebar}>
          <h2 className={styles.relateTitle}>関連記事</h2>
          <ul className={styles.relatedPosts}>
            {relatedPosts.length > 0 && filteredRelatedPosts.length === 0 && (
              <p>関連記事はありません</p>
            )}
            {filteredRelatedPosts.map((relatedPost) => (
              <Link key={relatedPost.id} href={`/blog/${relatedPost.id}`}>
              <li className={styles.relatedPost}>
                <div className={styles.blogCard}>
                  <img src={relatedPost.eyecatch!.url} alt="" />
                  <h3 className={styles.blogCardTitle}>{relatedPost.title}</h3>
                </div>
                <span className={styles.tags}>{relatedPost.category!.name}</span>
              </li>
              </Link>
            ))}
          </ul>
        </div>
      </main>
    </>
  );
}

// 静的パスを生成
export async function generateStaticParams() {
  const contentIds = await client.getAllContentIds({ endpoint: 'blog' });

  return contentIds.map((contentId) => ({
    id: contentId, // 各記事のIDをパラメータとして返す
  }));
}