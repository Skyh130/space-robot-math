import { act, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { loadSave, starsOf, type StageRecord } from './save'
import { ProgressProvider, useProgress } from './useProgress'

function fakeStorage(): Storage {
  const map = new Map<string, string>()
  return {
    get length() {
      return map.size
    },
    clear: () => map.clear(),
    getItem: (key) => map.get(key) ?? null,
    key: (index) => [...map.keys()][index] ?? null,
    removeItem: (key) => void map.delete(key),
    setItem: (key, value) => void map.set(key, String(value)),
  }
}

let finish: (record: StageRecord) => void
let reset: () => void

function Probe() {
  const progress = useProgress()
  finish = progress.finishStage
  reset = progress.reset
  return <p>코인 {progress.save.coins}</p>
}

describe('useProgress', () => {
  it('스테이지를 끝내면 곧바로 저장한다', () => {
    const store = fakeStorage()
    render(
      <ProgressProvider storage={store}>
        <Probe />
      </ProgressProvider>,
    )
    expect(screen.getByText('코인 0')).toBeInTheDocument()

    act(() => {
      finish({ world: 1, level: 1, stars: 3, correct: 8, skillLog: [] })
    })

    expect(screen.getByText('코인 80')).toBeInTheDocument()
    // 화면만 바뀌고 저장이 안 되면 앱을 닫는 순간 사라진다
    expect(starsOf(loadSave(store), 1, 1)).toBe(3)
  })

  it('저장된 진행을 그대로 읽어 온다', () => {
    const store = fakeStorage()
    render(
      <ProgressProvider storage={store}>
        <Probe />
      </ProgressProvider>,
    )
    act(() => {
      finish({ world: 1, level: 1, stars: 3, correct: 8, skillLog: [] })
    })

    render(
      <ProgressProvider storage={store}>
        <Probe />
      </ProgressProvider>,
    )
    expect(screen.getAllByText('코인 80')).toHaveLength(2)
  })

  it('처음부터 다시 시작할 수 있다', () => {
    const store = fakeStorage()
    render(
      <ProgressProvider storage={store}>
        <Probe />
      </ProgressProvider>,
    )
    act(() => {
      finish({ world: 1, level: 1, stars: 3, correct: 8, skillLog: [] })
    })
    act(() => {
      reset()
    })

    expect(screen.getByText('코인 0')).toBeInTheDocument()
    expect(starsOf(loadSave(store), 1, 1)).toBe(-1)
  })

  it('Provider 밖에서 쓰면 알려 준다', () => {
    expect(() => render(<Probe />)).toThrow(/ProgressProvider/)
  })
})
