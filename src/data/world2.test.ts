import { describe, expect, it } from 'vitest'

import { generateQuestion } from '../engine/generator'
import { describeIssues, findTemplateIssues } from '../engine/validate'
import {
  borrowCount,
  carryCount,
  w2Lv1AddSmall,
  w2Lv2AddCarry,
  w2Lv2SubBorrow,
  w2Lv3Add,
  w2Lv3Sub,
  w2Lv4Add,
  w2Lv4Sub,
  w2Lv5AddBlank,
  w2Lv5SubBlank,
  w2Lv5WordAdd,
  w2Lv5WordSub,
  world2Templates,
} from './world2'

const SEEDS = Array.from({ length: 200 }, (_, i) => i + 1)

describe('자리올림·자리내림 세기', () => {
  it('올림이 없는 덧셈', () => {
    expect(carryCount(21, 5)).toBe(0)
    expect(carryCount(123, 456)).toBe(0)
  })

  it('올림이 한 번', () => {
    expect(carryCount(37, 45)).toBe(1)
    expect(carryCount(245, 132)).toBe(0)
    expect(carryCount(245, 138)).toBe(1)
  })

  it('올림이 두 번', () => {
    expect(carryCount(476, 358)).toBe(2)
    expect(carryCount(66, 69)).toBe(2)
  })

  it('내림이 없는 뺄셈', () => {
    expect(borrowCount(58, 23)).toBe(0)
    expect(borrowCount(999, 111)).toBe(0)
  })

  it('내림이 한 번', () => {
    expect(borrowCount(52, 28)).toBe(1)
  })

  it('내림이 두 번', () => {
    expect(borrowCount(502, 167)).toBe(2)
    expect(borrowCount(300, 111)).toBe(2)
  })
})

describe('월드 2 — 템플릿 검사', () => {
  for (const template of world2Templates) {
    it(`${template.id} 는 어떤 파라미터에서도 성립한다`, () => {
      const issues = findTemplateIssues(template, { sampleCount: 6000 })
      expect(issues.length, describeIssues(issues)).toBe(0)
    })
  }

  it('설계서의 레벨 구성과 맞는다', () => {
    const levels = new Set(world2Templates.map((t) => t.level))
    expect([...levels].sort()).toEqual([1, 2, 3, 4, 5, 'boss'])
    for (const template of world2Templates) expect(template.world).toBe(2)
  })

  it('Lv1~Lv2 는 4지선다, Lv3 부터는 숫자 입력이다', () => {
    for (const template of world2Templates) {
      if (template.level === 1 || template.level === 2) {
        expect(template.inputType, template.id).toBe('choice')
      } else {
        expect(template.inputType, template.id).toBe('numpad')
      }
    }
  })
})

describe('Lv1 — 받아올림 없는 덧셈', () => {
  it('정답이 실제 합이고 올림이 없다', () => {
    for (const seed of SEEDS) {
      const q = generateQuestion(w2Lv1AddSmall, seed)
      const a = q.params['a'] as number
      const b = q.params['b'] as number
      expect(q.answer, q.prompt).toBe(a + b)
      expect(carryCount(a, b), q.prompt).toBe(0)
      expect(b).toBeLessThanOrEqual(9)
    }
  })
})

describe('Lv2 — 받아올림/내림 1회', () => {
  it('덧셈은 올림이 정확히 한 번이고 답이 두 자리다', () => {
    for (const seed of SEEDS) {
      const q = generateQuestion(w2Lv2AddCarry, seed)
      const a = q.params['a'] as number
      const b = q.params['b'] as number
      expect(carryCount(a, b), q.prompt).toBe(1)
      expect(q.answer).toBe(a + b)
      expect(q.answer as number).toBeLessThanOrEqual(99)
    }
  })

  it('뺄셈은 내림이 정확히 한 번이고 답이 0 이상이다', () => {
    for (const seed of SEEDS) {
      const q = generateQuestion(w2Lv2SubBorrow, seed)
      const a = q.params['a'] as number
      const b = q.params['b'] as number
      expect(borrowCount(a, b), q.prompt).toBe(1)
      expect(q.answer).toBe(a - b)
      expect(q.answer as number).toBeGreaterThan(0)
    }
  })
})

describe('Lv3·Lv4 — 세 자리', () => {
  it('Lv3 덧셈은 올림 1회, Lv4 덧셈은 2회', () => {
    for (const seed of SEEDS) {
      const three = generateQuestion(w2Lv3Add, seed)
      expect(carryCount(three.params['a'] as number, three.params['b'] as number)).toBe(1)
      expect(three.answer as number).toBeLessThanOrEqual(999)

      const four = generateQuestion(w2Lv4Add, seed)
      expect(carryCount(four.params['a'] as number, four.params['b'] as number)).toBe(2)
      expect(four.answer as number).toBeLessThanOrEqual(999)
    }
  })

  it('Lv3 뺄셈은 내림 1회, Lv4 뺄셈은 2회', () => {
    for (const seed of SEEDS) {
      const three = generateQuestion(w2Lv3Sub, seed)
      expect(borrowCount(three.params['a'] as number, three.params['b'] as number)).toBe(1)
      expect(three.answer as number).toBeGreaterThan(0)

      const four = generateQuestion(w2Lv4Sub, seed)
      expect(borrowCount(four.params['a'] as number, four.params['b'] as number)).toBe(2)
      expect(four.answer as number).toBeGreaterThan(0)
    }
  })
})

describe('Lv5 — □ 있는 식과 문장제', () => {
  it('□에 정답을 넣으면 식이 맞는다', () => {
    for (const seed of SEEDS) {
      const add = generateQuestion(w2Lv5AddBlank, seed)
      const [left, right] = add.prompt.split(' = ')
      const a = Number((left ?? '').split(' + ')[0])
      expect(a + (add.answer as number), add.prompt).toBe(Number(right))

      const sub = generateQuestion(w2Lv5SubBlank, seed)
      const [subLeft, subRight] = sub.prompt.split(' = ')
      const subA = Number((subLeft ?? '').split(' − ')[0])
      expect(subA - (sub.answer as number), sub.prompt).toBe(Number(subRight))
    }
  })

  it('문장제 답이 문장의 수와 맞는다', () => {
    for (const seed of SEEDS) {
      const add = generateQuestion(w2Lv5WordAdd, seed)
      expect(add.answer).toBe((add.params['a'] as number) + (add.params['b'] as number))

      const sub = generateQuestion(w2Lv5WordSub, seed)
      expect(sub.answer).toBe((sub.params['a'] as number) - (sub.params['b'] as number))
      expect(sub.answer as number).toBeGreaterThan(0)
    }
  })

  it('문장이 2학년이 읽을 길이다', () => {
    for (const template of [w2Lv5WordAdd, w2Lv5WordSub]) {
      for (const seed of SEEDS.slice(0, 30)) {
        const q = generateQuestion(template, seed)
        for (const line of q.prompt.split('\n')) {
          expect(line.length, q.prompt).toBeLessThanOrEqual(22)
        }
      }
    }
  })
})

describe('세로셈 그림 힌트', () => {
  it('모든 계산 문제에 세로셈 힌트가 붙는다', () => {
    for (const template of world2Templates) {
      const q = generateQuestion(template, 1)
      expect(q.hintVisual, template.id).toBeDefined()
      expect(q.hintVisual?.kind, template.id).toBe('columnMath')
    }
  })

  it('세로셈 힌트가 음수가 되지 않는다', () => {
    for (const template of world2Templates) {
      for (const seed of SEEDS) {
        const visual = generateQuestion(template, seed).hintVisual
        if (visual?.kind !== 'columnMath') continue
        if (visual.operation === 'subtract') {
          expect(visual.left, `${template.id} ${String(seed)}`).toBeGreaterThanOrEqual(visual.right)
        }
      }
    }
  })
})
