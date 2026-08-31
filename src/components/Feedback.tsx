import type { ReactNode } from 'react'

import { josaOf, type AnswerResult } from '../engine'

type FeedbackProps = {
  result: AnswerResult
  /** 오답일 때 아래에 붙는 그림 힌트. 없으면 글 힌트만 보여준다. */
  visual?: ReactNode
  onRetry: () => void
  onNext: () => void
}

/**
 * 정답·오답 피드백.
 *
 * 규칙이 셋이다. (CLAUDE.md 절대 규칙 4)
 * 1. 틀려도 벌이 없다. 정답과 한 줄 이유를 보여주고 다시 풀게 한다.
 * 2. 큰 빨간 X, 슬픈 표정, 부정적인 문구를 쓰지 않는다.
 * 3. 사과하지 않는다. "아까워! 다시 볼까?" 정도로 끝낸다.
 */
export function Feedback({ result, visual, onRetry, onNext }: FeedbackProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`
        flex w-full flex-col gap-3 rounded-3xl border-3 border-outline p-4 shadow-hard
        ${result.correct ? 'bg-energy' : 'bg-paper'}
      `}
    >
      {result.correct ? <CorrectBody /> : <WrongBody result={result} visual={visual} />}

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

function WrongBody({ result, visual }: { result: AnswerResult; visual?: ReactNode }) {
  const answerText = formatAnswer(result.expected)

  return (
    <div className="flex flex-col gap-2">
      <p className="font-title text-2xl text-outline">아까워! 다시 볼까?</p>

      <p className="text-question text-outline">
        {'답은 '}
        <span className="text-number font-bold text-coral">{answerText}</span>
        {`${josaOf(answerText, '이야/야')}.`}
      </p>

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
