import { createRng, hashSeed, type Rng } from './rng'
import type {
  AnswerResult,
  AnswerScalar,
  AnswerValue,
  AnyQuestionTemplate,
  Question,
} from './types'

/**
 * 템플릿 + 시드 → 문제 인스턴스.
 *
 * 순수 함수다. 같은 템플릿에 같은 시드를 주면 언제나 같은 문제가 나온다.
 */

export type GenerateOptions = {
  /**
   * 최근에 낸 문제 id 들. 같은 세션에서 같은 파라미터 조합이 반복되지 않게 피한다.
   * (설계서 4장) 피할 수 없으면 반복을 허용한다. 문제를 못 내는 것보다는 낫다.
   */
  readonly recent?: readonly string[]
  /** 파라미터를 다시 뽑아 볼 횟수. 조건이 까다로운 템플릿을 위해 넉넉히 잡는다. */
  readonly maxAttempts?: number
}

const DEFAULT_MAX_ATTEMPTS = 200
const DEFAULT_CHOICE_COUNT = 4

export function generateQuestion(
  template: AnyQuestionTemplate,
  seed: number,
  options: GenerateOptions = {},
): Question {
  const recent = options.recent ?? []
  const maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS

  // 템플릿마다 다른 수열을 쓴다. 같은 시드로 여러 템플릿을 돌려도 겹치지 않는다.
  const rng = createRng((seed ^ hashSeed(template.id)) >>> 0)

  const keys = Object.keys(template.params)
  let fallback: Readonly<Record<string, number>> | null = null

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const params = sampleParams(template, keys, rng)
    if (template.valid && !template.valid(params)) continue

    // 조건은 통과했으니 최소한 이건 쓸 수 있다
    fallback ??= params

    if (!recent.includes(instanceId(template.id, keys, params))) {
      return build(template, params, keys, rng)
    }
  }

  if (fallback === null) {
    throw new Error(
      `${template.id}: ${maxAttempts}번 뽑았는데 valid 를 통과한 파라미터가 없다. ` +
        '구간과 조건이 서로 맞지 않는다.',
    )
  }

  // 최근에 낸 것과 겹치더라도 문제는 내야 한다
  return build(template, fallback, keys, rng)
}

function sampleParams(
  template: AnyQuestionTemplate,
  keys: readonly string[],
  rng: Rng,
): Readonly<Record<string, number>> {
  const params: Record<string, number> = {}
  for (const key of keys) {
    const range = template.params[key]
    if (!range) {
      throw new Error(`${template.id}: 파라미터 ${key} 의 구간이 없다.`)
    }
    const [min, max] = range
    params[key] = rng.int(min, max)
  }
  return params
}

/**
 * 뽑힌 파라미터로 문제 하나를 만든다.
 *
 * generateQuestion 과 템플릿 검사기(validate.ts)가 같은 길을 쓰도록 밖으로 뺐다.
 * 검사기가 다른 길로 만들면, 검사에서 통과한 템플릿이 실제로는 터질 수 있다.
 */
export function composeQuestion(
  template: AnyQuestionTemplate,
  params: Readonly<Record<string, number>>,
  rng: Rng,
): Question {
  return build(template, params, Object.keys(template.params), rng)
}

function build(
  template: AnyQuestionTemplate,
  params: Readonly<Record<string, number>>,
  keys: readonly string[],
  rng: Rng,
): Question {
  const answer = template.answer(params)
  const question: Question = {
    id: instanceId(template.id, keys, params),
    templateId: template.id,
    world: template.world,
    level: template.level,
    skill: template.skill,
    inputType: template.inputType,
    prompt: template.render(params),
    params,
    answer,
    hint: template.hint(params),
    ...(template.hintVisual === undefined ? {} : { hintVisual: template.hintVisual(params) }),
    ...(template.inputType === 'choice'
      ? { choices: buildChoices(template, params, answer, rng) }
      : {}),
  }
  return question
}

/**
 * 4지선다 보기를 만든다.
 *
 * 오답은 전부 실수 기반이다. 규칙이 모자라 보기를 채우지 못하면 무작위로 메우지 않고
 * 오류를 낸다. 여기서 대충 넘기면 아이가 계산 대신 소거법으로 답을 맞히게 된다.
 */
function buildChoices(
  template: AnyQuestionTemplate,
  params: Readonly<Record<string, number>>,
  answer: AnswerValue,
  rng: Rng,
): readonly AnswerValue[] {
  const wanted = template.choiceCount ?? DEFAULT_CHOICE_COUNT
  const rules = template.distractors ?? []

  if (rules.length === 0) {
    throw new Error(`${template.id}: 4지선다인데 distractors 가 없다.`)
  }

  const used = new Set<string>([answerKey(answer)])
  const wrong: AnswerValue[] = []

  for (const rule of rules) {
    if (wrong.length >= wanted - 1) break

    const candidate = rule.wrong(params, answer)
    if (candidate === null || !isUsableChoice(candidate)) continue

    const key = answerKey(candidate)
    if (used.has(key)) continue

    used.add(key)
    wrong.push(candidate)
  }

  if (wrong.length < wanted - 1) {
    throw new Error(
      `${template.id}: 오답 보기가 ${wanted - 1}개 필요한데 ${wrong.length}개만 나왔다 ` +
        `(파라미터 ${JSON.stringify(params)}). 실수 유형 규칙을 더 달아야 한다.`,
    )
  }

  return rng.shuffle([answer, ...wrong])
}

/** 초2~3이 답으로 쓸 수 있는 값인지 본다. 음수와 소수는 보기에 넣지 않는다. */
function isUsableChoice(value: AnswerValue): boolean {
  if (Array.isArray(value)) {
    return value.length > 0 && value.every((item) => isUsableScalar(item))
  }
  return isUsableScalar(value as AnswerScalar)
}

function isUsableScalar(value: AnswerScalar): boolean {
  if (typeof value === 'number') {
    return Number.isInteger(value) && value >= 0
  }
  return value.length > 0
}

/**
 * 인스턴스 id. `w2_lv4#8821` 꼴이다. (설계서 8장 wrongQueue)
 * 같은 파라미터 조합이면 언제나 같은 id 가 나와 중복 출제를 걸러낼 수 있다.
 */
function instanceId(
  templateId: string,
  keys: readonly string[],
  params: Readonly<Record<string, number>>,
): string {
  const signature = keys.map((key) => `${key}=${String(params[key])}`).join(',')
  const digits = hashSeed(signature) % 10000
  return `${templateId}#${String(digits).padStart(4, '0')}`
}

/** 값 비교용 키. 숫자 72 와 문자열 '72' 를 같은 것으로 본다. */
function answerKey(value: AnswerValue): string {
  if (Array.isArray(value)) {
    return value.map((item) => scalarKey(item as AnswerScalar)).join('|')
  }
  return scalarKey(value as AnswerScalar)
}

function scalarKey(value: AnswerScalar): string {
  if (typeof value === 'number') return String(value)
  const trimmed = value.trim()
  // 숫자패드 입력은 문자열로 들어온다. '072' 와 72 를 같게 본다.
  return /^-?\d+$/.test(trimmed) ? String(Number(trimmed)) : trimmed
}

/** 답이 같은지 본다. 순서 배열 문제는 순서까지 같아야 한다. */
export function isSameAnswer(given: AnswerValue, expected: AnswerValue): boolean {
  if (Array.isArray(given) !== Array.isArray(expected)) return false
  if (Array.isArray(given) && Array.isArray(expected) && given.length !== expected.length) {
    return false
  }
  return answerKey(given) === answerKey(expected)
}

/**
 * 채점한다.
 * 틀렸을 때 정답만 던지지 않고 한 줄 이유를 함께 준다. (CLAUDE.md UI 규격)
 */
export function checkAnswer(question: Question, given: AnswerValue): AnswerResult {
  const correct = isSameAnswer(given, question.answer)
  return {
    correct,
    given,
    expected: question.answer,
    hint: correct ? '' : question.hint,
    skill: question.skill,
  }
}
