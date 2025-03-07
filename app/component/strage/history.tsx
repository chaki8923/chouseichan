"use client";

import styles from './index.module.scss';
import Link from "next/link";
import { FaRegTrashAlt, FaHistory, FaCalendarPlus } from "react-icons/fa";
import { useEffect, useState } from "react";
import { getEventList, removeEvent } from "@/app/utils/strages";
import { useRouter } from "next/navigation";
import { RiDeleteBin6Line } from "react-icons/ri";

interface HistoryProps {
  onHistoryExists?: (exists: boolean) => void;
}

export default function History({ onHistoryExists }: HistoryProps) {
    const router = useRouter();
    const [events, setEvents] = useState<{ eventId: string; eventName: string; schedules: { date: string; time: string }[] }[]>([]);
    
    useEffect(() => {
        const eventHistory = localStorage.getItem("eventHistory");
        if (eventHistory) {
            try {
                const parsedEvents = JSON.parse(eventHistory);
                const eventsArray = Array.isArray(parsedEvents)
                    ? parsedEvents
                    : [parsedEvents];
                
                setEvents(eventsArray);
                
                // 親コンポーネントに履歴の有無を通知
                if (onHistoryExists) {
                    onHistoryExists(eventsArray.length > 0);
                }
            } catch (e) {
                console.error("Error parsing event history:", e);
                setEvents([]);
                if (onHistoryExists) {
                    onHistoryExists(false);
                }
            }
        } else {
            if (onHistoryExists) {
                onHistoryExists(false);
            }
        }
    }, [onHistoryExists]);

    const handleRemoveEvent = (eventId: string) => {
        removeEvent(eventId);
        // イベントリストを再取得
        const eventString = getEventList() ?? "[]";
        try {
            const updatedEvents = eventString;
            setEvents(updatedEvents);
            
            // 親コンポーネントに履歴の有無を通知
            if (onHistoryExists) {
                onHistoryExists(updatedEvents.length > 0);
            }
        } catch (error) {
            console.error("Failed to parse events cookie:", error);
            if (onHistoryExists) {
                onHistoryExists(false);
            }
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("ja-JP", {
            year: "numeric",
            month: "numeric",
            day: "numeric",
            weekday: "short",
        });
    };

    if (events.length === 0) {
        return (
            <div className={styles.emptyState}>
                <FaHistory />
                <h3>閲覧履歴がありません</h3>
                <p>イベントを閲覧すると、ここに表示されます。</p>
                <Link href="/" className={styles.emptyStateButton}>
                    <FaCalendarPlus style={{ marginRight: '8px' }} />
                    イベントを作成する
                </Link>
            </div>
        );
    }

    return (
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
                                        {event.schedules.length > 5 && (
                                            <li className={styles.schedule}>
                                                ...他 {event.schedules.length - 5} 件の候補日程
                                            </li>
                                        )}
                                    </>
                                ) : (
                                    <li className={styles.schedule}>スケジュールなし</li>
                                )}
                            </ul>
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    );
}