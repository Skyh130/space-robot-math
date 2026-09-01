import { describe, expect, it } from 'vitest'

import { QUESTIONS_PER_STAGE } from '../engine'
import {
  COINS_PER_CORRECT,
  coinsForFullRun,
  coinsForWorld,
  PLANNED_ITEMS,
  PRICES,
  shopTotal,
} from './economy'
import { STAGE_ORDER } from './worlds'

describe('코인 벌이', () => {
  it('한 스테이지를 다 맞히면 문제 수만큼 받는다', () => {
    expect(QUESTIONS_PER_STAGE * COINS_PER_CORRECT).toBe(40)
  })

  it('월드 하나를 다 맞히면 스테이지 여섯 개 몫을 받는다', () => {
    // 월드 1·2 는 여섯 스테이지 모두 8문제다
    expect(coinsForWorld(1)).toBe(STAGE_ORDER.length * QUESTIONS_PER_STAGE * COINS_PER_CORRECT)
    expect(coinsForWorld(2)).toBe(coinsForWorld(1))
  })

  it('월드 3 은 보스가 12문제라 조금 더 받는다', () => {
    expect(coinsForWorld(3)).toBe(coinsForWorld(1) + 4 * COINS_PER_CORRECT)
  })

  it('MVP 한 바퀴를 다 맞히면 740코인', () => {
    // 월드 1~3 의 스테이지 18개, 문제 148개. W3 보스만 12문제라 4개가 더 있다.
    expect(coinsForFullRun()).toBe(740)
  })
})

describe('상점 값', () => {
  it('컬러가 데칼보다 비싸다. 로봇 전체가 바뀐다', () => {
    expect(PRICES.color).toBeGreaterThan(PRICES.decal)
  })

  it('상점을 통째로 사려면 1700코인', () => {
    expect(shopTotal()).toBe(1700)
  })
})

describe('벌이와 가격의 눈금', () => {
  const full = coinsForFullRun()

  it('첫 완주로 몇 개는 살 수 있다. 하나도 못 사면 모을 이유가 없다', () => {
    expect(Math.floor(full / PRICES.decal)).toBeGreaterThanOrEqual(4)
  })

  it('첫 완주로 다 사지는 못한다. 한 번에 다 사면 다시 할 이유가 없다', () => {
    expect(full).toBeLessThan(shopTotal())
  })

  it('두세 바퀴면 상점을 비울 수 있다. 영영 못 사는 곳이면 안 된다', () => {
    expect(full * 3).toBeGreaterThanOrEqual(shopTotal())
  })

  it('값이 2학년이 셀 수 있게 떨어진다', () => {
    for (const price of Object.values(PRICES)) {
      expect(price % 50, String(price)).toBe(0)
    }
    expect(COINS_PER_CORRECT % 5).toBe(0)
  })

  it('품목 수가 상점 화면에 담길 만큼이다', () => {
    const total = PLANNED_ITEMS.color + PLANNED_ITEMS.decal
    expect(total).toBeGreaterThan(6)
    expect(total).toBeLessThanOrEqual(16)
  })
})
