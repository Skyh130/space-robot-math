import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import App from './App'
import { STAGE_ORDER, templatesFor, worldById } from './data/worlds'
import { buildStage, stageSeed, type Question } from './engine'

/**
 * Phase 3 완료 조건: 월드 1의 5개 스테이지 + 보스를 처음부터 끝까지 클리어할 수 있다.
 *
 * 화면이 실제로 내는 문제를 App 과 똑같은 시드로 다시 만들어 답을 안다.
 * 생성기가 순수 함수라 이렇게 맞춰 볼 수 있다.
 */
const WORLD = worldById(1)

function questionsFor(level: (typeof STAGE_ORDER)[number], attempt = 0): Question[] {
  return buildStage(templatesFor(WORLD, level), stageSeed(WORLD.id, level, attempt))
}

const key = (name: string) => screen.getByRole('button', { name })

async function solve(user: ReturnType<typeof userEvent.setup>, question: Question) {
  if (question.inputType === 'choice') {
    await user.click(key(String(question.answer)))
  } else if (question.inputType === 'order') {
    for (const value of question.answer as number[]) await user.click(key(String(value)))
    await user.click(key('확인'))
  } else {
    for (const digit of String(question.answer)) await user.click(key(digit))
    await user.click(key('확인'))
  }
  await user.click(key('다음'))
}

describe('월드 1 통째로 플레이', () => {
  it('제목에서 출발해 보스까지 끝낸다', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(screen.getByRole('button', { name: '출발!' })).toBeInTheDocument()
    await user.click(key('출발!'))

    for (const level of STAGE_ORDER) {
      const label = level === 'boss' ? '보스' : `${String(level)}단계`
      expect(screen.getByText(`${WORLD.name} · ${label}`), label).toBeInTheDocument()

      for (const question of questionsFor(level)) {
        await solve(user, question)
      }

      // 8개를 다 맞혔으니 별 셋
      expect(screen.getByLabelText('별 3개'), label).toBeInTheDocument()

      if (level === 'boss') {
        expect(screen.getByText(`${WORLD.partName} 획득!`)).toBeInTheDocument()
        expect(key('처음으로')).toBeInTheDocument()
      } else {
        await user.click(key('다음 단계'))
      }
    }

    await user.click(key('처음으로'))
    expect(screen.getByRole('button', { name: '출발!' })).toBeInTheDocument()
  }, 120000)

  it('보스가 아닌 단계에서는 부품을 주지 않는다', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(key('출발!'))

    for (const question of questionsFor(1)) await solve(user, question)
    expect(screen.queryByText(/획득!/)).not.toBeInTheDocument()
  }, 60000)

  it('다시 하기를 누르면 같은 단계의 다른 문제가 나온다', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(key('출발!'))

    const first = questionsFor(1)
    for (const question of first) await solve(user, question)

    await user.click(key('다시 하기'))
    const second = questionsFor(1, 1)
    expect(screen.getByText(second[0]?.prompt ?? '')).toBeInTheDocument()
    expect(second[0]?.id).not.toBe(first[0]?.id)
  }, 60000)

  it('틀린 채로 끝내도 별 없이 넘어갈 수 있다. 처음부터 다시 시키지 않는다', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(key('출발!'))

    for (const question of questionsFor(1)) {
      const wrong = (question.choices ?? []).find((c) => String(c) !== String(question.answer))
      await user.click(key(String(wrong)))
      await user.click(key('다시 하기'))
      await user.click(key(String(question.answer)))
      await user.click(key('다음'))
    }

    expect(screen.getByLabelText('별 0개')).toBeInTheDocument()
    expect(screen.getByText('좋아, 한 번 더!')).toBeInTheDocument()
    expect(key('다음 단계')).toBeInTheDocument()
  }, 60000)
})
