import styles from './index.module.scss';
import { IoIosArrowForward } from "react-icons/io";
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
      const isScrolledToEnd = container.scrollLeft >= container.scrollWidth - container.clientWidth - 5;
  
      setShowScroll(isOverflowing && !isScrolledToEnd);
    };
  
    const handleScrollRight = () => {
      if (!containerRef.current) return;
      containerRef.current.scrollTo({
        left: containerRef.current.scrollWidth,
        behavior: "smooth",
      });
    };
  
    useEffect(() => {
      if (!containerRef.current) return;
  
      const observer = new ResizeObserver(checkScrollVisibility);
      observer.observe(containerRef.current);
  
      checkScrollVisibility();
      containerRef.current.addEventListener("scroll", checkScrollVisibility);
  
      return () => {
        observer.disconnect();
        containerRef.current?.removeEventListener("scroll", checkScrollVisibility);
      };
    }, [containerRef]);
  
    return (
      <>
        {showScroll && (
          <div className={styles.arrows} onClick={handleScrollRight}>
            <IoIosArrowForward className={`${styles.path} ${styles.a1}`} />
            <IoIosArrowForward className={`${styles.path} ${styles.a2}`} />
            <IoIosArrowForward className={`${styles.path} ${styles.a3}`} />
          </div>
        )}
      </>
    );
  }