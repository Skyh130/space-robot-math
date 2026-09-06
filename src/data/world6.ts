import { multiplyAsAdd, offByOne, offByTen, operationReversed } from '../engine/distractors'
import { josa } from '../engine/korean'
import { defineTemplate, type AnyQuestionTemplate } from '../engine/types'

/**
 * W6 암흑 행성 — 나눗셈과 두 자리 곱셈 (설계서 5장)
 *
 * Lv1 똑같이 나누기                 숫자 입력 (○ 묶음 그림)
 * Lv2 나눗셈식 ↔ 곱셈식             숫자 입력
 * Lv3 두 자리 × 한 자리             숫자 입력
 * Lv4 나머지가 있는 나눗셈          숫자 입력
 * Lv5 두 자리 ÷ 한 자리, 문장제     숫자 입력
 * 보스 나머지를 어떻게 처리할지     숫자 입력 + 4지선다
 *
 * "Lv1~2는 반드시 그림으로 먼저 보여준 뒤 식과 연결" 이 설계서의 지시다.
 * 그래서 Lv1 은 문제에 ○ 묶음을 붙이고, Lv2 는 힌트에 같은 그림을 쓴다.
 * 설계서의 드래그 대신 묶음을 보여주고 수만 답하게 했다. 나누는 뜻은 손으로
 * 옮겨 담는 데 있지 않고 "똑같이 갈랐을 때 하나에 몇 개" 를 보는 데 있다.
 *
 * 보스는 설계서가 콕 집은 문제다. "대원 27명을 4명씩 태우면 우주선 몇 대?"
 * 6대로는 24명뿐이라 한 대가 더 있어야 한다. 나머지를 버리면 세 명이 남는다.
 */

// ─────────────────────────────────────────────────────────────
// Lv1 — 똑같이 나누기
// ─────────────────────────────────────────────────────────────

export const w6Lv1Share: AnyQuestionTemplate = defineTemplate({
  id: 'w6_lv1_share',
  world: 6,
  level: 1,
  skill: 'division_share',
  inputType: 'numpad',
  params: { each: [2, 9], dishes: [2, 6] },
  render: (p) =>
    `구슬 ${String(p.each * p.dishes)}개를\n접시 ${String(p.dishes)}개에 똑같이 나눠 담으면\n한 접시에 몇 개일까?`,
  figure: (p) => ({ kind: 'dotGroups', step: p.each, times: p.dishes }),
  answer: (p) => p.each,
  hint: () => '묶음 하나에 몇 개가 들어 있는지 세어 봐.',
})

export const w6Lv1HowMany: AnyQuestionTemplate = defineTemplate({
  id: 'w6_lv1_how_many',
  world: 6,
  level: 1,
  skill: 'division_share',
  inputType: 'numpad',
  params: { each: [2, 9], dishes: [2, 6] },
  render: (p) =>
    `구슬 ${String(p.each * p.dishes)}개를\n${String(p.each)}개씩 담으면\n접시가 몇 개 필요할까?`,
  figure: (p) => ({ kind: 'dotGroups', step: p.each, times: p.dishes }),
  answer: (p) => p.dishes,
  hint: () => '몇 개씩 묶었는지 보고, 묶음이 몇 개인지 세어 봐.',
})

// ─────────────────────────────────────────────────────────────
// Lv2 — 나눗셈식과 곱셈식
// ─────────────────────────────────────────────────────────────

export const w6Lv2Divide: AnyQuestionTemplate = defineTemplate({
  id: 'w6_lv2_divide',
  world: 6,
  level: 2,
  skill: 'division_fact',
  inputType: 'numpad',
  params: { a: [2, 9], b: [2, 9] },
  render: (p) => `${String(p.a * p.b)} ÷ ${String(p.a)} = ?`,
  answer: (p) => p.b,
  hint: (p) => `${String(p.a)}단에서 답을 찾을 수 있어. 몇 번 곱해야 될까?`,
  hintVisual: (p) => ({ kind: 'dotGroups', step: p.a, times: p.b }),
})

export const w6Lv2FromMultiply: AnyQuestionTemplate = defineTemplate({
  id: 'w6_lv2_from_multiply',
  world: 6,
  level: 2,
  skill: 'division_fact',
  inputType: 'choice',
  params: { a: [2, 9], b: [2, 9] },
  render: (p) => `${String(p.a)} × ${String(p.b)} = ${String(p.a * p.b)}\n${String(p.a * p.b)} ÷ ${String(p.b)} = ?`,
  answer: (p) => p.a,
  hint: () => '곱셈식을 거꾸로 읽으면 나눗셈이야. 위의 식을 다시 봐.',
  hintVisual: (p) => ({ kind: 'dotGroups', step: p.a, times: p.b }),
  distractors: [
    // 나누는 수를 그대로 답으로 쓴다
    {
      kind: 'operation_reversed',
      wrong: (p) => {
        const a = p['a']
        const b = p['b']
        return a === undefined || b === undefined || a === b ? null : b
      },
    },
    // 나누지 않고 곱한 값을 그대로 쓴다
    {
      kind: 'operation_reversed',
      wrong: (p) => {
        const a = p['a']
        const b = p['b']
        return a === undefined || b === undefined ? null : a * b
      },
    },
    offByOne(1),
    offByOne(-1),
    offByTen(1),
  ],
})

// ─────────────────────────────────────────────────────────────
// Lv3 — 두 자리 × 한 자리
// ─────────────────────────────────────────────────────────────

export const w6Lv3MultiplyNoCarry: AnyQuestionTemplate = defineTemplate({
  id: 'w6_lv3_mult_no_carry',
  world: 6,
  level: 3,
  skill: 'multiply_two_digit',
  inputType: 'numpad',
  params: { tens: [1, 4], ones: [1, 4], b: [2, 4] },
  // 올림이 없는 것부터. 각 자리를 따로 곱해도 되는 단계다.
  valid: (p) => p.ones * p.b < 10 && p.tens * p.b < 10,
  render: (p) => `${String(p.tens * 10 + p.ones)} × ${String(p.b)} = ?`,
  answer: (p) => (p.tens * 10 + p.ones) * p.b,
  hint: () => '십의 자리와 일의 자리를 따로 곱한 다음 더해 봐.',
  hintVisual: (p) => ({ kind: 'dotGroups', step: p.tens * 10 + p.ones, times: p.b }),
})

export const w6Lv3MultiplyCarry: AnyQuestionTemplate = defineTemplate({
  id: 'w6_lv3_mult_carry',
  world: 6,
  level: 3,
  skill: 'multiply_two_digit',
  inputType: 'numpad',
  params: { tens: [1, 9], ones: [2, 9], b: [2, 9] },
  // 일의 자리에서 올림이 나는 것만. 이 단계의 목표가 그 올림이다.
  valid: (p) => p.ones * p.b >= 10 && (p.tens * 10 + p.ones) * p.b < 1000,
  render: (p) => `${String(p.tens * 10 + p.ones)} × ${String(p.b)} = ?`,
  answer: (p) => (p.tens * 10 + p.ones) * p.b,
  hint: () => '일의 자리를 곱하면 10이 넘어. 넘은 만큼 십의 자리로 올려 줘.',
})

// ─────────────────────────────────────────────────────────────
// Lv4 — 나머지가 있는 나눗셈
// ─────────────────────────────────────────────────────────────

export const w6Lv4Quotient: AnyQuestionTemplate = defineTemplate({
  id: 'w6_lv4_quotient',
  world: 6,
  level: 4,
  skill: 'division_remainder',
  inputType: 'numpad',
  params: { b: [2, 9], q: [2, 9], r: [1, 8] },
  valid: (p) => p.r < p.b,
  render: (p) => `${String(p.b * p.q + p.r)} ÷ ${String(p.b)}\n몫은 얼마일까?`,
  answer: (p) => p.q,
  hint: (p) => `${String(p.b)}단에서 나누는 수를 넘지 않는 가장 큰 수를 찾아봐.`,
  hintVisual: (p) => ({ kind: 'dotGroups', step: p.b, times: p.q }),
})

export const w6Lv4Remainder: AnyQuestionTemplate = defineTemplate({
  id: 'w6_lv4_remainder',
  world: 6,
  level: 4,
  skill: 'division_remainder',
  inputType: 'numpad',
  params: { b: [2, 9], q: [2, 9], r: [1, 8] },
  valid: (p) => p.r < p.b,
  render: (p) => `${String(p.b * p.q + p.r)} ÷ ${String(p.b)}\n나머지는 얼마일까?`,
  answer: (p) => p.r,
  hint: () => '똑같이 나눠 담고 마지막에 남는 것이 나머지야. 나머지는 나누는 수보다 작아.',
  hintVisual: (p) => ({ kind: 'dotGroups', step: p.b, times: p.q }),
})

// ─────────────────────────────────────────────────────────────
// Lv5 — 두 자리 ÷ 한 자리, 문장제
// ─────────────────────────────────────────────────────────────

export const w6Lv5LongDivide: AnyQuestionTemplate = defineTemplate({
  id: 'w6_lv5_long_divide',
  world: 6,
  level: 5,
  skill: 'division_fact',
  inputType: 'numpad',
  params: { b: [2, 9], q: [11, 40] },
  valid: (p) => p.b * p.q < 100,
  render: (p) => `${String(p.b * p.q)} ÷ ${String(p.b)} = ?`,
  answer: (p) => p.q,
  hint: () => '십의 자리부터 나눠 봐. 남은 것을 일의 자리로 내려서 다시 나누는 거야.',
})

/** 문장제에 쓰는 물건. 세는 말이 자연스러워야 문제가 읽힌다. */
const CARGO = [
  { name: '연료통', unit: '개', box: '상자' },
  { name: '부품', unit: '개', box: '칸' },
  { name: '식량팩', unit: '개', box: '창고' },
] as const

export const w6Lv5Word: AnyQuestionTemplate = defineTemplate({
  id: 'w6_lv5_word',
  world: 6,
  level: 5,
  skill: 'word_problem_divide',
  inputType: 'numpad',
  params: { kind: [0, 2], each: [2, 9], boxes: [2, 9] },
  render: (p) => {
    const cargo = CARGO[p.kind] ?? CARGO[0]
    const total = p.each * p.boxes
    return `${cargo.name} ${String(total)}${cargo.unit}를\n${cargo.box} ${String(p.boxes)}개에 똑같이 나누면\n하나에 몇 ${cargo.unit}일까?`
  },
  answer: (p) => p.each,
  hint: () => '전체를 몇으로 나누는지 먼저 찾고 나눗셈식을 세워 봐.',
  hintVisual: (p) => ({ kind: 'dotGroups', step: p.each, times: p.boxes }),
})

// ─────────────────────────────────────────────────────────────
// 보스 — 나머지를 어떻게 할 것인가
// ─────────────────────────────────────────────────────────────

/**
 * 설계서가 그대로 적어 둔 문제다.
 * "대원 27명을 4명씩 태우면 우주선 몇 대 필요?" — 6대로는 24명이고 3명이 남는다.
 * 나머지를 버리면 세 명이 못 탄다. 몫에 1을 더해야 한다는 판단이 이 문제의 전부다.
 */
export const w6BossSeats: AnyQuestionTemplate = defineTemplate({
  id: 'w6_boss_seats',
  world: 6,
  level: 'boss',
  skill: 'word_problem_divide',
  inputType: 'numpad',
  params: { per: [3, 6], full: [3, 8], r: [1, 5] },
  valid: (p) => p.r < p.per,
  render: (p) =>
    `대원 ${String(p.per * p.full + p.r)}명이\n${String(p.per)}명씩 우주선에 타.\n우주선이 몇 대 필요할까?`,
  answer: (p) => p.full + 1,
  hint: () => '똑같이 나누고 남은 대원도 타야 해. 남으면 한 대가 더 필요해.',
  hintVisual: (p) => ({ kind: 'dotGroups', step: p.per, times: p.full }),
})

export const w6BossLeftover: AnyQuestionTemplate = defineTemplate({
  id: 'w6_boss_leftover',
  world: 6,
  level: 'boss',
  skill: 'division_remainder',
  inputType: 'choice',
  params: { per: [3, 6], full: [3, 8], r: [1, 5] },
  valid: (p) => p.r < p.per,
  render: (p) =>
    `대원 ${String(p.per * p.full + p.r)}명이\n${String(p.per)}명씩 우주선에 타면\n마지막 우주선에는 몇 명이 탈까?`,
  answer: (p) => p.r,
  hint: () => '꽉 찬 우주선을 빼고 남은 대원 수야.',
  hintVisual: (p) => ({ kind: 'dotGroups', step: p.per, times: p.full }),
  distractors: [
    // 나머지를 버리고 몫을 답한다
    {
      kind: 'remainder_ignored',
      wrong: (p) => {
        const full = p['full']
        const r = p['r']
        return full === undefined || r === undefined || full === r ? null : full
      },
    },
    // 꽉 채운 대수를 하나 더 세어 답한다
    {
      kind: 'remainder_ignored',
      wrong: (p) => {
        const per = p['per']
        const r = p['r']
        return per === undefined || r === undefined || per === r ? null : per
      },
    },
    offByOne(1),
    offByOne(-1),
    offByTen(1),
  ],
})

export const w6BossMultiply: AnyQuestionTemplate = defineTemplate({
  id: 'w6_boss_multiply',
  world: 6,
  level: 'boss',
  skill: 'multiply_two_digit',
  inputType: 'choice',
  params: { tens: [1, 6], ones: [2, 9], b: [3, 7] },
  valid: (p) => p.ones * p.b >= 10 && (p.tens * 10 + p.ones) * p.b < 500,
  render: (p) =>
    `${josa(`좌석 ${String(p.tens * 10 + p.ones)}개짜리 우주선`, '이/가')} ${String(p.b)}대 있어.\n좌석은 모두 몇 개일까?`,
  answer: (p) => (p.tens * 10 + p.ones) * p.b,
  hint: () => '한 대의 좌석 수에 대수를 곱해 봐. 일의 자리 올림을 빠뜨리지 마.',
  distractors: [
    // 올림을 빠뜨린다
    {
      kind: 'carry_missed',
      wrong: (p) => {
        const tens = p['tens']
        const ones = p['ones']
        const b = p['b']
        if (tens === undefined || ones === undefined || b === undefined) return null
        const carried = Math.floor((ones * b) / 10)
        if (carried === 0) return null
        return (tens * 10 + ones) * b - carried * 10
      },
    },
    multiplyAsAdd('tens', 'b'),
    operationReversed('tens', 'ones', 'add'),
    offByTen(1),
    offByTen(-1),
    offByOne(1),
  ],
})

export const world6Templates: readonly AnyQuestionTemplate[] = [
  w6Lv1Share,
  w6Lv1HowMany,
  w6Lv2Divide,
  w6Lv2FromMultiply,
  w6Lv3MultiplyNoCarry,
  w6Lv3MultiplyCarry,
  w6Lv4Quotient,
  w6Lv4Remainder,
  w6Lv5LongDivide,
  w6Lv5Word,
  w6BossSeats,
  w6BossLeftover,
  w6BossMultiply,
]
