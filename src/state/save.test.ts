import { beforeEach, describe, expect, it } from 'vitest'

import {
  bestChallengeOf,
  clearSave,
  COINS_PER_CORRECT,
  defaultSave,
  isStagePlayed,
  isStageUnlocked,
  isWorldUnlocked,
  loadSave,
  migrate,
  playsOf,
  recordStage,
  SAVE_KEY,
  SAVE_VERSION,
  starsOf,
  totalChallenge,
  totalStars,
  weeklyOf,
  weekKeyOf,
  worldProgress,
  writeSave,
  type SaveData,
} from './save'

/** 테스트용 localStorage. 진짜와 같은 규칙으로 동작한다. */
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

describe('저장하고 불러오기', () => {
  it('처음에는 빈 저장이다', () => {
    const save = loadSave(store)
    expect(save).toEqual(defaultSave())
    expect(save.version).toBe(SAVE_VERSION)
  })

  it('쓴 것을 그대로 읽는다', () => {
    const save = recordStage(defaultSave(), {
      world: 1,
      level: 2,
      stars: 3,
      correct: 8,
      skillLog: [{ skill: 'place_value', correct: true }],
    })
    expect(writeSave(save, store)).toBe(true)
    expect(loadSave(store)).toEqual(save)
  })

  it('브라우저를 껐다 켜도 그대로다', () => {
    const save = recordStage(defaultSave(), {
      world: 1,
      level: 1,
      stars: 2,
      correct: 7,
      skillLog: [],
    })
    writeSave(save, store)

    // 새 탭에서 다시 여는 것과 같다. 같은 저장소, 새 로드.
    const reopened = loadSave(store)
    expect(starsOf(reopened, 1, 1)).toBe(2)
    expect(reopened.coins).toBe(7 * COINS_PER_CORRECT)
  })

  it('지우면 처음으로 돌아간다', () => {
    writeSave({ ...defaultSave(), coins: 500 }, store)
    clearSave(store)
    expect(loadSave(store)).toEqual(defaultSave())
  })
})

describe('깨진 저장을 만나도 터지지 않는다', () => {
  it('JSON 이 아니면 새 저장으로 시작한다', () => {
    store.setItem(SAVE_KEY, '{{{ 망가진 데이터')
    expect(loadSave(store)).toEqual(defaultSave())
  })

  it('배열이 들어와도 버틴다', () => {
    store.setItem(SAVE_KEY, '[1, 2, 3]')
    expect(loadSave(store)).toEqual(defaultSave())
  })

  it('빠진 항목은 기본값으로 채운다', () => {
    store.setItem(SAVE_KEY, JSON.stringify({ version: 1, coins: 30 }))
    const save = loadSave(store)
    expect(save.coins).toBe(30)
    expect(save.parts).toEqual([])
    expect(save.worlds).toEqual({})
  })

  it('말이 안 되는 값은 다듬는다', () => {
    store.setItem(
      SAVE_KEY,
      JSON.stringify({
        coins: -500,
        parts: ['head', 'head', 42],
        worlds: { '1': { stars: [9, -3, 'x', null, 2], bossStars: 99, bossCleared: 'yes' } },
        skillStats: { place_value: { correct: 100, total: 3 } },
      }),
    )
    const save = loadSave(store)
    expect(save.coins).toBe(0)
    expect(save.parts).toEqual(['head'])

    const world = worldProgress(save, 1)
    expect(world.stars).toEqual([3, -1, -1, -1, 2])
    expect(world.bossStars).toBe(3)
    // 'yes' 는 true 가 아니다
    expect(world.bossCleared).toBe(false)
    // 맞힌 수가 푼 수보다 많을 수 없다
    expect(save.skillStats['place_value']).toEqual({ correct: 3, total: 3 })
  })

  it('없는 월드 번호는 버린다', () => {
    store.setItem(SAVE_KEY, JSON.stringify({ worlds: { '0': {}, '9': {}, 'x': {}, '3': {} } }))
    expect(Object.keys(loadSave(store).worlds)).toEqual(['3'])
  })

  it('저장소를 아예 쓸 수 없어도 게임은 돌아간다', () => {
    const broken: Storage = {
      length: 0,
      clear: () => undefined,
      getItem: () => {
        throw new Error('막힘')
      },
      key: () => null,
      removeItem: () => undefined,
      setItem: () => {
        throw new Error('막힘')
      },
    }
    expect(loadSave(broken)).toEqual(defaultSave())
    expect(writeSave(defaultSave(), broken)).toBe(false)
  })

  it('migrate 는 어떤 값이 와도 쓸 수 있는 저장을 준다', () => {
    for (const input of [null, undefined, 0, 'x', [], true, { worlds: 3 }]) {
      const save = migrate(input)
      expect(save.version).toBe(SAVE_VERSION)
      expect(save.coins).toBeGreaterThanOrEqual(0)
    }
  })
})

describe('스테이지 결과 반영', () => {
  it('별과 코인이 쌓인다', () => {
    let save = defaultSave()
    save = recordStage(save, { world: 1, level: 1, stars: 2, correct: 7, skillLog: [] })
    expect(starsOf(save, 1, 1)).toBe(2)
    expect(save.coins).toBe(7 * COINS_PER_CORRECT)
  })

  it('다시 해서 못 봐도 이미 받은 별을 빼앗지 않는다', () => {
    let save = recordStage(defaultSave(), { world: 1, level: 1, stars: 3, correct: 8, skillLog: [] })
    save = recordStage(save, { world: 1, level: 1, stars: 1, correct: 6, skillLog: [] })
    expect(starsOf(save, 1, 1)).toBe(3)
    // 코인은 다시 할 때마다 또 받는다
    expect(save.coins).toBe(14 * COINS_PER_CORRECT)
  })

  it('별 0개로 끝내도 그 스테이지는 해 본 것이다', () => {
    const save = recordStage(defaultSave(), { world: 1, level: 1, stars: 0, correct: 3, skillLog: [] })
    expect(isStagePlayed(save, 1, 1)).toBe(true)
    expect(starsOf(save, 1, 1)).toBe(0)
  })

  it('영역별 정답률이 쌓인다', () => {
    let save = defaultSave()
    save = recordStage(save, {
      world: 1,
      level: 2,
      stars: 2,
      correct: 2,
      skillLog: [
        { skill: 'place_value', correct: true },
        { skill: 'place_value', correct: false },
        { skill: 'number_read', correct: true },
      ],
    })
    save = recordStage(save, {
      world: 1,
      level: 2,
      stars: 3,
      correct: 1,
      skillLog: [{ skill: 'place_value', correct: true }],
    })
    expect(save.skillStats['place_value']).toEqual({ correct: 2, total: 3 })
    expect(save.skillStats['number_read']).toEqual({ correct: 1, total: 1 })
  })

  it('보스를 별 하나 이상으로 깨면 부품을 받는다', () => {
    const save = recordStage(defaultSave(), {
      world: 1,
      level: 'boss',
      stars: 1,
      correct: 6,
      skillLog: [],
      part: 'head',
    })
    expect(worldProgress(save, 1).bossCleared).toBe(true)
    expect(save.parts).toEqual(['head'])
  })

  it('별을 못 받으면 보스를 깬 것이 아니다', () => {
    const save = recordStage(defaultSave(), {
      world: 1,
      level: 'boss',
      stars: 0,
      correct: 4,
      skillLog: [],
      part: 'head',
    })
    expect(worldProgress(save, 1).bossCleared).toBe(false)
    expect(save.parts).toEqual([])
  })

  it('같은 부품을 두 번 받지 않는다', () => {
    let save = defaultSave()
    for (let i = 0; i < 3; i += 1) {
      save = recordStage(save, {
        world: 1,
        level: 'boss',
        stars: 3,
        correct: 8,
        skillLog: [],
        part: 'head',
      })
    }
    expect(save.parts).toEqual(['head'])
  })

  it('원래 저장을 바꾸지 않는다', () => {
    const before = defaultSave()
    const snapshot = JSON.stringify(before)
    recordStage(before, { world: 1, level: 1, stars: 3, correct: 8, skillLog: [] })
    expect(JSON.stringify(before)).toBe(snapshot)
  })
})

describe('잠금', () => {
  it('월드 1과 그 첫 단계는 언제나 열려 있다', () => {
    const save = defaultSave()
    expect(isWorldUnlocked(save, 1)).toBe(true)
    expect(isStageUnlocked(save, 1, 1)).toBe(true)
  })

  it('앞 단계를 해야 다음 단계가 열린다', () => {
    let save = defaultSave()
    expect(isStageUnlocked(save, 1, 2)).toBe(false)

    save = recordStage(save, { world: 1, level: 1, stars: 0, correct: 2, skillLog: [] })
    // 별이 없어도 열린다. 별은 다시 할 이유이지 통과 조건이 아니다.
    expect(isStageUnlocked(save, 1, 2)).toBe(true)
    expect(isStageUnlocked(save, 1, 3)).toBe(false)
  })

  it('보스는 5단계를 해야 열린다', () => {
    let save = defaultSave()
    for (const level of [1, 2, 3, 4] as const) {
      save = recordStage(save, { world: 1, level, stars: 3, correct: 8, skillLog: [] })
    }
    expect(isStageUnlocked(save, 1, 'boss')).toBe(false)

    save = recordStage(save, { world: 1, level: 5, stars: 1, correct: 6, skillLog: [] })
    expect(isStageUnlocked(save, 1, 'boss')).toBe(true)
  })

  it('앞 행성의 보스를 깨야 다음 행성이 열린다', () => {
    let save = defaultSave()
    expect(isWorldUnlocked(save, 2)).toBe(false)

    save = recordStage(save, { world: 1, level: 'boss', stars: 2, correct: 7, skillLog: [], part: 'head' })
    expect(isWorldUnlocked(save, 2)).toBe(true)
    expect(isWorldUnlocked(save, 3)).toBe(false)
  })

  it('잠긴 행성의 단계는 열리지 않는다', () => {
    expect(isStageUnlocked(defaultSave(), 2, 1)).toBe(false)
  })
})

describe('totalStars', () => {
  it('모든 월드의 별을 더한다', () => {
    let save: SaveData = defaultSave()
    save = recordStage(save, { world: 1, level: 1, stars: 3, correct: 8, skillLog: [] })
    save = recordStage(save, { world: 1, level: 2, stars: 2, correct: 7, skillLog: [] })
    save = recordStage(save, { world: 1, level: 3, stars: 0, correct: 1, skillLog: [] })
    save = recordStage(save, { world: 1, level: 'boss', stars: 3, correct: 8, skillLog: [] })
    expect(totalStars(save)).toBe(8)
  })

  it('안 한 스테이지는 세지 않는다', () => {
    expect(totalStars(defaultSave())).toBe(0)
  })
})

describe('다시 하기 시드', () => {
  it('할 때마다 횟수가 늘어난다', () => {
    let save = defaultSave()
    expect(playsOf(save, 1, 1)).toBe(0)

    for (let i = 1; i <= 3; i += 1) {
      save = recordStage(save, { world: 1, level: 1, stars: 3, correct: 8, skillLog: [] })
      expect(playsOf(save, 1, 1)).toBe(i)
    }
    // 별이 더 오르지 않아도 횟수는 는다. 그래야 다시 할 때 다른 문제가 나온다.
    expect(starsOf(save, 1, 1)).toBe(3)
  })

  it('보스도 따로 센다', () => {
    let save = defaultSave()
    save = recordStage(save, { world: 1, level: 'boss', stars: 1, correct: 6, skillLog: [] })
    expect(playsOf(save, 1, 'boss')).toBe(1)
    expect(playsOf(save, 1, 1)).toBe(0)
  })

  it('옛 저장에 횟수가 없으면 해 본 스테이지는 한 번으로 친다', () => {
    const save = migrate({ worlds: { '1': { stars: [3, 2, -1, -1, -1] } } })
    expect(playsOf(save, 1, 1)).toBe(1)
    expect(playsOf(save, 1, 2)).toBe(1)
    expect(playsOf(save, 1, 3)).toBe(0)
  })
})

describe('60초 도전', () => {
  function clearedWorld1(): SaveData {
    let save = defaultSave()
    for (const level of [1, 2, 3, 4, 5] as const) {
      save = recordStage(save, { world: 1, level, stars: 3, correct: 8, skillLog: [] })
    }
    return recordStage(save, {
      world: 1,
      level: 'boss',
      stars: 3,
      correct: 8,
      skillLog: [],
      part: 'head',
    })
  }

  it('보스를 깨야 열린다', () => {
    let save = defaultSave()
    expect(isStageUnlocked(save, 1, 'challenge')).toBe(false)

    // Lv1~Lv5 를 다 해도 보스를 안 깼으면 아직이다
    for (const level of [1, 2, 3, 4, 5] as const) {
      save = recordStage(save, { world: 1, level, stars: 3, correct: 8, skillLog: [] })
    }
    expect(isStageUnlocked(save, 1, 'challenge')).toBe(false)

    save = recordStage(save, {
      world: 1,
      level: 'boss',
      stars: 1,
      correct: 6,
      skillLog: [],
      part: 'head',
    })
    expect(isStageUnlocked(save, 1, 'challenge')).toBe(true)
  })

  it('맞힌 개수가 최고 기록으로 남는다', () => {
    let save = clearedWorld1()
    expect(bestChallengeOf(save, 1)).toBe(0)

    save = recordStage(save, { world: 1, level: 'challenge', stars: 0, correct: 14, skillLog: [] })
    expect(bestChallengeOf(save, 1)).toBe(14)
  })

  it('기록을 못 넘으면 예전 기록이 남는다', () => {
    let save = clearedWorld1()
    save = recordStage(save, { world: 1, level: 'challenge', stars: 0, correct: 20, skillLog: [] })
    save = recordStage(save, { world: 1, level: 'challenge', stars: 0, correct: 11, skillLog: [] })
    expect(bestChallengeOf(save, 1)).toBe(20)
  })

  it('별을 주지 않는다. 배우는 스테이지가 아니다', () => {
    let save = clearedWorld1()
    const before = totalStars(save)
    save = recordStage(save, { world: 1, level: 'challenge', stars: 3, correct: 30, skillLog: [] })
    expect(totalStars(save)).toBe(before)
    expect(starsOf(save, 1, 'challenge')).toBe(-1)
  })

  it('진행을 건드리지 않는다. 보스 기록도 그대로다', () => {
    const before = clearedWorld1()
    const after = recordStage(before, {
      world: 1,
      level: 'challenge',
      stars: 0,
      correct: 25,
      skillLog: [],
    })
    expect(worldProgress(after, 1).stars).toEqual(worldProgress(before, 1).stars)
    expect(worldProgress(after, 1).bossStars).toBe(worldProgress(before, 1).bossStars)
    expect(after.parts).toEqual(before.parts)
  })

  it('코인은 준다. 맞힌 만큼이다', () => {
    const before = clearedWorld1()
    const after = recordStage(before, {
      world: 1,
      level: 'challenge',
      stars: 0,
      correct: 18,
      skillLog: [],
    })
    expect(after.coins - before.coins).toBe(18 * COINS_PER_CORRECT)
  })

  it('옛 저장에는 기록이 없으니 0으로 본다', () => {
    const save = migrate({ worlds: { '1': { stars: [3, 3, 3, 3, 3], bossCleared: true } } })
    expect(bestChallengeOf(save, 1)).toBe(0)
  })

  it('말이 안 되는 기록은 다듬는다', () => {
    const save = migrate({ worlds: { '1': { bestChallenge: -5 } } })
    expect(bestChallengeOf(save, 1)).toBe(0)
  })
})

describe('weekKeyOf — 주 나누기', () => {
  const at = (iso: string) => new Date(iso).getTime()

  it('같은 주의 날들은 같은 키다', () => {
    // 2026-08-31 은 월요일
    const monday = weekKeyOf(at('2026-08-31T09:00:00'))
    for (const day of ['2026-08-31', '2026-09-02', '2026-09-06']) {
      expect(weekKeyOf(at(`${day}T23:30:00`)), day).toBe(monday)
    }
  })

  it('월요일이 되면 키가 바뀐다', () => {
    const thisWeek = weekKeyOf(at('2026-09-06T23:59:00')) // 일요일
    const nextWeek = weekKeyOf(at('2026-09-07T00:01:00')) // 월요일
    expect(nextWeek).not.toBe(thisWeek)
  })

  it('그 주 월요일 날짜를 키로 쓴다', () => {
    expect(weekKeyOf(at('2026-09-03T12:00:00'))).toBe(20260831)
  })
})

describe('주간 기록', () => {
  const at = (iso: string) => new Date(iso).getTime()
  const MON = at('2026-08-31T10:00:00')
  const WED = at('2026-09-02T10:00:00')
  const NEXT_MON = at('2026-09-07T10:00:00')

  function play(save: SaveData, correct: number, when: number): SaveData {
    return recordStage(save, {
      world: 1,
      level: 'challenge',
      stars: 0,
      correct,
      skillLog: [],
      at: when,
    })
  }

  it('이번 주 최고를 갱신한다', () => {
    let save = play(defaultSave(), 12, MON)
    expect(weeklyOf(save, 1, WED).best).toBe(12)

    save = play(save, 18, WED)
    expect(weeklyOf(save, 1, WED).best).toBe(18)
  })

  it('이번 주 기록보다 낮으면 그대로 둔다', () => {
    let save = play(defaultSave(), 18, MON)
    save = play(save, 9, WED)
    expect(weeklyOf(save, 1, WED).best).toBe(18)
  })

  it('주가 바뀌면 이번 주가 지난 주로 밀리고 새로 시작한다', () => {
    let save = play(defaultSave(), 18, MON)
    save = play(save, 11, NEXT_MON)

    const weekly = weeklyOf(save, 1, NEXT_MON)
    expect(weekly.best).toBe(11)
    expect(weekly.lastBest).toBe(18)
  })

  it('한 판도 안 한 새 주는 읽기만 해도 0으로 보인다. 저장은 그대로다', () => {
    const save = play(defaultSave(), 18, MON)

    const nextWeek = weeklyOf(save, 1, NEXT_MON)
    expect(nextWeek.best).toBe(0)
    expect(nextWeek.lastBest).toBe(18)
    // 읽었다고 저장이 바뀌지는 않는다
    expect(worldProgress(save, 1).weekly.best).toBe(18)
  })

  it('한 주를 통째로 건너뛰어도 마지막에 한 것이 지난 주가 된다', () => {
    let save = play(defaultSave(), 20, MON)
    save = play(save, 7, at('2026-09-21T10:00:00'))
    expect(weeklyOf(save, 1, at('2026-09-21T10:00:00')).lastBest).toBe(20)
  })

  it('처음 하는 주는 지난 주가 0이다', () => {
    const save = play(defaultSave(), 15, MON)
    expect(weeklyOf(save, 1, MON).lastBest).toBe(0)
  })

  it('전체 최고 기록은 주와 상관없이 이어진다', () => {
    let save = play(defaultSave(), 22, MON)
    save = play(save, 9, NEXT_MON)
    expect(bestChallengeOf(save, 1)).toBe(22)
    expect(weeklyOf(save, 1, NEXT_MON).best).toBe(9)
  })

  it('옛 저장에는 주간 기록이 없다', () => {
    const save = migrate({ worlds: { '1': { bestChallenge: 12 } } })
    expect(worldProgress(save, 1).weekly).toEqual({ week: 0, best: 0, lastBest: 0 })
  })
})

describe('totalChallenge', () => {
  it('모든 월드의 도전 기록을 더한다', () => {
    let save = defaultSave()
    for (const world of [1, 2, 3] as const) {
      save = recordStage(save, {
        world,
        level: 'challenge',
        stars: 0,
        correct: world * 5,
        skillLog: [],
        at: Date.now(),
      })
    }
    expect(totalChallenge(save)).toBe(5 + 10 + 15)
  })

  it('안 해 봤으면 0이다', () => {
    expect(totalChallenge(defaultSave())).toBe(0)
  })
})
