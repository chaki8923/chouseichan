import Form from "./component/form/form";
import Head from "next/head";

export default function Home() {

  return (
    <>
      <Head>
        <title>調整ちゃん | イベント登録</title>
        <meta name="description" content="たったの2ステップでイベント登録" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.chouseichan.com/" />
        <meta property="og:image" content="./logo.png" />
        <meta property="og:title" content="調整ちゃん" />
      </Head>
      <div>
        <Form />
      </div>
    </>
  );
}
