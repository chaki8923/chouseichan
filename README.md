This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app --ts`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
# shukketuchan

## MicroCMSのカテゴリースキーマ拡張ガイド

カテゴリー一覧のUI/UX改善に伴い、MicroCMSの「categories」コンテンツタイプに以下のフィールドを追加する必要があります。

### 追加するフィールド

1. **categoryGroup** (テキストフィールド):
   - フィールドID: `categoryGroup`
   - 表示名: カテゴリーグループ
   - 種類: テキストフィールド
   - 値の候補: 
     - `business` (ビジネス)
     - `family` (家族・友人)
     - `hobby` (趣味・娯楽)
     - `other` (その他)

2. **description** (テキストエリア):
   - フィールドID: `description`
   - 表示名: 説明文
   - 種類: テキストエリア
   - 説明: カテゴリーの簡単な説明を入力してください（50文字程度推奨）

3. **eyecatch** (画像):
   - フィールドID: `eyecatch`
   - 表示名: アイキャッチ画像
   - 種類: 画像
   - 説明: カテゴリーを表すアイコン画像（推奨サイズ: 100x100px）

### 手順

1. MicroCMSの管理画面にログイン
2. 「categories」コンテンツを選択
3. 「API設定」→「スキーマ設定」を開く
4. 「＋フィールドを追加」から上記のフィールドを追加
5. 既存のカテゴリーに新しいフィールドの値を設定

### カテゴリーグループの例

- **ビジネス** (`business`):
  - 会議
  - 面接
  - ミーティング
  - 商談
  - 研修
  - セミナー

- **家族・友人** (`family`):
  - 結婚式
  - 同窓会
  - 誕生日会
  - 家族旅行
  - ホームパーティー

- **趣味・娯楽** (`hobby`):
  - スポーツ観戦
  - ライブ・コンサート
  - 旅行
  - キャンプ
  - オンラインゲーム

- **その他** (`other`):
  - その他のカテゴリー

このスキーマ拡張により、カテゴリーをグループ化し、より視覚的に魅力的なUIでユーザーに提示することができます。
