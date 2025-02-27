import Form from "./component/form/form";
import styles from "./index.module.scss"

export default function Home() {

  return (
    <>
      <div className={styles.container}>
        <Form categoryName="イベント"/>
      </div>
    </>
  );
}
