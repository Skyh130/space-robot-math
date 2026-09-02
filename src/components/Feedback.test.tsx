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
    render(<Feedback result={correct} showAnswer onRetry={() => undefined} onNext={onNext} />)

    expect(screen.getByText('잘했어!')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '다음' }))
    expect(onNext).toHaveBeenCalledOnce()
  })

  it('정답일 때 힌트를 늘어놓지 않는다', () => {
    render(<Feedback result={correct} showAnswer onRetry={() => undefined} onNext={() => undefined} />)
    expect(screen.queryByText(/세어 볼까/)).not.toBeInTheDocument()
  })
})

describe('Feedback — 처음 틀렸을 때', () => {
  it('답을 알려주지 않고 힌트만 준다', () => {
    const { container } = render(
      <Feedback
        result={wrong}
        showAnswer={false}
        onRetry={() => undefined}
        onNext={() => undefined}
      />,
    )
    expect(screen.getByText('4단을 순서대로 세어 볼까?')).toBeInTheDocument()
    expect(container.textContent).not.toContain('답은')
    expect(screen.queryByText('7')).not.toBeInTheDocument()
  })

  it('풀이 그림도 아직 펴지 않는다', () => {
    // 세로셈 그림은 답 줄까지 그린다. 힌트가 아니라 풀이라서 이때 보여주면 답을 준 것이다.
    render(
      <Feedback
        result={wrong}
        showAnswer={false}
        onRetry={() => undefined}
        onNext={() => undefined}
      />,
    )
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('다시 하기로 재시도한다. 벌은 없다', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    render(
      <Feedback result={wrong} showAnswer={false} onRetry={onRetry} onNext={() => undefined} />,
    )

    await user.click(screen.getByRole('button', { name: '다시 하기' }))
    expect(onRetry).toHaveBeenCalledOnce()
  })

  it('사과하거나 나무라는 말을 쓰지 않는다', () => {
    const { container } = render(
      <Feedback
        result={wrong}
        showAnswer={false}
        onRetry={() => undefined}
        onNext={() => undefined}
      />,
    )
    const text = container.textContent ?? ''
    for (const banned of ['틀렸', '실패', '미안', '죄송', '아쉽게도', '오답']) {
      expect(text, banned).not.toContain(banned)
    }
    expect(text).toContain('아까워')
  })
})

describe('Feedback — 두 번째로 틀렸을 때', () => {
  it('정답과 한 줄 이유를 함께 보여준다', () => {
    render(<Feedback result={wrong} showAnswer onRetry={() => undefined} onNext={() => undefined} />)
    expect(screen.getByText('7')).toBeInTheDocument()
    expect(screen.getByText('4단을 순서대로 세어 볼까?')).toBeInTheDocument()
  })

  it('정답 뒤 조사가 받침에 맞는다', () => {
    const { container, rerender } = render(
      <Feedback result={wrong} showAnswer onRetry={() => undefined} onNext={() => undefined} />,
    )
    expect(container.textContent).toContain('답은 7이야.')

    rerender(
      <Feedback
        result={{ ...wrong, expected: 4 }}
        showAnswer
        onRetry={() => undefined}
        onNext={() => undefined}
      />,
    )
    expect(container.textContent).toContain('답은 4야.')
  })

  it('나무라지 않고 같이 보자고 한다', () => {
    const { container } = render(
      <Feedback result={wrong} showAnswer onRetry={() => undefined} onNext={() => undefined} />,
    )
    const text = container.textContent ?? ''
    for (const banned of ['틀렸', '실패', '미안', '죄송', '아쉽게도', '오답']) {
      expect(text, banned).not.toContain(banned)
    }
    expect(text).toContain('같이 볼까?')
  })

  it('그림 힌트를 함께 붙일 수 있다', () => {
    render(
      <Feedback
        result={wrong}
        showAnswer
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
        showAnswer
        onRetry={() => undefined}
        onNext={() => undefined}
      />,
    )
    expect(screen.getByText('102, 250, 311')).toBeInTheDocument()
  })
})
