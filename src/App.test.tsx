import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import App from './App'
import { STAGE_ORDER, templatesFor, worldById } from './data/worlds'
import { buildStage, stageSeed, type Question, type StageLevel } from './engine'
import { loadSave, starsOf, worldProgress } from './state/save'

const WORLD = worldById(1)

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

let store: Storage

beforeEach(() => {
  store = fakeStorage()
})

const key = (name: string | RegExp) => screen.getByRole('button', { name })

/**
 * 화면이 낼 문제를 App 과 같은 시드로 다시 만든다.
 * 생성기가 순수 함수라 답을 미리 알 수 있다.
 */
function questionsFor(level: StageLevel, attempt = 0): Question[] {
  return buildStage(templatesFor(WORLD, level), stageSeed(WORLD.id, level, attempt))
}

async function solve(user: ReturnType<typeof userEvent.setup>, question: Question, correct = true) {
  if (question.inputType === 'choice') {
    const choices = question.choices ?? []
    const pick = correct
      ? String(question.answer)
      : String(choices.find((c) => String(c) !== String(question.answer)))
    await user.click(key(pick))
  } else if (question.inputType === 'order') {
    const answer = question.answer as number[]
    const order = correct ? answer : [...answer].reverse()
    for (const value of order) await user.click(key(String(value)))
    await user.click(key('확인'))
  } else {
    const value = correct ? String(question.answer) : String((question.answer as number) + 1)
    for (const digit of value) await user.click(key(digit))
    await user.click(key('확인'))
  }

  if (!correct) {
    await user.click(key('다시 하기'))
    await solve(user, question, true)
    return
  }
  await user.click(key('다음'))
}

async function playStage(
  user: ReturnType<typeof userEvent.setup>,
  level: StageLevel,
  attempt = 0,
) {
  for (const question of questionsFor(level, attempt)) await solve(user, question)
}

describe('월드 1 통째로 플레이', () => {
  it('제목에서 출발해 보스까지 끝내고 부품을 받는다', async () => {
    const user = userEvent.setup()
    render(<App storage={store} />)

    await user.click(key('출발!'))
    expect(screen.getByText('어디로 갈까?')).toBeInTheDocument()

    await user.click(key(new RegExp(`^${WORLD.name}`)))
    await user.click(key(/^1단계/))

    for (const level of STAGE_ORDER) {
      await playStage(user, level)
      expect(screen.getByLabelText('별 3개'), String(level)).toBeInTheDocument()

      if (level === 'boss') {
        expect(screen.getByText(`${WORLD.partName} 획득!`)).toBeInTheDocument()
      } else {
        await user.click(key('다음 단계'))
      }
    }

    const save = loadSave(store)
    expect(save.parts).toEqual([WORLD.part])
    expect(worldProgress(save, 1).bossCleared).toBe(true)
    expect(save.coins).toBe(6 * 8 * 10)
  }, 180000)
})

describe('Phase 4 완료 조건 — 껐다 켜도 그대로', () => {
  it('앱을 완전히 닫았다 다시 열어도 별과 코인이 남는다', async () => {
    const user = userEvent.setup()
    const first = render(<App storage={store} />)

    await user.click(key('출발!'))
    await user.click(key(new RegExp(`^${WORLD.name}`)))
    await user.click(key(/^1단계/))
    await playStage(user, 1)
    expect(screen.getByLabelText('별 3개')).toBeInTheDocument()

    // 브라우저를 완전히 끈다
    first.unmount()

    // 다시 켠다. 같은 기기의 같은 저장소다.
    render(<App storage={store} />)
    await user.click(key('출발!'))
    await user.click(key(new RegExp(`^${WORLD.name}`)))

    // 1단계에 별 셋이 그대로 있고, 2단계가 열려 있다
    expect(screen.getByLabelText('별 3개')).toBeInTheDocument()
    expect(key(/^2단계/)).toBeEnabled()
    expect(starsOf(loadSave(store), 1, 1)).toBe(3)
  }, 120000)

  it('저장이 깨져 있어도 게임이 뜬다', async () => {
    const user = userEvent.setup()
    store.setItem('space-robot-math.save', '{{{ 망가짐')
    render(<App storage={store} />)

    await user.click(key('출발!'))
    expect(screen.getByText('어디로 갈까?')).toBeInTheDocument()
  })
})

describe('월드맵 잠금', () => {
  it('처음에는 1단계만 열려 있다', async () => {
    const user = userEvent.setup()
    render(<App storage={store} />)

    await user.click(key('출발!'))
    await user.click(key(new RegExp(`^${WORLD.name}`)))

    expect(key(/^1단계/)).toBeEnabled()
    for (const label of [/^2단계/, /^3단계/, /^4단계/, /^5단계/, /^보스/]) {
      expect(key(label), String(label)).toBeDisabled()
    }
  })

  it('한 단계를 끝내면 다음 단계가 열린다. 별이 없어도 열린다', async () => {
    const user = userEvent.setup()
    render(<App storage={store} />)

    await user.click(key('출발!'))
    await user.click(key(new RegExp(`^${WORLD.name}`)))
    await user.click(key(/^1단계/))

    // 전부 처음에 틀렸다가 고쳐 푼다 → 별 0개
    for (const question of questionsFor(1)) await solve(user, question, false)
    expect(screen.getByLabelText('별 0개')).toBeInTheDocument()

    await user.click(key('우주로'))
    expect(key(/^2단계/)).toBeEnabled()
    expect(key(/^3단계/)).toBeDisabled()
  }, 120000)

  it('월드 2는 월드 1 보스를 깨기 전까지 잠겨 있다', async () => {
    const user = userEvent.setup()
    render(<App storage={store} />)

    await user.click(key('출발!'))
    expect(key(/^중력 협곡/)).toBeDisabled()
  })

  it('아직 문제를 만들지 않은 월드는 준비 중으로 보인다', async () => {
    const user = userEvent.setup()
    render(<App storage={store} />)

    await user.click(key('출발!'))
    // 월드 2~8 은 아직 템플릿이 없다
    expect(screen.getAllByText('준비 중')).toHaveLength(7)
  })
})

describe('다시 도전', () => {
  it('다시 하기를 누르면 같은 단계의 다른 문제가 나온다', async () => {
    const user = userEvent.setup()
    render(<App storage={store} />)

    await user.click(key('출발!'))
    await user.click(key(new RegExp(`^${WORLD.name}`)))
    await user.click(key(/^1단계/))

    const first = questionsFor(1)
    for (const question of first) await solve(user, question)

    await user.click(key('다시 하기'))
    expect(screen.queryByText(first[0]?.prompt ?? '')).not.toBeInTheDocument()
  }, 120000)

  it('다시 해서 못 봐도 이미 받은 별은 남는다', async () => {
    const user = userEvent.setup()
    render(<App storage={store} />)

    await user.click(key('출발!'))
    await user.click(key(new RegExp(`^${WORLD.name}`)))
    await user.click(key(/^1단계/))
    for (const question of questionsFor(1)) await solve(user, question)

    await user.click(key('다시 하기'))
    // 이번엔 전부 처음에 틀린다
    for (const question of questionsFor(1, 1)) await solve(user, question, false)

    expect(starsOf(loadSave(store), 1, 1)).toBe(3)
  }, 180000)
})
