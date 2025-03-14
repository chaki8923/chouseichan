import { useState } from "react";
import styles from "./index.module.scss";
import { FaCalendarCheck, FaCalendarTimes, FaCheck, FaTimes } from "react-icons/fa";
import { createPortal } from 'react-dom';

export function ConfirmScheduleButton({ scheduleId, eventId, buttonText, onConfirm }: {scheduleId: number, eventId: string, buttonText: string, onConfirm: (scheduleId: number) => void;}) {
  const [loading, setLoading] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(false);
  const isConfirming = scheduleId !== 0;

  const handleAction = async () => {
    setLoading(true);
    
    try {
      const response = await fetch("/api/schedule/", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduleId, eventId }),
      });

      if (response.ok) {
        onConfirm(scheduleId);
        setActionSuccess(true);
      } else {
        setActionSuccess(false);
      }
    } catch (error) {
      setActionSuccess(false);
    } finally {
      setLoading(false);
      setShowResultModal(true);
      
      // 1.5秒後に自動的に結果モーダルを閉じる
      setTimeout(() => {
        setShowResultModal(false);
      }, 1500);
    }
  };

  const ResultModal = ({ isSuccess, actionType, message, onClose }) => {
    // モーダルをportalsを使って実装
    const portalDiv = typeof document !== 'undefined' ? document.getElementById('portal-root') : null;
    
    if (!portalDiv) return null;
    
    // 確定と解除のメッセージを修正
    const title = actionType === 'confirm' 
      ? '出欠確定を解除しました' 
      : '出欠を確定しました';
    
    const content = actionType === 'confirm'
      ? 'スケジュールの出欠確定を解除しました。'
      : 'スケジュールの出欠を確定しました。';

    return createPortal(
      <div className={styles.modalBackdrop}>
        <div className={styles.modalContainer}>
          <div className={styles.modalHeader}>
            <div className={`${styles.modalIcon} ${actionType === 'confirm' ? styles.cancelIcon : styles.confirmIcon}`}>
              {actionType === 'confirm' 
                ? <FaTimes size={24} /> 
                : <FaCheck size={24} />
              }
            </div>
            <h3 className={styles.modalTitle}>{title}</h3>
          </div>
          <div className={styles.modalContent}>
            <p className={styles.modalDescription}>
              {message || content}
            </p>
          </div>
        </div>
      </div>,
      portalDiv
    );
  };

  return (
    <>
      <button 
        className={`${styles.confirmBtn} ${isConfirming ? styles.confirmScheduleBtn : styles.cancelScheduleBtn}`} 
        onClick={handleAction} 
        disabled={loading}
      >
        {loading ? (
          <span className={styles.loadingText}>処理中...</span>
        ) : (
          <>
            {isConfirming ? (
              <FaCalendarCheck className={styles.buttonIcon} />
            ) : (
              <FaCalendarTimes className={styles.buttonIcon} />
            )}
            <span className={styles.confirmText}>{buttonText}</span>
          </>
        )}
      </button>

      {showResultModal && (
        <ResultModal 
          isSuccess={actionSuccess} 
          actionType={isConfirming ? 'confirm' : 'cancel'} 
          message={actionSuccess ? null : "エラーが発生しました。もう一度お試しください。"} 
          onClose={() => setShowResultModal(false)} 
        />
      )}
      
      {typeof document !== 'undefined' && document.getElementById('__next') && !document.getElementById('portal-root') && (
        <div id="portal-root" style={{ position: 'relative', zIndex: 999999 }}></div>
      )}
    </>
  );
}
