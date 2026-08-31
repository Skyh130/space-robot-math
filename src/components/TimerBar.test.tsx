import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { TimerBar } from './TimerBar'

describe('TimerBar', () => {
  it('남은 초를 보여준다', () => {
    render(<TimerBar remainingSeconds={42} totalSeconds={60} />)
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.getByLabelText('남은 시간 42초')).toBeInTheDocument()
  })

  it('0초 아래로는 내려가지 않는다', () => {
    render(<TimerBar remainingSeconds={-3} totalSeconds={60} />)
    expect(screen.getByText('0')).toBeInTheDocument()
  })

  it('막대가 남은 비율만큼 찬다', () => {
    const { container } = render(<TimerBar remainingSeconds={30} totalSeconds={60} />)
    const bar = container.querySelector('[style*="width"]')
    expect(bar).toHaveStyle({ width: '50%' })
  })

  it('10초 이하가 되면 색이 바뀐다', () => {
    const { container } = render(<TimerBar remainingSeconds={8} totalSeconds={60} />)
    expect(container.querySelector('.bg-coral')).not.toBeNull()
  })
})
