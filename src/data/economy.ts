import { QUESTIONS_PER_STAGE } from '../engine/stage'
import type { WorldId } from '../engine/types'
import { STAGE_ORDER, stageRuleFor, WORLDS } from './worlds'

/**
 * 코인 경제.
 *
 * 코인은 문제를 맞히면 받고, 로봇 컬러와 데칼을 사는 데 쓴다. (설계서 6장)
 * 실력과 무관한 순수 재미 요소라 게임 진행을 막지 않는다. 상점 화면은 Phase 9 다.
 * 여기서는 값만 정한다. 가격과 벌이가 따로 놀면 상점이 하루 만에 텅 비거나
 * 영영 못 사는 곳이 된다.
 *
 * 맞춰 둔 눈금:
 * - MVP 한 바퀴(월드 1~3, 스테이지 18개, 문제 148개)를 다 맞히면 740코인.
 * - 상점을 통째로 사려면 1700코인. 한 바퀴로는 절반쯤 산다.
 * - 그래서 첫 완주로 대여섯 개를 사고, 나머지는 별을 올리러 다시 하면서 채운다.
 *   한 번에 다 사면 다시 할 이유가 없고, 하나도 못 사면 모을 이유가 없다.
 * - 이 눈금은 data/economy.test.ts 가 지킨다. 값 하나만 바꾸면 테스트가 잡는다.
 */

/** 문제 하나를 맞힐 때 받는 코인. */
export const COINS_PER_CORRECT = 5

/**
 * 상점 물건 값. (Phase 9)
 * 컬러는 로봇 전체가 바뀌니 데칼보다 비싸다.
 */
export const PRICES = {
  /** 로봇 몸 색 */
  color: 150,
  /** 로봇에 붙이는 스티커 */
  decal: 100,
} as const

/** Phase 9 에서 채울 상점 품목 수. 값을 매길 때 쓴 가정이다. */
export const PLANNED_ITEMS = {
  color: 6,
  decal: 8,
} as const

/** 상점 물건을 전부 사는 데 드는 코인. */
export function shopTotal(): number {
  return PRICES.color * PLANNED_ITEMS.color + PRICES.decal * PLANNED_ITEMS.decal
}

/** 그 월드를 한 바퀴 다 맞혔을 때 받는 코인. */
export function coinsForWorld(world: WorldId): number {
  return STAGE_ORDER.reduce((sum, level) => {
    const rule = stageRuleFor(world, level)
    return sum + (rule.count ?? QUESTIONS_PER_STAGE) * COINS_PER_CORRECT
  }, 0)
}

/** 지금 만들어 둔 월드를 전부 한 바퀴 다 맞혔을 때 받는 코인. */
export function coinsForFullRun(): number {
  return WORLDS.filter((world) => world.templates.length > 0).reduce(
    (sum, world) => sum + coinsForWorld(world.id),
    0,
  )
}
