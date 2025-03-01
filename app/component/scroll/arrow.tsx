import styles from './index.module.scss';
import { useState, useEffect, RefObject } from "react";

type ScrollProps = {
    containerRef: RefObject<HTMLDivElement | null>; // `null` を許容する
};
export default function Scroll({ containerRef }: ScrollProps) {
    const [showScroll, setShowScroll] = useState(false);

    const checkScrollVisibility = () => {
        if (!containerRef.current) return;

        const container = containerRef.current;

        const isOverflowing = container.scrollWidth > container.clientWidth;
        const isScrolledToEnd = container.scrollLeft > container.scrollWidth - container.clientWidth - 650;
        setShowScroll(isOverflowing && !isScrolledToEnd);
    };

    useEffect(() => {
        setTimeout(() => {
            if (!containerRef.current) return;

            const observer = new ResizeObserver(() => checkScrollVisibility());
            observer.observe(containerRef.current);

            checkScrollVisibility();
            containerRef.current.addEventListener("scroll", checkScrollVisibility);

            return () => {
                observer.disconnect();
                containerRef.current?.removeEventListener("scroll", checkScrollVisibility);
            };
        }, 100);
    }, [containerRef]);

    return (
        <>
            {showScroll && (
                <svg className={styles.arrows}>
                    <path className={styles.a2} d="M0 20 L30 52 L60 20"></path>
                    <path className={styles.a3} d="M0 40 L30 72 L60 40"></path>
                </svg>
            )}
        </>
    );
}