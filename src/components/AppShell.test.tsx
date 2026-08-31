import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import App from '../App'
import { AppShell } from './AppShell'

describe('AppShell', () => {
  it('자식을 그대로 렌더한다', () => {
    render(
      <AppShell>
        <p>출발!</p>
      </AppShell>,
    )
    expect(screen.getByText('출발!')).toBeInTheDocument()
  })

  it('가로로 눕혔을 때 쓸 회전 안내를 함께 그린다', () => {
    render(
      <AppShell>
        <p>내용</p>
      </AppShell>,
    )
    expect(screen.getByText('화면을 세로로 돌려줘!')).toBeInTheDocument()
  })

  it('태블릿에서 중앙 정렬되도록 최대 폭을 제한한다', () => {
    const { container } = render(
      <AppShell>
        <p>내용</p>
      </AppShell>,
    )
    const inner = container.querySelector('.max-w-app')
    expect(inner).not.toBeNull()
  })
})

describe('App', () => {
  it('제목이 뜬다', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: '우주 로봇 수학 모험' })).toBeInTheDocument()
  })
})
