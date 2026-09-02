import { placeConfused } from '../engine/distractors'
import { josa, readNumberKo } from '../engine/korean'
import { defineTemplate, type AnyQuestionTemplate, type DistractorRule } from '../engine/types'

/**
 * W1 숫자 소행성대 — 세 자리·네 자리 수, 자릿값 (설계서 5장)
 *
 * Lv1 세 자리 수 읽고 쓰기      4지선다
 * Lv2 자릿값                    4지선다
 * Lv3 뛰어 세기 빈칸 채우기     숫자 입력
 * Lv4 네 자리 자릿값 + 크기 비교 4지선다 / 부등호 선택
 * Lv5 숫자 카드로 수 만들기     숫자 입력
 * 보스 좌표를 크기 순으로 정렬   순서 배열
 */

// ─────────────────────────────────────────────────────────────
// Lv1 — 세 자리 수 읽고 쓰기
// ─────────────────────────────────────────────────────────────

/** 십의 자리와 일의 자리를 바꿔 쓴다. 342 를 324 로. */
const swapTensOnes: DistractorRule = {
  kind: 'digit_shift',
  wrong: (p) => {
    const h = p['h']
    const t = p['t']
    const o = p['o']
    if (h === undefined || t === undefined || o === undefined || t === o) return null
    return h * 100 + o * 10 + t
  },
}

/** 백의 자리와 십의 자리를 바꿔 쓴다. 342 를 432 로. */
const swapHundredsTens: DistractorRule = {
  kind: 'digit_shift',
  wrong: (p) => {
    const h = p['h']
    const t = p['t']
    const o = p['o']
    if (h === undefined || t === undefined || o === undefined) return null
    // 십의 자리가 0이면 앞자리가 0이 되어 세 자리 수가 아니게 된다
    if (h === t || t === 0) return null
    return t * 100 + h * 10 + o
  },
}

/** 0이 있는 자리를 빼먹고 쓴다. 305 를 35 로. 초2 최다 오답이다. */
const dropZeroPlace: DistractorRule = {
  kind: 'place_confused',
  wrong: (p) => {
    const h = p['h']
    const t = p['t']
    const o = p['o']
    if (h === undefined || t === undefined || o === undefined) return null
    if (t !== 0) return null
    return h * 10 + o
  },
}

/**
 * 한 자리를 더 세거나 덜 센다. 세 자리 수 문제이므로 결과도 세 자리여야 한다.
 * 범위를 걸지 않으면 992 + 10 = 1002 같은 네 자리 보기가 섞인다.
 */
function offByWithin(delta: number, min: number, max: number): DistractorRule {
  return {
    kind: delta % 100 === 0 ? 'off_by_one' : 'off_by_ten',
    wrong: (_p, answer) => {
      if (typeof answer !== 'number') return null
      const shifted = answer + delta
      return shifted >= min && shifted <= max ? shifted : null
    },
  }
}

export const w1Lv1ReadNumber: AnyQuestionTemplate = defineTemplate({
  id: 'w1_lv1_read',
  world: 1,
  level: 1,
  skill: 'number_read',
  inputType: 'choice',
  params: { h: [1, 9], t: [0, 9], o: [0, 9] },
  // 세 자리가 모두 같으면 자리를 바꿔도 같은 수라 보기를 만들 수 없다
  valid: (p) => !(p.h === p.t && p.t === p.o),
  render: (p) => {
    const number = p.h * 100 + p.t * 10 + p.o
    return `${josa(readNumberKo(number), '을/를')} 숫자로 쓰면?`
  },
  answer: (p) => p.h * 100 + p.t * 10 + p.o,
  /*
   * 자릿수를 그대로 읊으면 그게 곧 답이다. 처음 틀렸을 때는 답 없이 힌트만
   * 주기로 했으므로(components/Feedback.tsx), 여기서 답을 흘리면 안 된다.
   * 읽지 않고 건너뛴 자리가 있는 수는 그것만 짚어 준다. 0을 빠뜨리는 것이
   * 이 문제의 대표 실수다.
   */
  hint: (p) =>
    p.t === 0 || p.o === 0
      ? '읽지 않고 건너뛴 자리에는 0을 넣어야 해.'
      : '읽은 차례대로 백·십·일 자리에 하나씩 놓아 봐.',
  hintVisual: (p) => ({ kind: 'placeValue', value: p.h * 100 + p.t * 10 + p.o }),
  distractors: [
    swapTensOnes,
    swapHundredsTens,
    dropZeroPlace,
    offByWithin(100, 100, 999),
    offByWithin(-100, 100, 999),
    offByWithin(10, 100, 999),
    offByWithin(-10, 100, 999),
  ],
})

// ─────────────────────────────────────────────────────────────
// Lv2 — 자릿값
// ─────────────────────────────────────────────────────────────

/** 물어본 자리가 아닌 다른 자리의 값을 답한다. */
const otherPlaceValue: DistractorRule = {
  kind: 'place_confused',
  wrong: (p) => {
    const h = p['h']
    const t = p['t']
    const place = p['place']
    if (h === undefined || t === undefined || place === undefined) return null
    return place === 1 ? t * 10 : h * 100
  },
}

export const w1Lv2PlaceValue: AnyQuestionTemplate = defineTemplate({
  id: 'w1_lv2_place',
  world: 1,
  level: 2,
  skill: 'place_value',
  inputType: 'choice',
  // place 1 = 백의 자리를 묻는다, 0 = 십의 자리를 묻는다
  params: { h: [1, 9], t: [1, 9], o: [1, 9], place: [0, 1] },
  // 같은 숫자가 두 번 나오면 "7이 나타내는 값"이 어느 7인지 알 수 없다
  valid: (p) => p.h !== p.t && p.t !== p.o && p.h !== p.o,
  render: (p) => {
    const number = p.h * 100 + p.t * 10 + p.o
    const digit = p.place === 1 ? p.h : p.t
    return `${number}에서 ${josa(String(digit), '이/가')} 나타내는 값은?`
  },
  answer: (p) => (p.place === 1 ? p.h * 100 : p.t * 10),
  hint: (p) =>
    p.place === 1 ? '백의 자리 숫자야. 100씩 세어 봐.' : '십의 자리 숫자야. 10씩 세어 봐.',
  hintVisual: (p) => ({
    kind: 'placeValue',
    value: p.h * 100 + p.t * 10 + p.o,
    highlight: p.place === 1 ? 2 : 1,
  }),
  distractors: [placeConfused(0.1), placeConfused(10), otherPlaceValue],
})

// ─────────────────────────────────────────────────────────────
// Lv3 — 뛰어 세기 빈칸 채우기
// ─────────────────────────────────────────────────────────────

const SKIP_STEPS = [10, 100] as const

function skipStep(kind: number): number {
  return SKIP_STEPS[kind] ?? 10
}

export const w1Lv3SkipCounting: AnyQuestionTemplate = defineTemplate({
  id: 'w1_lv3_skip',
  world: 1,
  level: 3,
  skill: 'skip_counting',
  inputType: 'numpad',
  // stepKind 0 = 10씩, 1 = 100씩 / length 는 늘어놓는 칸 수 / blank 는 빈칸 위치
  params: { start: [100, 900], stepKind: [0, 1], length: [3, 5], blank: [0, 4] },
  valid: (p) => {
    if (p.blank >= p.length) return false
    const last = p.start + skipStep(p.stepKind) * (p.length - 1)
    return last <= 9999
  },
  render: (p) => {
    const step = skipStep(p.stepKind)
    const cells = Array.from({ length: p.length }, (_, index) =>
      index === p.blank ? '□' : String(p.start + step * index),
    )
    return `빈칸에 알맞은 수는?\n${cells.join(', ')}`
  },
  answer: (p) => p.start + skipStep(p.stepKind) * p.blank,
  hint: (p) => `${skipStep(p.stepKind)}씩 뛰어 세고 있어.`,
  hintVisual: (p) => {
    const step = skipStep(p.stepKind)
    return {
      kind: 'numberLine',
      values: Array.from({ length: p.length }, (_, index) => p.start + step * index),
      highlight: p.start + step * p.blank,
    }
  },
})

// ─────────────────────────────────────────────────────────────
// Lv4 — 네 자리 수 자릿값과 크기 비교
// ─────────────────────────────────────────────────────────────

const FOUR_DIGIT_PLACES = [1, 10, 100, 1000] as const
const PLACE_NAMES = ['일', '십', '백', '천'] as const

function placeUnit(index: number): number {
  return FOUR_DIGIT_PLACES[index] ?? 1
}

function placeName(index: number): string {
  return PLACE_NAMES[index] ?? '일'
}

/** 자리 이름은 맞게 골랐는데 한 자리 옆의 값을 답한다. */
function neighbourPlaceValue(step: 1 | -1 | 2 | -2): DistractorRule {
  return {
    kind: 'place_confused',
    wrong: (p) => {
      const digits = [p['o'], p['t'], p['h'], p['k']]
      const place = p['place']
      if (place === undefined) return null
      const index = place + step
      if (index < 0 || index > 3) return null
      const digit = digits[index]
      if (digit === undefined || digit === 0) return null
      return digit * placeUnit(index)
    },
  }
}

/**
 * 자릿값을 통째로 무시하고 숫자만 답한다. 4000의 4를 그냥 4라고 하는 실수다.
 * 자릿값 단원에서 가장 흔하다.
 */
const digitOnly: DistractorRule = {
  kind: 'place_confused',
  wrong: (p) => {
    const digits = [p['o'], p['t'], p['h'], p['k']]
    const place = p['place']
    if (place === undefined) return null
    const digit = digits[place]
    return digit === undefined || digit === 0 ? null : digit
  },
}

export const w1Lv4PlaceValue: AnyQuestionTemplate = defineTemplate({
  id: 'w1_lv4_place4',
  world: 1,
  level: 4,
  skill: 'place_value',
  inputType: 'choice',
  // k 천, h 백, t 십, o 일 / place 0=일 1=십 2=백 3=천
  params: { k: [1, 9], h: [0, 9], t: [0, 9], o: [0, 9], place: [1, 3] },
  valid: (p) => {
    const digits = [p.o, p.t, p.h, p.k]
    const target = digits[p.place]
    if (target === undefined || target === 0) return false
    // 같은 숫자가 두 번 나오면 어느 자리를 묻는지 알 수 없다
    return new Set(digits).size === 4
  },
  render: (p) => {
    const number = p.k * 1000 + p.h * 100 + p.t * 10 + p.o
    const digits = [p.o, p.t, p.h, p.k]
    const digit = digits[p.place] ?? 0
    return `${number}에서 ${josa(String(digit), '이/가')} 나타내는 값은?`
  },
  answer: (p) => {
    const digits = [p.o, p.t, p.h, p.k]
    return (digits[p.place] ?? 0) * placeUnit(p.place)
  },
  hint: (p) => `${placeName(p.place)}의 자리 숫자야.`,
  hintVisual: (p) => ({
    kind: 'placeValue',
    value: p.k * 1000 + p.h * 100 + p.t * 10 + p.o,
    highlight: p.place as 0 | 1 | 2 | 3,
  }),
  distractors: [
    placeConfused(0.1),
    placeConfused(10),
    digitOnly,
    neighbourPlaceValue(-1),
    neighbourPlaceValue(1),
    neighbourPlaceValue(-2),
    neighbourPlaceValue(2),
  ],
})

const COMPARE_SIGNS = ['>', '<', '='] as const

function compareSign(left: number, right: number): string {
  if (left > right) return '>'
  if (left < right) return '<'
  return '='
}

/** 부등호를 고를 때 나올 수 있는 나머지 두 기호. */
function otherSign(index: 0 | 1): DistractorRule {
  return {
    kind: 'operation_reversed',
    wrong: (_p, answer) => {
      const rest = COMPARE_SIGNS.filter((sign) => sign !== answer)
      return rest[index] ?? null
    },
  }
}

export const w1Lv4Compare: AnyQuestionTemplate = defineTemplate({
  id: 'w1_lv4_compare',
  world: 1,
  level: 4,
  skill: 'number_compare',
  inputType: 'choice',
  choiceCount: 3,
  // sameKind 0 이면 두 수를 같게 만든다. 늘 다르기만 하면 '=' 를 고를 일이 없다.
  params: { a: [1000, 9999], gap: [1, 999], sign: [0, 1], sameKind: [0, 3] },
  valid: (p) => {
    const b = otherNumber(p.a, p.gap, p.sign, p.sameKind)
    return b >= 1000 && b <= 9999
  },
  render: (p) => {
    const b = otherNumber(p.a, p.gap, p.sign, p.sameKind)
    return `빈칸에 알맞은 것은?\n${p.a} □ ${b}`
  },
  answer: (p) => compareSign(p.a, otherNumber(p.a, p.gap, p.sign, p.sameKind)),
  hint: () => '천의 자리부터 차례로 비교해 봐.',
  hintVisual: (p) => ({
    kind: 'placeValueCompare',
    left: p.a,
    right: otherNumber(p.a, p.gap, p.sign, p.sameKind),
  }),
  distractors: [otherSign(0), otherSign(1)],
})

function otherNumber(a: number, gap: number, sign: number, sameKind: number): number {
  if (sameKind === 0) return a
  return sign === 1 ? a + gap : a - gap
}

// ─────────────────────────────────────────────────────────────
// Lv5 — 숫자 카드로 조건에 맞는 수 만들기
// ─────────────────────────────────────────────────────────────

/**
 * 카드를 실제로 집어 자리에 놓는다.
 *
 * "가장 큰 세 자리 수는?" 을 읽고 머릿속으로 배열해 숫자패드로 치게 하면,
 * 답을 알아도 무엇을 하라는 건지 모른다. 카드를 순서대로 눌러 놓게 하면
 * 문장을 못 읽어도 할 일이 보이고, 앞자리에 큰 수를 놓는다는 것도 손으로 익는다.
 */
export const w1Lv5MakeNumber: AnyQuestionTemplate = defineTemplate({
  id: 'w1_lv5_make',
  world: 1,
  level: 5,
  skill: 'number_make',
  inputType: 'order',
  // want 1 = 가장 큰 수, 0 = 가장 작은 수
  params: { c1: [1, 9], c2: [1, 9], c3: [1, 9], want: [0, 1] },
  // 카드에 같은 숫자가 있으면 "카드로 만들 수 있는 수"가 헷갈린다
  valid: (p) => p.c1 !== p.c2 && p.c2 !== p.c3 && p.c1 !== p.c3,
  render: (p) => {
    const goal = p.want === 1 ? '가장 큰' : '가장 작은'
    return `카드를 놓아 ${goal} 수를 만들어 줘.\n${[p.c1, p.c2, p.c3].join(', ')}`
  },
  answer: (p) =>
    [p.c1, p.c2, p.c3].sort((left, right) => (p.want === 1 ? right - left : left - right)),
  hint: (p) =>
    p.want === 1
      ? '큰 숫자를 앞자리에 놓으면 수가 커져.'
      : '작은 숫자를 앞자리에 놓으면 수가 작아져.',
  hintVisual: (p) => {
    const cards = [p.c1, p.c2, p.c3].sort((left, right) =>
      p.want === 1 ? right - left : left - right,
    )
    return { kind: 'placeValue', value: Number(cards.join('')) }
  },
})

/** 이 템플릿에서 빈칸 위에 붙일 방향 안내. */
export const ORDER_ENDS: Readonly<Record<string, readonly [string, string]>> = {
  w1_lv5_make: ['백의 자리', '일의 자리'],
  w1_boss_sort3: ['작은 수', '큰 수'],
  w1_boss_sort4: ['작은 수', '큰 수'],
}

// ─────────────────────────────────────────────────────────────
// 보스 — 흩어진 좌표를 크기 순으로 정렬해 항로 열기
// ─────────────────────────────────────────────────────────────

export const w1BossSort3: AnyQuestionTemplate = defineTemplate({
  id: 'w1_boss_sort3',
  world: 1,
  level: 'boss',
  skill: 'number_compare',
  inputType: 'order',
  params: { x: [100, 999], y: [100, 999], z: [100, 999] },
  valid: (p) => new Set([p.x, p.y, p.z]).size === 3,
  render: (p) => `항로 좌표를 작은 수부터 눌러 줘.\n${p.x}, ${p.y}, ${p.z}`,
  answer: (p) => [p.x, p.y, p.z].sort((left, right) => left - right),
  hint: () => '백의 자리부터 비교해 봐.',
  hintVisual: (p) => ({
    kind: 'numberLine',
    values: [p.x, p.y, p.z].sort((left, right) => left - right),
  }),
})

export const w1BossSort4: AnyQuestionTemplate = defineTemplate({
  id: 'w1_boss_sort4',
  world: 1,
  level: 'boss',
  skill: 'number_compare',
  inputType: 'order',
  params: { x: [1000, 9999], y: [1000, 9999], z: [1000, 9999], w: [1000, 9999] },
  valid: (p) => new Set([p.x, p.y, p.z, p.w]).size === 4,
  render: (p) => `항로 좌표를 작은 수부터 눌러 줘.\n${p.x}, ${p.y}, ${p.z}, ${p.w}`,
  answer: (p) => [p.x, p.y, p.z, p.w].sort((left, right) => left - right),
  hint: () => '천의 자리부터 비교해 봐.',
  hintVisual: (p) => ({
    kind: 'numberLine',
    values: [p.x, p.y, p.z, p.w].sort((left, right) => left - right),
  }),
})

export const world1Templates: readonly AnyQuestionTemplate[] = [
  w1Lv1ReadNumber,
  w1Lv2PlaceValue,
  w1Lv3SkipCounting,
  w1Lv4PlaceValue,
  w1Lv4Compare,
  w1Lv5MakeNumber,
  w1BossSort3,
  w1BossSort4,
]
