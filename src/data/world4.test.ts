import { describe, expect, it } from 'vitest'

import { generateQuestion } from '../engine/generator'
import { describeIssues, findTemplateIssues } from '../engine/validate'
import {
  w4BossArrival,
  w4BossGap,
  w4Lv1ReadFive,
  w4Lv2ReadMinute,
  w4Lv3MarkToMinute,
  w4Lv3MinuteToMark,
  w4Lv4After,
  w4Lv4Span,
  w4Lv5Seconds,
  w4Lv5Timetable,
  world4Templates,
} from './world4'

const SEEDS = Array.from({ length: 300 }, (_, i) => i + 1)

describe('월드 4 — 템플릿 검사', () => {
  for (const template of world4Templates) {
    it(`${template.id} 는 어떤 파라미터에서도 성립한다`, () => {
      const issues = findTemplateIssues(template)
      expect(issues.length, describeIssues(issues)).toBe(0)
    })
  }

  it('설계서의 레벨 구성과 맞는다', () => {
    const levels = new Set(world4Templates.map((t) => t.level))
    expect([...levels].sort()).toEqual([1, 2, 3, 4, 5, 'boss'])
    for (const template of world4Templates) expect(template.world).toBe(4)
  })
})

describe('시계 읽기 — 설계서 5장 W4', () => {
  it('Lv1 은 5분 단위만 낸다. 정각은 내지 않는다', () => {
    for (const seed of SEEDS) {
      const q = generateQuestion(w4Lv1ReadFive, seed)
      const figure = q.figure
      expect(figure?.kind).toBe('clock')
      if (figure?.kind !== 'clock') continue
      expect(figure.minute % 5).toBe(0)
      expect(figure.minute).toBeGreaterThan(0)
      expect(q.answer).toBe(`${String(figure.hour)}시 ${String(figure.minute)}분`)
    }
  })

  it('Lv1 오답 보기에 시침·분침을 바꿔 읽은 값이 들어간다', () => {
    // 이 단계에서 가장 흔한 실수라 보기에 반드시 있어야 한다
    let swapped = 0
    for (const seed of SEEDS) {
      const q = generateQuestion(w4Lv1ReadFive, seed)
      const figure = q.figure
      if (figure?.kind !== 'clock') continue
      const mark = figure.minute / 5
      const swap = `${String(mark)}시 ${String(figure.hour * 5)}분`
      if ((q.choices ?? []).some((c) => c === swap)) swapped += 1
    }
    expect(swapped).toBeGreaterThan(SEEDS.length / 2)
  })

  it('Lv2 는 5의 배수가 아닌 분만 낸다. 눈금 사이를 세는 단계다', () => {
    for (const seed of SEEDS) {
      const q = generateQuestion(w4Lv2ReadMinute, seed)
      expect(Number(q.answer) % 5).not.toBe(0)
      const figure = q.figure
      expect(figure?.kind).toBe('clock')
      if (figure?.kind === 'clock') expect(figure.minute).toBe(q.answer)
    }
  })

  it('Lv3 은 눈금과 분을 양쪽으로 바꾼다', () => {
    for (const seed of SEEDS.slice(0, 60)) {
      const toMinute = generateQuestion(w4Lv3MarkToMinute, seed)
      expect(Number(toMinute.answer) % 5).toBe(0)

      const toMark = generateQuestion(w4Lv3MinuteToMark, seed)
      expect(Number(toMark.answer)).toBeGreaterThanOrEqual(1)
      expect(Number(toMark.answer)).toBeLessThanOrEqual(11)
      // 되돌리는 문제라 그림을 주면 답이 그대로 보인다
      expect(toMark.figure).toBeUndefined()
    }
  })
})

describe('시간 계산', () => {
  it('Lv4 는 60분을 넘길 때 시를 올린다', () => {
    for (const seed of SEEDS) {
      const q = generateQuestion(w4Lv4After, seed)
      const figure = q.figure
      if (figure?.kind !== 'clock') continue
      const added = Number(/(\d+)분 뒤/.exec(q.prompt)?.[1] ?? 0)
      const total = figure.minute + added
      const hour = ((figure.hour + Math.floor(total / 60) - 1) % 12) + 1
      expect(q.answer).toBe(`${String(hour)}시 ${String(total % 60)}분`)
    }
  })

  it('Lv4 오전·오후 문제는 12시를 건너 센다', () => {
    for (const seed of SEEDS.slice(0, 80)) {
      const q = generateQuestion(w4Lv4Span, seed)
      const [, start, end] = /오전 (\d+)시.*오후 (\d+)시/s.exec(q.prompt) ?? []
      expect(q.answer).toBe(12 - Number(start) + Number(end))
    }
  })

  it('Lv5 는 분을 초로 바르게 바꾼다', () => {
    for (const seed of SEEDS.slice(0, 80)) {
      const q = generateQuestion(w4Lv5Seconds, seed)
      const [, m, s] = /(\d+)분 (\d+)초/.exec(q.prompt) ?? []
      expect(q.answer).toBe(Number(m) * 60 + Number(s))
    }
  })

  it('Lv5 시각표는 표에 적힌 두 시각의 차와 맞는다', () => {
    for (const seed of SEEDS.slice(0, 80)) {
      const q = generateQuestion(w4Lv5Timetable, seed)
      const figure = q.figure
      expect(figure?.kind).toBe('dataTable')
      if (figure?.kind !== 'dataTable') continue

      const read = (row: number) => {
        const cell = figure.rows[row]?.[1] ?? ''
        const [, h, m] = /(\d+)시 (\d+)분/.exec(cell) ?? []
        return Number(h) * 60 + Number(m)
      }
      // 0번 줄이 가람호, 2번 줄이 라온호다
      expect(q.answer).toBe(read(2) - read(0))
    }
  })
})

describe('보스 — 도착 시각표', () => {
  it('가장 먼저·나중에 도착하는 배를 바르게 고른다', () => {
    for (const seed of SEEDS) {
      const q = generateQuestion(w4BossArrival, seed)
      const figure = q.figure
      if (figure?.kind !== 'dataTable') continue

      const times = figure.rows.map((row) => {
        const [, h, m] = /(\d+)시 (\d+)분/.exec(row[1] ?? '') ?? []
        return { ship: row[0] ?? '', at: Number(h) * 60 + Number(m) }
      })
      const wantLast = q.prompt.includes('늦게')
      const sorted = [...times].sort((a, b) => a.at - b.at)
      const expected = wantLast ? sorted[sorted.length - 1]?.ship : sorted[0]?.ship
      expect(q.answer).toBe(expected)
    }
  })

  it('보기 넷이 모두 표에 있는 배다', () => {
    for (const seed of SEEDS.slice(0, 100)) {
      const q = generateQuestion(w4BossArrival, seed)
      const figure = q.figure
      if (figure?.kind !== 'dataTable') continue
      const ships = figure.rows.map((row) => row[0])
      expect(q.choices).toHaveLength(4)
      for (const choice of q.choices ?? []) expect(ships).toContain(choice)
    }
  })

  it('도착 시각이 넷 다 다르다. 같으면 답이 둘이 된다', () => {
    for (const seed of SEEDS) {
      const q = generateQuestion(w4BossGap, seed)
      const figure = q.figure
      if (figure?.kind !== 'dataTable') continue
      const times = figure.rows.map((row) => row[1])
      expect(new Set(times).size).toBe(4)
    }
  })
})
