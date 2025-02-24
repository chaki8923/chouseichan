import Script from "next/script";

const GoogleAdsense: React.FC = () => {
  if (process.env.NODE_ENV !== "production") {
    return null;
  }
  return (
    <Script
      async
      src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6348441325859182"
      crossOrigin="anonymous"
    />
  );
};

export default GoogleAdsense;
