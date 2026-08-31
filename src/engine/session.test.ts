import { describe, expect, it } from 'vitest'

import { world1Templates } from '../data/world1'
import { buildStage } from './stage'
import { REQUEUE_GAP, requeueMissed } from './session'
import { multiplicationChoice, multiplicationBlank } from './fixtures'

const templates = [multiplicationChoice]

describe('requeueMissed — 같은 세션 오답 재출제', () => {
  it('틀린 문제를 3문제 뒤에 다시 낸다', () => {
    const stage = buildStage(templates, 1)
    const next = requeueMissed(stage, 0, templates, 999)

    expect(next[0 + REQUEUE_GAP]?.templateId).toBe(stage[0]?.templateId)
    // 숫자만 바뀐다. 같은 문제를 그대로 다시 내지 않는다.
    expect(next[3]?.id).not.toBe(stage[0]?.id)
  })

  it('문제 수는 그대로다', () => {
    const stage = buildStage(templates, 1)
    expect(requeueMissed(stage, 0, templates, 5)).toHaveLength(stage.length)
  })

  it('앞의 문제들은 건드리지 않는다', () => {
    const stage = buildStage(templates, 1)
    const next = requeueMissed(stage, 2, templates, 5)
    expect(next.slice(0, 5)).toEqual(stage.slice(0, 5))
  })

  it('원본을 바꾸지 않는다', () => {
    const stage = buildStage(templates, 1)
    const before = stage.map((q) => q.id)
    requeueMissed(stage, 0, templates, 5)
    expect(stage.map((q) => q.id)).toEqual(before)
  })

  it('3문제 뒤가 스테이지 끝을 넘으면 그냥 둔다', () => {
    const stage = buildStage(templates, 1)
    for (const index of [5, 6, 7]) {
      expect(requeueMissed(stage, index, templates, 5)).toEqual(stage)
    }
  })

  it('이미 낸 문제와 겹치지 않는다', () => {
    const stage = buildStage(templates, 1)
    const next = requeueMissed(stage, 1, templates, 77)
    expect(new Set(next.map((q) => q.id)).size).toBe(next.length)
  })

  it('여러 문제를 틀려도 차례로 반영된다', () => {
    let stage = buildStage(templates, 1)
    stage = requeueMissed(stage, 0, templates, 11)
    stage = requeueMissed(stage, 1, templates, 22)
    expect(stage).toHaveLength(8)
    expect(new Set(stage.map((q) => q.id)).size).toBe(8)
  })

  it('여러 템플릿이 섞인 스테이지에서도 틀린 그 템플릿으로 다시 낸다', () => {
    const mixed = [multiplicationChoice, multiplicationBlank]
    const stage = buildStage(mixed, 3)
    const missedTemplate = stage[1]?.templateId
    const next = requeueMissed(stage, 1, mixed, 42)
    expect(next[4]?.templateId).toBe(missedTemplate)
  })

  it('템플릿을 못 찾으면 그냥 둔다', () => {
    const stage = buildStage(templates, 1)
    expect(requeueMissed(stage, 0, [], 5)).toEqual(stage)
  })

  it('월드 1 보스처럼 순서 배열 문제도 다시 낼 수 있다', () => {
    const boss = world1Templates.filter((t) => t.level === 'boss')
    const stage = buildStage(boss, 1)
    const next = requeueMissed(stage, 0, boss, 5)
    expect(next[3]?.inputType).toBe('order')
    expect(next).toHaveLength(8)
  })
})
