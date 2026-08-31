import { describe, expect, it } from 'vitest'

import {
  adjacentTable,
  borrowMissed,
  carryMissed,
  digitShift,
  multiplyAsAdd,
  offByOne,
  offByTen,
  operationReversed,
  placeConfused,
} from './distractors'

describe('carryMissed — 받아올림 누락', () => {
  it('CLAUDE.md 예시: 37 + 45 를 72 로 만든다', () => {
    expect(carryMissed('a', 'b').wrong({ a: 37, b: 45 }, 82)).toBe(72)
  })

  it('세 자리에서도 자리마다 10을 버린다: 476 + 358 → 724', () => {
    // 6+8=14→4, 7+5=12→2, 4+3=7
    expect(carryMissed('a', 'b').wrong({ a: 476, b: 358 }, 834)).toBe(724)
  })

  it('자릿수가 다르면 짧은 쪽을 0으로 채운다: 245 + 18 → 253', () => {
    // 5+8=13→3, 4+1=5, 2+0=2
    expect(carryMissed('a', 'b').wrong({ a: 245, b: 18 }, 263)).toBe(253)
  })

  it('받아올림이 없던 덧셈에는 이 실수가 성립하지 않는다', () => {
    expect(carryMissed('a', 'b').wrong({ a: 21, b: 5 }, 26)).toBeNull()
  })

  it('맨 앞자리까지 올림이 생겨 자릿수가 줄면 보기로 쓰지 않는다', () => {
    // 83 + 28 은 자리마다 계산하면 '01' 이 되어 1 이 된다.
    // 정답 111 옆에 1 을 놓으면 계산하지 않고도 지워진다.
    expect(carryMissed('a', 'b').wrong({ a: 83, b: 28 }, 111)).toBeNull()
  })

  it('파라미터가 없으면 포기한다', () => {
    expect(carryMissed('a', 'b').wrong({ a: 37 }, 82)).toBeNull()
  })
})

describe('borrowMissed — 받아내림 누락', () => {
  it('설계서 예시: 52 − 28 을 36 으로 만든다', () => {
    // |2-8|=6, |5-2|=3
    expect(borrowMissed('a', 'b').wrong({ a: 52, b: 28 }, 24)).toBe(36)
  })

  it('세 자리에서도 자리마다 큰 수에서 작은 수를 뺀다: 502 − 167 → 465', () => {
    // |2-7|=5, |0-6|=6, |5-1|=4
    expect(borrowMissed('a', 'b').wrong({ a: 502, b: 167 }, 335)).toBe(465)
  })

  it('받아내림이 없던 뺄셈에는 이 실수가 성립하지 않는다', () => {
    expect(borrowMissed('a', 'b').wrong({ a: 58, b: 23 }, 35)).toBeNull()
  })

  it('맨 앞자리가 0이 되어 자릿수가 줄면 보기로 쓰지 않는다', () => {
    // 152 − 138 은 자리마다 빼면 '026' 이 되어 26 이 된다
    expect(borrowMissed('a', 'b').wrong({ a: 152, b: 138 }, 14)).toBeNull()
  })

  it('작은 수에서 큰 수를 빼는 식은 다루지 않는다', () => {
    expect(borrowMissed('a', 'b').wrong({ a: 28, b: 52 }, -24)).toBeNull()
  })
})

describe('digitShift — 자릿수 밀림', () => {
  it('245 + 13 을 245 + 130 으로 계산한다', () => {
    expect(digitShift('a', 'b', 'add').wrong({ a: 245, b: 13 }, 258)).toBe(375)
  })

  it('뺄셈에서도 밀려 쓴다: 245 − 13 → 245 − 130', () => {
    expect(digitShift('a', 'b', 'subtract').wrong({ a: 245, b: 13 }, 232)).toBe(115)
  })

  it('자릿수가 같으면 밀려 쓸 일이 없다', () => {
    expect(digitShift('a', 'b', 'add').wrong({ a: 37, b: 45 }, 82)).toBeNull()
  })

  it('결과가 음수가 되면 보기로 쓰지 않는다', () => {
    expect(digitShift('a', 'b', 'subtract').wrong({ a: 120, b: 15 }, 105)).toBeNull()
  })
})

describe('multiplyAsAdd — 곱셈을 덧셈으로', () => {
  it('CLAUDE.md 예시: 4 × 6 을 10 으로 만든다', () => {
    expect(multiplyAsAdd('a', 'b').wrong({ a: 4, b: 6 }, 24)).toBe(10)
  })
})

describe('adjacentTable — 구구단 한 칸 밀림', () => {
  it('7 × 8 을 7 × 9 로 센다', () => {
    expect(adjacentTable('a', 'b', 1).wrong({ a: 7, b: 8 }, 56)).toBe(63)
  })

  it('7 × 8 을 7 × 7 로 센다', () => {
    expect(adjacentTable('a', 'b', -1).wrong({ a: 7, b: 8 }, 56)).toBe(49)
  })

  it('1단 아래로는 내려가지 않는다', () => {
    expect(adjacentTable('a', 'b', -1).wrong({ a: 7, b: 1 }, 7)).toBeNull()
  })
})

describe('operationReversed — 연산 뒤집기', () => {
  it('덧셈 문제에 뺄셈을 한다', () => {
    expect(operationReversed('a', 'b', 'add').wrong({ a: 37, b: 45 }, 82)).toBeNull()
    expect(operationReversed('a', 'b', 'add').wrong({ a: 45, b: 37 }, 82)).toBe(8)
  })

  it('뺄셈 문제에 덧셈을 한다', () => {
    expect(operationReversed('a', 'b', 'subtract').wrong({ a: 52, b: 28 }, 24)).toBe(80)
  })
})

describe('placeConfused — 자릿값 혼동', () => {
  it('472 의 7 이 나타내는 값 70 을 7 로 답한다', () => {
    expect(placeConfused(0.1).wrong({}, 70)).toBe(7)
  })

  it('70 을 700 으로 답한다', () => {
    expect(placeConfused(10).wrong({}, 70)).toBe(700)
  })

  it('정수가 되지 않으면 포기한다', () => {
    expect(placeConfused(0.1).wrong({}, 7)).toBeNull()
  })

  it('0 은 자릿값 혼동이 의미가 없다', () => {
    expect(placeConfused(10).wrong({}, 0)).toBeNull()
  })
})

describe('offByOne / offByTen', () => {
  it('한 칸 더 세거나 덜 센다', () => {
    expect(offByOne(1).wrong({}, 24)).toBe(25)
    expect(offByOne(-1).wrong({}, 24)).toBe(23)
  })

  it('십의 자리만 어긋난다', () => {
    expect(offByTen(1).wrong({}, 82)).toBe(92)
    expect(offByTen(-1).wrong({}, 82)).toBe(72)
  })

  it('음수는 보기로 쓰지 않는다', () => {
    expect(offByOne(-1).wrong({}, 0)).toBeNull()
    expect(offByTen(-1).wrong({}, 5)).toBeNull()
  })
})
