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
