import type { ReactNode } from 'react'

import { ComboBadge } from './ComboBadge'
import { josaOf, type AnswerResult } from '../engine'

type FeedbackProps = {
  result: AnswerResult
  /**
   * 답을 알려줄 차례인지.
   *
   * 처음 틀렸을 때는 false 다. 힌트 한 줄만 주고 다시 풀게 한다.
   * 두 번째로 틀리면 true 가 되어 답과 풀이를 편다. 끝까지 안 알려주면
   * 8살은 갇힌다. 벌이 없어야 한다는 규칙은 막다른 길도 없어야 한다는 뜻이다.
   */
  showAnswer: boolean
  /** 답을 펼 때 아래에 붙는 그림 힌트(풀이). 없으면 글 힌트만 보여준다. */
  visual?: ReactNode
  onRetry: () => void
  onNext: () => void
  /** 연속 정답 고비를 넘겼을 때만 준다. 배지를 위에 띄운다. */
  streak?: number
}

/**
 * 정답·오답 피드백.
 *
 * 규칙이 셋이다. (CLAUDE.md 절대 규칙 4)
 * 1. 틀려도 벌이 없다. 다시 풀게 한다.
 * 2. 큰 빨간 X, 슬픈 표정, 부정적인 문구를 쓰지 않는다.
 * 3. 사과하지 않는다. "아까워! 다시 해 볼까?" 정도로 끝낸다.
 *
 * 답은 두 번째로 틀렸을 때 편다.
 * 처음부터 답을 보여주면 '다시 하기' 는 보이는 답을 옮겨 적는 일이 된다.
 * 한 번은 힌트만 들고 스스로 다시 생각하게 두어야 다시 푸는 뜻이 있다.
 */
export function Feedback({ result, showAnswer, visual, onRetry, onNext, streak }: FeedbackProps) {
  return (
    <div className="flex w-full flex-col gap-2">
      {streak === undefined ? null : <ComboBadge streak={streak} />}
      <div
      role="status"
      aria-live="polite"
      className={`
        flex w-full flex-col gap-3 rounded-3xl border-3 border-outline p-4 shadow-hard
        ${result.correct ? 'bg-energy' : 'bg-paper'}
      `}
    >
        {result.correct ? (
          <CorrectBody />
        ) : (
          <WrongBody result={result} showAnswer={showAnswer} visual={visual} />
        )}

        <button
          type="button"
          onClick={result.correct ? onNext : onRetry}
          className="
          min-h-touch w-full rounded-2xl border-3 border-outline bg-panel px-4 py-3
          font-title text-2xl text-paper shadow-hard transition-transform
          active:translate-y-1 active:shadow-none
        "
        >
          {result.correct ? '다음' : '다시 하기'}
        </button>
      </div>
    </div>
  )
}

function CorrectBody() {
  return (
    <div className="flex items-center justify-center gap-3 py-1">
      <CheckMark />
      <p className="font-title text-3xl text-outline">잘했어!</p>
    </div>
  )
}

function WrongBody({
  result,
  showAnswer,
  visual,
}: {
  result: AnswerResult
  showAnswer: boolean
  visual?: ReactNode
}) {
  const answerText = formatAnswer(result.expected)

  return (
    <div className="flex flex-col gap-2">
      <p className="font-title text-2xl text-outline">
        {showAnswer ? '같이 볼까?' : '아까워! 다시 해 볼까?'}
      </p>

      {showAnswer ? (
        <p className="text-question text-outline">
          {'답은 '}
          <span className="text-number font-bold text-coral">{answerText}</span>
          {`${josaOf(answerText, '이야/야')}.`}
        </p>
      ) : null}

      <p className="text-question text-outline/80">{result.hint}</p>

      {visual === undefined ? null : <div className="pt-1">{visual}</div>}
    </div>
  )
}

function formatAnswer(value: AnswerResult['expected']): string {
  return Array.isArray(value) ? value.join(', ') : String(value)
}

function CheckMark() {
  return (
    <svg viewBox="0 0 40 40" className="h-10 w-10" aria-hidden="true">
      <circle cx={20} cy={20} r={17} fill="#FFF6E5" stroke="#101838" strokeWidth={3} />
      <path
        d="M12 20.5l5.5 5.5L28 14"
        fill="none"
        stroke="#101838"
        strokeWidth={4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
