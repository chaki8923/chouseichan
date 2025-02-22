'use client';

import type { Metadata } from "next";
import { useState } from "react";
import { motion } from "framer-motion";
import "./index.css";

const metadata: Metadata = {
    title: "お知らせ | 調整ちゃん",
    description: "お知らせ",
    keywords: ["イベント", "スケジュール", "調整", "日程調整"],
    robots: "index, follow",
};

export default function Information() {
    const [openSection, setOpenSection] = useState<string | null>(null);

    const toggleSection = (section: string) => {
        setOpenSection(openSection === section ? null : section);
    };

    const sections = [
        {
            title: "ご質問への回答",
            contents: [
                "まだご質問はありません",
            ],
        },
        {
            title: "不具合対応",
            contents: [
                "まだ不具合報告はありません",
            ],
        },
        {
            title: "リクエストへの回答",
            contents: [
                "まだリクエストはありません",
            ],
        },
        {
            title: "その他",
            contents: [
                "まだその他のお声はありません",
            ],
        },
    ];

    return (
        <div className="min-h-screen bg-[#FFEDFA] p-6">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-2xl font-bold text-[#DE3163] mb-4 info-title">お知らせ</h1>

                {sections.map((section) => (
                    <div key={section.title} className="mb-4">
                        <button
                            className="w-full flex justify-between items-center text-lg font-semibold bg-[#E195AB] p-3 rounded-md cursor-pointer"
                            onClick={() => toggleSection(section.title)}
                        >
                            {section.title}
                            <span>{openSection === section.title ? "➖" : "➕"}</span> {/* 仮のアイコン */}
                        </button>

                        <motion.div
                            initial={false}
                            animate={{ height: openSection === section.title ? "auto" : 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="overflow-hidden"
                        >
                            <ul className="mt-2 p-4 bg-white border border-[#E195AB] rounded-md">
                                {section.contents.map((content, index) => (
                                    <li key={index} className="mb-2 last:mb-0 content">
                                        ・{content}
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    </div>
                ))}
            </div>
        </div>
    );
}
