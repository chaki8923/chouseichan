"use client";

import { signIn } from "next-auth/react";

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
        backgroundColor: "#4285F4",
        color: "white",
        border: "none",
        borderRadius: "5px",
        cursor: "pointer",
      }}
    >
      Google同期してカレンダー登録
    </button>
  );
}
