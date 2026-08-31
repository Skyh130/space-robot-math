import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { NumPad } from './NumPad'

function Harness({ onSubmit, maxLength }: { onSubmit?: () => void; maxLength?: number }) {
  const [value, setValue] = useState('')
  return (
    <NumPad
      value={value}
      onChange={setValue}
      onSubmit={onSubmit ?? (() => undefined)}
      {...(maxLength === undefined ? {} : { maxLength })}
    />
  )
}

const key = (name: string) => screen.getByRole('button', { name })

describe('NumPad', () => {
  it('누른 숫자가 순서대로 쌓인다', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(key('4'))
    await user.click(key('2'))
    expect(screen.getByLabelText('내가 쓴 답')).toHaveTextContent('42')
  })

  it('비어 있을 때는 안내 문구가 보인다', () => {
    render(<Harness />)
    expect(screen.getByLabelText('내가 쓴 답')).toHaveTextContent('여기에 답을 써 줘')
  })

  it('지우기는 마지막 한 글자만 지운다', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(key('1'))
    await user.click(key('2'))
    await user.click(key('3'))
    await user.click(key('지우기'))
    expect(screen.getByLabelText('내가 쓴 답')).toHaveTextContent('12')
  })

  it('빈 상태에서는 지우기를 누를 수 없다', () => {
    render(<Harness />)
    expect(key('지우기')).toBeDisabled()
  })

  it('빈 상태에서는 확인을 누를 수 없다', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<Harness onSubmit={onSubmit} />)

    expect(key('확인')).toBeDisabled()
    await user.click(key('확인'))
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('숫자를 넣으면 확인을 누를 수 있다', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<Harness onSubmit={onSubmit} />)

    await user.click(key('7'))
    await user.click(key('확인'))
    expect(onSubmit).toHaveBeenCalledOnce()
  })

  it('자릿수 제한을 넘으면 더 들어가지 않는다', async () => {
    const user = userEvent.setup()
    render(<Harness maxLength={2} />)

    for (const digit of ['1', '2', '3']) {
      await user.click(key(digit))
    }
    expect(screen.getByLabelText('내가 쓴 답')).toHaveTextContent('12')
  })

  it('앞자리 0 뒤에 숫자를 누르면 0을 밀어낸다', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(key('0'))
    await user.click(key('5'))
    expect(screen.getByLabelText('내가 쓴 답')).toHaveTextContent('5')
  })

  it('0 하나만 쓸 수도 있다', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(key('0'))
    expect(screen.getByLabelText('내가 쓴 답')).toHaveTextContent('0')
    expect(key('확인')).toBeEnabled()
  })

  it('0부터 9까지 모든 키가 있다', () => {
    render(<Harness />)
    for (let digit = 0; digit <= 9; digit += 1) {
      expect(key(String(digit))).toBeInTheDocument()
    }
  })

  it('disabled 면 어떤 키도 눌리지 않는다', () => {
    render(<NumPad value="7" onChange={() => undefined} onSubmit={() => undefined} disabled />)
    expect(key('5')).toBeDisabled()
    expect(key('지우기')).toBeDisabled()
    expect(key('확인')).toBeDisabled()
  })
})
