import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from "next";
import { getBlogPosts, getCategoryById } from '@/app/utils/getBlogPosts';
import Form from '../component/form/form';
import styles from "./index.module.scss";


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
    const categoryId = typeof params.categoryId === "string" ? params.categoryId : undefined;

    if (!categoryId) {
        return {
            title: "イベントが見つかりません",
            description: "指定されたイベントが存在しません。",
        };
    }

    const posts = await getBlogPosts(categoryId);

    if (!posts.length) {
        return {
            title: "ブログが見つかりません",
            description: "指定されたイベントが存在しません。",
        };
    }

    const categoryName = posts[0].category?.name || "カテゴリなし";

    return {
        title: `${categoryName} | 調整ちゃん`,
        description: `${categoryName}の時にURLを共有するだけで簡単に日程調整可能！`,
        keywords: [ `${categoryName}`,"イベント", "スケジュール", "調整", "日程調整"], 
        openGraph: {
            title: `${categoryName} | 調整ちゃん`,
            description: `${categoryName}の時にURLを共有するだけで簡単に日程調整可能！`,
        },
    };
}

export default async function Page({ searchParams }: PageProps) {
    const params = await searchParams;
    const categoryId = typeof params.categoryId === "string" ? params.categoryId : undefined;

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

    return (
        <>
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
                                    {post.tags.length > 0 && (
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
