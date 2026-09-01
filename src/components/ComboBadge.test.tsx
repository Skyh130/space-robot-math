import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ComboBadge, isComboMilestone } from './ComboBadge'

describe('isComboMilestone', () => {
  it('3, 5, 8 에서 뜬다', () => {
    for (const n of [3, 5, 8]) expect(isComboMilestone(n), String(n)).toBe(true)
  })

  it('그 전에는 뜨지 않는다. 두 개 맞혔다고 잔치를 벌이지 않는다', () => {
    for (const n of [0, 1, 2]) expect(isComboMilestone(n), String(n)).toBe(false)
  })

  it('중간 숫자에는 뜨지 않는다. 매번 띄우면 배경이 된다', () => {
    for (const n of [4, 6, 7, 9, 10, 11]) expect(isComboMilestone(n), String(n)).toBe(false)
  })

  it('길게 이어지면 네 개마다 뜬다', () => {
    for (const n of [12, 16, 20, 40]) expect(isComboMilestone(n), String(n)).toBe(true)
    for (const n of [13, 14, 15, 17]) expect(isComboMilestone(n), String(n)).toBe(false)
  })
})

describe('ComboBadge', () => {
  it('몇 연속인지 보여준다', () => {
    render(<ComboBadge streak={5} />)
    expect(screen.getByText(/5연속/)).toBeInTheDocument()
  })

  it('연속이 길수록 다른 말을 한다', () => {
    const { rerender, container } = render(<ComboBadge streak={3} />)
    const first = container.textContent
    rerender(<ComboBadge streak={8} />)
    expect(container.textContent).not.toBe(first)
  })

  it('나무라는 말이 없다', () => {
    for (const streak of [3, 5, 8, 12]) {
      const { container, unmount } = render(<ComboBadge streak={streak} />)
      const text = container.textContent ?? ''
      for (const banned of ['끊', '실패', '아깝']) {
        expect(text, banned).not.toContain(banned)
      }
      unmount()
    }
  })
})
