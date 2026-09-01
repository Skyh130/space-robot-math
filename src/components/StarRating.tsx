type StarRatingProps = {
  /** 0~3 */
  count: number
  size?: 'small' | 'large'
}

/** 별 세 칸. 못 받은 별도 자리를 남겨 둬야 다시 도전할 마음이 생긴다. */
export function StarRating({ count, size = 'small' }: StarRatingProps) {
  const box = size === 'large' ? 'h-16 w-16 short:h-12 short:w-12' : 'h-6 w-6'

  return (
    <div className="flex items-center justify-center gap-1.5" aria-label={`별 ${count}개`}>
      {[0, 1, 2].map((index) => (
        <Star key={index} filled={index < count} className={box} />
      ))}
    </div>
  )
}

/**
 * 못 받은 별은 어두운 빈칸으로 둔다.
 * 패널색으로 두면 보스 줄(코랄 바탕) 위에서 받은 별과 구분이 안 된다.
 */
function Star({ filled, className }: { filled: boolean; className: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M12 2.6l2.9 5.9 6.5.95-4.7 4.6 1.1 6.45L12 17.45 6.2 20.5l1.1-6.45-4.7-4.6 6.5-.95z"
        fill={filled ? '#FFC93C' : '#101838'}
        stroke="#101838"
        strokeWidth={2}
        strokeLinejoin="round"
      />
    </svg>
  )
}
