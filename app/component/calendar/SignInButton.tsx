"use client";

import { signIn } from "next-auth/react";
import { FcGoogle } from "react-icons/fc";
import styles from "./index.module.scss";


export default function SignInButton() {
  const currentUrl = window.location.href; // 
  const handleSignIn = async () => {
    await signIn("google", { callbackUrl: currentUrl });
  };

  return (
    <button
      onClick={handleSignIn}
      style={{
        padding: "10px 20px",
        margin: "8px 0",
        backgroundColor: "#4285F4",
        color: "white",
        border: "none",
        borderRadius: "5px",
        cursor: "pointer",
      }}
    >
      <span className={styles.syncGoogle}>
        <FcGoogle className={styles.google} /> Google連携でカレンダー登録
      </span>
    </button>
  );
}
