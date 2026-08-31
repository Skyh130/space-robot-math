import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { AnswerResult } from '../engine'
import { Feedback } from './Feedback'

const correct: AnswerResult = {
  correct: true,
  given: 7,
  expected: 7,
  hint: '',
  skill: 'multiplication_blank',
}

const wrong: AnswerResult = {
  correct: false,
  given: 6,
  expected: 7,
  hint: '4단을 순서대로 세어 볼까?',
  skill: 'multiplication_blank',
}

describe('Feedback — 정답', () => {
  it('칭찬하고 다음으로 넘어가게 한다', async () => {
    const user = userEvent.setup()
    const onNext = vi.fn()
    render(<Feedback result={correct} onRetry={() => undefined} onNext={onNext} />)

    expect(screen.getByText('잘했어!')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '다음' }))
    expect(onNext).toHaveBeenCalledOnce()
  })

  it('정답일 때 힌트를 늘어놓지 않는다', () => {
    render(<Feedback result={correct} onRetry={() => undefined} onNext={() => undefined} />)
    expect(screen.queryByText(/세어 볼까/)).not.toBeInTheDocument()
  })
})

describe('Feedback — 오답', () => {
  it('정답과 한 줄 이유를 함께 보여준다', () => {
    render(<Feedback result={wrong} onRetry={() => undefined} onNext={() => undefined} />)
    expect(screen.getByText('7')).toBeInTheDocument()
    expect(screen.getByText('4단을 순서대로 세어 볼까?')).toBeInTheDocument()
  })

  it('정답 뒤 조사가 받침에 맞는다', () => {
    const { container, rerender } = render(
      <Feedback result={wrong} onRetry={() => undefined} onNext={() => undefined} />,
    )
    expect(container.textContent).toContain('답은 7이야.')

    rerender(
      <Feedback
        result={{ ...wrong, expected: 4 }}
        onRetry={() => undefined}
        onNext={() => undefined}
      />,
    )
    expect(container.textContent).toContain('답은 4야.')
  })

  it('다시 하기로 재시도한다. 벌은 없다', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    render(<Feedback result={wrong} onRetry={onRetry} onNext={() => undefined} />)

    await user.click(screen.getByRole('button', { name: '다시 하기' }))
    expect(onRetry).toHaveBeenCalledOnce()
  })

  it('사과하거나 나무라는 말을 쓰지 않는다', () => {
    const { container } = render(
      <Feedback result={wrong} onRetry={() => undefined} onNext={() => undefined} />,
    )
    const text = container.textContent ?? ''
    for (const banned of ['틀렸', '실패', '미안', '죄송', '아쉽게도', '오답']) {
      expect(text, banned).not.toContain(banned)
    }
    expect(text).toContain('아까워')
  })

  it('그림 힌트를 함께 붙일 수 있다', () => {
    render(
      <Feedback
        result={wrong}
        visual={<svg role="img" aria-label="그림 힌트" />}
        onRetry={() => undefined}
        onNext={() => undefined}
      />,
    )
    expect(screen.getByRole('img', { name: '그림 힌트' })).toBeInTheDocument()
  })

  it('배열 정답은 쉼표로 이어 보여준다', () => {
    render(
      <Feedback
        result={{ ...wrong, expected: [102, 250, 311] }}
        onRetry={() => undefined}
        onNext={() => undefined}
      />,
    )
    expect(screen.getByText('102, 250, 311')).toBeInTheDocument()
  })
})
