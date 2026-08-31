import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { PartRewardScreen } from './PartRewardScreen'

function renderReward(onContinue = vi.fn()) {
  render(
    <PartRewardScreen
      part="head"
      partName="헤드 유닛"
      parts={['head']}
      totalParts={8}
      onContinue={onContinue}
    />,
  )
  return onContinue
}

describe('PartRewardScreen — 부품 획득 연출', () => {
  it('받은 부품 이름과 모은 개수를 보여준다', async () => {
    renderReward()
    expect(screen.getByText('부품 획득!')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText('헤드 유닛')).toBeVisible())
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('연출이 끝나기 전에는 버튼을 띄우지 않는다', () => {
    renderReward()
    // 버튼이 먼저 보이면 아이가 연출을 건너뛴다
    expect(screen.getByRole('button', { name: '격납고로' })).toHaveClass('invisible')
  })

  it('연출이 끝나면 버튼이 나온다', async () => {
    const onContinue = renderReward()
    await waitFor(
      () => expect(screen.getByRole('button', { name: '격납고로' })).not.toHaveClass('invisible'),
      { timeout: 5000 },
    )

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: '격납고로' }))
    expect(onContinue).toHaveBeenCalledOnce()
  }, 10000)

  it('부품이 로봇에 붙는다', async () => {
    renderReward()
    await waitFor(() => expect(screen.getByLabelText('헤드 유닛')).toBeInTheDocument(), {
      timeout: 5000,
    })
    expect(screen.getByLabelText('부품 1개를 붙인 로봇')).toBeInTheDocument()
  }, 10000)

  it('붙기 전에는 그 자리가 비어 있다', () => {
    renderReward()
    expect(screen.getByLabelText('헤드 유닛 자리')).toBeInTheDocument()
    expect(screen.getByLabelText('부품 0개를 붙인 로봇')).toBeInTheDocument()
  })
})
