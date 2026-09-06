import { describe, expect, it } from 'vitest'

import { generateQuestion } from '../engine/generator'
import { describeIssues, findTemplateIssues } from '../engine/validate'
import {
  w6BossLeftover,
  w6BossMultiply,
  w6BossSeats,
  w6Lv1HowMany,
  w6Lv1Share,
  w6Lv2Divide,
  w6Lv2FromMultiply,
  w6Lv3MultiplyCarry,
  w6Lv3MultiplyNoCarry,
  w6Lv4Quotient,
  w6Lv4Remainder,
  w6Lv5LongDivide,
  w6Lv5Word,
  world6Templates,
} from './world6'

const SEEDS = Array.from({ length: 300 }, (_, i) => i + 1)

describe('월드 6 — 템플릿 검사', () => {
  for (const template of world6Templates) {
    it(`${template.id} 는 어떤 파라미터에서도 성립한다`, () => {
      const issues = findTemplateIssues(template)
      expect(issues.length, describeIssues(issues)).toBe(0)
    })
  }

  it('설계서의 레벨 구성과 맞는다', () => {
    const levels = new Set(world6Templates.map((t) => t.level))
    expect([...levels].sort()).toEqual([1, 2, 3, 4, 5, 'boss'])
    for (const template of world6Templates) expect(template.world).toBe(6)
  })
})

describe('나누기 — 그림으로 먼저 보여준다 (설계서 5장 힌트)', () => {
  it('Lv1 은 문제에 ○ 묶음을 붙인다', () => {
    for (const template of [w6Lv1Share, w6Lv1HowMany]) {
      for (const seed of SEEDS.slice(0, 60)) {
        const q = generateQuestion(template, seed)
        expect(q.figure?.kind).toBe('dotGroups')
      }
    }
  })

  it('Lv1 묶음 그림이 문제의 수와 맞는다', () => {
    for (const seed of SEEDS) {
      const q = generateQuestion(w6Lv1Share, seed)
      const figure = q.figure
      if (figure?.kind !== 'dotGroups') continue
      const [, total] = /구슬 (\d+)개/.exec(q.prompt) ?? []
      expect(figure.step * figure.times).toBe(Number(total))
      expect(q.answer).toBe(figure.step)
    }
  })

  it('Lv2 는 나눗셈을 바르게 푼다', () => {
    for (const seed of SEEDS) {
      const q = generateQuestion(w6Lv2Divide, seed)
      const [, a, b] = /(\d+) ÷ (\d+)/.exec(q.prompt) ?? []
      expect(Number(a) % Number(b)).toBe(0)
      expect(q.answer).toBe(Number(a) / Number(b))
    }
  })

  it('Lv2 곱셈식 문제는 위에 준 식을 거꾸로 읽은 값이 답이다', () => {
    for (const seed of SEEDS.slice(0, 120)) {
      const q = generateQuestion(w6Lv2FromMultiply, seed)
      const [, a, b] = /^(\d+) × (\d+) = (\d+)/.exec(q.prompt) ?? []
      expect(q.answer).toBe(Number(a))
      expect(Number(b)).toBeGreaterThan(0)
    }
  })
})

describe('두 자리 곱셈', () => {
  it('Lv3 앞 템플릿은 올림이 없고, 뒤 템플릿은 올림이 있다', () => {
    for (const seed of SEEDS) {
      const easy = generateQuestion(w6Lv3MultiplyNoCarry, seed)
      const [, ea, eb] = /(\d+) × (\d+)/.exec(easy.prompt) ?? []
      expect((Number(ea) % 10) * Number(eb)).toBeLessThan(10)
      expect(easy.answer).toBe(Number(ea) * Number(eb))

      const hard = generateQuestion(w6Lv3MultiplyCarry, seed)
      const [, ha, hb] = /(\d+) × (\d+)/.exec(hard.prompt) ?? []
      expect((Number(ha) % 10) * Number(hb)).toBeGreaterThanOrEqual(10)
      expect(hard.answer).toBe(Number(ha) * Number(hb))
    }
  })
})

describe('나머지', () => {
  it('나머지는 언제나 나누는 수보다 작다', () => {
    for (const seed of SEEDS) {
      const q = generateQuestion(w6Lv4Remainder, seed)
      const [, a, b] = /(\d+) ÷ (\d+)/.exec(q.prompt) ?? []
      expect(q.answer).toBe(Number(a) % Number(b))
      expect(Number(q.answer)).toBeLessThan(Number(b))
      expect(Number(q.answer)).toBeGreaterThan(0)
    }
  })

  it('몫과 나머지가 같은 식에서 나온다', () => {
    for (const seed of SEEDS.slice(0, 120)) {
      const q = generateQuestion(w6Lv4Quotient, seed)
      const [, a, b] = /(\d+) ÷ (\d+)/.exec(q.prompt) ?? []
      expect(q.answer).toBe(Math.floor(Number(a) / Number(b)))
    }
  })

  it('Lv5 두 자리 나눗셈은 나머지 없이 떨어진다', () => {
    for (const seed of SEEDS) {
      const q = generateQuestion(w6Lv5LongDivide, seed)
      const [, a, b] = /(\d+) ÷ (\d+)/.exec(q.prompt) ?? []
      expect(Number(a) % Number(b)).toBe(0)
      expect(Number(a)).toBeLessThan(100)
      expect(q.answer).toBe(Number(a) / Number(b))
    }
  })

  it('Lv5 문장제도 나눗셈이 떨어진다', () => {
    for (const seed of SEEDS.slice(0, 120)) {
      const q = generateQuestion(w6Lv5Word, seed)
      const [, total] = /(\d+)개를/.exec(q.prompt) ?? []
      const [, boxes] = /(\d+)개에 똑같이/.exec(q.prompt) ?? []
      expect(Number(total) % Number(boxes)).toBe(0)
      expect(q.answer).toBe(Number(total) / Number(boxes))
    }
  })
})

describe('보스 — 나머지를 어떻게 할 것인가 (설계서 5장)', () => {
  it('남는 대원이 있으면 우주선이 한 대 더 필요하다', () => {
    for (const seed of SEEDS) {
      const q = generateQuestion(w6BossSeats, seed)
      const [, people] = /대원 (\d+)명이/.exec(q.prompt) ?? []
      const [, per] = /(\d+)명씩/.exec(q.prompt) ?? []
      expect(Number(people) % Number(per)).not.toBe(0)
      expect(q.answer).toBe(Math.ceil(Number(people) / Number(per)))
    }
  })

  it('마지막 우주선에 타는 사람 수는 나머지다', () => {
    for (const seed of SEEDS) {
      const q = generateQuestion(w6BossLeftover, seed)
      const [, people] = /대원 (\d+)명이/.exec(q.prompt) ?? []
      const [, per] = /(\d+)명씩/.exec(q.prompt) ?? []
      expect(q.answer).toBe(Number(people) % Number(per))
    }
  })

  it('보스 곱셈은 올림이 있는 것만 낸다', () => {
    for (const seed of SEEDS) {
      const q = generateQuestion(w6BossMultiply, seed)
      const [, seats] = /좌석 (\d+)개짜리/.exec(q.prompt) ?? []
      const [, ships] = /(\d+)대 있어/.exec(q.prompt) ?? []
      expect((Number(seats) % 10) * Number(ships)).toBeGreaterThanOrEqual(10)
      expect(q.answer).toBe(Number(seats) * Number(ships))
    }
  })
})
