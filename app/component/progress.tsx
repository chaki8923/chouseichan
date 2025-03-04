"use client";

import { AppProgressBar as ProgressBar } from "next-nprogress-bar";

export default function ProgressBarComponent() {
  return (
    <>
    <ProgressBar 
      height="6px" 
      color="#333"
      options={{ showSpinner: false }} 
      shallowRouting
    />
    </>
  );
}