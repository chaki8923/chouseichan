import Link from 'next/link';
import type { Metadata } from "next";
import { getBlogPosts } from '@/app/utils/getBlogPosts';
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

    // `generateMetadata` で取得したデータを再利用
    const posts = await getBlogPosts(categoryId);

    const categoryName = posts.length > 0 ? posts[0].category?.name || "カテゴリなし" : "カテゴリなし";
    const description = posts.length > 0 ? posts[0].category?.description || "カテゴリなし" : "カテゴリなし";

    return (
        <>
            <Form categoryName={categoryName} />
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
