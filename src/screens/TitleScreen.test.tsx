import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { TitleScreen } from './TitleScreen'

describe('TitleScreen', () => {
  it('제목과 출발 버튼이 있다', () => {
    render(<TitleScreen onStart={vi.fn()} />)
    expect(screen.getByText('우주 로봇')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '출발!' })).toBeInTheDocument()
  })

  it('출발을 누르면 시작한다', async () => {
    const user = userEvent.setup()
    const onStart = vi.fn()
    render(<TitleScreen onStart={onStart} />)

    await user.click(screen.getByRole('button', { name: '출발!' }))
    expect(onStart).toHaveBeenCalledOnce()
  })

  it('설명 없이도 무엇을 누를지 알 수 있게 버튼이 하나뿐이다', () => {
    render(<TitleScreen onStart={vi.fn()} />)
    expect(screen.getAllByRole('button')).toHaveLength(1)
  })

  it('만든이가 제목 화면에 있다', () => {
    render(<TitleScreen onStart={vi.fn()} />)
    expect(screen.getByText(/SkyHan/)).toBeInTheDocument()
    expect(screen.getByText(/Kai/)).toBeInTheDocument()
  })
})
