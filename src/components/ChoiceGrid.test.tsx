import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { ChoiceGrid } from './ChoiceGrid'

describe('ChoiceGrid', () => {
  it('보기를 모두 버튼으로 그린다', () => {
    render(<ChoiceGrid choices={[12, 16, 24, 28]} onPick={() => undefined} />)
    for (const value of ['12', '16', '24', '28']) {
      expect(screen.getByRole('button', { name: value })).toBeInTheDocument()
    }
  })

  it('누른 보기를 그대로 넘긴다', async () => {
    const user = userEvent.setup()
    const onPick = vi.fn()
    render(<ChoiceGrid choices={[12, 16, 24, 28]} onPick={onPick} />)

    await user.click(screen.getByRole('button', { name: '24' }))
    expect(onPick).toHaveBeenCalledWith(24)
  })

  it('부등호 같은 기호도 보기로 쓸 수 있다', async () => {
    const user = userEvent.setup()
    const onPick = vi.fn()
    render(<ChoiceGrid choices={['>', '<', '=']} onPick={onPick} />)

    await user.click(screen.getByRole('button', { name: '<' }))
    expect(onPick).toHaveBeenCalledWith('<')
  })

  it('disabled 면 누를 수 없다', async () => {
    const user = userEvent.setup()
    const onPick = vi.fn()
    render(<ChoiceGrid choices={[1, 2]} onPick={onPick} disabled />)

    await user.click(screen.getByRole('button', { name: '1' }))
    expect(onPick).not.toHaveBeenCalled()
  })
})
