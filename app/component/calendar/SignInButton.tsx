"use client";

import { signIn } from "next-auth/react";

export default function SignInButton() {
  const handleSignIn = async () => {
    await signIn("google", { callbackUrl: "http://localhost:3000/calendar" });
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
      Googleでサインイン
    </button>
  );
}
