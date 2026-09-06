import { describe, expect, it } from 'vitest'

import { buildStage, checkAnswer, QUESTIONS_PER_STAGE, stageSeed } from '../engine'
import { CHALLENGE, STAGE_ORDER, stageRuleFor, templatesFor, WORLDS } from './worlds'

/**
 * 여덟 행성을 끝까지 갈 수 있는지 한자리에서 확인한다.
 *
 * 템플릿 하나하나는 월드별 테스트가 이미 전수로 본다. 여기서 보는 것은 그다음이다.
 * 실제로 스테이지를 짜면 문제 수가 맞는지, 정답을 넣으면 맞다고 나오는지,
 * 보기 안에 정답이 있는지 — 아이가 앉아서 겪는 순서 그대로를 훑는다.
 *
 * 아이가 "관제 스테이션에서 준비 중이라고 나온다" 고 한 적이 있다. 그때 이 검사가
 * 있었다면 월드 하나가 통째로 비어 있다는 것을 진작 알았을 것이다.
 */

/** 스테이지를 여러 번 다시 해도 늘 성립해야 한다. */
const ATTEMPTS = [0, 1, 2, 3, 4]

describe('여덟 행성 훑기', () => {
  for (const world of WORLDS) {
    describe(`W${String(world.id)} ${world.name}`, () => {
      for (const level of [...STAGE_ORDER, CHALLENGE]) {
        it(`${String(level)} 단계를 짤 수 있다`, () => {
          const templates = templatesFor(world, level)
          expect(templates.length, '템플릿이 없으면 준비 중으로 막힌다').toBeGreaterThan(0)

          const rule = stageRuleFor(world.id, level)
          for (const attempt of ATTEMPTS) {
            const questions = buildStage(templates, stageSeed(world.id, level, attempt), {
              count: rule.count,
            })
            expect(questions.length, `${String(level)} #${String(attempt)}`).toBe(
              rule.count ?? QUESTIONS_PER_STAGE,
            )

            for (const question of questions) {
              expect(question.prompt.trim()).not.toBe('')
              expect(question.hint.trim()).not.toBe('')
              expect(question.world).toBe(world.id)

              // 정답을 넣으면 맞다고 나와야 한다
              expect(checkAnswer(question, question.answer).correct, question.id).toBe(true)

              if (question.inputType === 'choice') {
                const choices = question.choices ?? []
                expect(choices.length, question.id).toBeGreaterThanOrEqual(2)
                expect(choices.map(String), question.id).toContain(String(question.answer))
                expect(new Set(choices.map(String)).size, question.id).toBe(choices.length)
              }
            }
          }
        })
      }
    })
  }

  it('배우는 스테이지에는 시간 제한이 없다 (CLAUDE.md 절대 규칙 3)', () => {
    for (const world of WORLDS) {
      for (const level of STAGE_ORDER) {
        const rule = stageRuleFor(world.id, level)
        const timed = rule.timeLimitSeconds !== undefined
        // 시간을 재도 되는 곳은 W3 보스와 60초 도전뿐이다
        expect(timed, `${String(world.id)}:${String(level)}`).toBe(world.id === 3 && level === 'boss')
      }
    }
  })

  it('소수점 키는 W7 에서만 쓴다', () => {
    for (const world of WORLDS) {
      for (const template of world.templates) {
        if (template.inputType === 'decimal') expect(template.world, template.id).toBe(7)
      }
    }
  })

  it('드래그 입력을 쓰는 템플릿이 없다', () => {
    // 8살이 답을 아는데 손이 미끄러져 틀리면 그건 오답이 아니라 우리 잘못이다
    for (const world of WORLDS) {
      for (const template of world.templates) {
        expect(template.inputType, template.id).not.toBe('drag')
      }
    }
  })

  it('부품이 여덟 개, 월드마다 하나씩이다', () => {
    const parts = WORLDS.map((world) => world.part)
    expect(new Set(parts).size).toBe(WORLDS.length)
    expect(parts).toHaveLength(8)
  })
})
