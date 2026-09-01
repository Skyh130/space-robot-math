import { useEffect, useRef, useState } from 'react'

import { ChoiceGrid } from '../components/ChoiceGrid'
import { ComboBadge, isComboMilestone } from '../components/ComboBadge'
import { ORDER_ENDS } from '../data/world1'
import { Feedback } from '../components/Feedback'
import { HintVisualView } from '../components/HintVisual'
import { NumPad } from '../components/NumPad'
import { OrderPicker } from '../components/OrderPicker'
import { ProgressDots } from '../components/ProgressDots'
import { QuestionCard } from '../components/QuestionCard'
import { TimerBar } from '../components/TimerBar'
import {
  checkAnswer,
  requeueMissed,
  type AnswerResult,
  type AnswerScalar,
  type AnswerValue,
  type AnyQuestionTemplate,
  type Question,
  type SkillKey,
} from '../engine'

export type StageOutcome = {
  readonly correct: number
  readonly total: number
  /** 영역별 정답 기록. 부모 대시보드와 복습 편성의 근거가 된다. (설계서 8장) */
  readonly skillLog: readonly { readonly skill: SkillKey; readonly correct: boolean }[]
  /** 첫 시도에 틀린 문제. 다음 세션 복습에 쓴다. */
  readonly missed: readonly Question[]
}

type StageScreenProps = {
  questions: readonly Question[]
  /** "숫자 소행성대 · 2단계" 처럼 지금 어디인지 알려 준다. */
  label: string
  onFinish: (outcome: StageOutcome) => void
  /**
   * 스테이지를 도중에 그만두고 나간다.
   * 잘못 들어왔을 때 8문제를 다 풀어야만 빠져나갈 수 있으면 갇힌 것이나 같다.
   */
  onQuit?: () => void
  /** 오답을 3문제 뒤에 숫자만 바꿔 다시 내기 위해 필요하다. */
  templates?: readonly AnyQuestionTemplate[]
  /** 시간 제한. W3 보스와 도전 모드에 있다. */
  timeLimitSeconds?: number
  /**
   * 남은 문제 수 대신 맞힌 수를 센다.
   * 도전 모드는 문제를 넉넉히 쌓아 두고 시간이 끝을 정하므로, 남은 개수를
   * 보여주면 끝없이 남은 것처럼 보여 기가 죽는다.
   */
  countUp?: boolean
}

/** 시간 제한이 있는 판에서 피드백을 보여주는 시간. */
const TIMED_FEEDBACK_MS = 800

/**
 * 스테이지 한 판.
 *
 * 점수는 첫 시도만 센다. 틀리면 정답과 힌트를 보여주고 다시 풀게 하는데,
 * 이 재시도까지 점수에 넣으면 누구나 다 맞아 별이 뜻을 잃는다.
 * 재시도는 점수가 아니라 배우기 위한 것이다.
 */
export function StageScreen({
  questions: initialQuestions,
  label,
  onFinish,
  onQuit,
  templates,
  timeLimitSeconds,
  countUp = false,
}: StageScreenProps) {
  const [questions, setQuestions] = useState<readonly Question[]>(initialQuestions)
  const [index, setIndex] = useState(0)
  const [typed, setTyped] = useState('')
  const [result, setResult] = useState<AnswerResult | null>(null)
  const [firstTry, setFirstTry] = useState(true)
  const [log, setLog] = useState<StageOutcome['skillLog']>([])
  const [missed, setMissed] = useState<Question[]>([])
  const [remaining, setRemaining] = useState(timeLimitSeconds ?? 0)
  const [askingQuit, setAskingQuit] = useState(false)
  // 첫 시도로 연달아 맞힌 수. 틀리면 조용히 0으로 돌아간다.
  const [streak, setStreak] = useState(0)
  const [showCombo, setShowCombo] = useState(false)

  const timed = timeLimitSeconds !== undefined
  const finished = useRef(false)
  // 시간을 재는 판에서 예약해 둔 자동 넘김. 화면이 사라지면 취소한다.
  const advanceTimer = useRef<number | null>(null)

  useEffect(
    () => () => {
      if (advanceTimer.current !== null) window.clearTimeout(advanceTimer.current)
    },
    [],
  )

  const question = questions[index]
  if (!question) {
    throw new Error('문제가 없는 스테이지다.')
  }

  const finish = (entries: StageOutcome['skillLog'], missedSoFar: readonly Question[]) => {
    if (finished.current) return
    finished.current = true
    onFinish({
      correct: entries.filter((entry) => entry.correct).length,
      total: questions.length,
      skillLog: entries,
      missed: missedSoFar,
    })
  }

  // 시간 제한이 있는 판만 초를 센다. 다른 판에는 타이머가 아예 돌지 않는다.
  useEffect(() => {
    if (!timed) return undefined
    const started = Date.now()
    const id = window.setInterval(() => {
      const left = (timeLimitSeconds ?? 0) - (Date.now() - started) / 1000
      setRemaining(left)
      if (left <= 0) {
        window.clearInterval(id)
        setRemaining(0)
      }
    }, 200)
    return () => window.clearInterval(id)
  }, [timed, timeLimitSeconds])

  // 시간이 다 되면 그때까지의 점수로 끝낸다
  useEffect(() => {
    if (timed && remaining <= 0 && !finished.current) {
      finish(log, missed)
    }
  })

  const correctIndexes = log
    .map((entry, at) => (entry.correct ? at : -1))
    .filter((at) => at >= 0)

  const goNext = (entries: StageOutcome['skillLog'], missedSoFar: readonly Question[]) => {
    if (index + 1 >= questions.length) {
      finish(entries, missedSoFar)
      return
    }
    setIndex(index + 1)
    setTyped('')
    setResult(null)
    setFirstTry(true)
    setShowCombo(false)
  }

  const submit = (given: AnswerValue) => {
    const outcome = checkAnswer(question, given)
    setResult(outcome)

    let entries = log
    let missedNow = missed

    if (firstTry) {
      entries = [...log, { skill: question.skill, correct: outcome.correct }]
      setLog(entries)

      // 연속은 첫 시도만 센다. 답을 보고 다시 맞힌 것까지 세면 뜻이 없다.
      const nextStreak = outcome.correct ? streak + 1 : 0
      setStreak(nextStreak)
      setShowCombo(outcome.correct && isComboMilestone(nextStreak))

      if (!outcome.correct) {
        missedNow = [...missed, question]
        setMissed(missedNow)
        // 틀린 문제를 3문제 뒤에 숫자만 바꿔 다시 낸다
        if (templates) {
          setQuestions((current) => requeueMissed(current, index, templates, index * 7919 + 13))
        }
      }
    }
    setFirstTry(false)

    // 시간을 재는 판에서는 손을 멈추게 두지 않는다. 잠깐 보여주고 넘어간다.
    if (timed) {
      advanceTimer.current = window.setTimeout(() => {
        advanceTimer.current = null
        if (!finished.current) goNext(entries, missedNow)
      }, TIMED_FEEDBACK_MS)
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-2.5 overflow-hidden px-4 pb-4 pt-3">
      <header className="flex flex-col items-center gap-2">
        <div className="flex w-full items-center justify-between gap-2">
          {onQuit === undefined ? (
            <span className="w-12" />
          ) : (
            <button
              type="button"
              onClick={() => setAskingQuit(true)}
              aria-label="나가기"
              className="
                flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-3
                border-outline bg-panel shadow-hard transition-transform
                active:translate-y-1 active:shadow-none
              "
            >
              <BackIcon />
            </button>
          )}
          <p className="font-title text-base text-paper/70">{label}</p>
          {/* 제목을 가운데 두기 위한 빈자리 */}
          <span className="w-12 shrink-0" />
        </div>
        {timed ? (
          <div className="w-full">
            <TimerBar remainingSeconds={remaining} totalSeconds={timeLimitSeconds ?? 0} />
          </div>
        ) : null}
        {countUp ? (
          <ScoreCounter score={correctIndexes.length} />
        ) : (
          <ProgressDots total={questions.length} current={index} correct={correctIndexes} />
        )}
      </header>

      <QuestionCard prompt={question.prompt} />

      {askingQuit ? (
        <QuitConfirm onStay={() => setAskingQuit(false)} onLeave={onQuit ?? (() => undefined)} />
      ) : result === null ? (
        <InputArea question={question} typed={typed} onTyped={setTyped} onSubmit={submit} />
      ) : timed ? (
        <QuickFeedback result={result} {...(showCombo ? { streak } : {})} />
      ) : (
        <Feedback
          result={result}
          {...(result.correct || question.hintVisual === undefined
            ? {}
            : { visual: <HintVisualView visual={question.hintVisual} /> })}
          {...(showCombo ? { streak } : {})}
          onRetry={() => {
            setResult(null)
            setTyped('')
          }}
          onNext={() => goNext(log, missed)}
        />
      )}
    </div>
  )
}

/** 도전 모드에서 지금까지 몇 개를 맞혔는지. 올라가기만 하므로 볼 때마다 기분이 좋다. */
function ScoreCounter({ score }: { score: number }) {
  return (
    <div
      className="flex items-center gap-2"
      aria-label={`지금까지 ${String(score)}개`}
      role="status"
      aria-live="polite"
    >
      <CoreIcon />
      <span className="text-number font-bold tabular-nums text-energy">{score}</span>
    </div>
  )
}

function CoreIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden="true">
      <circle cx={12} cy={12} r={9} fill="#FFC93C" stroke="#101838" strokeWidth={3} />
      <path
        d="M12 6.5l1.9 3.9 4.3.6-3.1 3 .7 4.2-3.8-2-3.8 2 .7-4.2-3.1-3 4.3-.6z"
        fill="#101838"
        opacity={0.25}
      />
    </svg>
  )
}

/**
 * 그만둘지 묻는다.
 *
 * 한 번에 나가지 않고 한 번 더 묻는다. 8살 손가락은 옆 버튼을 잘 누르는데,
 * 그때마다 풀던 판이 날아가면 안 된다.
 */
function QuitConfirm({ onStay, onLeave }: { onStay: () => void; onLeave: () => void }) {
  return (
    <div className="flex w-full flex-col gap-3 rounded-3xl border-3 border-outline bg-paper p-4 shadow-hard">
      <p className="font-title text-2xl text-outline">그만 할까?</p>
      <p className="text-question text-outline/80">지금까지 푼 건 저장되지 않아.</p>

      <div className="flex flex-col gap-2.5 pt-1">
        <button
          type="button"
          onClick={onStay}
          className="
            min-h-touch w-full rounded-2xl border-3 border-outline bg-energy px-4 py-3
            font-title text-2xl text-outline shadow-hard transition-transform
            active:translate-y-1 active:shadow-none
          "
        >
          계속 풀기
        </button>
        <button
          type="button"
          onClick={onLeave}
          className="
            min-h-touch w-full rounded-2xl border-3 border-outline bg-panel px-4 py-3
            font-title text-xl text-paper shadow-hard transition-transform
            active:translate-y-1 active:shadow-none
          "
        >
          나갈래
        </button>
      </div>
    </div>
  )
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
      <path
        d="M15 5l-7 7 7 7"
        fill="none"
        stroke="#FFF6E5"
        strokeWidth={3.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** 시간을 재는 판에서 잠깐 스치는 피드백. 버튼이 없어 손이 멈추지 않는다. */
function QuickFeedback({ result, streak }: { result: AnswerResult; streak?: number }) {
  return (
    <div className="flex w-full flex-col gap-2">
      {streak === undefined ? null : <ComboBadge streak={streak} />}
      <div
        role="status"
        aria-live="polite"
        className={`
        flex min-h-[72px] w-full items-center justify-center gap-3 rounded-3xl border-3
        border-outline p-4 shadow-hard
        ${result.correct ? 'bg-energy' : 'bg-paper'}
      `}
      >
        {result.correct ? (
          <p className="font-title text-2xl text-outline">좋아!</p>
        ) : (
          <p className="text-question text-outline">
            {'답은 '}
            <span className="text-number font-bold text-coral">{String(result.expected)}</span>
          </p>
        )}
      </div>
    </div>
  )
}

function InputArea({
  question,
  typed,
  onTyped,
  onSubmit,
}: {
  question: Question
  typed: string
  onTyped: (next: string) => void
  onSubmit: (given: AnswerValue) => void
}) {
  switch (question.inputType) {
    case 'choice':
      return <ChoiceGrid choices={question.choices ?? []} onPick={onSubmit} />
    case 'order':
      return (
        <OrderPicker
          // 문제가 바뀌면 고른 순서를 비운다
          key={question.id}
          items={orderItems(question)}
          {...(ORDER_ENDS[question.templateId] === undefined
            ? {}
            : { ends: ORDER_ENDS[question.templateId] })}
          onSubmit={(order) => onSubmit(order)}
        />
      )
    default:
      return <NumPad value={typed} onChange={onTyped} onSubmit={() => onSubmit(typed)} />
  }
}

/** 순서 배열 문제에서 아이가 누를 조각들. 문제 문장에 적힌 순서 그대로 보여준다. */
function orderItems(question: Question): readonly AnswerScalar[] {
  const answer = question.answer
  if (!Array.isArray(answer)) return []

  const lines = question.prompt.split('\n')
  const shown = lines[lines.length - 1] ?? ''
  const parsed = shown
    .split(',')
    .map((piece) => Number(piece.trim()))
    .filter((value) => Number.isFinite(value))

  return parsed.length === answer.length ? parsed : (answer as readonly AnswerScalar[])
}
