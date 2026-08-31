import { describe, expect, it } from 'vitest'

import { allFixtures, multiplicationChoice } from './fixtures'
import { defineTemplate } from './types'
import { describeIssues, findTemplateIssues } from './validate'

describe('findTemplateIssues', () => {
  it('멀쩡한 템플릿에서는 아무것도 찾지 않는다', () => {
    for (const template of allFixtures) {
      expect(findTemplateIssues(template), template.id).toEqual([])
    }
  })

  it('곱셈구구 64가지 조합을 전수로 본다', () => {
    // 표본이 아니라 전수여야 2 × 2 같은 구석이 빠지지 않는다
    expect(findTemplateIssues(multiplicationChoice)).toEqual([])
  })

  it('보기가 모자란 조합을 잡아낸다', () => {
    const broken = defineTemplate({
      id: 'bad_thin',
      world: 3,
      level: 1,
      skill: 'multiplication_table',
      inputType: 'choice',
      params: { a: [2, 9] },
      render: (p) => `${p.a} × 2 = ?`,
      answer: (p) => p.a * 2,
      hint: () => '2단이야.',
      distractors: [{ kind: 'off_by_one', wrong: (_p, answer) => (answer as number) + 1 }],
    })
    const issues = findTemplateIssues(broken)
    expect(issues.length).toBeGreaterThan(0)
    expect(issues[0]?.problem).toMatch(/오답 보기가/)
  })

  it('음수 정답을 잡아낸다', () => {
    const broken = defineTemplate({
      id: 'bad_negative',
      world: 2,
      level: 1,
      skill: 'subtraction_borrow',
      inputType: 'numpad',
      params: { a: [1, 5], b: [6, 9] },
      render: (p) => `${p.a} − ${p.b} = ?`,
      answer: (p) => p.a - p.b,
      hint: () => '빼 볼까?',
    })
    const issues = findTemplateIssues(broken)
    expect(issues.length).toBeGreaterThan(0)
    expect(issues[0]?.problem).toMatch(/음수/)
  })

  it('깨진 문장을 잡아낸다', () => {
    const broken = defineTemplate({
      id: 'bad_prompt',
      world: 1,
      level: 1,
      skill: 'number_read',
      inputType: 'numpad',
      params: { a: [1, 5] },
      render: (p) => `${p.a} 와 ${String((p as Record<string, number>)['없는키'])} 중에?`,
      answer: (p) => p.a,
      hint: () => '골라 봐.',
    })
    const issues = findTemplateIssues(broken)
    expect(issues.some((issue) => /깨졌다/.test(issue.problem))).toBe(true)
  })

  it('힌트가 비면 잡아낸다', () => {
    const broken = defineTemplate({
      id: 'bad_hint',
      world: 1,
      level: 1,
      skill: 'number_read',
      inputType: 'numpad',
      params: { a: [1, 5] },
      render: (p) => `${p.a} + 1 = ?`,
      answer: (p) => p.a + 1,
      hint: () => '   ',
    })
    expect(findTemplateIssues(broken).some((i) => /힌트/.test(i.problem))).toBe(true)
  })

  it('통과할 수 없는 조건을 잡아낸다', () => {
    const broken = defineTemplate({
      id: 'bad_impossible',
      world: 1,
      level: 1,
      skill: 'number_read',
      inputType: 'numpad',
      params: { a: [1, 5] },
      valid: (p) => p.a > 100,
      render: (p) => `${p.a} + 1 = ?`,
      answer: (p) => p.a + 1,
      hint: () => '더해 봐.',
    })
    expect(findTemplateIssues(broken).some((i) => /하나도 없다/.test(i.problem))).toBe(true)
  })
})

describe('describeIssues', () => {
  it('문제가 없으면 빈 문자열이다', () => {
    expect(describeIssues([])).toBe('')
  })

  it('파라미터와 함께 읽을 수 있게 줄인다', () => {
    const text = describeIssues([{ templateId: 't', params: { a: 3 }, problem: '터짐' }])
    expect(text).toContain('[t]')
    expect(text).toContain('a=3')
    expect(text).toContain('터짐')
  })
})
