import { describe, expect, it } from 'vitest'

import { generateQuestion } from '../engine/generator'
import { describeIssues, findTemplateIssues } from '../engine/validate'
import {
  w5BossMm,
  w5BossPerimeter,
  w5BossPick,
  w5Lv1Name,
  w5Lv2Edges,
  w5Lv2Vertices,
  w5Lv3CmToMm,
  w5Lv3Measure,
  w5Lv3MeasureMm,
  w5Lv4RightAngle,
  w5Lv5AddLength,
  w5Lv5Perimeter,
  world5Templates,
} from './world5'

const SEEDS = Array.from({ length: 300 }, (_, i) => i + 1)

describe('월드 5 — 템플릿 검사', () => {
  for (const template of world5Templates) {
    it(`${template.id} 는 어떤 파라미터에서도 성립한다`, () => {
      const issues = findTemplateIssues(template)
      expect(issues.length, describeIssues(issues)).toBe(0)
    })
  }

  it('설계서의 레벨 구성과 맞는다', () => {
    const levels = new Set(world5Templates.map((t) => t.level))
    expect([...levels].sort()).toEqual([1, 2, 3, 4, 5, 'boss'])
    for (const template of world5Templates) expect(template.world).toBe(5)
  })
})

describe('도형', () => {
  it('Lv1 에는 정사각형과 직사각형을 함께 내지 않는다', () => {
    // 둘 다 변이 4개라 "변이 4개" 를 물으면 답이 둘이 된다. 가르는 것은 Lv4 의 일이다.
    for (const seed of SEEDS.slice(0, 120)) {
      const choices = (generateQuestion(w5Lv1Name, seed).choices ?? []).map(String)
      expect(choices.includes('정사각형') && choices.includes('직사각형')).toBe(false)
    }
  })

  it('Lv1 은 그림과 이름이 맞는다', () => {
    const byShape: Record<string, string> = {
      triangle: '삼각형',
      square: '사각형',
      pentagon: '오각형',
      hexagon: '육각형',
      circle: '원',
    }
    for (const seed of SEEDS) {
      const q = generateQuestion(w5Lv1Name, seed)
      const figure = q.figure
      expect(figure?.kind).toBe('shape')
      if (figure?.kind !== 'shape') continue
      expect(q.answer).toBe(byShape[figure.shape])
    }
  })

  it('Lv1 보기에 같은 이름이 두 번 나오지 않는다', () => {
    for (const seed of SEEDS.slice(0, 120)) {
      const choices = generateQuestion(w5Lv1Name, seed).choices ?? []
      expect(new Set(choices).size).toBe(choices.length)
    }
  })

  it('Lv2 변과 꼭짓점은 도형마다 같은 수다', () => {
    const sides: Record<string, number> = {
      triangle: 3,
      square: 4,
      pentagon: 5,
      hexagon: 6,
    }
    for (const seed of SEEDS.slice(0, 120)) {
      for (const template of [w5Lv2Edges, w5Lv2Vertices]) {
        const q = generateQuestion(template, seed)
        const figure = q.figure
        if (figure?.kind !== 'shape') continue
        expect(q.answer).toBe(sides[figure.shape])
        // 원은 내지 않는다. 변도 꼭짓점도 없어 셀 것이 없다
        expect(figure.shape).not.toBe('circle')
      }
    }
  })

  it('Lv4 는 직각이 있는 도형에만 직각 표시를 붙인다', () => {
    const hasRight = new Set(['square', 'rectangle', 'rightTriangle'])
    for (const seed of SEEDS.slice(0, 120)) {
      const q = generateQuestion(w5Lv4RightAngle, seed)
      const figure = q.figure
      if (figure?.kind !== 'shape') continue
      expect(figure.marks === 'rightAngle').toBe(hasRight.has(figure.shape))
    }
  })
})

describe('길이', () => {
  it('Lv3 자 그림의 막대 길이가 곧 정답이다', () => {
    for (const seed of SEEDS.slice(0, 120)) {
      const cmQ = generateQuestion(w5Lv3Measure, seed)
      if (cmQ.figure?.kind === 'ruler') expect(cmQ.figure.lengthMm).toBe(Number(cmQ.answer) * 10)

      const mmQ = generateQuestion(w5Lv3MeasureMm, seed)
      if (mmQ.figure?.kind === 'ruler') expect(mmQ.figure.lengthMm).toBe(mmQ.answer)
    }
  })

  it('자 위 막대는 10cm 자를 넘지 않는다', () => {
    for (const template of [w5Lv3Measure, w5Lv3MeasureMm]) {
      for (const seed of SEEDS) {
        const q = generateQuestion(template, seed)
        if (q.figure?.kind === 'ruler') expect(q.figure.lengthMm).toBeLessThanOrEqual(100)
      }
    }
  })

  it('cm 를 mm 로 바꾸면 10배다', () => {
    for (const seed of SEEDS.slice(0, 120)) {
      const q = generateQuestion(w5Lv3CmToMm, seed)
      const [, cm, mm] = /(\d+)cm (\d+)mm/.exec(q.prompt) ?? []
      expect(q.answer).toBe(Number(cm) * 10 + Number(mm))
    }
  })

  it('Lv5 길이 더하기는 m 를 cm 로 바꿔 더한다', () => {
    for (const seed of SEEDS.slice(0, 120)) {
      const q = generateQuestion(w5Lv5AddLength, seed)
      const found = [...q.prompt.matchAll(/(\d+)m (\d+)cm/g)]
      const total = found.reduce((sum, m) => sum + Number(m[1]) * 100 + Number(m[2]), 0)
      expect(q.answer).toBe(total)
    }
  })

  it('Lv5 둘레는 한 변 × 변의 수다', () => {
    for (const seed of SEEDS.slice(0, 120)) {
      const q = generateQuestion(w5Lv5Perimeter, seed)
      const [, side] = /한 변이 (\d+)cm/.exec(q.prompt) ?? []
      const [, sides] = /변이 (\d+)개/.exec(q.prompt) ?? []
      expect(q.answer).toBe(Number(side) * Number(sides))
    }
  })
})

describe('보스', () => {
  it('변의 수로 고르는 문제는 정답이 하나뿐이다', () => {
    // 정사각형과 직사각형은 둘 다 변이 4개다. 둘을 함께 내면 답이 둘이 된다.
    const sidesOf: Record<string, number> = {
      삼각형: 3,
      사각형: 4,
      오각형: 5,
      육각형: 6,
    }
    for (const seed of SEEDS) {
      const q = generateQuestion(w5BossPick, seed)
      const [, want] = /변이 (\d+)개인/.exec(q.prompt) ?? []
      const matching = (q.choices ?? []).filter((c) => sidesOf[String(c)] === Number(want))
      expect(matching, q.prompt).toHaveLength(1)
      expect(matching[0]).toBe(q.answer)
    }
  })

  it('둘레를 mm 로 답한다. 단위를 두 번 건넌다', () => {
    for (const seed of SEEDS.slice(0, 120)) {
      const q = generateQuestion(w5BossPerimeter, seed)
      const [, side] = /한 변이 (\d+)cm/.exec(q.prompt) ?? []
      const sides = q.prompt.includes('정사각형') ? 4 : 3
      expect(q.answer).toBe(Number(side) * sides * 10)
    }
  })

  it('보기에 단위를 헷갈린 값이 들어간다', () => {
    let confused = 0
    for (const seed of SEEDS) {
      const q = generateQuestion(w5BossMm, seed)
      const [, cm, mm] = /(\d+)cm (\d+)mm/.exec(q.prompt) ?? []
      if ((q.choices ?? []).includes(Number(cm) + Number(mm))) confused += 1
    }
    expect(confused).toBeGreaterThan(SEEDS.length / 2)
  })
})
