import { describe, expect, it } from 'vitest'

import { describeIssues, findTemplateIssues } from '../engine/validate'
import { generateQuestion } from '../engine/generator'
import { readNumberKo } from '../engine/korean'
import {
  w1BossSort3,
  w1BossSort4,
  w1Lv1ReadNumber,
  w1Lv2PlaceValue,
  w1Lv3SkipCounting,
  w1Lv4Compare,
  w1Lv4PlaceValue,
  w1Lv5MakeNumber,
  world1Templates,
} from './world1'

const SEEDS = Array.from({ length: 200 }, (_, i) => i + 1)

describe('월드 1 — 템플릿 검사', () => {
  for (const template of world1Templates) {
    it(`${template.id} 는 어떤 파라미터에서도 성립한다`, () => {
      const issues = findTemplateIssues(template)
      expect(issues.length, describeIssues(issues)).toBe(0)
    })
  }

  it('설계서의 레벨 구성과 맞는다', () => {
    const levels = new Set(world1Templates.map((t) => t.level))
    expect([...levels].sort()).toEqual([1, 2, 3, 4, 5, 'boss'])
    for (const template of world1Templates) {
      expect(template.world).toBe(1)
    }
  })
})

describe('Lv1 — 세 자리 수 읽고 쓰기', () => {
  it('한글로 읽은 수를 숫자로 고르게 한다', () => {
    for (const seed of SEEDS) {
      const q = generateQuestion(w1Lv1ReadNumber, seed)
      const number = q.answer as number
      expect(number).toBeGreaterThanOrEqual(100)
      expect(number).toBeLessThanOrEqual(999)
      expect(q.prompt).toContain(readNumberKo(number))
    }
  })

  it('보기가 모두 세 자리이거나, 0을 빠뜨린 두 자리다', () => {
    for (const seed of SEEDS) {
      const q = generateQuestion(w1Lv1ReadNumber, seed)
      for (const choice of q.choices ?? []) {
        expect(choice as number).toBeGreaterThanOrEqual(10)
        expect(choice as number).toBeLessThanOrEqual(999)
      }
    }
  })
})

describe('Lv2 — 세 자리 자릿값', () => {
  it('물어본 숫자의 자릿값이 정답이다', () => {
    for (const seed of SEEDS) {
      const q = generateQuestion(w1Lv2PlaceValue, seed)
      const { h, t, place } = q.params as Record<string, number>
      expect(q.answer).toBe(place === 1 ? (h as number) * 100 : (t as number) * 10)
    }
  })
})

describe('Lv3 — 뛰어 세기', () => {
  it('빈칸에 들어갈 수가 정답이다', () => {
    for (const seed of SEEDS) {
      const q = generateQuestion(w1Lv3SkipCounting, seed)
      const line = q.prompt.split('\n')[1] ?? ''
      const cells = line.split(', ')

      // 빈칸 자리에 정답을 넣으면 일정한 간격의 수열이 되어야 한다
      const filled = cells.map((cell) => (cell === '□' ? (q.answer as number) : Number(cell)))
      expect(filled.length).toBeGreaterThanOrEqual(3)
      expect(filled.length).toBeLessThanOrEqual(5)
      const gaps = filled.slice(1).map((value, index) => value - (filled[index] as number))
      expect(new Set(gaps).size, q.prompt).toBe(1)
      expect([10, 100]).toContain(gaps[0])
    }
  })

  it('빈칸이 정확히 하나다', () => {
    for (const seed of SEEDS) {
      const q = generateQuestion(w1Lv3SkipCounting, seed)
      expect((q.prompt.match(/□/g) ?? []).length).toBe(1)
    }
  })

  it('수열이 9999를 넘지 않는다', () => {
    for (const seed of SEEDS) {
      const q = generateQuestion(w1Lv3SkipCounting, seed)
      const line = q.prompt.split('\n')[1] ?? ''
      for (const cell of line.split(', ')) {
        if (cell === '□') continue
        expect(Number(cell)).toBeLessThanOrEqual(9999)
      }
    }
  })
})

describe('Lv4 — 네 자리 자릿값', () => {
  it('물어본 자리의 값이 정답이다', () => {
    for (const seed of SEEDS) {
      const q = generateQuestion(w1Lv4PlaceValue, seed)
      const p = q.params as Record<string, number>
      const digits = [p['o'], p['t'], p['h'], p['k']]
      const unit = [1, 10, 100, 1000][p['place'] as number] as number
      expect(q.answer).toBe((digits[p['place'] as number] as number) * unit)
    }
  })
})

describe('Lv4 — 크기 비교', () => {
  it('부등호가 실제 대소와 맞는다', () => {
    for (const seed of SEEDS) {
      const q = generateQuestion(w1Lv4Compare, seed)
      const line = q.prompt.split('\n')[1] ?? ''
      const [left, right] = line.split(' □ ').map(Number)
      const expected = (left as number) > (right as number) ? '>' : (left as number) < (right as number) ? '<' : '='
      expect(q.answer, q.prompt).toBe(expected)
    }
  })

  it('보기는 부등호 세 개뿐이다', () => {
    for (const seed of SEEDS) {
      const q = generateQuestion(w1Lv4Compare, seed)
      expect(q.choices).toHaveLength(3)
      expect([...(q.choices ?? [])].sort()).toEqual(['<', '=', '>'])
    }
  })

  it('= 도 실제로 나온다. 늘 다르기만 하면 =를 고를 일이 없다', () => {
    const answers = SEEDS.map((seed) => generateQuestion(w1Lv4Compare, seed).answer)
    expect(answers).toContain('=')
    expect(answers).toContain('>')
    expect(answers).toContain('<')
  })

  it('두 수 모두 네 자리다', () => {
    for (const seed of SEEDS) {
      const q = generateQuestion(w1Lv4Compare, seed)
      const line = q.prompt.split('\n')[1] ?? ''
      for (const value of line.split(' □ ').map(Number)) {
        expect(value).toBeGreaterThanOrEqual(1000)
        expect(value).toBeLessThanOrEqual(9999)
      }
    }
  })
})

describe('Lv5 — 숫자 카드로 수 만들기', () => {
  it('카드를 재배열한 수가 정답이다', () => {
    for (const seed of SEEDS) {
      const q = generateQuestion(w1Lv5MakeNumber, seed)
      const p = q.params as Record<string, number>
      const cards = [p['c1'], p['c2'], p['c3']] as number[]
      const answerDigits = String(q.answer).split('').map(Number)
      expect([...answerDigits].sort()).toEqual([...cards].sort())
      const isLargest = p['want'] === 1
      const expected = [...cards].sort((a, b) => (isLargest ? b - a : a - b)).join('')
      expect(String(q.answer), q.prompt).toBe(expected)
    }
  })

  it('세 자리 수가 나온다. 앞자리가 0이 되지 않는다', () => {
    for (const seed of SEEDS) {
      const q = generateQuestion(w1Lv5MakeNumber, seed)
      expect(String(q.answer)).toHaveLength(3)
    }
  })
})

describe('보스 — 좌표 정렬', () => {
  it('세 좌표를 오름차순으로 늘어놓는 것이 정답이다', () => {
    for (const seed of SEEDS) {
      const q = generateQuestion(w1BossSort3, seed)
      const answer = q.answer as number[]
      expect(answer).toHaveLength(3)
      expect(answer).toEqual([...answer].sort((a, b) => a - b))
      for (const value of answer) {
        expect(q.prompt).toContain(String(value))
      }
    }
  })

  it('네 좌표도 마찬가지다', () => {
    for (const seed of SEEDS) {
      const q = generateQuestion(w1BossSort4, seed)
      const answer = q.answer as number[]
      expect(answer).toHaveLength(4)
      expect(answer).toEqual([...answer].sort((a, b) => a - b))
      expect(new Set(answer).size).toBe(4)
    }
  })
})
