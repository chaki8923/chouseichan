import styles from './index.module.scss';
import Link from "next/link";
import { FaRegTrashAlt } from "react-icons/fa";
import { useEffect, useState } from "react";
import { getEventList, removeEvent } from "@/app/utils/strages";

export default function History() {

    const [events, setEvents] = useState<{ eventId: string; eventName: string; schedules: { date: string; time: string }[] }[]>([]);
    useEffect(() => {
        if (typeof window !== "undefined") {
            const eventString = getEventList() ?? "[]";
            try {
                setEvents(eventString);
            } catch (error) {
                console.error("Failed to parse events cookie:", error);
            }
        }
    }, []);

    const handleRemoveEvent = (eventId: string) => {
        removeEvent(eventId);
        setEvents((prevEvents) => prevEvents.filter((event) => event.eventId !== eventId));
    };


    return (

        events.length > 0 && (
            <div className={styles.cookieContent}>
                <h2 className={styles.cookieTitle}>最近このブラウザで閲覧したイベント</h2>
                <div className={styles.cookieContainer}>
                    {events.map((ev) => (
                        <div key={ev.eventId} className={styles.cookieWrapper}>
                            <Link
                                href={`/event?eventId=${ev.eventId}`}
                                className={styles.cookieEvent}
                            >
                                <p className={styles.cookieData}>{ev.eventName} <FaRegTrashAlt className={styles.trash} onClick={(e) => {
                                    e.preventDefault(); // デフォルトのリンク遷移を防ぐ
                                    e.stopPropagation(); // クリックイベントの伝播を防ぐ
                                    handleRemoveEvent(ev.eventId);
                                }} /></p>
                                <ul className={styles.scheduleUl}>
                                    {ev.schedules?.length > 0 ? (
                                        <>
                                            {ev.schedules.slice(0, 5).map((schedule, index) => (
                                                <li key={index} className={styles.schedule}>
                                                    {new Date(schedule.date).toLocaleDateString("ja-JP", {
                                                        year: "numeric",
                                                        month: "numeric",
                                                        day: "numeric",
                                                        weekday: "short",
                                                    })}{" "}
                                                    - {schedule.time}
                                                </li>
                                            ))}
                                            {ev.schedules.length > 5 && (
                                                <li className={styles.schedule}>...他{ev.schedules.length - 5} 件の候補</li>
                                            )}
                                        </>
                                    ) : (
                                        <li>スケジュールなし</li>
                                    )}
                                </ul>
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        )

    )
}