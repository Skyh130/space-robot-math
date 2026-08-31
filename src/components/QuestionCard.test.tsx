import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { QuestionCard } from './QuestionCard'

describe('QuestionCard', () => {
  it('문제를 그대로 보여준다', () => {
    render(<QuestionCard prompt="4 × □ = 28" />)
    expect(screen.getByText('4 × □ = 28')).toBeInTheDocument()
  })

  it('짧은 계산식은 큰 글씨로 쓴다', () => {
    render(<QuestionCard prompt="37 + 45 = ?" />)
    expect(screen.getByText('37 + 45 = ?')).toHaveClass('text-number')
  })

  it('긴 문장제는 한 단계 작은 글씨로 쓴다. 그래도 20px 아래로는 안 간다', () => {
    const long = '대원 27명을 4명씩 태우면 우주선이 몇 대 필요할까?'
    render(<QuestionCard prompt={long} />)
    expect(screen.getByText(long)).toHaveClass('text-question')
  })
})
