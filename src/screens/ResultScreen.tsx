import { StarRating } from '../components/StarRating'
import { starsFor } from '../engine'

type ResultScreenProps = {
  correct: number
  total: number
  /**
   * 도전 모드 결과. 별 대신 기록을 보여준다.
   * best 는 이번 판을 포함한 최고 기록이고, isRecord 면 이번에 갈아치운 것이다.
   */
  challenge?: { readonly best: number; readonly isRecord: boolean }
  /** 보스를 깬 판이면 얻은 부품 이름. */
  earnedPart?: string
  onRetry: () => void
  onNext: () => void
  /** 월드맵으로 돌아가기. 없으면 버튼을 그리지 않는다. */
  onMap?: () => void
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
  challenge,
  earnedPart,
  onRetry,
  onNext,
  onMap,
  nextLabel = '다음 단계',
}: ResultScreenProps) {
  const stars = starsFor(correct, total)

  if (challenge) {
    return (
      <ChallengeResult
        correct={correct}
        best={challenge.best}
        isRecord={challenge.isRecord}
        onRetry={onRetry}
        onNext={onNext}
        nextLabel={nextLabel}
      />
    )
  }

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
        {onMap === undefined ? null : (
          <button
            type="button"
            onClick={onMap}
            className="
              min-h-touch w-full rounded-2xl border-3 border-outline bg-mint px-4 py-3
              font-title text-xl text-outline shadow-hard transition-transform
              active:translate-y-1 active:shadow-none
            "
          >
            우주로
          </button>
        )}
      </div>
    </div>
  )
}

/**
 * 도전 모드 결과.
 *
 * 별이 없다. 기록만 남는다. 그래서 별을 다 받은 뒤에도 다시 할 이유가 된다.
 * 신기록이면 그 자체가 보상이라 크게 알려 준다.
 */
function ChallengeResult({
  correct,
  best,
  isRecord,
  onRetry,
  onNext,
  nextLabel,
}: {
  correct: number
  best: number
  isRecord: boolean
  onRetry: () => void
  onNext: () => void
  nextLabel: string
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 p-6">
      {isRecord ? (
        <p className="animate-pop-in font-title text-3xl text-coral">신기록!</p>
      ) : (
        <p className="font-title text-3xl text-energy">잘했어!</p>
      )}

      <div className="flex w-full flex-col items-center gap-1 rounded-3xl border-3 border-outline bg-energy px-6 py-5 shadow-hard">
        <span className="text-base font-bold text-outline/70">이번에 충전한 코어</span>
        <span className="text-6xl font-bold tabular-nums text-outline">{correct}</span>
      </div>

      <div className="rounded-2xl border-3 border-outline bg-panel px-6 py-3 shadow-hard">
        <p className="text-question text-paper">
          최고 기록 <span className="text-number font-bold text-energy">{best}</span>개
        </p>
      </div>

      <div className="flex w-full flex-col gap-3 pt-1">
        <button
          type="button"
          onClick={onRetry}
          className="
            min-h-touch w-full rounded-2xl border-3 border-outline bg-coral px-4 py-4
            font-title text-2xl text-paper shadow-hard transition-transform
            active:translate-y-1 active:shadow-none
          "
        >
          한 번 더!
        </button>
        <button
          type="button"
          onClick={onNext}
          className="
            min-h-touch w-full rounded-2xl border-3 border-outline bg-panel px-4 py-3
            font-title text-xl text-paper shadow-hard transition-transform
            active:translate-y-1 active:shadow-none
          "
        >
          {nextLabel}
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
