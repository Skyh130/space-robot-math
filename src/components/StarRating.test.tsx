import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { StarRating } from './StarRating'

describe('StarRating', () => {
  it('별 개수를 읽어 줄 수 있게 이름을 붙인다', () => {
    render(<StarRating count={2} />)
    expect(screen.getByLabelText('별 2개')).toBeInTheDocument()
  })

  it('못 받은 별도 자리를 남긴다. 다시 도전할 자리가 보여야 한다', () => {
    const { container } = render(<StarRating count={1} />)
    expect(container.querySelectorAll('svg')).toHaveLength(3)
  })

  it('0개부터 3개까지 모두 그린다', () => {
    for (const count of [0, 1, 2, 3]) {
      const { unmount } = render(<StarRating count={count} />)
      expect(screen.getByLabelText(`별 ${count}개`)).toBeInTheDocument()
      unmount()
    }
  })
})
