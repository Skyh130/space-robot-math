import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { StageScreen } from './StageScreen'

const key = (name: string) => screen.getByRole('button', { name })

async function answer(user: ReturnType<typeof userEvent.setup>, digits: string) {
  for (const digit of digits) {
    await user.click(key(digit))
  }
  await user.click(key('확인'))
}

describe('StageScreen — 한 문제 풀기', () => {
  it('문제가 화면에 뜬다', () => {
    render(<StageScreen />)
    expect(screen.getByText('4 × □ = 28')).toBeInTheDocument()
  })

  it('정답을 넣으면 칭찬이 나온다', async () => {
    const user = userEvent.setup()
    render(<StageScreen />)

    await answer(user, '7')
    expect(screen.getByText('잘했어!')).toBeInTheDocument()
  })

  it('오답을 넣으면 정답과 한 줄 이유와 그림 힌트가 함께 나온다', async () => {
    const user = userEvent.setup()
    render(<StageScreen />)

    await answer(user, '6')
    expect(screen.getByText('아까워! 다시 볼까?')).toBeInTheDocument()
    expect(screen.getByText('4단을 순서대로 세어 볼까?')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: '4씩 7묶음을 세는 그림' })).toBeInTheDocument()
  })

  it('오답 뒤 다시 하기를 누르면 빈 상태로 돌아가 다시 풀 수 있다', async () => {
    const user = userEvent.setup()
    render(<StageScreen />)

    await answer(user, '6')
    await user.click(key('다시 하기'))

    expect(screen.getByLabelText('내가 쓴 답')).toHaveTextContent('여기에 답을 써 줘')
    await answer(user, '7')
    expect(screen.getByText('잘했어!')).toBeInTheDocument()
  })

  it('몇 번을 틀려도 문제가 사라지거나 벌을 주지 않는다', async () => {
    const user = userEvent.setup()
    render(<StageScreen />)

    for (const wrong of ['1', '2', '3', '9']) {
      await answer(user, wrong)
      expect(screen.getByText('아까워! 다시 볼까?')).toBeInTheDocument()
      await user.click(key('다시 하기'))
      expect(screen.getByText('4 × □ = 28')).toBeInTheDocument()
    }
  })

  it('피드백이 뜨는 동안에는 숫자패드가 화면을 겹치지 않는다', async () => {
    const user = userEvent.setup()
    render(<StageScreen />)

    await answer(user, '7')
    expect(screen.queryByLabelText('내가 쓴 답')).not.toBeInTheDocument()
  })

  it('타이머나 남은 목숨 같은 압박 요소가 없다', () => {
    const { container } = render(<StageScreen />)
    const text = container.textContent ?? ''
    for (const banned of ['초', '남은 시간', '목숨', '체력', 'HP']) {
      expect(text, banned).not.toContain(banned)
    }
  })
})
