import { describe, expect, it } from 'vitest'

import { generateQuestion } from '../engine/generator'
import { describeIssues, findTemplateIssues } from '../engine/validate'
import {
  w3BossCharge,
  w3Lv1EasyTables,
  w3Lv2MiddleTables,
  w3Lv3HardTables,
  w3Lv4Blank,
  w3Lv4Mixed,
  w3Lv5WordAnswer,
  w3Lv5WordEquation,
  world3Templates,
} from './world3'

const SEEDS = Array.from({ length: 300 }, (_, i) => i + 1)

describe('월드 3 — 템플릿 검사', () => {
  for (const template of world3Templates) {
    it(`${template.id} 는 어떤 파라미터에서도 성립한다`, () => {
      const issues = findTemplateIssues(template)
      expect(issues.length, describeIssues(issues)).toBe(0)
    })
  }

  it('설계서의 레벨 구성과 맞는다', () => {
    const levels = new Set(world3Templates.map((t) => t.level))
    expect([...levels].sort()).toEqual([1, 2, 3, 4, 5, 'boss'])
    for (const template of world3Templates) expect(template.world).toBe(3)
  })

  it('설계서가 정한 입력 방식과 맞는다', () => {
    // Lv1 4지선다 / Lv2~Lv4 숫자 입력 / Lv5 둘 다 / 보스 4지선다
    expect(w3Lv1EasyTables.inputType).toBe('choice')
    expect(w3Lv2MiddleTables.inputType).toBe('numpad')
    expect(w3Lv3HardTables.inputType).toBe('numpad')
    expect(w3Lv4Mixed.inputType).toBe('numpad')
    expect(w3Lv4Blank.inputType).toBe('numpad')
    expect(w3Lv5WordAnswer.inputType).toBe('numpad')
    expect(w3Lv5WordEquation.inputType).toBe('choice')
    expect(w3BossCharge.inputType).toBe('choice')
  })
})

describe('단 나누기 — 설계서 5장', () => {
  it('Lv1 은 2단과 5단만 낸다', () => {
    const tables = new Set(
      SEEDS.map((seed) => Number(generateQuestion(w3Lv1EasyTables, seed).prompt.split(' × ')[0])),
    )
    expect([...tables].sort((a, b) => a - b)).toEqual([2, 5])
  })

  it('Lv2 는 3·4·6단만 낸다', () => {
    const tables = new Set(
      SEEDS.map((seed) => Number(generateQuestion(w3Lv2MiddleTables, seed).prompt.split(' × ')[0])),
    )
    expect([...tables].sort((a, b) => a - b)).toEqual([3, 4, 6])
  })

  it('Lv3 은 7·8·9단만 낸다', () => {
    const tables = new Set(
      SEEDS.map((seed) => Number(generateQuestion(w3Lv3HardTables, seed).prompt.split(' × ')[0])),
    )
    expect([...tables].sort((a, b) => a - b)).toEqual([7, 8, 9])
  })

  it('Lv4 는 전체를 섞는다', () => {
    const tables = new Set(
      SEEDS.map((seed) => Number(generateQuestion(w3Lv4Mixed, seed).prompt.split(' × ')[0])),
    )
    expect([...tables].sort((a, b) => a - b)).toEqual([2, 3, 4, 5, 6, 7, 8, 9])
  })
})

describe('정답 검증', () => {
  it('구구단 문제의 답이 실제 곱이다', () => {
    for (const template of [w3Lv1EasyTables, w3Lv2MiddleTables, w3Lv3HardTables, w3Lv4Mixed, w3BossCharge]) {
      for (const seed of SEEDS) {
        const q = generateQuestion(template, seed)
        const [left, right] = q.prompt.replace(' = ?', '').split(' × ').map(Number)
        expect(q.answer, `${template.id} ${q.prompt}`).toBe((left as number) * (right as number))
      }
    }
  })

  it('□ 채우기의 답을 넣으면 식이 맞는다', () => {
    for (const seed of SEEDS) {
      const q = generateQuestion(w3Lv4Blank, seed)
      const a = q.params['a'] as number
      const product = Number(q.prompt.split(' = ')[1])
      expect(a * (q.answer as number), q.prompt).toBe(product)
    }
  })

  it('문장제의 답이 두 수의 곱이다', () => {
    for (const seed of SEEDS) {
      const q = generateQuestion(w3Lv5WordAnswer, seed)
      expect(q.answer).toBe((q.params['a'] as number) * (q.params['b'] as number))
    }
  })

  it('식 세우기의 정답이 문장의 두 수로 만든 곱셈식이다', () => {
    for (const seed of SEEDS) {
      const q = generateQuestion(w3Lv5WordEquation, seed)
      expect(q.answer).toBe(`${String(q.params['a'])} × ${String(q.params['b'])}`)
      // 보기에 곱셈식이 아닌 것도 섞여야 식을 고르는 문제가 된다
      const shapes = new Set((q.choices ?? []).map((c) => String(c).replace(/\d+/g, 'n')))
      expect(shapes.size, q.prompt).toBeGreaterThan(1)
    }
  })
})

describe('보기', () => {
  it('4지선다 문제는 늘 보기 4개를 채운다', () => {
    for (const template of [w3Lv1EasyTables, w3Lv5WordEquation, w3BossCharge]) {
      for (const seed of SEEDS) {
        expect(generateQuestion(template, seed).choices, template.id).toHaveLength(4)
      }
    }
  })

  it('오답이 전부 설명 가능한 실수다', () => {
    for (const seed of SEEDS) {
      const q = generateQuestion(w3BossCharge, seed)
      const a = q.params['a'] as number
      const b = q.params['b'] as number
      const answer = a * b
      const explainable = new Set([a + b, a * (b + 1), a * (b - 1), answer - 1, answer + 1])
      for (const choice of q.choices ?? []) {
        if (choice === answer) continue
        expect(explainable, `${q.prompt} 의 보기 ${String(choice)}`).toContain(choice)
      }
    }
  })
})

describe('그림 힌트', () => {
  it('모든 문제에 묶음 그림이 붙는다', () => {
    for (const template of world3Templates) {
      const visual = generateQuestion(template, 1).hintVisual
      expect(visual?.kind, template.id).toBe('dotGroups')
    }
  })

  it('묶음 그림이 화면에 담길 크기다', () => {
    for (const template of world3Templates) {
      for (const seed of SEEDS.slice(0, 60)) {
        const visual = generateQuestion(template, seed).hintVisual
        if (visual?.kind !== 'dotGroups') continue
        expect(visual.times, template.id).toBeLessThanOrEqual(9)
        expect(visual.step, template.id).toBeLessThanOrEqual(9)
      }
    }
  })
})

describe('문장 길이', () => {
  it('한 줄이 2학년이 읽을 길이다', () => {
    for (const template of [w3Lv5WordAnswer, w3Lv5WordEquation]) {
      for (const seed of SEEDS.slice(0, 60)) {
        const q = generateQuestion(template, seed)
        for (const line of q.prompt.split('\n')) {
          expect(line.length, q.prompt).toBeLessThanOrEqual(20)
        }
      }
    }
  })
})
