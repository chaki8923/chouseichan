'use client'

import { useState } from 'react'
import Image from 'next/image'
import Modal from '../component/modal/modal'
import StarRating from './StarRating'
import { FiCheck, FiSend, FiHeart } from 'react-icons/fi'
import styles from './SatisfactionSurveyModal.module.css'

interface SatisfactionSurveyModalProps {
  isOpen: boolean
  onClose: () => void
  eventId: string
  eventName: string
}

enum SurveyStep {
  RATING,
  THANK_YOU
}

const SatisfactionSurveyModal: React.FC<SatisfactionSurveyModalProps> = ({
  isOpen,
  onClose,
  eventId,
  eventName
}) => {
  const [step, setStep] = useState<SurveyStep>(SurveyStep.RATING)
  const [rating, setRating] = useState<number>(0)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRatingChange = (newRating: number) => {
    setRating(newRating)
    setError(null)
  }

  const handleSubmit = async () => {
    // バリデーション
    if (rating === 0) {
      setError('評価を選択してください')
      return
    }

    try {
      setIsSubmitting(true)
      const response = await fetch('/api/satisfaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId,
          rating,
          comment: comment.trim() || null,
        }),
      })

      if (!response.ok) {
        throw new Error('アンケートの送信に失敗しました')
      }

      // 送信完了後、ローカルストレージに保存
      localStorage.setItem(`satisfaction_survey_${eventId}`, 'completed')
      
      // サンクスステップに進む
      setStep(SurveyStep.THANK_YOU)
    } catch (err) {
      setError((err as Error).message || 'エラーが発生しました。もう一度お試しください。')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    // ステップをリセットして閉じる
    if (step === SurveyStep.THANK_YOU) {
      setStep(SurveyStep.RATING)
      setRating(0)
      setComment('')
      setError(null)
    }
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      type="info"
      showCloseButton={step !== SurveyStep.THANK_YOU}
    >
      <div className={styles.surveyContainer}>
        {step === SurveyStep.RATING ? (
          <>
            <div className={styles.logoContainer}>
              <Image 
                src="/logo.png" 
                alt="調整ちゃん" 
                width={100} 
                height={100} 
                className={styles.logoImage}
              />
            </div>
            
            <h2 className={styles.title}>調整ちゃんの満足度を教えてください</h2>
            <div className={styles.hearts}>
              <FiHeart className={styles.heart} />
              <FiHeart className={styles.heart} style={{ animationDelay: '0.3s' }} />
              <FiHeart className={styles.heart} style={{ animationDelay: '0.6s' }} />
            </div>
            
            <div className={styles.ratingContainer}>
              <p className={styles.ratingLabel}>調整ちゃんのサービスを5段階で評価してください</p>
              <StarRating
                onChange={handleRatingChange}
                initialRating={rating}
                size={40}
              />
              {error && <p className={styles.error}>{error}</p>}
            </div>

            <div className={styles.commentContainer}>
              <label htmlFor="comment" className={styles.commentLabel}>
                コメント (任意)
              </label>
              <textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className={styles.commentInput}
                placeholder="調整ちゃんへのご意見やご感想をお聞かせください"
                maxLength={500}
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={styles.submitButton}
            >
              {isSubmitting ? (
                '送信中...'
              ) : (
                <>
                  <FiSend className={styles.buttonIcon} />
                  アンケートを送信
                </>
              )}
            </button>
          </>
        ) : (
          <div className={styles.thankYouContainer}>
            <div className={styles.logoContainer}>
              <Image 
                src="/logo.png" 
                alt="調整ちゃん" 
                width={120} 
                height={120} 
                className={styles.logoImageThankYou}
              />
            </div>
            
            <div className={styles.thankYouContent}>
              <h2 className={styles.thankYouTitle}>ありがとうございました！</h2>
              <div className={styles.sparkleBorder}>
                <p className={styles.thankYouText}>
                  アンケートへのご協力、<br />
                  ありがとうございました♪<br />
                  <span className={styles.smallText}>これからもよろしくお願いします！</span>
                </p>
              </div>
              
              <div className={styles.heartContainer}>
                {[...Array(5)].map((_, i) => (
                  <FiHeart 
                    key={i} 
                    className={styles.floatingHeart} 
                    style={{ 
                      animationDelay: `${i * 0.3}s`,
                      left: `${10 + i * 20}%`
                    }}
                  />
                ))}
              </div>
              
              <button onClick={handleClose} className={styles.closeButton}>
                閉じる
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

export default SatisfactionSurveyModal 