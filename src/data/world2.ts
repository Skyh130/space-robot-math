import {
  borrowMissed,
  carryMissed,
  offByOne,
  offByTen,
  operationReversed,
} from '../engine/distractors'
import { defineTemplate, type AnyQuestionTemplate, type DistractorRule } from '../engine/types'

/**
 * W2 중력 협곡 — 덧셈과 뺄셈 (설계서 5장)
 *
 * Lv1 두 자리 + 한 자리, 받아올림 없음   4지선다
 * Lv2 두 자리 ± 두 자리, 받아올림/내림 1회 4지선다
 * Lv3 세 자리 ± 세 자리, 받아올림/내림 1회 숫자 입력
 * Lv4 세 자리, 받아올림/내림 2회         숫자 입력
 * Lv5 □ 있는 식과 문장제                 숫자 입력
 * 보스 다리 세 칸을 잇는 계산            숫자 입력
 *
 * 오답 힌트에는 세로셈 그림을 붙인다. 받아올림 1이 어느 자리로 올라가는지
 * 보여주지 않으면 같은 실수를 그대로 반복한다.
 */

// ─────────────────────────────────────────────────────────────
// 자리올림·자리내림 세기
// ─────────────────────────────────────────────────────────────

/** 두 수를 더할 때 자리올림이 몇 번 생기는지. */
export function carryCount(a: number, b: number): number {
  let count = 0
  let carry = 0
  let left = a
  let right = b
  while (left > 0 || right > 0) {
    const sum = (left % 10) + (right % 10) + carry
    if (sum >= 10) {
      count += 1
      carry = 1
    } else {
      carry = 0
    }
    left = Math.floor(left / 10)
    right = Math.floor(right / 10)
  }
  return count
}

/** a 에서 b 를 뺄 때 자리내림이 몇 번 생기는지. */
export function borrowCount(a: number, b: number): number {
  let count = 0
  let borrow = 0
  let left = a
  let right = b
  while (right > 0 || borrow > 0) {
    const top = (left % 10) - borrow
    const bottom = right % 10
    if (top < bottom) {
      count += 1
      borrow = 1
    } else {
      borrow = 0
    }
    left = Math.floor(left / 10)
    right = Math.floor(right / 10)
  }
  return count
}

// ─────────────────────────────────────────────────────────────
// 이 월드에서만 쓰는 실수 규칙
// ─────────────────────────────────────────────────────────────

/**
 * 한 자리 수를 십의 자리에 더해 버린다. 21 + 5 를 71 로.
 * 자리를 맞춰 쓰지 않고 왼쪽부터 채워 넣을 때 나온다.
 */
const addToTensColumn: DistractorRule = {
  kind: 'digit_shift',
  wrong: (p) => {
    const a = p['a']
    const b = p['b']
    if (a === undefined || b === undefined || b > 9) return null
    const tens = Math.floor(a / 10) + b
    if (tens > 9) return null
    return tens * 10 + (a % 10)
  },
}

const ADD_DISTRACTORS: readonly DistractorRule[] = [
  carryMissed('a', 'b'),
  offByTen(1),
  offByTen(-1),
  offByOne(1),
  offByOne(-1),
  operationReversed('a', 'b', 'add'),
]

const SUBTRACT_DISTRACTORS: readonly DistractorRule[] = [
  borrowMissed('a', 'b'),
  offByTen(1),
  offByTen(-1),
  offByOne(1),
  offByOne(-1),
  operationReversed('a', 'b', 'subtract'),
]

// ─────────────────────────────────────────────────────────────
// Lv1 — 두 자리 + 한 자리, 받아올림 없음
// ─────────────────────────────────────────────────────────────

export const w2Lv1AddSmall: AnyQuestionTemplate = defineTemplate({
  id: 'w2_lv1_add_small',
  world: 2,
  level: 1,
  skill: 'addition_no_carry',
  inputType: 'choice',
  params: { a: [11, 89], b: [1, 8] },
  valid: (p) => (p.a % 10) + p.b < 10,
  render: (p) => `${p.a} + ${p.b} = ?`,
  answer: (p) => p.a + p.b,
  hint: (p) => `일의 자리끼리 먼저 더해 봐. ${p.a % 10} + ${p.b} 야.`,
  hintVisual: (p) => ({ kind: 'columnMath', left: p.a, right: p.b, operation: 'add' }),
  distractors: [addToTensColumn, offByOne(1), offByOne(-1), offByTen(1), operationReversed('a', 'b', 'add')],
})

// ─────────────────────────────────────────────────────────────
// Lv2 — 두 자리 ± 두 자리, 받아올림/내림 1회
// ─────────────────────────────────────────────────────────────

export const w2Lv2AddCarry: AnyQuestionTemplate = defineTemplate({
  id: 'w2_lv2_add_carry',
  world: 2,
  level: 2,
  skill: 'addition_carry',
  inputType: 'choice',
  params: { a: [11, 89], b: [11, 89] },
  // 일의 자리에서 한 번만 올라가고, 답이 두 자리로 남아야 한다
  valid: (p) => carryCount(p.a, p.b) === 1 && p.a + p.b <= 99,
  render: (p) => `${p.a} + ${p.b} = ?`,
  answer: (p) => p.a + p.b,
  hint: () => '일의 자리를 더하면 10이 넘어. 십의 자리로 1을 올려 줘.',
  hintVisual: (p) => ({ kind: 'columnMath', left: p.a, right: p.b, operation: 'add' }),
  distractors: ADD_DISTRACTORS,
})

export const w2Lv2SubBorrow: AnyQuestionTemplate = defineTemplate({
  id: 'w2_lv2_sub_borrow',
  world: 2,
  level: 2,
  skill: 'subtraction_borrow',
  inputType: 'choice',
  params: { a: [21, 99], b: [11, 89] },
  valid: (p) => p.a > p.b && borrowCount(p.a, p.b) === 1,
  render: (p) => `${p.a} − ${p.b} = ?`,
  answer: (p) => p.a - p.b,
  hint: () => '일의 자리를 뺄 수 없어. 십의 자리에서 10을 빌려 와.',
  hintVisual: (p) => ({ kind: 'columnMath', left: p.a, right: p.b, operation: 'subtract' }),
  distractors: SUBTRACT_DISTRACTORS,
})

// ─────────────────────────────────────────────────────────────
// Lv3 — 세 자리 ± 세 자리, 받아올림/내림 1회
// ─────────────────────────────────────────────────────────────

export const w2Lv3Add: AnyQuestionTemplate = defineTemplate({
  id: 'w2_lv3_add',
  world: 2,
  level: 3,
  skill: 'addition_carry',
  inputType: 'numpad',
  params: { a: [100, 899], b: [100, 899] },
  valid: (p) => carryCount(p.a, p.b) === 1 && p.a + p.b <= 999,
  render: (p) => `${p.a} + ${p.b} = ?`,
  answer: (p) => p.a + p.b,
  hint: () => '자리를 맞춰 놓고 일의 자리부터 더해 봐.',
  hintVisual: (p) => ({ kind: 'columnMath', left: p.a, right: p.b, operation: 'add' }),
})

export const w2Lv3Sub: AnyQuestionTemplate = defineTemplate({
  id: 'w2_lv3_sub',
  world: 2,
  level: 3,
  skill: 'subtraction_borrow',
  inputType: 'numpad',
  params: { a: [200, 999], b: [100, 899] },
  valid: (p) => p.a > p.b && borrowCount(p.a, p.b) === 1,
  render: (p) => `${p.a} − ${p.b} = ?`,
  answer: (p) => p.a - p.b,
  hint: () => '뺄 수 없는 자리는 윗자리에서 10을 빌려 와.',
  hintVisual: (p) => ({ kind: 'columnMath', left: p.a, right: p.b, operation: 'subtract' }),
})

// ─────────────────────────────────────────────────────────────
// Lv4 — 세 자리, 받아올림/내림 2회
// ─────────────────────────────────────────────────────────────

export const w2Lv4Add: AnyQuestionTemplate = defineTemplate({
  id: 'w2_lv4_add',
  world: 2,
  level: 4,
  skill: 'addition_carry',
  inputType: 'numpad',
  params: { a: [100, 899], b: [100, 899] },
  valid: (p) => carryCount(p.a, p.b) === 2 && p.a + p.b <= 999,
  render: (p) => `${p.a} + ${p.b} = ?`,
  answer: (p) => p.a + p.b,
  hint: () => '올림이 두 번 있어. 일의 자리에서 하나, 십의 자리에서 또 하나.',
  hintVisual: (p) => ({ kind: 'columnMath', left: p.a, right: p.b, operation: 'add' }),
})

export const w2Lv4Sub: AnyQuestionTemplate = defineTemplate({
  id: 'w2_lv4_sub',
  world: 2,
  level: 4,
  skill: 'subtraction_borrow',
  inputType: 'numpad',
  params: { a: [200, 999], b: [100, 899] },
  valid: (p) => p.a > p.b && borrowCount(p.a, p.b) === 2,
  render: (p) => `${p.a} − ${p.b} = ?`,
  answer: (p) => p.a - p.b,
  hint: () => '빌려 오기가 두 번 있어. 한 자리씩 천천히 해 보자.',
  hintVisual: (p) => ({ kind: 'columnMath', left: p.a, right: p.b, operation: 'subtract' }),
})

// ─────────────────────────────────────────────────────────────
// Lv5 — □ 있는 식과 문장제
// ─────────────────────────────────────────────────────────────

export const w2Lv5AddBlank: AnyQuestionTemplate = defineTemplate({
  id: 'w2_lv5_add_blank',
  world: 2,
  level: 5,
  skill: 'equation_blank',
  inputType: 'numpad',
  params: { a: [11, 89], b: [11, 89] },
  valid: (p) => p.a + p.b <= 99,
  render: (p) => `${p.a} + □ = ${p.a + p.b}`,
  answer: (p) => p.b,
  hint: (p) => `${p.a + p.b}에서 ${p.a}를 빼면 □가 나와.`,
  hintVisual: (p) => ({ kind: 'columnMath', left: p.a + p.b, right: p.a, operation: 'subtract' }),
})

export const w2Lv5SubBlank: AnyQuestionTemplate = defineTemplate({
  id: 'w2_lv5_sub_blank',
  world: 2,
  level: 5,
  skill: 'equation_blank',
  inputType: 'numpad',
  params: { a: [21, 99], b: [11, 89] },
  valid: (p) => p.a > p.b,
  render: (p) => `${p.a} − □ = ${p.a - p.b}`,
  answer: (p) => p.b,
  hint: (p) => `${p.a}에서 ${p.a - p.b}를 빼면 □가 나와.`,
  hintVisual: (p) => ({ kind: 'columnMath', left: p.a, right: p.a - p.b, operation: 'subtract' }),
})

export const w2Lv5WordAdd: AnyQuestionTemplate = defineTemplate({
  id: 'w2_lv5_word_add',
  world: 2,
  level: 5,
  skill: 'word_problem_add_sub',
  inputType: 'numpad',
  params: { a: [23, 89], b: [12, 89] },
  valid: (p) => p.a + p.b <= 999,
  render: (p) => `우주선에 대원 ${p.a}명이 탔어.\n${p.b}명이 더 타면 모두 몇 명?`,
  answer: (p) => p.a + p.b,
  hint: () => '더 탔으니까 더하기야.',
  hintVisual: (p) => ({ kind: 'columnMath', left: p.a, right: p.b, operation: 'add' }),
})

export const w2Lv5WordSub: AnyQuestionTemplate = defineTemplate({
  id: 'w2_lv5_word_sub',
  world: 2,
  level: 5,
  skill: 'word_problem_add_sub',
  inputType: 'numpad',
  params: { a: [120, 899], b: [15, 89] },
  valid: (p) => p.a > p.b,
  render: (p) => `연료가 ${p.a}칸 있었어.\n${p.b}칸을 쓰면 몇 칸 남을까?`,
  answer: (p) => p.a - p.b,
  hint: () => '썼으니까 빼기야.',
  hintVisual: (p) => ({ kind: 'columnMath', left: p.a, right: p.b, operation: 'subtract' }),
})

// ─────────────────────────────────────────────────────────────
// 보스 — 무너진 다리를 계산으로 잇는다
// ─────────────────────────────────────────────────────────────

export const w2BossAdd: AnyQuestionTemplate = defineTemplate({
  id: 'w2_boss_add',
  world: 2,
  level: 'boss',
  skill: 'addition_carry',
  inputType: 'numpad',
  params: { a: [100, 899], b: [100, 899] },
  valid: (p) => carryCount(p.a, p.b) === 2 && p.a + p.b <= 999,
  render: (p) => `다리 한 칸을 잇자.\n${p.a} + ${p.b} = ?`,
  answer: (p) => p.a + p.b,
  hint: () => '올림이 두 번이야. 일의 자리부터 차례로.',
  hintVisual: (p) => ({ kind: 'columnMath', left: p.a, right: p.b, operation: 'add' }),
})

export const w2BossSub: AnyQuestionTemplate = defineTemplate({
  id: 'w2_boss_sub',
  world: 2,
  level: 'boss',
  skill: 'subtraction_borrow',
  inputType: 'numpad',
  params: { a: [200, 999], b: [100, 899] },
  valid: (p) => p.a > p.b && borrowCount(p.a, p.b) === 2,
  render: (p) => `다리 한 칸을 잇자.\n${p.a} − ${p.b} = ?`,
  answer: (p) => p.a - p.b,
  hint: () => '빌려 오기가 두 번이야. 한 자리씩 천천히.',
  hintVisual: (p) => ({ kind: 'columnMath', left: p.a, right: p.b, operation: 'subtract' }),
})

export const w2BossBlank: AnyQuestionTemplate = defineTemplate({
  id: 'w2_boss_blank',
  world: 2,
  level: 'boss',
  skill: 'equation_blank',
  inputType: 'numpad',
  params: { a: [120, 799], b: [110, 199] },
  valid: (p) => p.a + p.b <= 999,
  render: (p) => `다리 한 칸을 잇자.\n${p.a} + □ = ${p.a + p.b}`,
  answer: (p) => p.b,
  hint: (p) => `${p.a + p.b}에서 ${p.a}를 빼 봐.`,
  hintVisual: (p) => ({ kind: 'columnMath', left: p.a + p.b, right: p.a, operation: 'subtract' }),
})

export const world2Templates: readonly AnyQuestionTemplate[] = [
  w2Lv1AddSmall,
  w2Lv2AddCarry,
  w2Lv2SubBorrow,
  w2Lv3Add,
  w2Lv3Sub,
  w2Lv4Add,
  w2Lv4Sub,
  w2Lv5AddBlank,
  w2Lv5SubBlank,
  w2Lv5WordAdd,
  w2Lv5WordSub,
  w2BossAdd,
  w2BossSub,
  w2BossBlank,
]
