import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from "next";
import { getBlogPosts, getCategoryById } from '@/app/utils/getBlogPosts';
import Form from '../component/form/form';
import styles from "./index.module.scss";
import { getWebPageStructuredData } from '../lib/structured-data';


interface PageProps {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}

type Blog = {
    id: string;
    title: string;
    eyecatch?: {
        url: string;
        height: number;
        width: number;
    };
    category: {
        id: string;
        name: string;
        description: string;
        defaultTime: number;
        eyecatch?: {
            url: string;
            height: number;
            width: number;
        };
    } | null;
    tags: { id: string; name: string; }[]
};

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
    const params = await searchParams;
    const categoryId = typeof params.categoryId === 'string' ? params.categoryId : undefined;

    if (!categoryId) {
        return {
            title: "イベントが見つかりません",
            description: "指定されたイベントが存在しません。",
        };
    }

    const categoryData = await getCategoryById(categoryId);
    
    if (!categoryData) {
        return {
            title: "カテゴリーが見つかりません",
            description: "指定されたカテゴリーが存在しません。",
        };
    }

    const categoryName = categoryData?.name || '全カテゴリー';

    return {
        title: `${categoryName} | 調整ちゃん`,
        description: `${categoryName}の時にURLを共有するだけで簡単に日程調整可能！調整ちゃんはGoogleカレンダーと連携し、ユーザーがスケジュールを簡単に管理できるサービスです。GoogleカレンダーAPIを利用し、ユーザーの許可を得た上でイベントを作成・編集・削除する機能を提供します。友達や同僚とのスケジュール調整が簡単に。回答期限の設定、お店選び投票機能、主役設定機能など、幹事の人に役立つ機能がたくさんあります。イベントの画像もみんなで共有できて参加者も楽しめるサービスです。`,
        keywords: [ `${categoryName}`,"イベント", "幹事","スケジュール", "調整", "日程調整", "出欠管理", "AI", "日程提案"], 
        openGraph: {
            title: `${categoryName} | 調整ちゃん`,
            description: `${categoryName}の時にURLを共有するだけで簡単に日程調整可能！調整ちゃんはGoogleカレンダーと連携し、ユーザーがスケジュールを簡単に管理できるサービスです。GoogleカレンダーAPIを利用し、ユーザーの許可を得た上でイベントを作成・編集・削除する機能を提供します。友達や同僚とのスケジュール調整が簡単に。回答期限の設定、お店選び投票機能、主役設定機能など、幹事の人に役立つ機能がたくさんあります。イベントの画像もみんなで共有できて参加者も楽しめるサービスです。`,
        },
        alternates: {
            canonical: `/situation?categoryId=${categoryId}`,
          },
    };
}

// 構造化データを生成する関数
function generateStructuredData(categoryName: string) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.atumaruchan.com';
    
    return getWebPageStructuredData({
        title: `${categoryName} | 調整ちゃん`,
        description: `${categoryName}のイベント作成と予定調整ができます。`,
        url: `${baseUrl}/situation`
    });
}

export default async function Page({ searchParams }: PageProps) {
    const params = await searchParams;
    const categoryId = typeof params.categoryId === 'string' ? params.categoryId : undefined;

    if (!categoryId) {
        return <p>カテゴリーIDが指定されていません</p>;
    }

    // カテゴリー情報を直接取得
    const categoryData = await getCategoryById(categoryId);
    
    // ブログ記事を取得
    const posts = await getBlogPosts(categoryId);

    const categoryName = categoryData?.name || (posts.length > 0 ? posts[0].category?.name || "カテゴリなし" : "カテゴリなし");
    const defaultTime = categoryData?.defaultTime || (posts.length > 0 ? posts[0].category?.defaultTime || 19 : 19);
    const description = categoryData?.description || (posts.length > 0 ? posts[0].category?.description || "カテゴリなし" : "カテゴリなし");
    const eyecatchUrl = categoryData?.eyecatch?.url || (posts.length > 0 && posts[0].category?.eyecatch?.url) || null;
    
    // 構造化データを生成
    const structuredData = generateStructuredData(categoryName);

    return (
        <>
            {/* 構造化データを追加 */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
            />
            
            {/* カテゴリーのアイキャッチヘッダー */}
            {eyecatchUrl && (
                <div className={styles.categoryHeader}>
                    <div className={styles.categoryHeaderOverlay}>
                        <h1 className={styles.categoryHeaderTitle}>{categoryName}<span className={styles.categoryHeaderTitleSub}>の予定登録も調整ちゃんで2ステップ</span></h1>
                    </div>
                    <div className={styles.categoryHeaderImage}>
                        <Image 
                            src={eyecatchUrl} 
                            alt={categoryName}
                            fill
                            style={{ objectFit: 'cover', objectPosition: 'center 30%' }}
                            priority
                            sizes="100vw"
                            quality={90}
                        />
                    </div>
                </div>
            )}

            <Form categoryName={categoryName} defaultTime={defaultTime} />
            
            {posts.length > 0 && (
                <div className={styles.blogContainer}>
                    <div className={styles.descriptionContainer}>
                        <h2 className={styles.categoryTitle}>{categoryName}に関してのお役立ち情報</h2>
                        <p className={styles.description}>{description}</p>
                    </div>

                    <ul className={styles.blogUl}>
                        {posts.map((post: Blog) => (
                            <li key={post.id} className={styles.blogList}>
                                <Link
                                    href={post.id ? `/blog/${post.id}` : '/'}
                                    className={styles.blogLink}
                                >
                                    <div className={styles.imageWrapper}>
                                        <img src={post.eyecatch!.url} alt={post.title} className={styles.eyeCatch} />
                                    </div>
                                    <h3 className={styles.blogTitle}>{post.title}</h3>
                                    {post.tags && post.tags.length > 0 && (
                                        <ul className={styles.tagList}>
                                            {post.tags.map((tag) => (
                                                <li key={tag.id} className={styles.tagItem}>
                                                    #{tag.name}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </>
    );
}
