import { world1Templates } from './world1'
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
  { id: 2, name: '중력 협곡', topic: '덧셈과 뺄셈', part: 'left_arm', partName: '왼팔', templates: [] },
  { id: 3, name: '에너지 코어 공장', topic: '곱셈구구', part: 'right_arm', partName: '오른팔', templates: [] },
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

/** 그 스테이지에서 낼 템플릿들. */
export function templatesFor(world: WorldMeta, level: StageLevel): readonly AnyQuestionTemplate[] {
  return world.templates.filter((template) => template.level === level)
}

/** 이 월드를 실제로 플레이할 수 있는지. 템플릿이 아직 없는 월드는 잠겨 있다. */
export function isPlayable(world: WorldMeta): boolean {
  return STAGE_ORDER.every((level) => templatesFor(world, level).length > 0)
}
