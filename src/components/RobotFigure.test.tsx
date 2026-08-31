import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { WORLDS } from '../data/worlds'
import { RobotFigure } from './RobotFigure'

describe('RobotFigure', () => {
  it('부품이 없어도 로봇 자리는 다 그린다. 빈칸이 보여야 모으고 싶어진다', () => {
    render(<RobotFigure parts={[]} />)
    for (const world of WORLDS) {
      expect(screen.getByLabelText(`${world.partName} 자리`), world.partName).toBeInTheDocument()
    }
  })

  it('가진 부품은 자리가 아니라 부품으로 그린다', () => {
    render(<RobotFigure parts={['head', 'body']} />)
    expect(screen.getByLabelText('헤드 유닛')).toBeInTheDocument()
    expect(screen.getByLabelText('몸통')).toBeInTheDocument()
    expect(screen.queryByLabelText('헤드 유닛 자리')).not.toBeInTheDocument()
    expect(screen.getByLabelText('왼팔 자리')).toBeInTheDocument()
  })

  it('몇 개를 붙였는지 읽어 줄 수 있게 한다', () => {
    render(<RobotFigure parts={['head', 'body', 'left_arm']} />)
    expect(screen.getByLabelText('부품 3개를 붙인 로봇')).toBeInTheDocument()
  })

  it('여덟 부품을 다 모으면 자리가 하나도 남지 않는다', () => {
    render(<RobotFigure parts={WORLDS.map((world) => world.part)} />)
    expect(screen.queryByLabelText(/자리$/)).not.toBeInTheDocument()
  })

  it('방금 붙인 부품만 붙는 연출이 들어간다', () => {
    const { container } = render(<RobotFigure parts={['head', 'body']} highlight="head" />)
    expect(container.querySelectorAll('.animate-attach')).toHaveLength(1)
  })
})
