import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import App from './App'
import { STAGE_ORDER, templatesFor, worldById } from './data/worlds'
import { buildStage, stageSeed, type Question, type StageLevel } from './engine'
import { defaultSave, loadSave, recordStage, starsOf, worldProgress, writeSave } from './state/save'

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


/**
 * 화면을 보고 푸는 방식.
 *
 * 오답 재출제가 켜지면 뒤에 나올 문제가 바뀌므로 미리 알 수 없다.
 * 일부러 틀린 뒤 피드백에 적힌 정답을 읽어 다시 푼다.
 * 4지선다 스테이지에서만 쓴다.
 */
function choiceButtons(): HTMLElement[] {
  return screen
    .getAllByRole('button')
    .filter((button) => /^[0-9]+$/.test(button.textContent?.trim() ?? ''))
}

function shownAnswer(): string {
  const node = document.querySelector('.text-coral')
  return node?.textContent?.trim() ?? ''
}

/** 첫 시도에 일부러 틀린 뒤 정답을 읽어 다시 푼다. 별 0개로 끝내기 위한 것이다. */
async function missThenFix(user: ReturnType<typeof userEvent.setup>) {
  const buttons = choiceButtons()
  await user.click(buttons[0] as HTMLElement)

  if (screen.queryByText('잘했어!')) {
    // 첫 보기가 우연히 정답이었다. 이 문제는 맞은 것으로 넘어간다.
    await user.click(key('다음'))
    return true
  }

  const answer = shownAnswer()
  await user.click(key('다시 하기'))
  await user.click(key(answer))
  await user.click(key('다음'))
  return false
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

    // 전부 처음에 틀렸다가 고쳐 푼다 → 별이 거의 없다
    let lucky = 0
    for (let i = 0; i < 8; i += 1) {
      if (await missThenFix(user)) lucky += 1
    }
    // 우연히 맞은 것이 두 개를 넘지 않으면 별은 0개다
    expect(lucky).toBeLessThan(6)
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
    // 월드 4~8 은 아직 템플릿이 없다
    expect(screen.getAllByText('준비 중')).toHaveLength(5)
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
    for (let i = 0; i < 8; i += 1) await missThenFix(user)

    expect(starsOf(loadSave(store), 1, 1)).toBe(3)
  }, 180000)
})

describe('월드 2·3 플레이 (Phase 5 완료 조건)', () => {
  /**
   * 앞 월드들을 보스까지 깬 저장을 만든다.
   * openStagesOf 를 주면 그 월드의 Lv1~Lv5 까지만 해 둔 상태가 되어 보스가 열린다.
   */
  function unlockedThrough(world: 1 | 2, openStagesOf?: 2 | 3): Storage {
    const store = fakeStorage()
    let save = defaultSave()
    for (let id = 1 as 1 | 2; id <= world; id += 1) {
      for (const level of STAGE_ORDER) {
        save = recordStage(save, {
          world: id,
          level,
          stars: 3,
          correct: 8,
          skillLog: [],
          ...(level === 'boss' ? { part: worldById(id).part } : {}),
        })
      }
    }
    if (openStagesOf !== undefined) {
      for (const level of [1, 2, 3, 4, 5] as const) {
        save = recordStage(save, {
          world: openStagesOf,
          level,
          stars: 3,
          correct: 8,
          skillLog: [],
        })
      }
    }
    writeSave(save, store)
    return store
  }

  it('월드 2를 처음부터 보스까지 클리어한다', async () => {
    const user = userEvent.setup()
    const store = unlockedThrough(1)
    render(<App storage={store} />)

    const world = worldById(2)
    await user.click(key('출발!'))
    await user.click(key(new RegExp(`^${world.name}`)))
    await user.click(key(/^1단계/))

    for (const level of STAGE_ORDER) {
      for (const question of buildStage(templatesFor(world, level), stageSeed(2, level, 0))) {
        await solve(user, question)
      }
      expect(screen.getByLabelText('별 3개'), String(level)).toBeInTheDocument()
      if (level !== 'boss') await user.click(key('다음 단계'))
    }

    expect(screen.getByText(`${world.partName} 획득!`)).toBeInTheDocument()
    expect(loadSave(store).parts).toContain(world.part)
  }, 240000)

  it('월드 3의 일반 단계를 클리어한다', async () => {
    const user = userEvent.setup()
    const store = unlockedThrough(2)
    render(<App storage={store} />)

    const world = worldById(3)
    await user.click(key('출발!'))
    await user.click(key(new RegExp(`^${world.name}`)))
    await user.click(key(/^1단계/))

    for (const level of [1, 2, 3, 4, 5] as const) {
      for (const question of buildStage(templatesFor(world, level), stageSeed(3, level, 0))) {
        await solve(user, question)
      }
      expect(screen.getByLabelText('별 3개'), String(level)).toBeInTheDocument()
      await user.click(key('다음 단계'))
    }

    // 5단계까지 끝내면 보스가 시작된다
    expect(screen.getByText(`${world.name} · 보스`)).toBeInTheDocument()
  }, 240000)

  it('월드 3 보스만 타이머가 돈다. 코어는 12개다', async () => {
    const user = userEvent.setup()
    const world = worldById(3)

    // 일반 단계에는 타이머가 없다
    const plain = render(<App storage={unlockedThrough(2)} />)
    await user.click(key('출발!'))
    await user.click(key(new RegExp(`^${world.name}`)))
    await user.click(key(/^1단계/))
    expect(screen.queryByLabelText(/남은 시간/)).toBeNull()
    expect(screen.getByLabelText('8문제 중 1번째')).toBeInTheDocument()
    plain.unmount()

    // 보스에만 타이머가 돌고, 코어는 12개다
    render(<App storage={unlockedThrough(2, 3)} />)
    await user.click(key('출발!'))
    await user.click(key(new RegExp(`^${world.name}`)))
    await user.click(key(/^보스/))
    expect(screen.getByLabelText(/남은 시간 \d+초/)).toBeInTheDocument()
    expect(screen.getByLabelText('12문제 중 1번째')).toBeInTheDocument()
  }, 60000)

  it('월드 3 보스 말고는 어떤 스테이지에도 타이머가 없다', async () => {
    const user = userEvent.setup()

    for (const worldId of [1, 2, 3] as const) {
      const meta = worldById(worldId)
      for (const level of STAGE_ORDER) {
        if (worldId === 3 && level === 'boss') continue

        const view = render(<App storage={unlockedThrough(2, 3)} />)
        await user.click(key('출발!'))
        await user.click(key(new RegExp(`^${meta.name}`)))
        await user.click(key(level === 'boss' ? /^보스/ : new RegExp(`^${String(level)}단계`)))

        expect(
          screen.queryByLabelText(/남은 시간/),
          `${meta.name} ${String(level)}`,
        ).toBeNull()
        view.unmount()
      }
    }
  }, 180000)
})

describe('Phase 6 — 격납고와 부품 획득', () => {
  it('보스를 깨면 결과 → 부품 획득 연출 → 격납고 로 이어진다', async () => {
    const user = userEvent.setup()
    const store = fakeStorage()
    let save = defaultSave()
    for (const level of [1, 2, 3, 4, 5] as const) {
      save = recordStage(save, { world: 1, level, stars: 3, correct: 8, skillLog: [] })
    }
    writeSave(save, store)

    render(<App storage={store} />)
    await user.click(key('출발!'))
    await user.click(key(new RegExp(`^${WORLD.name}`)))
    await user.click(key(/^보스/))

    for (const question of buildStage(templatesFor(WORLD, 'boss'), stageSeed(1, 'boss', 0))) {
      await solve(user, question)
    }

    expect(screen.getByText(`${WORLD.partName} 획득!`)).toBeInTheDocument()
    await user.click(key('부품 받기'))

    // 획득 연출
    expect(screen.getByText('부품 획득!')).toBeInTheDocument()
    await waitFor(
      () => expect(screen.getByRole('button', { name: '격납고로' })).not.toHaveClass('invisible'),
      { timeout: 6000 },
    )
    await user.click(key('격납고로'))

    // 격납고에 부품이 붙어 있다
    expect(screen.getByText('격납고')).toBeInTheDocument()
    expect(screen.getByText('부품 1 / 8')).toBeInTheDocument()
    expect(screen.getByLabelText('헤드 유닛')).toBeInTheDocument()

    await user.click(key('우주로'))
    expect(screen.getByText('어디로 갈까?')).toBeInTheDocument()
  }, 120000)

  it('이미 가진 부품은 획득 연출을 다시 하지 않는다', async () => {
    const user = userEvent.setup()
    const store = fakeStorage()
    let save = defaultSave()
    for (const level of STAGE_ORDER) {
      save = recordStage(save, {
        world: 1,
        level,
        stars: 3,
        correct: 8,
        skillLog: [],
        ...(level === 'boss' ? { part: WORLD.part } : {}),
      })
    }
    writeSave(save, store)

    render(<App storage={store} />)
    await user.click(key('출발!'))
    await user.click(key(new RegExp(`^${WORLD.name}`)))
    await user.click(key(/^보스/))

    const attempt = 1
    for (const question of buildStage(templatesFor(WORLD, 'boss'), stageSeed(1, 'boss', attempt))) {
      await solve(user, question)
    }
    expect(screen.queryByRole('button', { name: '부품 받기' })).not.toBeInTheDocument()
    expect(key('우주로')).toBeInTheDocument()
  }, 120000)

  it('월드맵에서 격납고로 갈 수 있다', async () => {
    const user = userEvent.setup()
    render(<App storage={fakeStorage()} />)

    await user.click(key('출발!'))
    await user.click(key('격납고'))
    expect(screen.getByText('부품 0 / 8')).toBeInTheDocument()
    // 아직 아무것도 없으면 자리만 남아 있다
    expect(screen.getByLabelText('헤드 유닛 자리')).toBeInTheDocument()
  })
})
