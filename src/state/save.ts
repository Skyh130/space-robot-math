import { COINS_PER_CORRECT } from '../data/economy'
import type { RobotPart } from '../data/worlds'
import type { SkillKey, StageLevel, WorldId } from '../engine'

/**
 * 진행 상황 저장. (설계서 8장)
 *
 * 서버가 없으므로 전부 기기 안에 남는다. 저장이 깨지면 아이의 별과 부품이
 * 사라지므로, 읽을 때 조금이라도 이상하면 새 저장으로 시작하되 절대 터지지 않는다.
 * 화면이 죽는 것보다 별을 잃는 편이 낫고, 별을 잃지 않는 것이 가장 좋다.
 */

export const SAVE_KEY = 'space-robot-math.save'

/** 저장 형식이 바뀔 때마다 올린다. 옛 저장은 migrate 에서 손본다. */
export const SAVE_VERSION = 1

export const STAGES_PER_WORLD = 5

// 코인 값은 상점 가격과 함께 정해야 해서 data/economy.ts 에 모아 두었다.
export { COINS_PER_CORRECT }

export type SkillStat = { readonly correct: number; readonly total: number }

export type WorldProgress = {
  /** Lv1~Lv5 의 별. 아직 안 한 스테이지는 -1 이다. 0 은 별 없이 끝냈다는 뜻이다. */
  readonly stars: readonly number[]
  readonly bossStars: number
  readonly bossCleared: boolean
  /**
   * Lv1~Lv5 를 몇 번 했는지. 다시 할 때마다 다른 문제가 나오게 하는 데 쓴다.
   * 별 수로 대신하면 별을 다 받은 뒤로는 늘 같은 문제가 나와 답을 외우게 된다.
   */
  readonly plays: readonly number[]
  readonly bossPlays: number
  /** 도전 모드 최고 기록. 60초 안에 맞힌 문제 수다. 안 해 봤으면 0. */
  readonly bestChallenge: number
  /**
   * 주 단위 기록.
   * 전체 최고 기록은 한 번 높이 찍으면 다시 깨기 어려워 금세 목표가 사라진다.
   * 매주 0에서 다시 시작하는 기록이 있으면 이번 주에도 도전할 이유가 생긴다.
   */
  readonly weekly: WeeklyRecord
}

export type WeeklyRecord = {
  /** 그 주 월요일의 날짜 키. 예: 20260831 */
  readonly week: number
  /** 이번 주 최고 기록. */
  readonly best: number
  /** 지난 주 최고 기록. 견줄 상대가 있어야 재미가 있다. */
  readonly lastBest: number
}

export type SaveData = {
  readonly version: number
  readonly parts: readonly RobotPart[]
  readonly coins: number
  readonly worlds: Readonly<Record<string, WorldProgress>>
  /** 영역별 정답률. 부모 대시보드와 복습 편성의 근거다. */
  readonly skillStats: Readonly<Record<string, SkillStat>>
}

const UNPLAYED = -1

export function emptyWorld(): WorldProgress {
  return {
    stars: Array.from({ length: STAGES_PER_WORLD }, () => UNPLAYED),
    bossStars: UNPLAYED,
    bossCleared: false,
    plays: Array.from({ length: STAGES_PER_WORLD }, () => 0),
    bossPlays: 0,
    bestChallenge: 0,
    weekly: { week: 0, best: 0, lastBest: 0 },
  }
}

/**
 * 그 주 월요일의 날짜 키. 20260831 꼴이다.
 *
 * 기기의 현지 시각으로 센다. 아이가 쓰는 기기의 달력이 곧 아이의 한 주다.
 */
export function weekKeyOf(at: number): number {
  const date = new Date(at)
  date.setHours(0, 0, 0, 0)
  // getDay() 는 일요일이 0이다. 월요일을 주의 시작으로 옮긴다.
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7))
  return date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate()
}

export function defaultSave(): SaveData {
  return { version: SAVE_VERSION, parts: [], coins: 0, worlds: {}, skillStats: {} }
}

// ─────────────────────────────────────────────────────────────
// 읽고 쓰기
// ─────────────────────────────────────────────────────────────

/** 저장소를 쓸 수 없는 환경(사생활 보호 모드 등)에서도 게임은 돌아가야 한다. */
function safeStorage(storage?: Storage): Storage | null {
  if (storage) return storage
  try {
    return window.localStorage
  } catch {
    return null
  }
}

export function loadSave(storage?: Storage): SaveData {
  const store = safeStorage(storage)
  if (!store) return defaultSave()

  let raw: string | null = null
  try {
    raw = store.getItem(SAVE_KEY)
  } catch {
    return defaultSave()
  }
  if (raw === null) return defaultSave()

  try {
    return migrate(JSON.parse(raw))
  } catch {
    // 저장이 깨졌다. 처음부터 시작하되 화면은 뜨게 한다.
    return defaultSave()
  }
}

export function writeSave(data: SaveData, storage?: Storage): boolean {
  const store = safeStorage(storage)
  if (!store) return false
  try {
    store.setItem(SAVE_KEY, JSON.stringify(data))
    return true
  } catch {
    // 저장 공간이 꽉 찼거나 막혀 있다. 이번 판은 그대로 이어서 한다.
    return false
  }
}

export function clearSave(storage?: Storage): void {
  const store = safeStorage(storage)
  if (!store) return
  try {
    store.removeItem(SAVE_KEY)
  } catch {
    // 지우지 못해도 할 수 있는 것이 없다
  }
}

// ─────────────────────────────────────────────────────────────
// 검사와 이사
// ─────────────────────────────────────────────────────────────

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function intOr(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.trunc(value) : fallback
}

/** 어떤 모양이 들어와도 쓸 수 있는 저장으로 바꿔 준다. */
export function migrate(input: unknown): SaveData {
  if (!isRecord(input)) return defaultSave()

  const worlds: Record<string, WorldProgress> = {}
  if (isRecord(input['worlds'])) {
    for (const [id, value] of Object.entries(input['worlds'])) {
      if (!/^[1-8]$/.test(id) || !isRecord(value)) continue
      worlds[id] = readWorld(value)
    }
  }

  const skillStats: Record<string, SkillStat> = {}
  if (isRecord(input['skillStats'])) {
    for (const [skill, value] of Object.entries(input['skillStats'])) {
      if (!isRecord(value)) continue
      const total = Math.max(0, intOr(value['total'], 0))
      const correct = Math.min(total, Math.max(0, intOr(value['correct'], 0)))
      if (total > 0) skillStats[skill] = { correct, total }
    }
  }

  const parts = Array.isArray(input['parts'])
    ? input['parts'].filter((part): part is RobotPart => typeof part === 'string')
    : []

  return {
    version: SAVE_VERSION,
    parts: [...new Set(parts)],
    coins: Math.max(0, intOr(input['coins'], 0)),
    worlds,
    skillStats,
  }
}

function readWorld(value: Record<string, unknown>): WorldProgress {
  const rawStars = Array.isArray(value['stars']) ? value['stars'] : []
  const rawPlays = Array.isArray(value['plays']) ? value['plays'] : []
  const stars = Array.from({ length: STAGES_PER_WORLD }, (_, index) =>
    clampStar(intOr(rawStars[index], UNPLAYED)),
  )
  const plays = Array.from({ length: STAGES_PER_WORLD }, (_, index) =>
    Math.max(0, intOr(rawPlays[index], stars[index] === undefined || stars[index] < 0 ? 0 : 1)),
  )
  return {
    stars,
    bossStars: clampStar(intOr(value['bossStars'], UNPLAYED)),
    bossCleared: value['bossCleared'] === true,
    plays,
    bossPlays: Math.max(0, intOr(value['bossPlays'], 0)),
    bestChallenge: Math.max(0, intOr(value['bestChallenge'], 0)),
    weekly: readWeekly(value['weekly']),
  }
}

function readWeekly(value: unknown): WeeklyRecord {
  if (!isRecord(value)) return { week: 0, best: 0, lastBest: 0 }
  return {
    week: Math.max(0, intOr(value['week'], 0)),
    best: Math.max(0, intOr(value['best'], 0)),
    lastBest: Math.max(0, intOr(value['lastBest'], 0)),
  }
}

function clampStar(value: number): number {
  if (value < 0) return UNPLAYED
  return Math.min(3, value)
}

// ─────────────────────────────────────────────────────────────
// 읽기 도우미
// ─────────────────────────────────────────────────────────────

export function worldProgress(save: SaveData, world: WorldId): WorldProgress {
  return save.worlds[String(world)] ?? emptyWorld()
}

/** Lv1~Lv5 는 배열 자리를 갖는다. 보스와 도전 모드는 따로 센다. */
function stageIndex(level: StageLevel): number | null {
  return typeof level === 'number' ? level - 1 : null
}

export function starsOf(save: SaveData, world: WorldId, level: StageLevel): number {
  const progress = worldProgress(save, world)
  if (level === 'boss') return progress.bossStars
  const index = stageIndex(level)
  // 도전 모드에는 별이 없다. 기록만 남는다.
  if (index === null) return UNPLAYED
  return progress.stars[index] ?? UNPLAYED
}

/** 도전 모드 최고 기록. */
export function bestChallengeOf(save: SaveData, world: WorldId): number {
  return worldProgress(save, world).bestChallenge
}

/**
 * 이번 주 기록. 주가 바뀌었으면 이번 주는 0이고 저장된 이번 주가 지난 주가 된다.
 * 저장을 건드리지 않고 읽기만 한다.
 */
export function weeklyOf(save: SaveData, world: WorldId, at: number): WeeklyRecord {
  const weekly = worldProgress(save, world).weekly
  const week = weekKeyOf(at)
  if (weekly.week === week) return weekly
  // 주가 바뀌면 저장된 이번 주가 지난 주로 밀린다
  return { week, best: 0, lastBest: weekly.week === 0 ? 0 : weekly.best }
}

/** 모든 월드의 도전 기록을 합친 수. */
export function totalChallenge(save: SaveData): number {
  return Object.values(save.worlds).reduce((sum, world) => sum + world.bestChallenge, 0)
}

export function isStagePlayed(save: SaveData, world: WorldId, level: StageLevel): boolean {
  return starsOf(save, world, level) > UNPLAYED
}

/**
 * 앞 스테이지를 한 번 끝내면 다음이 열린다.
 *
 * 별을 조건으로 걸지 않는다. 별은 재도전할 이유이지 통과 조건이 아니다.
 * (설계서 6장) 별이 없어야 다음으로 못 가면 그게 곧 실패 패널티다.
 */
export function isStageUnlocked(save: SaveData, world: WorldId, level: StageLevel): boolean {
  if (!isWorldUnlocked(save, world)) return false
  if (level === 1) return true
  if (level === 'boss') return isStagePlayed(save, world, STAGES_PER_WORLD as StageLevel)
  // 도전 모드는 보스를 깨야 열린다. 다 배운 뒤에 하는 놀이다.
  if (level === 'challenge') return worldProgress(save, world).bossCleared

  const index = stageIndex(level)
  if (index === null) return false
  return isStagePlayed(save, world, index as StageLevel)
}

/** 앞 행성의 보스를 깨야 다음 행성이 열린다. */
export function isWorldUnlocked(save: SaveData, world: WorldId): boolean {
  if (world === 1) return true
  return worldProgress(save, (world - 1) as WorldId).bossCleared
}

/** 그 스테이지를 몇 번 했는지. 다음 도전의 시드로 쓴다. */
export function playsOf(save: SaveData, world: WorldId, level: StageLevel): number {
  const progress = worldProgress(save, world)
  if (level === 'boss') return progress.bossPlays
  if (level === 'challenge') return progress.bestChallenge
  const index = stageIndex(level)
  if (index === null) return 0
  return progress.plays[index] ?? 0
}

/** 별을 다 합친 수. 월드맵에 보여준다. */
export function totalStars(save: SaveData): number {
  return Object.values(save.worlds).reduce((sum, world) => {
    const levels = world.stars.reduce((inner, star) => inner + Math.max(0, star), 0)
    return sum + levels + Math.max(0, world.bossStars)
  }, 0)
}

// ─────────────────────────────────────────────────────────────
// 쓰기
// ─────────────────────────────────────────────────────────────

export type StageRecord = {
  readonly world: WorldId
  readonly level: StageLevel
  readonly stars: number
  readonly correct: number
  readonly skillLog: readonly { readonly skill: SkillKey; readonly correct: boolean }[]
  /** 보스를 깼을 때 받는 부품. */
  readonly part?: RobotPart
  /** 언제 끝냈는지. 주간 기록을 어느 주에 넣을지 정한다. 테스트에서 고정한다. */
  readonly at?: number
}

/**
 * 스테이지 결과를 저장에 반영한다. 순수 함수라 테스트가 쉽다.
 *
 * 별은 더 잘한 기록만 남긴다. 다시 해서 못 봤다고 이미 받은 별을 빼앗지 않는다.
 */
export function recordStage(save: SaveData, record: StageRecord): SaveData {
  const key = String(record.world)
  const before = worldProgress(save, record.world)

  const stars = [...before.stars]
  const plays = [...before.plays]
  let bossStars = before.bossStars
  let bossCleared = before.bossCleared
  let bossPlays = before.bossPlays

  let bestChallenge = before.bestChallenge
  let weekly = before.weekly

  if (record.level === 'challenge') {
    // 도전 모드는 별을 남기지 않는다. 기록만 갱신한다.
    bestChallenge = Math.max(bestChallenge, record.correct)

    const week = weekKeyOf(record.at ?? Date.now())
    weekly =
      weekly.week === week
        ? { ...weekly, best: Math.max(weekly.best, record.correct) }
        : // 주가 바뀌었다. 이번 주를 지난 주로 밀고 새로 시작한다.
          { week, best: record.correct, lastBest: weekly.week === 0 ? 0 : weekly.best }
  } else if (record.level === 'boss') {
    bossStars = Math.max(bossStars, record.stars)
    // 별을 하나라도 받아야 보스를 깬 것으로 본다
    bossCleared = bossCleared || record.stars >= 1
    bossPlays += 1
  } else {
    const index = stageIndex(record.level)
    if (index !== null) {
      stars[index] = Math.max(stars[index] ?? UNPLAYED, record.stars)
      plays[index] = (plays[index] ?? 0) + 1
    }
  }

  const skillStats: Record<string, SkillStat> = { ...save.skillStats }
  for (const entry of record.skillLog) {
    const previous = skillStats[entry.skill] ?? { correct: 0, total: 0 }
    skillStats[entry.skill] = {
      correct: previous.correct + (entry.correct ? 1 : 0),
      total: previous.total + 1,
    }
  }

  const parts =
    record.part !== undefined && bossCleared && !save.parts.includes(record.part)
      ? [...save.parts, record.part]
      : save.parts

  return {
    version: SAVE_VERSION,
    parts,
    coins: save.coins + record.correct * COINS_PER_CORRECT,
    worlds: {
      ...save.worlds,
      [key]: { stars, bossStars, bossCleared, plays, bossPlays, bestChallenge, weekly },
    },
    skillStats,
  }
}
