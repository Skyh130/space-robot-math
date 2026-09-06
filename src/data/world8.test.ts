import { describe, expect, it } from 'vitest'

import { generateQuestion } from '../engine/generator'
import { describeIssues, findTemplateIssues } from '../engine/validate'
import {
  w8BossRound1,
  w8BossRound2,
  w8BossRound2Time,
  w8BossRound3,
  w8BossRound3Remainder,
  w8Lv1ReadTable,
  w8Lv1TableTotal,
  w8Lv2GraphDiff,
  w8Lv2ReadGraph,
  w8Lv3MultiplyRule,
  w8Lv3NumberRule,
  w8Lv3ShapeRule,
  w8Lv4Tally,
  w8Lv5AddThenDivide,
  w8Lv5MultiplyThenSubtract,
  world8Templates,
} from './world8'

const SEEDS = Array.from({ length: 300 }, (_, i) => i + 1)

describe('월드 8 — 템플릿 검사', () => {
  for (const template of world8Templates) {
    it(`${template.id} 는 어떤 파라미터에서도 성립한다`, () => {
      const issues = findTemplateIssues(template)
      expect(issues.length, describeIssues(issues)).toBe(0)
    })
  }

  it('설계서의 레벨 구성과 맞는다', () => {
    const levels = new Set(world8Templates.map((t) => t.level))
    expect([...levels].sort()).toEqual([1, 2, 3, 4, 5, 'boss'])
    for (const template of world8Templates) expect(template.world).toBe(8)
  })
})

describe('표와 그래프', () => {
  it('Lv1 은 표에 적힌 값을 그대로 답한다', () => {
    for (const seed of SEEDS) {
      const q = generateQuestion(w8Lv1ReadTable, seed)
      const figure = q.figure
      if (figure?.kind !== 'dataTable') continue
      const [, who] = /^(\S+) 대원의/.exec(q.prompt) ?? []
      const row = figure.rows.find((r) => r[0] === who)
      expect(q.answer).toBe(Number(row?.[1]))
    }
  })

  it('Lv1 합계는 표의 모든 수를 더한 값이다', () => {
    for (const seed of SEEDS.slice(0, 120)) {
      const q = generateQuestion(w8Lv1TableTotal, seed)
      const figure = q.figure
      if (figure?.kind !== 'dataTable') continue
      const sum = figure.rows.reduce((total, row) => total + Number(row[1]), 0)
      expect(q.answer).toBe(sum)
    }
  })

  it('Lv2 는 막대 높이를 그대로 읽는다', () => {
    for (const seed of SEEDS) {
      const q = generateQuestion(w8Lv2ReadGraph, seed)
      const figure = q.figure
      if (figure?.kind !== 'barChart') continue
      const [, who] = /^(\S+) 대원의/.exec(q.prompt) ?? []
      expect(q.answer).toBe(figure.bars.find((bar) => bar.label === who)?.value)
    }
  })

  it('Lv2 차이 문제는 막대가 모두 다른 높이다', () => {
    for (const seed of SEEDS) {
      const q = generateQuestion(w8Lv2GraphDiff, seed)
      const figure = q.figure
      if (figure?.kind !== 'barChart') continue
      const values = figure.bars.map((bar) => bar.value)
      expect(new Set(values).size).toBe(values.length)
      expect(q.answer).toBe(Math.max(...values) - Math.min(...values))
    }
  })

  it('Lv4 는 합계에서 빼면 빈칸이 나온다', () => {
    for (const seed of SEEDS) {
      const q = generateQuestion(w8Lv4Tally, seed)
      const figure = q.figure
      if (figure?.kind !== 'dataTable') continue
      // 합계는 문장에, 아는 값은 표에 있다
      const total = Number(/모두 (\d+)개/.exec(q.prompt)?.[1])
      const known = figure.rows
        .filter((row) => row[1] !== '?')
        .reduce((sum, row) => sum + Number(row[1]), 0)
      expect(q.answer).toBe(total - known)
      // 빈칸이 정확히 하나여야 답이 하나로 정해진다
      expect(figure.rows.filter((row) => row[1] === '?')).toHaveLength(1)
    }
  })
})

describe('규칙 찾기', () => {
  it('수 배열은 같은 폭으로 뛴다', () => {
    for (const seed of SEEDS) {
      const q = generateQuestion(w8Lv3NumberRule, seed)
      const values = (q.prompt.split('\n')[0] ?? '')
        .replace(', □', '')
        .split(', ')
        .map(Number)
      const step = (values[1] ?? 0) - (values[0] ?? 0)
      for (let i = 1; i < values.length; i += 1) {
        expect((values[i] ?? 0) - (values[i - 1] ?? 0)).toBe(step)
      }
      expect(q.answer).toBe((values[values.length - 1] ?? 0) + step)
    }
  })

  it('곱셈 배열도 같은 폭으로 뛴다', () => {
    for (const seed of SEEDS.slice(0, 120)) {
      const q = generateQuestion(w8Lv3MultiplyRule, seed)
      const values = (q.prompt.split('\n')[0] ?? '')
        .replace(', □', '')
        .split(', ')
        .map(Number)
      const step = values[0] ?? 0
      expect(q.answer).toBe(step * (values.length + 1))
    }
  })

  it('도형 배열의 답이 규칙과 맞는다', () => {
    const nameOf: Record<string, string> = {
      triangle: '삼각형',
      square: '정사각형',
      circle: '원',
    }
    for (const seed of SEEDS) {
      const q = generateQuestion(w8Lv3ShapeRule, seed)
      const figure = q.figure
      if (figure?.kind !== 'shapePattern') continue
      const shape = figure.items[figure.blankAt]
      expect(q.answer).toBe(nameOf[shape ?? ''])
      // 빈칸 앞에 규칙이 한 바퀴는 다 보여야 찾을 수 있다
      expect(figure.blankAt).toBeGreaterThanOrEqual(3)
    }
  })
})

describe('복합 문장제', () => {
  it('곱한 뒤 빼는 문제가 두 단계를 거친다', () => {
    for (const seed of SEEDS) {
      const q = generateQuestion(w8Lv5MultiplyThenSubtract, seed)
      const [, boxes] = /상자 (\d+)개/.exec(q.prompt) ?? []
      const [, each] = /부품이 (\d+)개씩/.exec(q.prompt) ?? []
      const [, used] = /(\d+)개를 썼다면/.exec(q.prompt) ?? []
      expect(q.answer).toBe(Number(boxes) * Number(each) - Number(used))
      expect(Number(q.answer)).toBeGreaterThan(0)
    }
  })

  it('더한 뒤 나누는 문제는 나머지 없이 떨어진다', () => {
    for (const seed of SEEDS) {
      const q = generateQuestion(w8Lv5AddThenDivide, seed)
      const [, a] = /통을 (\d+)개 찾고/.exec(q.prompt) ?? []
      const [, b] = /(\d+)개를 더 찾았어/.exec(q.prompt) ?? []
      const [, groups] = /(\d+)대에 똑같이/.exec(q.prompt) ?? []
      expect((Number(a) + Number(b)) % Number(groups)).toBe(0)
      expect(q.answer).toBe((Number(a) + Number(b)) / Number(groups))
    }
  })
})

describe('최종 보스 — 3라운드 (설계서 5장)', () => {
  it('라운드마다 묻는 것이 다르다', () => {
    const round1 = generateQuestion(w8BossRound1, 1)
    const round2 = generateQuestion(w8BossRound2, 1)
    const round3 = generateQuestion(w8BossRound3, 1)
    expect(round1.prompt).toContain('×')
    expect(round2.prompt).toContain('둘레')
    expect(round3.prompt).toContain('나누면')
  })

  it('1라운드 곱셈은 올림이 있다', () => {
    for (const seed of SEEDS) {
      const q = generateQuestion(w8BossRound1, seed)
      const [, a, b] = /(\d+) × (\d+)/.exec(q.prompt) ?? []
      expect((Number(a) % 10) * Number(b)).toBeGreaterThanOrEqual(10)
      expect(q.answer).toBe(Number(a) * Number(b))
    }
  })

  it('2라운드 둘레는 mm 로 답한다', () => {
    for (const seed of SEEDS.slice(0, 120)) {
      const q = generateQuestion(w8BossRound2, seed)
      const [, side] = /한 변이 (\d+)cm/.exec(q.prompt) ?? []
      const [, sides] = /변 (\d+)개/.exec(q.prompt) ?? []
      expect(q.answer).toBe(Number(side) * Number(sides) * 10)
    }
  })

  it('2라운드 시간은 60분을 넘기면 0부터 다시 센다', () => {
    for (const seed of SEEDS.slice(0, 120)) {
      const q = generateQuestion(w8BossRound2Time, seed)
      const [, m] = /시 (\d+)분에/.exec(q.prompt) ?? []
      const [, add] = /(\d+)분 동안/.exec(q.prompt) ?? []
      expect(q.answer).toBe((Number(m) + Number(add)) % 60)
    }
  })

  it('3라운드는 곱하고 나누는 두 단계다', () => {
    for (const seed of SEEDS) {
      const q = generateQuestion(w8BossRound3, seed)
      const [, boxes] = /상자 (\d+)개/.exec(q.prompt) ?? []
      const [, each] = /(\d+)발씩/.exec(q.prompt) ?? []
      const [, per] = /포 (\d+)문/.exec(q.prompt) ?? []
      expect((Number(boxes) * Number(each)) % Number(per)).toBe(0)
      expect(q.answer).toBe((Number(boxes) * Number(each)) / Number(per))
    }
  })

  it('3라운드 나머지 문제는 남는 사람까지 태운다', () => {
    for (const seed of SEEDS) {
      const q = generateQuestion(w8BossRound3Remainder, seed)
      const [, people] = /대원 (\d+)명을/.exec(q.prompt) ?? []
      const [, per] = /(\d+)명씩/.exec(q.prompt) ?? []
      expect(q.answer).toBe(Math.ceil(Number(people) / Number(per)))
    }
  })
})
