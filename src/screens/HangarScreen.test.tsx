import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { WORLDS } from '../data/worlds'
import { defaultSave } from '../state/save'
import { HangarScreen } from './HangarScreen'

describe('HangarScreen', () => {
  it('모은 부품 수를 보여준다', () => {
    render(<HangarScreen save={{ ...defaultSave(), parts: ['head', 'left_arm'] }} onBack={vi.fn()} />)
    expect(screen.getByText('부품 2 / 8')).toBeInTheDocument()
  })

  it('부품 여덟 칸을 모두 늘어놓는다', () => {
    render(<HangarScreen save={defaultSave()} onBack={vi.fn()} />)
    for (const world of WORLDS) {
      expect(screen.getByText(world.partName), world.partName).toBeInTheDocument()
    }
  })

  it('가진 부품이 로봇에 붙어 있다', () => {
    render(<HangarScreen save={{ ...defaultSave(), parts: ['head'] }} onBack={vi.fn()} />)
    expect(screen.getByLabelText('부품 1개를 붙인 로봇')).toBeInTheDocument()
    expect(screen.getByLabelText('헤드 유닛')).toBeInTheDocument()
  })

  it('우주로 돌아갈 수 있다', async () => {
    const user = userEvent.setup()
    const onBack = vi.fn()
    render(<HangarScreen save={defaultSave()} onBack={onBack} />)

    await user.click(screen.getByRole('button', { name: '우주로' }))
    expect(onBack).toHaveBeenCalledOnce()
  })

  it('조용한 화면이다. 시간이나 점수 압박이 없다', () => {
    const { container } = render(<HangarScreen save={defaultSave()} onBack={vi.fn()} />)
    expect(container.textContent).not.toMatch(/초|남은|실패/)
  })
})
