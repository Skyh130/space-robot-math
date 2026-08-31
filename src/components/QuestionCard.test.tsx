import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { QuestionCard } from './QuestionCard'

describe('QuestionCard', () => {
  it('문제를 그대로 보여준다', () => {
    render(<QuestionCard prompt="4 × □ = 28" />)
    expect(screen.getByText('4 × □ = 28')).toBeInTheDocument()
  })

  it('수와 기호로 된 식은 큰 글씨로 쓴다', () => {
    render(<QuestionCard prompt="37 + 45 = ?" />)
    expect(screen.getByText('37 + 45 = ?')).toHaveClass('text-number')
  })

  it('읽는 문장은 한 단계 작은 글씨로 쓴다. 그래도 20px 아래로는 안 간다', () => {
    const long = '대원 27명을 4명씩 태우면 우주선이 몇 대 필요할까?'
    render(<QuestionCard prompt={long} />)
    expect(screen.getByText(long)).toHaveClass('text-question')
  })

  it('짧아도 한글이 섞이면 문장으로 본다', () => {
    render(<QuestionCard prompt="삼백사십이를 숫자로 쓰면?" />)
    expect(screen.getByText('삼백사십이를 숫자로 쓰면?')).toHaveClass('text-question')
  })

  it('줄마다 크기를 따로 정한다', () => {
    render(<QuestionCard prompt={'빈칸에 알맞은 것은?\n4213 □ 4231'} />)
    expect(screen.getByText('빈칸에 알맞은 것은?')).toHaveClass('text-question')
    // 수를 비교하는 줄이라 크게 보여야 한다
    expect(screen.getByText('4213 □ 4231')).toHaveClass('text-number')
  })

  it('뛰어 세기처럼 길게 늘어선 수는 한 단계 줄여 한 줄에 담는다', () => {
    render(<QuestionCard prompt={'빈칸에 알맞은 수는?\n230, 240, □, 260'} />)
    expect(screen.getByText('230, 240, □, 260')).toHaveClass('text-number-tight')
  })

  it('아주 긴 수열은 읽는 글씨 크기까지 내린다. 그래도 20px 아래로는 안 간다', () => {
    render(<QuestionCard prompt={'빈칸에 알맞은 수는?\n230, 240, 250, □, 270'} />)
    expect(screen.getByText('230, 240, 250, □, 270')).toHaveClass('text-question')
  })

  it('세 자리 계산식은 그대로 큰 글씨다', () => {
    render(<QuestionCard prompt="476 + 358 = ?" />)
    expect(screen.getByText('476 + 358 = ?')).toHaveClass('text-number')
  })

  it('부등호도 식으로 본다', () => {
    render(<QuestionCard prompt="1234 > 999" />)
    expect(screen.getByText('1234 > 999')).toHaveClass('text-number')
  })

  it('문장제는 모든 줄이 읽는 글씨다', () => {
    render(<QuestionCard prompt={'칸 6개에\n부품이 8개씩 있어.\n모두 몇 개?'} />)
    for (const line of ['칸 6개에', '부품이 8개씩 있어.', '모두 몇 개?']) {
      expect(screen.getByText(line), line).toHaveClass('text-question')
    }
  })
})
