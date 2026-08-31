import type { AnswerValue, DistractorRule, MistakeKind, ParamSpec, ParamsOf } from './types'

/**
 * 4지선다 오답 보기 규칙 모음.
 *
 * 오답 보기를 무작위로 만들면 아이가 계산하지 않고 '이상해 보이는 것'을 지우는
 * 요령으로 정답을 맞힌다. 그래서 모든 오답은 아이가 실제로 하는 실수를 그대로
 * 재현한 값이어야 한다. (CLAUDE.md 문제 템플릿 작성 규칙)
 *
 * 각 규칙은 재현할 수 없는 파라미터를 만나면 null 을 준다.
 * 보기 수가 모자라면 generator 가 오류를 내므로, 템플릿은 넉넉히 달아 둔다.
 */

/** 파라미터에서 수 하나를 꺼낸다. 없거나 정수가 아니면 규칙을 포기한다. */
function num(params: Readonly<Record<string, number>>, key: string): number | null {
  const value = params[key]
  return typeof value === 'number' && Number.isInteger(value) ? value : null
}

function rule<S extends ParamSpec>(
  kind: MistakeKind,
  wrong: (params: ParamsOf<S>, answer: AnswerValue) => AnswerValue | null,
): DistractorRule<S> {
  return { kind, wrong }
}

/** 정답이 정수 하나일 때만 의미가 있는 규칙을 위한 도우미. */
function asInteger(answer: AnswerValue): number | null {
  return typeof answer === 'number' && Number.isInteger(answer) ? answer : null
}

/** 자릿수를 맞춰 각 자리를 따로 계산한 뒤 자리끼리의 연결을 잃은 결과를 만든다. */
function digitsOf(value: number): number[] {
  return Math.abs(value)
    .toString()
    .split('')
    .map((d) => Number(d))
}

/**
 * 자리마다 계산한 결과를 하나의 수로 합친다.
 *
 * 맨 앞자리가 0이면 자릿수가 통째로 줄어든다. 83 + 28 을 자리마다 계산하면
 * 십의 자리가 0이 되어 '01' → 1 이 되는데, 정답 111 옆에 1을 보기로 놓으면
 * 계산하지 않아도 지워진다. 그런 값은 보기로 쓰지 않는다.
 */
function fromDigits(digits: readonly number[]): number | null {
  if (digits[0] === 0) return null
  return Number(digits.join(''))
}

/**
 * 받아올림 누락. 37 + 45 → 72
 * 각 자리를 더한 뒤 10을 넘는 부분을 윗자리로 올리지 않고 버린다.
 */
export function carryMissed<S extends ParamSpec>(
  aKey: string,
  bKey: string,
): DistractorRule<S> {
  return rule('carry_missed', (params) => {
    const a = num(params, aKey)
    const b = num(params, bKey)
    if (a === null || b === null || a < 0 || b < 0) return null

    const width = Math.max(digitsOf(a).length, digitsOf(b).length)
    const left = digitsOf(a).reverse()
    const right = digitsOf(b).reverse()
    const columns: number[] = []
    let carried = false

    for (let i = 0; i < width; i += 1) {
      const sum = (left[i] ?? 0) + (right[i] ?? 0)
      if (sum >= 10) carried = true
      columns.push(sum % 10)
    }
    // 받아올림이 없던 덧셈이면 이 실수 자체가 성립하지 않는다
    if (!carried) return null

    return fromDigits(columns.reverse())
  })
}

/**
 * 받아내림 누락. 52 − 28 → 36
 * 자리마다 큰 수에서 작은 수를 빼 버린다. 초2 뺄셈 최다 오답이다.
 */
export function borrowMissed<S extends ParamSpec>(
  aKey: string,
  bKey: string,
): DistractorRule<S> {
  return rule('borrow_missed', (params) => {
    const a = num(params, aKey)
    const b = num(params, bKey)
    if (a === null || b === null || a < b || b < 0) return null

    const width = digitsOf(a).length
    const left = digitsOf(a).reverse()
    const right = digitsOf(b).reverse()
    const columns: number[] = []
    let borrowed = false

    for (let i = 0; i < width; i += 1) {
      const top = left[i] ?? 0
      const bottom = right[i] ?? 0
      if (top < bottom) borrowed = true
      columns.push(Math.abs(top - bottom))
    }
    // 받아내림이 없던 뺄셈이면 이 실수가 나올 수 없다
    if (!borrowed) return null

    return fromDigits(columns.reverse())
  })
}

/**
 * 자릿수 밀림. 245 + 13 을 245 + 130 으로 계산한다.
 * 세로셈에서 두 수를 오른쪽 끝에 맞추지 않고 왼쪽에 맞춰 쓸 때 나온다.
 */
export function digitShift<S extends ParamSpec>(
  aKey: string,
  bKey: string,
  operation: 'add' | 'subtract',
): DistractorRule<S> {
  return rule('digit_shift', (params) => {
    const a = num(params, aKey)
    const b = num(params, bKey)
    if (a === null || b === null || b < 0) return null
    // 자릿수가 같으면 밀려 쓸 일이 없다
    if (digitsOf(a).length === digitsOf(b).length) return null

    const shifted = b * 10
    const value = operation === 'add' ? a + shifted : a - shifted
    return value >= 0 ? value : null
  })
}

/** 곱셈을 덧셈으로. 4 × 6 → 10 */
export function multiplyAsAdd<S extends ParamSpec>(
  aKey: string,
  bKey: string,
): DistractorRule<S> {
  return rule('multiply_as_add', (params) => {
    const a = num(params, aKey)
    const b = num(params, bKey)
    if (a === null || b === null) return null
    return a + b
  })
}

/**
 * 구구단 한 칸 밀림. 7 × 8 을 7 × 7 이나 7 × 9 로 센다.
 * 단을 외워 세다가 한 번 더 세거나 덜 세는, 구구단에서 가장 흔한 실수다.
 */
export function adjacentTable<S extends ParamSpec>(
  aKey: string,
  bKey: string,
  step: 1 | -1,
): DistractorRule<S> {
  return rule('adjacent_table', (params) => {
    const a = num(params, aKey)
    const b = num(params, bKey)
    if (a === null || b === null) return null
    const shifted = b + step
    if (shifted < 1) return null
    return a * shifted
  })
}

/** 연산을 반대로. 뺄셈 문제에 덧셈을, 덧셈 문제에 뺄셈을 한다. */
export function operationReversed<S extends ParamSpec>(
  aKey: string,
  bKey: string,
  actual: 'add' | 'subtract',
): DistractorRule<S> {
  return rule('operation_reversed', (params) => {
    const a = num(params, aKey)
    const b = num(params, bKey)
    if (a === null || b === null) return null
    const value = actual === 'add' ? a - b : a + b
    return value >= 0 ? value : null
  })
}

/**
 * 자릿값 혼동. 472 의 7 이 나타내는 값을 70 이 아니라 7 이나 700 으로 답한다.
 * factor 는 정답에 곱할 자릿수 배율이다.
 */
export function placeConfused<S extends ParamSpec>(factor: 10 | 0.1): DistractorRule<S> {
  return rule('place_confused', (_params, answer) => {
    const value = asInteger(answer)
    if (value === null || value === 0) return null
    const shifted = value * factor
    return Number.isInteger(shifted) && shifted > 0 ? shifted : null
  })
}

/** 한 칸 세기 실수. 뛰어 세기나 개수 세기에서 하나 더 세거나 덜 센다. */
export function offByOne<S extends ParamSpec>(step: 1 | -1): DistractorRule<S> {
  return rule('off_by_one', (_params, answer) => {
    const value = asInteger(answer)
    if (value === null) return null
    const shifted = value + step
    return shifted >= 0 ? shifted : null
  })
}

/** 십의 자리만 어긋남. 받아올림 '1'을 엉뚱한 자리에 더하거나 빼먹을 때 나온다. */
export function offByTen<S extends ParamSpec>(step: 1 | -1): DistractorRule<S> {
  return rule('off_by_ten', (_params, answer) => {
    const value = asInteger(answer)
    if (value === null) return null
    const shifted = value + step * 10
    return shifted >= 0 ? shifted : null
  })
}
