import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { HintVisualView } from './HintVisual'

describe('HintVisualView', () => {
  it('자릿값 표는 자리마다 숫자를 떼어 놓는다', () => {
    render(<HintVisualView visual={{ kind: 'placeValue', value: 472, highlight: 1 }} />)
    for (const label of ['백', '십', '일']) {
      expect(screen.getByText(label)).toBeInTheDocument()
    }
    expect(screen.getByText('4')).toBeInTheDocument()
    // 강조한 자리의 값을 함께 적어 준다
    expect(screen.getByText('70')).toBeInTheDocument()
  })

  it('네 자리 수는 천의 자리까지 그린다', () => {
    render(<HintVisualView visual={{ kind: 'placeValue', value: 3042, highlight: 3 }} />)
    expect(screen.getByText('천')).toBeInTheDocument()
    expect(screen.getByText('3000')).toBeInTheDocument()
  })

  it('비교 표는 두 수를 위아래로 놓는다', () => {
    const { container } = render(
      <HintVisualView visual={{ kind: 'placeValueCompare', left: 4213, right: 4231 }} />,
    )
    expect(container.textContent).toContain('4213')
    expect(container.textContent).toContain('4231')
  })

  it('수직선은 늘어놓은 수를 모두 보여준다', () => {
    render(<HintVisualView visual={{ kind: 'numberLine', values: [230, 240, 250], highlight: 240 }} />)
    for (const value of ['230', '240', '250']) {
      expect(screen.getByText(value)).toBeInTheDocument()
    }
  })

  it('묶음 그림은 누적 수를 적는다', () => {
    render(<HintVisualView visual={{ kind: 'dotGroups', step: 4, times: 7 }} />)
    expect(screen.getByRole('img', { name: '4씩 7묶음을 세는 그림' })).toBeInTheDocument()
    expect(screen.getByText('28')).toBeInTheDocument()
  })
})
