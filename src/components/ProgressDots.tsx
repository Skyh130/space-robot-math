type ProgressDotsProps = {
  total: number
  /** 지금 푸는 문제 번호 (0부터). */
  current: number
  /** 이미 맞힌 문제 번호들. */
  correct: readonly number[]
}

/**
 * 남은 문제 수를 점으로 보여준다.
 *
 * 시간은 보여주지 않는다. 이 게임에 타이머가 있는 곳은 W3 보스뿐이다.
 * (CLAUDE.md 절대 규칙 3)
 */
export function ProgressDots({ total, current, correct }: ProgressDotsProps) {
  return (
    <div
      className="flex items-center justify-center gap-1.5"
      aria-label={`${total}문제 중 ${current + 1}번째`}
    >
      {Array.from({ length: total }, (_, index) => (
        <span
          key={index}
          className={`
            h-3 rounded-full border-2 border-outline transition-all
            ${index === current ? 'w-7 bg-paper' : 'w-3'}
            ${correct.includes(index) ? 'bg-energy' : index === current ? 'bg-paper' : 'bg-panel'}
          `}
        />
      ))}
    </div>
  )
}
