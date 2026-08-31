import { describe, expect, it } from 'vitest'

import { starsFor } from '../engine'
import { isPlayable, STAGE_ORDER, stageRuleFor, templatesFor, WORLDS, worldById } from './worlds'

describe('월드 메타데이터 — 설계서 2장', () => {
  it('행성이 여덟 개다', () => {
    expect(WORLDS).toHaveLength(8)
    expect(WORLDS.map((w) => w.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
  })

  it('부품이 여덟 개 모두 다르다', () => {
    expect(new Set(WORLDS.map((w) => w.part)).size).toBe(8)
  })

  it('MVP 범위인 월드 1~3 은 플레이할 수 있다', () => {
    for (const id of [1, 2, 3] as const) {
      expect(isPlayable(worldById(id)), String(id)).toBe(true)
    }
  })

  it('월드 4~8 은 아직 문제가 없다', () => {
    for (const id of [4, 5, 6, 7, 8] as const) {
      expect(isPlayable(worldById(id)), String(id)).toBe(false)
    }
  })

  it('플레이할 수 있는 월드는 모든 단계에 템플릿이 있다', () => {
    for (const id of [1, 2, 3] as const) {
      const world = worldById(id)
      for (const level of STAGE_ORDER) {
        expect(templatesFor(world, level).length, `${world.name} ${String(level)}`).toBeGreaterThan(0)
      }
    }
  })

  it('없는 월드를 찾으면 알려 준다', () => {
    expect(() => worldById(99 as never)).toThrow()
  })
})

describe('스테이지 규칙', () => {
  it('기본은 문제 8개, 시간 제한 없음', () => {
    for (const id of [1, 2, 3] as const) {
      for (const level of STAGE_ORDER) {
        if (id === 3 && level === 'boss') continue
        const rule = stageRuleFor(id, level)
        expect(rule.count, `${String(id)} ${String(level)}`).toBe(8)
        expect(rule.timeLimitSeconds, `${String(id)} ${String(level)}`).toBeUndefined()
      }
    }
  })

  it('W3 보스만 60초에 코어 12개다', () => {
    const rule = stageRuleFor(3, 'boss')
    expect(rule.count).toBe(12)
    expect(rule.timeLimitSeconds).toBe(60)
  })

  it('시간 제한이 있는 곳은 게임을 통틀어 한 곳뿐이다', () => {
    const timed = WORLDS.flatMap((world) =>
      STAGE_ORDER.filter((level) => stageRuleFor(world.id, level).timeLimitSeconds !== undefined).map(
        (level) => `${String(world.id)}:${String(level)}`,
      ),
    )
    expect(timed).toEqual(['3:boss'])
  })

  it('W3 보스의 별 기준이 12문제에 맞게 늘어난다', () => {
    const { starThresholds } = stageRuleFor(3, 'boss')
    expect(starsFor(12, 12, starThresholds)).toBe(3)
    expect(starsFor(11, 12, starThresholds)).toBe(2)
    expect(starsFor(10, 12, starThresholds)).toBe(2)
    expect(starsFor(9, 12, starThresholds)).toBe(1)
    expect(starsFor(8, 12, starThresholds)).toBe(1)
    expect(starsFor(7, 12, starThresholds)).toBe(0)
  })
})
