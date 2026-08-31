import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { WORLDS } from '../data/worlds'
import { defaultSave, recordStage, type SaveData } from '../state/save'
import { WorldMapScreen } from './WorldMapScreen'

const noop = () => undefined

function played(): SaveData {
  let save = defaultSave()
  save = recordStage(save, { world: 1, level: 1, stars: 3, correct: 8, skillLog: [] })
  save = recordStage(save, { world: 1, level: 2, stars: 2, correct: 7, skillLog: [] })
  return save
}

describe('WorldMapScreen — 행성 목록', () => {
  it('행성 8개를 모두 보여준다. 못 가는 곳도 자리를 남긴다', () => {
    render(
      <WorldMapScreen save={defaultSave()} openWorld={null} onOpenWorld={noop} onPlay={noop} />,
    )
    for (const world of WORLDS) {
      expect(screen.getByText(world.name), world.name).toBeInTheDocument()
    }
  })

  it('모은 별을 다 합쳐 보여준다', () => {
    render(<WorldMapScreen save={played()} openWorld={null} onOpenWorld={noop} onPlay={noop} />)
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('아직 문제가 없는 행성은 준비 중이고 누를 수 없다', () => {
    render(
      <WorldMapScreen save={defaultSave()} openWorld={null} onOpenWorld={noop} onPlay={noop} />,
    )
    expect(screen.getAllByText('준비 중')).toHaveLength(5)
    expect(screen.getByRole('button', { name: /관제 스테이션/ })).toBeDisabled()
  })

  it('갈 수 있는 행성을 누르면 펼친다', async () => {
    const user = userEvent.setup()
    const onOpenWorld = vi.fn()
    render(
      <WorldMapScreen
        save={defaultSave()}
        openWorld={null}
        onOpenWorld={onOpenWorld}
        onPlay={noop}
      />,
    )
    await user.click(screen.getByRole('button', { name: /숫자 소행성대/ }))
    expect(onOpenWorld).toHaveBeenCalledWith(1)
  })

  it('격납고 버튼은 넘겨줄 때만 나온다', () => {
    const { rerender } = render(
      <WorldMapScreen save={defaultSave()} openWorld={null} onOpenWorld={noop} onPlay={noop} />,
    )
    expect(screen.queryByRole('button', { name: '격납고' })).not.toBeInTheDocument()

    rerender(
      <WorldMapScreen
        save={defaultSave()}
        openWorld={null}
        onOpenWorld={noop}
        onPlay={noop}
        onHangar={noop}
      />,
    )
    expect(screen.getByRole('button', { name: '격납고' })).toBeInTheDocument()
  })

  it('시간을 보여주지 않는다', () => {
    const { container } = render(
      <WorldMapScreen save={played()} openWorld={null} onOpenWorld={noop} onPlay={noop} />,
    )
    expect(container.textContent).not.toMatch(/초|분|남은 시간/)
  })
})

describe('WorldMapScreen — 단계 목록', () => {
  it('Lv1~Lv5 와 보스를 보여준다', () => {
    render(<WorldMapScreen save={played()} openWorld={1} onOpenWorld={noop} onPlay={noop} />)
    for (const label of ['1단계', '2단계', '3단계', '4단계', '5단계']) {
      expect(screen.getByText(label), label).toBeInTheDocument()
    }
    expect(screen.getByText('보스 · 헤드 유닛')).toBeInTheDocument()
  })

  it('받은 별을 단계마다 보여준다', () => {
    render(<WorldMapScreen save={played()} openWorld={1} onOpenWorld={noop} onPlay={noop} />)
    expect(screen.getByLabelText('별 3개')).toBeInTheDocument()
    expect(screen.getByLabelText('별 2개')).toBeInTheDocument()
  })

  it('잠긴 단계는 자물쇠를 달고 누를 수 없다', () => {
    render(
      <WorldMapScreen save={defaultSave()} openWorld={1} onOpenWorld={noop} onPlay={noop} />,
    )
    expect(screen.getAllByLabelText('잠김')).toHaveLength(5)
    expect(screen.getByRole('button', { name: /^2단계/ })).toBeDisabled()
  })

  it('열린 단계를 누르면 그 단계를 연다', async () => {
    const user = userEvent.setup()
    const onPlay = vi.fn()
    render(<WorldMapScreen save={played()} openWorld={1} onOpenWorld={noop} onPlay={onPlay} />)

    await user.click(screen.getByRole('button', { name: /^3단계/ }))
    expect(onPlay).toHaveBeenCalledWith(1, 3)
  })

  it('우주로를 누르면 행성 목록으로 돌아간다', async () => {
    const user = userEvent.setup()
    const onOpenWorld = vi.fn()
    render(
      <WorldMapScreen save={played()} openWorld={1} onOpenWorld={onOpenWorld} onPlay={noop} />,
    )
    await user.click(screen.getByRole('button', { name: '우주로' }))
    expect(onOpenWorld).toHaveBeenCalledWith(null)
  })
})
