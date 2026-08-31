import { generateQuestion } from './generator'
import { hashSeed } from './rng'
import type { AnyQuestionTemplate, Question } from './types'

/**
 * 스테이지 하나에 낼 문제를 만든다.
 *
 * 한 스테이지는 문제 8개다. (설계서 1장)
 * 스테이지에 템플릿이 여럿이면 돌아가며 내고, 같은 파라미터 조합이 반복되지 않게
 * 앞서 낸 문제를 계속 넘겨 준다.
 */

export const QUESTIONS_PER_STAGE = 8

export type BuildStageOptions = {
  readonly count?: number
  /** 이전 세션에서 넘어온 복습 문제 등, 앞에 끼워 넣을 문제. */
  readonly leading?: readonly Question[]
}

export function buildStage(
  templates: readonly AnyQuestionTemplate[],
  seed: number,
  options: BuildStageOptions = {},
): Question[] {
  const count = options.count ?? QUESTIONS_PER_STAGE
  if (templates.length === 0) {
    throw new Error('문제 템플릿이 없는 스테이지는 만들 수 없다.')
  }

  const questions: Question[] = [...(options.leading ?? [])]
  const asked = questions.map((question) => question.id)

  for (let index = questions.length; index < count; index += 1) {
    // 템플릿을 돌아가며 쓴다. 한 종류만 여덟 번 나오면 지겹다.
    const template = templates[index % templates.length] as AnyQuestionTemplate
    const question = generateQuestion(template, seed + index * 7919, { recent: asked })
    questions.push(question)
    asked.push(question.id)
  }

  return questions.slice(0, count)
}

/** 스테이지마다 다른 시드를 쓰되, 같은 스테이지를 다시 하면 다른 문제가 나오게 한다. */
export function stageSeed(worldId: number, level: number | string, attempt: number): number {
  return (hashSeed(`w${String(worldId)}_lv${String(level)}`) + attempt * 104729) >>> 0
}

/**
 * 별 개수. 8문제 중 6개↑ ★ / 7개↑ ★★ / 8개 ★★★ (설계서 1장)
 * 문제 수가 다른 스테이지는 기준을 따로 넘긴다. (W3 보스는 12문제다)
 */
export function starsFor(
  correct: number,
  total: number = QUESTIONS_PER_STAGE,
  thresholds?: readonly [number, number, number],
): 0 | 1 | 2 | 3 {
  const [one, two, three] = thresholds ?? [total - 2, total - 1, total]
  if (correct >= three) return 3
  if (correct >= two) return 2
  if (correct >= one) return 1
  return 0
}
