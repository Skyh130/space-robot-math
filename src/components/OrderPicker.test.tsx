import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { OrderPicker } from './OrderPicker'

const key = (name: string) => screen.getByRole('button', { name })

describe('OrderPicker', () => {
  it('고른 순서대로 답을 넘긴다', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<OrderPicker items={[511, 682, 461]} onSubmit={onSubmit} />)

    for (const value of ['461', '511', '682']) await user.click(key(value))
    await user.click(key('확인'))
    expect(onSubmit).toHaveBeenCalledWith([461, 511, 682])
  })

  it('다 고르기 전에는 확인을 누를 수 없다', async () => {
    const user = userEvent.setup()
    render(<OrderPicker items={[1, 2, 3]} onSubmit={vi.fn()} />)

    expect(key('확인')).toBeDisabled()
    await user.click(key('1'))
    expect(key('확인')).toBeDisabled()
    await user.click(key('2'))
    await user.click(key('3'))
    expect(key('확인')).toBeEnabled()
  })

  it('고른 조각은 목록에서 사라진다', async () => {
    const user = userEvent.setup()
    render(<OrderPicker items={[10, 20]} onSubmit={vi.fn()} />)

    await user.click(key('10'))
    expect(screen.queryByRole('button', { name: '10' })).not.toBeInTheDocument()
  })

  it('되돌리기로 마지막 하나를 취소한다. 잘못 눌러도 벌이 없다', async () => {
    const user = userEvent.setup()
    render(<OrderPicker items={[10, 20]} onSubmit={vi.fn()} />)

    await user.click(key('10'))
    await user.click(key('되돌리기'))
    expect(key('10')).toBeInTheDocument()
  })

  it('아무것도 고르지 않았으면 되돌릴 것이 없다', () => {
    render(<OrderPicker items={[1, 2]} onSubmit={vi.fn()} />)
    expect(key('되돌리기')).toBeDisabled()
  })

  it('같은 값이 두 번 있어도 각각 한 번씩만 고를 수 있다', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<OrderPicker items={[7, 7]} onSubmit={onSubmit} />)

    await user.click(screen.getAllByRole('button', { name: '7' })[0] as HTMLElement)
    await user.click(screen.getByRole('button', { name: '7' }))
    await user.click(key('확인'))
    expect(onSubmit).toHaveBeenCalledWith([7, 7])
  })
})
