'use client'

import { useState } from 'react'
import { FaStar } from 'react-icons/fa'
import styles from './StarRating.module.css'

interface StarRatingProps {
  totalStars?: number
  initialRating?: number
  onChange: (rating: number) => void
  size?: number
  disabled?: boolean
}

const StarRating: React.FC<StarRatingProps> = ({
  totalStars = 5,
  initialRating = 0,
  onChange,
  size = 30,
  disabled = false,
}) => {
  const [rating, setRating] = useState<number>(initialRating)
  const [hover, setHover] = useState<number | null>(null)

  const handleClick = (currentRating: number) => {
    if (disabled) return
    setRating(currentRating)
    onChange(currentRating)
  }

  return (
    <div className={styles.starRating}>
      {[...Array(totalStars)].map((_, index) => {
        const ratingValue = index + 1
        
        return (
          <label
            key={index}
            className={`${styles.star} ${disabled ? styles.disabled : ''}`}
          >
            <input
              type="radio"
              name="rating"
              value={ratingValue}
              onClick={() => handleClick(ratingValue)}
              disabled={disabled}
              className={styles.radioInput}
            />
            <FaStar
              className={styles.starIcon}
              color={ratingValue <= (hover || rating) ? '#FFD700' : '#e4e5e9'}
              size={size}
              onMouseEnter={() => !disabled && setHover(ratingValue)}
              onMouseLeave={() => !disabled && setHover(null)}
            />
          </label>
        )
      })}
    </div>
  )
}

export default StarRating 