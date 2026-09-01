import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { ResultScreen } from './ResultScreen'

const noop = () => undefined

describe('ResultScreen — 별', () => {
  it('8개 다 맞히면 별 셋', () => {
    render(<ResultScreen correct={8} total={8} onRetry={noop} onNext={noop} />)
    expect(screen.getByLabelText('별 3개')).toBeInTheDocument()
    expect(screen.getByText('완벽해!')).toBeInTheDocument()
  })

  it('7개면 별 둘, 6개면 별 하나', () => {
    const { rerender } = render(<ResultScreen correct={7} total={8} onRetry={noop} onNext={noop} />)
    expect(screen.getByLabelText('별 2개')).toBeInTheDocument()

    rerender(<ResultScreen correct={6} total={8} onRetry={noop} onNext={noop} />)
    expect(screen.getByLabelText('별 1개')).toBeInTheDocument()
  })

  it('5개 이하면 별이 없지만 나무라지 않는다', () => {
    const { container } = render(
      <ResultScreen correct={2} total={8} onRetry={noop} onNext={noop} />,
    )
    expect(screen.getByLabelText('별 0개')).toBeInTheDocument()
    expect(screen.getByText('좋아, 한 번 더!')).toBeInTheDocument()
    const text = container.textContent ?? ''
    for (const banned of ['실패', '틀렸', '아쉽', '부족']) {
      expect(text, banned).not.toContain(banned)
    }
  })
})

describe('ResultScreen — 내용', () => {
  it('맞힌 개수를 보여준다', () => {
    const { container } = render(
      <ResultScreen correct={6} total={8} onRetry={noop} onNext={noop} />,
    )
    expect(container.textContent).toContain('8문제 중 6개 맞혔어')
  })

  it('보스를 깨면 부품을 준다', () => {
    render(
      <ResultScreen correct={8} total={8} earnedPart="헤드 유닛" onRetry={noop} onNext={noop} />,
    )
    expect(screen.getByText('헤드 유닛 획득!')).toBeInTheDocument()
  })

  it('보스가 아니면 부품을 주지 않는다', () => {
    render(<ResultScreen correct={8} total={8} onRetry={noop} onNext={noop} />)
    expect(screen.queryByText(/획득!/)).not.toBeInTheDocument()
  })

  it('다시 하기와 다음이 각각 동작한다', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    const onNext = vi.fn()
    render(<ResultScreen correct={8} total={8} onRetry={onRetry} onNext={onNext} />)

    await user.click(screen.getByRole('button', { name: '다시 하기' }))
    expect(onRetry).toHaveBeenCalledOnce()

    await user.click(screen.getByRole('button', { name: '다음 단계' }))
    expect(onNext).toHaveBeenCalledOnce()
  })

  it('다음 버튼 이름을 바꿀 수 있다', () => {
    render(
      <ResultScreen correct={8} total={8} nextLabel="격납고" onRetry={noop} onNext={noop} />,
    )
    expect(screen.getByRole('button', { name: '격납고' })).toBeInTheDocument()
  })
})

describe('ResultScreen — 60초 도전 결과', () => {
  const base = {
    correct: 19,
    total: 40,
    onRetry: noop,
    onNext: noop,
    nextLabel: '우주로',
  }

  it('별이 아니라 기록을 보여준다', () => {
    render(
      <ResultScreen
        {...base}
        challenge={{ best: 19, isRecord: true, weekBest: 19, lastWeekBest: 12 }}
      />,
    )
    expect(screen.queryByLabelText(/^별/)).toBeNull()
    expect(screen.getByText('이번에 충전한 코어')).toBeInTheDocument()
    expect(screen.getByText('19')).toBeInTheDocument()
  })

  it('신기록이면 크게 알려 준다', () => {
    render(
      <ResultScreen
        {...base}
        challenge={{ best: 19, isRecord: true, weekBest: 19, lastWeekBest: 12 }}
      />,
    )
    expect(screen.getByText('신기록!')).toBeInTheDocument()
  })

  it('기록을 못 넘으면 그냥 칭찬한다. 나무라지 않는다', () => {
    const { container } = render(
      <ResultScreen
        {...base}
        correct={9}
        challenge={{ best: 19, isRecord: false, weekBest: 19, lastWeekBest: 12 }}
      />,
    )
    expect(screen.queryByText('신기록!')).toBeNull()
    expect(screen.getByText('잘했어!')).toBeInTheDocument()
    for (const banned of ['실패', '아깝', '부족']) {
      expect(container.textContent, banned).not.toContain(banned)
    }
  })

  it('최고·이번 주·지난 주를 나란히 보여준다', () => {
    const { container } = render(
      <ResultScreen
        {...base}
        challenge={{ best: 22, isRecord: false, weekBest: 19, lastWeekBest: 12 }}
      />,
    )
    expect(container.textContent).toContain('최고 기록')
    expect(container.textContent).toContain('이번 주')
    expect(container.textContent).toContain('지난 주')
    expect(screen.getByText('22개')).toBeInTheDocument()
    expect(screen.getByText('19개')).toBeInTheDocument()
    expect(screen.getByText('12개')).toBeInTheDocument()
  })

  it('지난 주를 넘기면 얼마나 늘었는지 알려 준다', () => {
    render(
      <ResultScreen
        {...base}
        challenge={{ best: 19, isRecord: true, weekBest: 19, lastWeekBest: 12 }}
      />,
    )
    expect(screen.getByText('지난 주보다 7개 더!')).toBeInTheDocument()
  })

  it('지난 주 기록이 없으면 견주지 않는다', () => {
    render(
      <ResultScreen
        {...base}
        challenge={{ best: 19, isRecord: true, weekBest: 19, lastWeekBest: 0 }}
      />,
    )
    expect(screen.queryByText(/지난 주보다/)).toBeNull()
    expect(screen.getByText('없음')).toBeInTheDocument()
  })

  it('지난 주를 못 넘겼다고 말하지 않는다', () => {
    const { container } = render(
      <ResultScreen
        {...base}
        correct={8}
        challenge={{ best: 22, isRecord: false, weekBest: 8, lastWeekBest: 20 }}
      />,
    )
    expect(container.textContent).not.toMatch(/지난 주보다/)
  })

  it('첫 버튼이 한 번 더다. 다시 할 마음이 식기 전에 누를 수 있어야 한다', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    render(
      <ResultScreen
        {...base}
        onRetry={onRetry}
        challenge={{ best: 19, isRecord: true, weekBest: 19, lastWeekBest: 12 }}
      />,
    )
    await user.click(screen.getByRole('button', { name: '한 번 더!' }))
    expect(onRetry).toHaveBeenCalledOnce()
  })
})
