import { describe, expect, it } from 'vitest'

import { world1Templates } from '../data/world1'
import { STAGE_ORDER, templatesFor, worldById } from '../data/worlds'
import { buildStage, QUESTIONS_PER_STAGE, stageSeed, starsFor } from './stage'
import { multiplicationChoice, multiplicationBlank } from './fixtures'

describe('buildStage', () => {
  it('한 스테이지는 문제 8개다', () => {
    const stage = buildStage([multiplicationChoice], 1)
    expect(stage).toHaveLength(QUESTIONS_PER_STAGE)
  })

  it('같은 문제가 두 번 나오지 않는다', () => {
    for (let seed = 1; seed <= 60; seed += 1) {
      const stage = buildStage([multiplicationChoice], seed)
      expect(new Set(stage.map((q) => q.id)).size, `seed=${seed}`).toBe(QUESTIONS_PER_STAGE)
    }
  })

  it('템플릿이 여럿이면 돌아가며 낸다', () => {
    const stage = buildStage([multiplicationChoice, multiplicationBlank], 1)
    const used = stage.map((q) => q.templateId)
    expect(new Set(used).size).toBe(2)
    // 번갈아 나와야 한 종류만 몰리지 않는다
    expect(used[0]).not.toBe(used[1])
  })

  it('같은 시드면 같은 스테이지가 나온다', () => {
    expect(buildStage(world1Templates.slice(0, 2), 42)).toEqual(
      buildStage(world1Templates.slice(0, 2), 42),
    )
  })

  it('시드가 다르면 다른 문제가 나온다', () => {
    const first = buildStage([multiplicationChoice], 1).map((q) => q.id)
    const second = buildStage([multiplicationChoice], 999).map((q) => q.id)
    expect(first).not.toEqual(second)
  })

  it('앞에 끼워 넣은 복습 문제를 살린다', () => {
    const leading = buildStage([multiplicationBlank], 5, { count: 2 })
    const stage = buildStage([multiplicationChoice], 1, { leading })
    expect(stage).toHaveLength(QUESTIONS_PER_STAGE)
    expect(stage[0]).toEqual(leading[0])
    expect(stage[1]).toEqual(leading[1])
  })

  it('템플릿이 없으면 만들지 않는다', () => {
    expect(() => buildStage([], 1)).toThrow()
  })

  it('월드 1의 모든 스테이지를 실제로 만들 수 있다', () => {
    const world = worldById(1)
    for (const level of STAGE_ORDER) {
      const templates = templatesFor(world, level)
      expect(templates.length, `Lv${String(level)}`).toBeGreaterThan(0)
      for (let attempt = 0; attempt < 12; attempt += 1) {
        const stage = buildStage(templates, stageSeed(1, level, attempt))
        expect(stage, `Lv${String(level)} attempt=${String(attempt)}`).toHaveLength(8)
        for (const question of stage) {
          expect(question.prompt.length).toBeGreaterThan(0)
          expect(question.hint.length).toBeGreaterThan(0)
        }
      }
    }
  })
})

describe('stageSeed', () => {
  it('스테이지마다 다른 시드를 준다', () => {
    const seeds = STAGE_ORDER.map((level) => stageSeed(1, level, 0))
    expect(new Set(seeds).size).toBe(STAGE_ORDER.length)
  })

  it('다시 도전하면 다른 시드를 준다. 같은 문제를 외워서 별을 올릴 수 없다', () => {
    const seeds = Array.from({ length: 10 }, (_, attempt) => stageSeed(1, 1, attempt))
    expect(new Set(seeds).size).toBe(10)
  })

  it('월드가 다르면 시드도 다르다', () => {
    expect(stageSeed(1, 1, 0)).not.toBe(stageSeed(2, 1, 0))
  })
})

describe('starsFor — 설계서 1장의 별 기준', () => {
  it('8개 다 맞으면 별 셋', () => {
    expect(starsFor(8)).toBe(3)
  })

  it('7개면 별 둘', () => {
    expect(starsFor(7)).toBe(2)
  })

  it('6개면 별 하나', () => {
    expect(starsFor(6)).toBe(1)
  })

  it('5개 이하면 별이 없다. 그래도 벌은 없고 다시 하면 된다', () => {
    for (const correct of [0, 1, 2, 3, 4, 5]) {
      expect(starsFor(correct)).toBe(0)
    }
  })

  it('문제 수가 달라도 같은 비율로 매긴다', () => {
    expect(starsFor(3, 3)).toBe(3)
    expect(starsFor(2, 3)).toBe(2)
    expect(starsFor(1, 3)).toBe(1)
    expect(starsFor(0, 3)).toBe(0)
  })
})
