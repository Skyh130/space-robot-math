import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ProgressDots } from './ProgressDots'

describe('ProgressDots', () => {
  it('문제 수만큼 점을 그린다', () => {
    const { container } = render(<ProgressDots total={8} current={0} correct={[]} />)
    expect(container.querySelectorAll('span')).toHaveLength(8)
  })

  it('지금 몇 번째인지 읽어 줄 수 있게 한다', () => {
    render(<ProgressDots total={8} current={3} correct={[0, 1]} />)
    expect(screen.getByLabelText('8문제 중 4번째')).toBeInTheDocument()
  })

  it('시간을 보여주지 않는다', () => {
    const { container } = render(<ProgressDots total={8} current={0} correct={[]} />)
    expect(container.textContent).toBe('')
  })
})
