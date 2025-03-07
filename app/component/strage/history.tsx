"use client";

import styles from './index.module.scss';
import Link from "next/link";
import { FaRegTrashAlt } from "react-icons/fa";
import { useEffect, useState, useCallback } from "react";
import { getEventList, removeEvent } from "@/app/utils/strages";

interface HistoryProps {
  onHistoryExists?: (exists: boolean) => void;
}

export default function History({ onHistoryExists }: HistoryProps) {
    const [events, setEvents] = useState<{ eventId: string; eventName: string; schedules: { date: string; time: string }[] }[]>([]);
    const [isClient, setIsClient] = useState(false);
    
    // クライアントサイドのみで実行されるようにする
    useEffect(() => {
        setIsClient(true);
    }, []);
    
    // 初期ロード時とイベント削除時に履歴を更新する関数
    const loadEventHistory = useCallback(() => {
        if (typeof window === 'undefined') return;
        
        try {
            // getEventList関数を使用して履歴を取得
            const eventsArray = getEventList();
            
            // 確実に配列であることを確認し、長さをチェック
            const validEvents = Array.isArray(eventsArray) ? eventsArray : [];
            
            // 状態を更新
            setEvents(validEvents);
            
            // 親コンポーネントに履歴の有無を通知 - 空配列でも [] でもないかを確認
            const hasEvents = validEvents.length > 0;
        
            
            if (onHistoryExists) {
                onHistoryExists(hasEvents);
            } else {
                // console.log("History component - onHistoryExists is not provided");
            }
        } catch (err) {
            console.error("History component - Error in loadEventHistory:", err);
            // エラー時は空の配列に設定
            setEvents([]);
            // 親コンポーネントにも通知
            if (onHistoryExists) {
                onHistoryExists(false);
            }
        }
    }, [onHistoryExists]);

    // 初回レンダリング時のみ実行
    useEffect(() => {
        if (isClient) {
            loadEventHistory();
        }
    }, [isClient, loadEventHistory]);

    // イベント削除ハンドラー
    const handleRemoveEvent = (eventId: string) => {
        try {
            // イベントを削除
            removeEvent(eventId);
            
            // 削除後に再度イベント一覧を取得
            const updatedEvents = getEventList();
            
            // 更新された一覧で状態を更新
            const validEvents = Array.isArray(updatedEvents) ? updatedEvents : [];
            setEvents(validEvents);
            
            // 親コンポーネントに履歴の有無を通知
            const hasEvents = validEvents.length > 0;
            
            if (onHistoryExists) {
                onHistoryExists(hasEvents);
            }
        } catch (error) {
            console.error("History component - Error in handleRemoveEvent:", error);
        }
    };

    const formatDate = (dateString: string) => {
        if (!isClient) return dateString; // クライアントサイドでない場合は変換せずにそのまま返す
        
        try {
            return new Date(dateString).toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: 'numeric',
                day: 'numeric'
            });
        } catch {
            return dateString; // 変換できない場合は元の文字列を返す
        }
    };

    return (
        <>
            {/* eventsが空でない場合のみ履歴を表示 */}
            {events.length > 0 ? (
                <div className={styles.cookieContent}>
                    <h2 className={styles.cookieTitle}>最近閲覧したイベント</h2>
                    <div className={styles.cookieContainer}>
                        {events.map((event) => (
                            <div key={event.eventId} className={styles.cookieWrapper}>
                                <Link
                                    href={`/event?eventId=${event.eventId}`}
                                    className={styles.cookieEvent}
                                >
                                    <div className={styles.cookieData}>
                                        <span>{event.eventName}</span>
                                        <FaRegTrashAlt 
                                            className={styles.trash} 
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleRemoveEvent(event.eventId);
                                            }} 
                                            title="削除"
                                            aria-label="イベントを履歴から削除"
                                            style={{ 
                                                cursor: 'pointer',
                                                color: '#777',
                                                padding: '8px',
                                                borderRadius: '50%',
                                                display: 'inline-block'
                                            }}
                                        />
                                    </div>
                                    <ul className={styles.scheduleUl}>
                                        {event.schedules?.length > 0 ? (
                                            <>
                                                {event.schedules.slice(0, 5).map((schedule, index) => (
                                                    <li key={index} className={styles.schedule}>
                                                        {formatDate(schedule.date)} - {schedule.time}
                                                    </li>
                                                ))}
                                            </>
                                        ) : (
                                            <li className={styles.schedule}>日程情報はありません</li>
                                        )}
                                    </ul>
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            ) : null}
        </>
    );
}