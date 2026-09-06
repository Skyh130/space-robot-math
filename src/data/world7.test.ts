import { describe, expect, it } from 'vitest'

import { generateQuestion } from '../engine/generator'
import { describeIssues, findTemplateIssues } from '../engine/validate'
import {
  w7BossDecimal,
  w7BossFraction,
  w7BossTanks,
  w7Lv1ReadFraction,
  w7Lv2UnitCompare,
  w7Lv3SameDenominator,
  w7Lv4FractionToDecimal,
  w7Lv4ReadDecimal,
  w7Lv5CompareDecimal,
  w7Lv5Word,
  world7Templates,
} from './world7'

const SEEDS = Array.from({ length: 300 }, (_, i) => i + 1)

/** '3/4' 나 '0.7' 을 견줄 수 있는 수로 바꾼다. 테스트에서만 쓴다. */
function valueOf(text: string): number {
  const fraction = /^(\d+)\/(\d+)$/.exec(text)
  if (fraction) return Number(fraction[1]) / Number(fraction[2])
  return Number(text)
}

describe('월드 7 — 템플릿 검사', () => {
  for (const template of world7Templates) {
    it(`${template.id} 는 어떤 파라미터에서도 성립한다`, () => {
      const issues = findTemplateIssues(template)
      expect(issues.length, describeIssues(issues)).toBe(0)
    })
  }

  it('설계서의 레벨 구성과 맞는다', () => {
    const levels = new Set(world7Templates.map((t) => t.level))
    expect([...levels].sort()).toEqual([1, 2, 3, 4, 5, 'boss'])
    for (const template of world7Templates) expect(template.world).toBe(7)
  })

  it('시각 자료 비중이 다른 월드의 두 배다 (설계서 5장 주의)', () => {
    const withFigure = world7Templates.filter((t) => t.figure !== undefined)
    expect(withFigure.length / world7Templates.length).toBeGreaterThanOrEqual(0.6)
  })
})

describe('분수', () => {
  it('Lv1 은 색칠한 칸과 전체 칸을 그대로 분수로 쓴다', () => {
    for (const seed of SEEDS) {
      const q = generateQuestion(w7Lv1ReadFraction, seed)
      const figure = q.figure
      expect(figure?.kind).toBe('fractionBars')
      if (figure?.kind !== 'fractionBars') continue
      const bar = figure.bars[0]
      expect(q.answer).toBe(`${String(bar?.filled)}/${String(bar?.parts)}`)
      // 전부 칠하면 1이라 분수로 물을 것이 없다
      expect(bar?.filled).toBeLessThan(bar?.parts ?? 0)
    }
  })

  it('Lv1 보기에 분자·분모를 뒤집은 값이 들어간다', () => {
    let flipped = 0
    for (const seed of SEEDS) {
      const q = generateQuestion(w7Lv1ReadFraction, seed)
      const [num, den] = String(q.answer).split('/')
      if ((q.choices ?? []).includes(`${String(den)}/${String(num)}`)) flipped += 1
    }
    expect(flipped).toBeGreaterThan(SEEDS.length / 2)
  })

  it('Lv2 단위분수는 아래 수가 클수록 작다', () => {
    for (const seed of SEEDS) {
      const q = generateQuestion(w7Lv2UnitCompare, seed)
      const figure = q.figure
      if (figure?.kind !== 'fractionBars') continue
      const values = figure.bars.map((bar) => valueOf(bar.label))
      const want = q.prompt.includes('작은') ? Math.min(...values) : Math.max(...values)
      expect(valueOf(String(q.answer))).toBeCloseTo(want)
    }
  })

  it('Lv3 은 분모가 같은 둘을 견준다', () => {
    for (const seed of SEEDS) {
      const q = generateQuestion(w7Lv3SameDenominator, seed)
      const figure = q.figure
      if (figure?.kind !== 'fractionBars') continue
      const [first, second] = figure.bars
      expect(first?.parts).toBe(second?.parts)
      const want = q.prompt.includes('작은')
        ? Math.min(first?.filled ?? 0, second?.filled ?? 0)
        : Math.max(first?.filled ?? 0, second?.filled ?? 0)
      expect(q.answer).toBe(`${String(want)}/${String(first?.parts)}`)
    }
  })
})

describe('소수', () => {
  it('소수 정답은 언제나 소수점 뒤 한 자리다', () => {
    for (const template of [w7Lv4ReadDecimal, w7Lv4FractionToDecimal, w7Lv5Word, w7BossDecimal]) {
      for (const seed of SEEDS.slice(0, 60)) {
        const q = generateQuestion(template, seed)
        expect(String(q.answer)).toMatch(/^\d+\.\d$/)
      }
    }
  })

  it('소수 문제는 소수점 키가 있는 입력을 쓴다', () => {
    for (const template of [w7Lv4ReadDecimal, w7Lv4FractionToDecimal, w7Lv5Word, w7BossDecimal]) {
      expect(template.inputType, template.id).toBe('decimal')
    }
  })

  it('Lv4 는 열 칸 중 색칠한 칸을 0.1 씩으로 읽는다', () => {
    for (const seed of SEEDS.slice(0, 120)) {
      const q = generateQuestion(w7Lv4ReadDecimal, seed)
      const figure = q.figure
      if (figure?.kind !== 'fractionBars') continue
      const bar = figure.bars[0]
      expect(bar?.parts).toBe(10)
      expect(q.answer).toBe(((bar?.filled ?? 0) / 10).toFixed(1))
    }
  })

  it('Lv4 는 1/10 을 0.1 로 잇는다', () => {
    for (const seed of SEEDS.slice(0, 120)) {
      const q = generateQuestion(w7Lv4FractionToDecimal, seed)
      const [, num] = /(\d+)\/10/.exec(q.prompt) ?? []
      expect(q.answer).toBe((Number(num) / 10).toFixed(1))
    }
  })

  it('Lv5 소수 더하기는 0.1 단위로 떨어진다', () => {
    for (const seed of SEEDS.slice(0, 120)) {
      const q = generateQuestion(w7Lv5Word, seed)
      const found = [...q.prompt.matchAll(/(\d+\.\d)L/g)].map((m) => Number(m[1]))
      const total = Math.round((found[0] ?? 0) * 10 + (found[1] ?? 0) * 10) / 10
      expect(q.answer).toBe(total.toFixed(1))
    }
  })

  it('Lv5 비교는 그림에 적힌 값과 맞는다', () => {
    for (const seed of SEEDS) {
      const q = generateQuestion(w7Lv5CompareDecimal, seed)
      const figure = q.figure
      if (figure?.kind !== 'fractionBars') continue
      const values = figure.bars.map((bar) => Number(bar.label))
      const want = q.prompt.includes('적은') ? Math.min(...values) : Math.max(...values)
      expect(Number(q.answer)).toBe(want)
    }
  })
})

describe('보스 — 분수와 소수를 섞어 견준다', () => {
  it('탱크 셋 중 가장 많은(적은) 것을 고른다', () => {
    for (const seed of SEEDS) {
      const q = generateQuestion(w7BossTanks, seed)
      const figure = q.figure
      if (figure?.kind !== 'fractionBars') continue
      expect(figure.bars).toHaveLength(3)
      const values = figure.bars.map((bar) => bar.filled)
      const want = q.prompt.includes('적은') ? Math.min(...values) : Math.max(...values)
      expect(Number(q.answer)).toBeCloseTo(want / 10)
    }
  })

  it('탱크 표시에 분수와 소수가 함께 나온다 (설계서 5장)', () => {
    for (const seed of SEEDS.slice(0, 120)) {
      const q = generateQuestion(w7BossTanks, seed)
      const figure = q.figure
      if (figure?.kind !== 'fractionBars') continue
      const labels = figure.bars.map((bar) => bar.label)
      expect(labels.some((label) => label.includes('/'))).toBe(true)
      expect(labels.some((label) => label.includes('.'))).toBe(true)
    }
  })

  it('보스 분수 문제의 답이 그림과 맞는다', () => {
    for (const seed of SEEDS.slice(0, 120)) {
      const q = generateQuestion(w7BossFraction, seed)
      const figure = q.figure
      if (figure?.kind !== 'fractionBars') continue
      const bar = figure.bars[0]
      expect(q.answer).toBe(`${String(bar?.filled)}/${String(bar?.parts)}`)
    }
  })
})
