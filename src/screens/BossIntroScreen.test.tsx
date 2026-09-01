import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { worldById } from '../data/worlds'
import { BossIntroScreen } from './BossIntroScreen'

describe('BossIntroScreen', () => {
  it('보스가 등장했다고 알리고 어느 행성인지 보여준다', () => {
    render(<BossIntroScreen world={worldById(1)} onStart={vi.fn()} />)
    expect(screen.getByText('보스 등장!')).toBeInTheDocument()
    expect(screen.getByText('숫자 소행성대')).toBeInTheDocument()
  })

  it('무엇이 걸려 있는지 알려 준다', () => {
    render(<BossIntroScreen world={worldById(2)} onStart={vi.fn()} />)
    expect(screen.getByText('이기면 왼팔')).toBeInTheDocument()
  })

  it('아무 때나 눌러 넘길 수 있다. 두 번째부터는 연출이 방해가 된다', async () => {
    const user = userEvent.setup()
    const onStart = vi.fn()
    render(<BossIntroScreen world={worldById(1)} onStart={onStart} />)

    await user.click(screen.getByRole('button', { name: '보스전 시작' }))
    expect(onStart).toHaveBeenCalledOnce()
  })

  it('연출이 끝나면 눌러서 시작하라고 알려 준다', async () => {
    render(<BossIntroScreen world={worldById(1)} onStart={vi.fn()} />)
    expect(screen.getByText('눌러서 시작')).toHaveClass('invisible')

    await waitFor(() => expect(screen.getByText('눌러서 시작')).not.toHaveClass('invisible'), {
      timeout: 4000,
    })
  }, 10000)

  it('시간을 재지 않는다. 겁주는 화면이 아니다', () => {
    const { container } = render(<BossIntroScreen world={worldById(1)} onStart={vi.fn()} />)
    expect(container.textContent).not.toMatch(/초|남은 시간/)
  })
})
