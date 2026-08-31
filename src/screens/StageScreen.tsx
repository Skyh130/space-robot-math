import { useState } from 'react'

import { ChoiceGrid } from '../components/ChoiceGrid'
import { Feedback } from '../components/Feedback'
import { NumPad } from '../components/NumPad'
import { QuestionCard } from '../components/QuestionCard'
import { checkAnswer, type AnswerResult, type AnswerValue, type Question } from '../engine'

/**
 * 문제를 푸는 화면.
 *
 * Phase 2는 하드코딩한 문제 하나를 끝까지 푸는 것까지다.
 * 스테이지 8문제 연결과 진행 인디케이터는 Phase 3에서 붙인다.
 */

/** Phase 2용 하드코딩 문제. 설계서 5장 W3 Lv4 모양이다. */
const DEMO_QUESTION: Question = {
  id: 'demo_w3_lv4#0001',
  templateId: 'demo_w3_lv4',
  world: 3,
  level: 4,
  skill: 'multiplication_blank',
  inputType: 'numpad',
  prompt: '4 × □ = 28',
  params: { a: 4, b: 7 },
  answer: 7,
  hint: '4단을 순서대로 세어 볼까?',
}

export function StageScreen() {
  const [typed, setTyped] = useState('')
  const [result, setResult] = useState<AnswerResult | null>(null)

  const question = DEMO_QUESTION

  const submit = (given: AnswerValue) => setResult(checkAnswer(question, given))

  const reset = () => {
    setResult(null)
    setTyped('')
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <QuestionCard prompt={question.prompt} />

      {result === null ? (
        <InputArea question={question} typed={typed} onTyped={setTyped} onSubmit={submit} />
      ) : (
        <Feedback
          result={result}
          visual={result.correct ? undefined : <SkipCountHint step={4} times={7} />}
          onRetry={reset}
          onNext={reset}
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
  if (question.inputType === 'choice') {
    return <ChoiceGrid choices={question.choices ?? []} onPick={onSubmit} />
  }
  return <NumPad value={typed} onChange={onTyped} onSubmit={() => onSubmit(typed)} />
}

/**
 * 뛰어 세기 그림 힌트.
 *
 * 답만 알려주면 다음에 또 틀린다. 4씩 묶음을 늘어놓고 세어 가는 방법을 보여준다.
 * (설계서 6장 오답 시 그림 힌트)
 */
function SkipCountHint({ step, times }: { step: number; times: number }) {
  const box = 30
  const gap = 6
  const width = times * box + (times - 1) * gap
  const height = box + 20

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-auto w-full"
      role="img"
      aria-label={`${step}씩 ${times}묶음을 세는 그림`}
    >
      {Array.from({ length: times }, (_, index) => {
        const x = index * (box + gap)
        return (
          <g key={index}>
            <rect
              x={x}
              y={0}
              width={box}
              height={box}
              rx={6}
              fill="#FFF6E5"
              stroke="#101838"
              strokeWidth={2}
            />
            {Array.from({ length: step }, (_, dot) => (
              <circle
                key={dot}
                cx={x + 9 + (dot % 2) * 12}
                cy={9 + Math.floor(dot / 2) * 12}
                r={3.5}
                fill="#4FD1C5"
                stroke="#101838"
                strokeWidth={1.5}
              />
            ))}
            <text
              x={x + box / 2}
              y={height - 3}
              textAnchor="middle"
              fontSize={11}
              fontWeight="bold"
              fill="#101838"
            >
              {step * (index + 1)}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
