import { composeQuestion } from './generator'
import { createRng } from './rng'
import type { AnyQuestionTemplate, ParamRange, Question } from './types'

/**
 * 템플릿 검사기.
 *
 * 문제 은행은 파라미터 조합의 곱만큼 커진다. 손으로 몇 개 눌러 보고 넘기면
 * 수천 가지 중 어딘가에서 정답이 어긋나거나 보기가 모자라 화면이 죽는다.
 * 아이가 문제를 푸는 중에 터지는 것이 이 게임에서 가장 나쁜 실패다.
 *
 * 그래서 월드 데이터마다 이 검사기를 돌린다. 조합 수가 적으면 전수로,
 * 많으면 정해진 시드로 표본을 뽑아 검사한다.
 */

export type TemplateIssue = {
  readonly templateId: string
  readonly params: Readonly<Record<string, number>>
  readonly problem: string
}

export type ValidateOptions = {
  /** 이 수보다 조합이 적으면 전수 검사한다. */
  readonly exhaustiveLimit?: number
  /** 전수로 못 볼 때 뽑아 볼 표본 수. */
  readonly sampleCount?: number
  /** 답이 이 값보다 크면 아이가 풀 문제가 아니라고 본다. */
  readonly maxAnswer?: number
}

const DEFAULT_EXHAUSTIVE_LIMIT = 40000
const DEFAULT_SAMPLE_COUNT = 4000
const DEFAULT_MAX_ANSWER = 100000

export function findTemplateIssues(
  template: AnyQuestionTemplate,
  options: ValidateOptions = {},
): TemplateIssue[] {
  const exhaustiveLimit = options.exhaustiveLimit ?? DEFAULT_EXHAUSTIVE_LIMIT
  const sampleCount = options.sampleCount ?? DEFAULT_SAMPLE_COUNT
  const maxAnswer = options.maxAnswer ?? DEFAULT_MAX_ANSWER

  const issues: TemplateIssue[] = []
  const combos = enumerateParams(template, exhaustiveLimit) ?? sampleParams(template, sampleCount)

  let validCount = 0

  for (const params of combos) {
    if (template.valid && !template.valid(params)) continue
    validCount += 1

    let question: Question
    try {
      // 보기 순서만 정하는 난수라 검사 결과가 시드에 흔들리지 않는다
      question = composeQuestion(template, params, createRng(1))
    } catch (error) {
      issues.push({
        templateId: template.id,
        params,
        problem: error instanceof Error ? error.message : String(error),
      })
      continue
    }

    for (const problem of inspect(question, maxAnswer)) {
      issues.push({ templateId: template.id, params, problem })
    }
  }

  if (validCount === 0) {
    issues.push({
      templateId: template.id,
      params: {},
      problem: 'valid 를 통과하는 파라미터 조합이 하나도 없다.',
    })
  }

  return issues
}

function inspect(question: Question, maxAnswer: number): string[] {
  const problems: string[] = []

  if (question.prompt.trim() === '') problems.push('문제 문장이 비어 있다.')
  if (question.hint.trim() === '') problems.push('힌트가 비어 있다.')
  if (question.prompt.includes('undefined') || question.prompt.includes('NaN')) {
    problems.push(`문제 문장이 깨졌다: ${question.prompt}`)
  }
  if (question.hint.includes('undefined') || question.hint.includes('NaN')) {
    problems.push(`힌트가 깨졌다: ${question.hint}`)
  }

  for (const problem of inspectAnswer(question.answer, maxAnswer)) {
    problems.push(problem)
  }

  if (question.inputType === 'choice') {
    const choices = question.choices ?? []
    if (choices.length < 2) {
      problems.push('4지선다인데 보기가 모자란다.')
    }
    const keys = choices.map((choice) => String(choice))
    if (new Set(keys).size !== keys.length) {
      problems.push(`보기가 겹친다: ${keys.join(', ')}`)
    }
    const answerKey = String(question.answer)
    if (!keys.includes(answerKey)) {
      problems.push(`보기 안에 정답 ${answerKey} 가 없다.`)
    }
    for (const choice of choices) {
      if (typeof choice === 'number' && (!Number.isInteger(choice) || choice < 0)) {
        problems.push(`보기에 쓸 수 없는 값이 있다: ${String(choice)}`)
      }
    }
  } else if (question.choices !== undefined) {
    problems.push('숫자 입력 문제인데 보기가 붙어 있다.')
  }

  for (const problem of inspectHintVisual(question)) {
    problems.push(problem)
  }

  return problems
}

function inspectHintVisual(question: Question): string[] {
  const visual = question.hintVisual
  if (visual === undefined) return []

  switch (visual.kind) {
    case 'placeValue':
      return Number.isInteger(visual.value) && visual.value >= 0
        ? []
        : [`그림 힌트의 수가 이상하다: ${String(visual.value)}`]
    case 'placeValueCompare':
      return [visual.left, visual.right].every((v) => Number.isInteger(v) && v >= 0)
        ? []
        : ['그림 힌트의 비교 대상이 이상하다.']
    case 'numberLine': {
      if (visual.values.length === 0) return ['그림 힌트의 수직선이 비어 있다.']
      if (!visual.values.every((v) => Number.isInteger(v) && v >= 0)) {
        return ['그림 힌트의 수직선에 이상한 수가 있다.']
      }
      if (visual.highlight !== undefined && !visual.values.includes(visual.highlight)) {
        return ['그림 힌트에서 강조할 수가 수직선 위에 없다.']
      }
      return []
    }
    case 'dotGroups':
      return visual.step > 0 && visual.times > 0 && visual.step * visual.times <= 200
        ? []
        : [`그림 힌트의 묶음이 이상하다: ${String(visual.step)}씩 ${String(visual.times)}묶음`]
  }
}

function inspectAnswer(answer: Question['answer'], maxAnswer: number): string[] {
  const values = Array.isArray(answer) ? answer : [answer]
  if (values.length === 0) return ['정답이 비어 있다.']

  const problems: string[] = []
  for (const value of values) {
    if (typeof value === 'string') {
      if (value.trim() === '') problems.push('정답 문자열이 비어 있다.')
      continue
    }
    if (!Number.isFinite(value)) {
      problems.push(`정답이 수가 아니다: ${String(value)}`)
    } else if (!Number.isInteger(value)) {
      problems.push(`정답이 정수가 아니다: ${String(value)}`)
    } else if (value < 0) {
      problems.push(`정답이 음수다: ${String(value)}. 초등 2~3학년 범위가 아니다.`)
    } else if (value > maxAnswer) {
      problems.push(`정답이 너무 크다: ${String(value)}`)
    }
  }
  return problems
}

/** 파라미터 조합을 전부 만든다. 너무 많으면 null 을 준다. */
function enumerateParams(
  template: AnyQuestionTemplate,
  limit: number,
): Readonly<Record<string, number>>[] | null {
  const keys = Object.keys(template.params)
  const ranges: ParamRange[] = []

  let total = 1
  for (const key of keys) {
    const range = template.params[key]
    if (!range) return null
    ranges.push(range)
    total *= range[1] - range[0] + 1
    if (total > limit) return null
  }

  let combos: Record<string, number>[] = [{}]
  keys.forEach((key, index) => {
    const range = ranges[index]
    if (!range) return
    const next: Record<string, number>[] = []
    for (const combo of combos) {
      for (let value = range[0]; value <= range[1]; value += 1) {
        next.push({ ...combo, [key]: value })
      }
    }
    combos = next
  })

  return combos
}

/** 전수로 못 볼 때. 시드를 고정해 검사 결과가 매번 같도록 한다. */
function sampleParams(
  template: AnyQuestionTemplate,
  count: number,
): Readonly<Record<string, number>>[] {
  const rng = createRng(20260101)
  const keys = Object.keys(template.params)
  const samples: Record<string, number>[] = []

  for (let i = 0; i < count; i += 1) {
    const params: Record<string, number> = {}
    for (const key of keys) {
      const range = template.params[key]
      if (!range) continue
      params[key] = rng.int(range[0], range[1])
    }
    samples.push(params)
  }
  return samples
}

/** 검사 결과를 사람이 읽을 수 있게 줄인다. */
export function describeIssues(issues: readonly TemplateIssue[], limit = 10): string {
  if (issues.length === 0) return ''
  const shown = issues.slice(0, limit).map((issue) => {
    const params = Object.entries(issue.params)
      .map(([key, value]) => `${key}=${String(value)}`)
      .join(' ')
    return `  [${issue.templateId}] ${params} → ${issue.problem}`
  })
  const rest = issues.length > limit ? `\n  ... 그리고 ${issues.length - limit}건 더` : ''
  return `\n${shown.join('\n')}${rest}`
}
