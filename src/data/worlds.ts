import { world1Templates } from './world1'
import { world2Templates } from './world2'
import { world3Templates } from './world3'
import type { AnyQuestionTemplate, StageLevel, WorldId } from '../engine/types'

/** 월드 메타데이터. 설계서 2장의 표를 그대로 옮긴 것이다. */

export type RobotPart =
  | 'head'
  | 'left_arm'
  | 'right_arm'
  | 'booster'
  | 'body'
  | 'left_leg'
  | 'right_leg'
  | 'weapon'

export type WorldMeta = {
  readonly id: WorldId
  readonly name: string
  /** 무엇을 배우는 곳인지 한 줄로. */
  readonly topic: string
  readonly part: RobotPart
  readonly partName: string
  /** 문제 템플릿. 아직 만들지 않은 월드는 비어 있다. */
  readonly templates: readonly AnyQuestionTemplate[]
}

export const WORLDS: readonly WorldMeta[] = [
  { id: 1, name: '숫자 소행성대', topic: '세 자리·네 자리 수', part: 'head', partName: '헤드 유닛', templates: world1Templates },
  { id: 2, name: '중력 협곡', topic: '덧셈과 뺄셈', part: 'left_arm', partName: '왼팔', templates: world2Templates },
  { id: 3, name: '에너지 코어 공장', topic: '곱셈구구', part: 'right_arm', partName: '오른팔', templates: world3Templates },
  { id: 4, name: '관제 스테이션', topic: '시각과 시간', part: 'booster', partName: '부스터', templates: [] },
  { id: 5, name: '구조물 격납고', topic: '평면도형과 길이', part: 'body', partName: '몸통', templates: [] },
  { id: 6, name: '암흑 행성', topic: '나눗셈', part: 'left_leg', partName: '왼다리', templates: [] },
  { id: 7, name: '액체 행성', topic: '분수와 소수', part: 'right_leg', partName: '오른다리', templates: [] },
  { id: 8, name: '적 모선', topic: '표와 규칙', part: 'weapon', partName: '메인 웨폰', templates: [] },
]

export function worldById(id: WorldId): WorldMeta {
  const world = WORLDS.find((candidate) => candidate.id === id)
  if (!world) throw new Error(`없는 월드다: ${String(id)}`)
  return world
}

/** 한 월드의 스테이지 차례. Lv1~Lv5 다음이 보스다. */
export const STAGE_ORDER: readonly StageLevel[] = [1, 2, 3, 4, 5, 'boss']

/** 도전 모드. 보스를 깨야 열리며 진행과는 무관하다. */
export const CHALLENGE: StageLevel = 'challenge'

/** 도전 모드 제한 시간(초). */
export const CHALLENGE_SECONDS = 60

/**
 * 도전 모드에서 60초 안에 만날 수 있는 문제 수의 상한.
 * 다 풀 일은 없지만, 시간이 남는데 문제가 떨어지면 안 된다.
 */
const CHALLENGE_POOL = 40

/** 그 스테이지에서 낼 템플릿들. */
export function templatesFor(world: WorldMeta, level: StageLevel): readonly AnyQuestionTemplate[] {
  if (level === CHALLENGE) return challengeTemplates(world)
  return world.templates.filter((template) => template.level === level)
}

/**
 * 도전 모드에 낼 템플릿. 그 월드에서 배운 것을 통째로 섞는다.
 *
 * 순서 배열은 빼둔다. 조각을 여러 번 눌러야 해서 60초 안에서는 손이 느린 아이가
 * 문제를 아는데도 점수를 못 낸다. 시간을 재는 곳에서는 아는지만 물어야 한다.
 */
function challengeTemplates(world: WorldMeta): readonly AnyQuestionTemplate[] {
  return world.templates.filter(
    (template) => template.inputType === 'choice' || template.inputType === 'numpad',
  )
}

/**
 * 스테이지마다 다른 규칙.
 *
 * 기본은 문제 8개, 시간 제한 없음, 별은 6개↑ / 7개↑ / 8개다. (설계서 1장)
 * W3 보스만 예외다. 60초 안에 코어 12개를 충전한다. 게임 전체에서 시간을 재는
 * 곳은 여기뿐이다. (설계서 5장, CLAUDE.md 절대 규칙 3)
 */
export type StageRule = {
  readonly count: number
  readonly timeLimitSeconds?: number
  /** [별 하나, 별 둘, 별 셋] 을 받는 최소 정답 수. */
  readonly starThresholds?: readonly [number, number, number]
}

const DEFAULT_RULE: StageRule = { count: 8 }

const SPECIAL_RULES: Readonly<Record<string, StageRule>> = {
  '3:boss': { count: 12, timeLimitSeconds: 60, starThresholds: [8, 10, 12] },
}

/** 도전 모드는 어느 월드든 같은 규칙이다. 60초, 맞힌 만큼이 점수다. */
const CHALLENGE_RULE: StageRule = {
  count: CHALLENGE_POOL,
  timeLimitSeconds: CHALLENGE_SECONDS,
}

export function stageRuleFor(world: WorldId, level: StageLevel): StageRule {
  if (level === CHALLENGE) return CHALLENGE_RULE
  return SPECIAL_RULES[`${String(world)}:${String(level)}`] ?? DEFAULT_RULE
}

/** 이 월드를 실제로 플레이할 수 있는지. 템플릿이 아직 없는 월드는 잠겨 있다. */
export function isPlayable(world: WorldMeta): boolean {
  return STAGE_ORDER.every((level) => templatesFor(world, level).length > 0)
}

/** 배우는 스테이지인지. 도전 모드는 별도 취급이라 별도 코인도 다르게 준다. */
export function isChallenge(level: StageLevel): boolean {
  return level === CHALLENGE
}
