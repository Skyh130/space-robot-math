import { describe, expect, it } from 'vitest'

import { createRng, hashSeed } from './rng'

describe('createRng', () => {
  it('같은 시드면 같은 수열이 나온다', () => {
    const a = createRng(12345)
    const b = createRng(12345)
    const left = Array.from({ length: 50 }, () => a.next())
    const right = Array.from({ length: 50 }, () => b.next())
    expect(left).toEqual(right)
  })

  it('시드가 다르면 수열도 다르다', () => {
    const a = Array.from({ length: 20 }, (() => {
      const rng = createRng(1)
      return () => rng.next()
    })())
    const b = Array.from({ length: 20 }, (() => {
      const rng = createRng(2)
      return () => rng.next()
    })())
    expect(a).not.toEqual(b)
  })

  it('시드 0도 한 값에 갇히지 않는다', () => {
    const rng = createRng(0)
    const values = new Set(Array.from({ length: 20 }, () => rng.next()))
    expect(values.size).toBeGreaterThan(15)
  })

  it('next 는 항상 [0, 1) 안에 있다', () => {
    const rng = createRng(777)
    for (let i = 0; i < 5000; i += 1) {
      const value = rng.next()
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
    }
  })

  it('int 는 양끝을 포함한 정수를 준다', () => {
    const rng = createRng(42)
    const seen = new Set<number>()
    for (let i = 0; i < 3000; i += 1) {
      const value = rng.int(2, 9)
      expect(Number.isInteger(value)).toBe(true)
      expect(value).toBeGreaterThanOrEqual(2)
      expect(value).toBeLessThanOrEqual(9)
      seen.add(value)
    }
    // 2와 9가 실제로 나와야 파라미터 경계값이 문제로 출제된다
    expect(seen.has(2)).toBe(true)
    expect(seen.has(9)).toBe(true)
    expect(seen.size).toBe(8)
  })

  it('int 는 min 과 max 가 같으면 그 값만 준다', () => {
    const rng = createRng(5)
    expect(rng.int(7, 7)).toBe(7)
  })

  it('int 는 뒤집힌 구간을 거부한다', () => {
    const rng = createRng(5)
    expect(() => rng.int(9, 2)).toThrow()
  })

  it('int 는 정수가 아닌 구간을 거부한다', () => {
    const rng = createRng(5)
    expect(() => rng.int(1.5, 3)).toThrow()
  })

  it('pick 은 배열 안의 값만 준다', () => {
    const rng = createRng(99)
    const items = ['머리', '왼팔', '오른팔'] as const
    for (let i = 0; i < 200; i += 1) {
      expect(items).toContain(rng.pick(items))
    }
  })

  it('pick 은 빈 배열을 거부한다', () => {
    const rng = createRng(99)
    expect(() => rng.pick([])).toThrow()
  })

  it('shuffle 은 원본을 건드리지 않고 원소를 보존한다', () => {
    const rng = createRng(2024)
    const original = [1, 2, 3, 4, 5, 6, 7, 8]
    const shuffled = rng.shuffle(original)
    expect(original).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
    expect(shuffled.slice().sort((x, y) => x - y)).toEqual(original)
  })

  it('shuffle 은 같은 시드면 같은 순서를 준다', () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8]
    expect(createRng(7).shuffle(items)).toEqual(createRng(7).shuffle(items))
  })

  it('shuffle 은 실제로 순서를 바꾼다', () => {
    const items = Array.from({ length: 10 }, (_, i) => i)
    const rng = createRng(31)
    const changed = Array.from({ length: 20 }, () => rng.shuffle(items)).filter(
      (result) => result.join() !== items.join(),
    )
    expect(changed.length).toBeGreaterThan(15)
  })

  it('유한하지 않은 시드를 거부한다', () => {
    expect(() => createRng(Number.NaN)).toThrow()
    expect(() => createRng(Number.POSITIVE_INFINITY)).toThrow()
  })
})

describe('hashSeed', () => {
  it('같은 문자열이면 같은 시드가 나온다', () => {
    expect(hashSeed('w1_lv2_place')).toBe(hashSeed('w1_lv2_place'))
  })

  it('문자열이 다르면 시드도 다르다', () => {
    expect(hashSeed('w1_lv1')).not.toBe(hashSeed('w1_lv2'))
  })

  it('32비트 부호 없는 정수를 준다', () => {
    for (const text of ['', 'a', 'w3_lv4_blank', '숫자 소행성대']) {
      const seed = hashSeed(text)
      expect(Number.isInteger(seed)).toBe(true)
      expect(seed).toBeGreaterThanOrEqual(0)
      expect(seed).toBeLessThanOrEqual(0xffffffff)
    }
  })
})
