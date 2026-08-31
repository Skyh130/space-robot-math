import { useState } from 'react'

import { ChoiceGrid } from '../components/ChoiceGrid'
import { Feedback } from '../components/Feedback'
import { HintVisualView } from '../components/HintVisual'
import { NumPad } from '../components/NumPad'
import { OrderPicker } from '../components/OrderPicker'
import { ProgressDots } from '../components/ProgressDots'
import { QuestionCard } from '../components/QuestionCard'
import {
  checkAnswer,
  type AnswerResult,
  type AnswerScalar,
  type AnswerValue,
  type Question,
  type SkillKey,
} from '../engine'

export type StageOutcome = {
  readonly correct: number
  readonly total: number
  /** 영역별 정답 기록. 부모 대시보드와 복습 편성의 근거가 된다. (설계서 8장) */
  readonly skillLog: readonly { readonly skill: SkillKey; readonly correct: boolean }[]
  /** 첫 시도에 틀린 문제. 세션 안 재출제와 다음 세션 복습에 쓴다. */
  readonly missed: readonly Question[]
}

type StageScreenProps = {
  questions: readonly Question[]
  /** "숫자 소행성대 · 2단계" 처럼 지금 어디인지 알려 준다. */
  label: string
  onFinish: (outcome: StageOutcome) => void
}

/**
 * 스테이지 한 판. 문제 8개를 차례로 푼다.
 *
 * 점수는 첫 시도만 센다. 틀리면 정답과 힌트를 보여주고 다시 풀게 하는데,
 * 이 재시도까지 점수에 넣으면 누구나 8개를 다 맞아 별이 뜻을 잃는다.
 * 재시도는 점수가 아니라 배우기 위한 것이다.
 */
export function StageScreen({ questions, label, onFinish }: StageScreenProps) {
  const [index, setIndex] = useState(0)
  const [typed, setTyped] = useState('')
  const [result, setResult] = useState<AnswerResult | null>(null)
  const [firstTry, setFirstTry] = useState(true)
  const [log, setLog] = useState<StageOutcome['skillLog']>([])
  const [missed, setMissed] = useState<Question[]>([])

  const question = questions[index]
  if (!question) {
    throw new Error('문제가 없는 스테이지다.')
  }

  const correctIndexes = log
    .map((entry, at) => (entry.correct ? at : -1))
    .filter((at) => at >= 0)

  const submit = (given: AnswerValue) => {
    const outcome = checkAnswer(question, given)
    setResult(outcome)

    if (firstTry) {
      setLog([...log, { skill: question.skill, correct: outcome.correct }])
      if (!outcome.correct) setMissed([...missed, question])
    }
    setFirstTry(false)
  }

  const retry = () => {
    setResult(null)
    setTyped('')
  }

  const next = () => {
    const done = index + 1 >= questions.length
    if (done) {
      onFinish({
        correct: log.filter((entry) => entry.correct).length,
        total: questions.length,
        skillLog: log,
        missed,
      })
      return
    }
    setIndex(index + 1)
    setTyped('')
    setResult(null)
    setFirstTry(true)
  }

  return (
    <div className="flex flex-1 flex-col gap-3 overflow-hidden p-4">
      <header className="flex flex-col items-center gap-2">
        <p className="font-title text-base text-paper/70">{label}</p>
        <ProgressDots total={questions.length} current={index} correct={correctIndexes} />
      </header>

      <QuestionCard prompt={question.prompt} />

      {result === null ? (
        <InputArea question={question} typed={typed} onTyped={setTyped} onSubmit={submit} />
      ) : (
        <Feedback
          result={result}
          {...(result.correct || question.hintVisual === undefined
            ? {}
            : { visual: <HintVisualView visual={question.hintVisual} /> })}
          onRetry={retry}
          onNext={next}
        />
      )}
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
          onSubmit={(order) => onSubmit(order)}
        />
      )
    default:
      return <NumPad value={typed} onChange={onTyped} onSubmit={() => onSubmit(typed)} />
  }
}

/** 순서 배열 문제에서 아이가 누를 조각들. 정답 순서 그대로 주면 답이 보이므로 섞는다. */
function orderItems(question: Question): readonly AnswerScalar[] {
  const answer = question.answer
  if (!Array.isArray(answer)) return []
  // 문제 문장에 적힌 순서 그대로 보여준다
  const lines = question.prompt.split('\n')
  const shown = lines[lines.length - 1] ?? ''
  const parsed = shown
    .split(',')
    .map((piece) => Number(piece.trim()))
    .filter((value) => Number.isFinite(value))

  return parsed.length === answer.length ? parsed : (answer as readonly AnswerScalar[])
}
