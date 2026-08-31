/**
 * 시드 기반 난수.
 *
 * 문제 생성기는 순수 함수여야 한다. 같은 시드를 주면 언제나 같은 문제가 나와야
 * 테스트로 정답을 검증할 수 있고, 실기기에서 이상한 문제가 나왔을 때 시드만으로
 * 그 문제를 그대로 재현할 수 있다. Math.random 은 엔진 안에서 쓰지 않는다.
 */

export type Rng = {
  /** [0, 1) 구간의 실수. */
  next(): number
  /** min 이상 max 이하의 정수. 양끝을 포함한다. */
  int(min: number, max: number): number
  /** 배열에서 하나를 고른다. */
  pick<T>(items: readonly T[]): T
  /** 원본을 건드리지 않고 섞은 새 배열을 준다. */
  shuffle<T>(items: readonly T[]): T[]
}

/** 시드가 0이면 mulberry32 가 같은 값을 반복한다. 그럴 때 쓸 대체값. */
const FALLBACK_SEED = 0x9e3779b9

export function createRng(seed: number): Rng {
  if (!Number.isFinite(seed)) {
    throw new Error(`시드는 유한한 수여야 한다: ${String(seed)}`)
  }

  let state = (seed >>> 0) === 0 ? FALLBACK_SEED : seed >>> 0

  // mulberry32. 32비트 상태 하나로 도는 작고 균일한 생성기다.
  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  const int = (min: number, max: number): number => {
    if (!Number.isInteger(min) || !Number.isInteger(max)) {
      throw new Error(`구간은 정수여야 한다: [${min}, ${max}]`)
    }
    if (max < min) {
      throw new Error(`구간이 뒤집혔다: [${min}, ${max}]`)
    }
    return min + Math.floor(next() * (max - min + 1))
  }

  const pick = <T,>(items: readonly T[]): T => {
    if (items.length === 0) {
      throw new Error('빈 배열에서는 고를 수 없다.')
    }
    const index = int(0, items.length - 1)
    // int 가 구간 안의 값만 주므로 이 접근은 항상 성공한다.
    return items[index] as T
  }

  const shuffle = <T,>(items: readonly T[]): T[] => {
    const result = items.slice()
    // Fisher-Yates
    for (let i = result.length - 1; i > 0; i -= 1) {
      const j = int(0, i)
      const a = result[i] as T
      const b = result[j] as T
      result[i] = b
      result[j] = a
    }
    return result
  }

  return { next, int, pick, shuffle }
}

/**
 * 문자열에서 시드를 만든다. FNV-1a 32비트.
 * 스테이지 id 나 템플릿 id 처럼 사람이 읽는 값에서 재현 가능한 시드를 뽑을 때 쓴다.
 */
export function hashSeed(text: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}
