import { generateQuestion } from './generator'
import type { AnyQuestionTemplate, Question } from './types'

/**
 * 한 판 안에서의 오답 재출제.
 *
 * 틀린 문제를 3문제 뒤에 숫자만 바꿔 다시 낸다. (설계서 3장)
 * 바로 다시 내면 방금 본 답을 그대로 쓰고, 끝에 몰아 내면 이미 잊는다.
 * 문제 수는 늘리지 않는다. 뒤에 예정돼 있던 문제 하나를 이것으로 바꾼다.
 */

export const REQUEUE_GAP = 3

export function requeueMissed(
  questions: readonly Question[],
  missedIndex: number,
  templates: readonly AnyQuestionTemplate[],
  seed: number,
  gap: number = REQUEUE_GAP,
): Question[] {
  const slot = missedIndex + gap
  const missed = questions[missedIndex]
  if (!missed || slot >= questions.length) return [...questions]

  const template = templates.find((candidate) => candidate.id === missed.templateId)
  if (!template) return [...questions]

  // 이미 낸 문제와 겹치지 않게, 그리고 방금 틀린 그 수 그대로는 나오지 않게 한다
  const recent = questions.map((question) => question.id)
  const replacement = generateQuestion(template, seed, { recent })
  if (replacement.id === missed.id) return [...questions]

  const next = [...questions]
  next[slot] = replacement
  return next
}
