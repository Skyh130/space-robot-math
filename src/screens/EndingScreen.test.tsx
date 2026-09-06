import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { WORLDS } from '../data/worlds'
import { defaultSave } from '../state/save'
import { EndingScreen } from './EndingScreen'

const full = { ...defaultSave(), parts: WORLDS.map((world) => world.part) }

describe('EndingScreen', () => {
  it('빛이 먼저 퍼지고 그다음 완성된 로봇이 선다', async () => {
    render(<EndingScreen save={full} onHangar={vi.fn()} />)
    // 처음에는 부품이 하나도 붙어 있지 않다
    expect(screen.getByRole('img', { name: /부품 0개/ })).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByRole('img', { name: /부품 8개/ })).toBeInTheDocument()
    })
  })

  it('합체를 알리고 여태 모은 것을 세어 준다', async () => {
    render(<EndingScreen save={full} onHangar={vi.fn()} />)
    await waitFor(() => {
      expect(screen.getByText('합체 완료!')).toBeInTheDocument()
    })
    expect(screen.getByText('8 / 8')).toBeInTheDocument()
    expect(screen.getByText('8곳')).toBeInTheDocument()
  })

  it('연출이 끝나야 버튼을 누를 수 있다. 먼저 띄우면 건너뛴다', async () => {
    const user = userEvent.setup()
    const onHangar = vi.fn()
    render(<EndingScreen save={full} onHangar={onHangar} />)

    // 처음에는 보이지 않는다
    expect(screen.getByRole('button', { name: '격납고로' }).className).toContain('invisible')

    await waitFor(
      () => {
        expect(screen.getByRole('button', { name: '격납고로' }).className).not.toContain('invisible')
      },
      { timeout: 5000 },
    )
    await user.click(screen.getByRole('button', { name: '격납고로' }))
    expect(onHangar).toHaveBeenCalledOnce()
  })

  it('나가는 길이 하나뿐이다. 다 끝낸 아이에게 고를 것을 주지 않는다', () => {
    render(<EndingScreen save={full} onHangar={vi.fn()} />)
    expect(screen.getAllByRole('button')).toHaveLength(1)
  })

  it('나무라거나 아쉬워하는 말을 쓰지 않는다', () => {
    const { container } = render(<EndingScreen save={full} onHangar={vi.fn()} />)
    const text = container.textContent ?? ''
    for (const banned of ['실패', '아쉽', '미안', '틀렸']) {
      expect(text, banned).not.toContain(banned)
    }
  })
})
