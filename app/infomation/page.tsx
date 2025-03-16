import type { Metadata } from "next";
import Info from "./info";

export const metadata: Metadata = {
    title: "お知らせ | 調整ちゃん",
    description: "お知らせ",
    keywords: ["イベント","幹事", "スケジュール", "調整", "日程調整"],
    robots: "index, follow",
};

export default function Information() {
   
    return (
        <Info />
    );
}
