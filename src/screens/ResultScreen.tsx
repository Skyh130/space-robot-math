import { StarRating } from '../components/StarRating'
import { starsFor } from '../engine'

type ResultScreenProps = {
  correct: number
  total: number
  /** 보스를 깬 판이면 얻은 부품 이름. */
  earnedPart?: string
  onRetry: () => void
  onNext: () => void
  /** 다음으로 갈 곳의 이름. "다음 단계" 또는 "격납고" 처럼 동작 그대로 쓴다. */
  nextLabel?: string
}

/**
 * 스테이지가 끝난 뒤 별을 보여준다.
 *
 * 별을 못 받아도 나무라지 않는다. 다시 하면 된다. (CLAUDE.md 절대 규칙 4)
 */
export function ResultScreen({
  correct,
  total,
  earnedPart,
  onRetry,
  onNext,
  nextLabel = '다음 단계',
}: ResultScreenProps) {
  const stars = starsFor(correct, total)

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6">
      <StarRating count={stars} size="large" />

      <p className="font-title text-3xl text-energy">{headline(stars)}</p>

      <div className="rounded-2xl border-3 border-outline bg-panel px-6 py-3 shadow-hard">
        <p className="text-question text-paper">
          {total}문제 중 <span className="text-number font-bold text-energy">{correct}</span>개 맞혔어
        </p>
      </div>

      {earnedPart === undefined ? null : (
        <div className="rounded-2xl border-3 border-outline bg-energy px-6 py-3 shadow-hard">
          <p className="font-title text-2xl text-outline">{earnedPart} 획득!</p>
        </div>
      )}

      <div className="flex w-full flex-col gap-3 pt-2">
        <button
          type="button"
          onClick={onNext}
          className="
            min-h-touch w-full rounded-2xl border-3 border-outline bg-energy px-4 py-4
            font-title text-2xl text-outline shadow-hard transition-transform
            active:translate-y-1 active:shadow-none
          "
        >
          {nextLabel}
        </button>
        <button
          type="button"
          onClick={onRetry}
          className="
            min-h-touch w-full rounded-2xl border-3 border-outline bg-panel px-4 py-3
            font-title text-xl text-paper shadow-hard transition-transform
            active:translate-y-1 active:shadow-none
          "
        >
          다시 하기
        </button>
      </div>
    </div>
  )
}

/** 별 개수에 따른 한 마디. 어느 쪽이든 나무라지 않는다. */
function headline(stars: number): string {
  if (stars === 3) return '완벽해!'
  if (stars === 2) return '아주 잘했어!'
  if (stars === 1) return '잘했어!'
  return '좋아, 한 번 더!'
}
