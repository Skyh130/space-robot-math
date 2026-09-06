import { defineTemplate, type AnyQuestionTemplate } from '../engine/types'

/**
 * W7 액체 행성 — 분수와 소수 (설계서 5장)
 *
 * Lv1 색칠한 부분을 분수로            4지선다 (막대 그림)
 * Lv2 단위분수 비교 (1/3 과 1/5)      4지선다 (막대 그림)
 * Lv3 분모가 같은 분수 비교           4지선다 (막대 그림)
 * Lv4 소수 한 자리 읽기, 0.1 = 1/10   소수 입력 (막대 그림)
 * Lv5 소수 비교, 분수·소수 섞기       4지선다 + 소수 입력
 * 보스 연료 탱크 셋 중 가장 많은 것    4지선다 (막대 그림)
 *
 * "전 월드 중 최고 난도. 시각 자료 비중을 다른 월드의 2배로" 가 설계서의 지시다.
 * 그래서 여기서는 여덟 템플릿 중 여섯에 그림이 붙는다. 다른 월드의 두 배다.
 *
 * 분수 정답은 '3/4' 같은 문자열이다. 분수를 수로 바꾸면 1/3 이 0.333… 이 되어
 * 채점이 흔들린다. 소수 정답도 '0.7' 문자열로 둔다. 검사기가 수 정답은 정수만
 * 받는 것도 같은 이유다.
 *
 * 소수는 한 자리까지만 낸다. 3학년 범위이기도 하고, 숫자패드가 소수점 뒤 한 자리
 * 에서 멈추므로 '0.50' 처럼 적어 맞는 답이 틀리는 일이 생기지 않는다.
 */

/** `3/4` 꼴. 화면에도 이대로 보인다. */
function fractionText(numerator: number, denominator: number): string {
  return `${String(numerator)}/${String(denominator)}`
}

/** `0.7` 꼴. 소수점 뒤 한 자리로 고정한다. */
function decimalText(tenths: number): string {
  return (tenths / 10).toFixed(1)
}

// ─────────────────────────────────────────────────────────────
// Lv1 — 색칠한 부분을 분수로
// ─────────────────────────────────────────────────────────────

export const w7Lv1ReadFraction: AnyQuestionTemplate = defineTemplate({
  id: 'w7_lv1_read',
  world: 7,
  level: 1,
  skill: 'fraction_read',
  inputType: 'choice',
  params: { parts: [3, 8], filled: [1, 7] },
  // 전부 칠하면 1이 되어 분수로 물을 것이 없다
  valid: (p) => p.filled < p.parts,
  render: () => '색칠한 부분은\n전체의 얼마일까?',
  figure: (p) => ({
    kind: 'fractionBars',
    bars: [{ label: '', parts: p.parts, filled: p.filled }],
  }),
  answer: (p) => fractionText(p.filled, p.parts),
  hint: () => '전체를 몇 칸으로 나눴는지가 아래 수, 색칠한 칸이 위 수야.',
  distractors: [
    // 분자와 분모를 뒤집는다
    {
      kind: 'fraction_flipped',
      wrong: (p) => {
        const parts = p['parts']
        const filled = p['filled']
        return parts === undefined || filled === undefined || parts === filled
          ? null
          : fractionText(parts, filled)
      },
    },
    // 색칠하지 않은 칸을 센다
    {
      kind: 'fraction_part_counted',
      wrong: (p) => {
        const parts = p['parts']
        const filled = p['filled']
        if (parts === undefined || filled === undefined) return null
        const rest = parts - filled
        return rest === filled ? null : fractionText(rest, parts)
      },
    },
    // 분모를 '색칠하지 않은 칸 수' 로 잘못 센다
    {
      kind: 'fraction_part_counted',
      wrong: (p) => {
        const parts = p['parts']
        const filled = p['filled']
        if (parts === undefined || filled === undefined) return null
        const rest = parts - filled
        return rest <= filled ? null : fractionText(filled, rest)
      },
    },
    {
      kind: 'off_by_one',
      wrong: (p) => {
        const parts = p['parts']
        const filled = p['filled']
        if (parts === undefined || filled === undefined || filled + 1 >= parts) return null
        return fractionText(filled + 1, parts)
      },
    },
    {
      kind: 'off_by_one',
      wrong: (p) => {
        const parts = p['parts']
        const filled = p['filled']
        if (parts === undefined || filled === undefined || filled <= 1) return null
        return fractionText(filled - 1, parts)
      },
    },
    {
      kind: 'off_by_one',
      wrong: (p) => {
        const parts = p['parts']
        const filled = p['filled']
        if (parts === undefined || filled === undefined || parts + 1 > 12) return null
        return fractionText(filled, parts + 1)
      },
    },
  ],
})

// ─────────────────────────────────────────────────────────────
// Lv2 — 단위분수 비교
// ─────────────────────────────────────────────────────────────

/**
 * 1/3 과 1/5 중 어느 쪽이 큰가.
 * 아래 수가 클수록 작아진다는 것이 이 나이대에 가장 뒤집히기 쉬운 감각이라
 * 막대를 나란히 놓아 눈으로 먼저 보게 한다.
 */
export const w7Lv2UnitCompare: AnyQuestionTemplate = defineTemplate({
  id: 'w7_lv2_unit_compare',
  world: 7,
  level: 2,
  skill: 'fraction_compare',
  inputType: 'choice',
  params: { a: [2, 8], b: [2, 8], askSmall: [0, 1] },
  valid: (p) => p.a < p.b,
  render: (p) => (p.askSmall === 1 ? '더 작은 것은?' : '더 큰 것은?'),
  figure: (p) => ({
    kind: 'fractionBars',
    bars: [
      { label: fractionText(1, p.a), parts: p.a, filled: 1 },
      { label: fractionText(1, p.b), parts: p.b, filled: 1 },
    ],
  }),
  answer: (p) => fractionText(1, p.askSmall === 1 ? p.b : p.a),
  hint: () => '똑같은 것을 더 많이 나눌수록 한 조각은 작아져.',
  distractors: [
    // 아래 수가 크면 큰 분수라고 생각한다
    {
      kind: 'fraction_flipped',
      wrong: (p) => {
        const a = p['a']
        const b = p['b']
        const askSmall = p['askSmall']
        if (a === undefined || b === undefined || askSmall === undefined) return null
        return fractionText(1, askSmall === 1 ? a : b)
      },
    },
    {
      kind: 'off_by_one',
      wrong: (p) => {
        const a = p['a']
        const b = p['b']
        const askSmall = p['askSmall']
        if (a === undefined || b === undefined || askSmall === undefined) return null
        const denominator = askSmall === 1 ? b : a
        return fractionText(denominator, 1)
      },
    },
    {
      kind: 'fraction_part_counted',
      wrong: (p) => {
        const a = p['a']
        const b = p['b']
        return a === undefined || b === undefined ? null : fractionText(a, b)
      },
    },
    {
      kind: 'fraction_part_counted',
      wrong: (p) => {
        const a = p['a']
        const b = p['b']
        return a === undefined || b === undefined ? null : fractionText(b, a)
      },
    },
  ],
})

// ─────────────────────────────────────────────────────────────
// Lv3 — 분모가 같은 분수 비교
// ─────────────────────────────────────────────────────────────

export const w7Lv3SameDenominator: AnyQuestionTemplate = defineTemplate({
  id: 'w7_lv3_same_denominator',
  world: 7,
  level: 3,
  skill: 'fraction_compare',
  inputType: 'choice',
  params: { parts: [4, 9], x: [1, 8], y: [1, 8], askSmall: [0, 1] },
  valid: (p) => p.x < p.y && p.y < p.parts,
  render: (p) => (p.askSmall === 1 ? '더 작은 것은?' : '더 큰 것은?'),
  figure: (p) => ({
    kind: 'fractionBars',
    bars: [
      { label: fractionText(p.x, p.parts), parts: p.parts, filled: p.x },
      { label: fractionText(p.y, p.parts), parts: p.parts, filled: p.y },
    ],
  }),
  answer: (p) => fractionText(p.askSmall === 1 ? p.x : p.y, p.parts),
  hint: () => '아래 수가 같으면 위 수가 큰 쪽이 더 커.',
  distractors: [
    {
      kind: 'fraction_flipped',
      wrong: (p) => {
        const parts = p['parts']
        const x = p['x']
        const y = p['y']
        const askSmall = p['askSmall']
        if (parts === undefined || x === undefined || y === undefined || askSmall === undefined) {
          return null
        }
        return fractionText(askSmall === 1 ? y : x, parts)
      },
    },
    {
      kind: 'fraction_part_counted',
      wrong: (p) => {
        const parts = p['parts']
        const x = p['x']
        return parts === undefined || x === undefined ? null : fractionText(parts, x)
      },
    },
    {
      kind: 'fraction_part_counted',
      wrong: (p) => {
        const parts = p['parts']
        const y = p['y']
        return parts === undefined || y === undefined ? null : fractionText(parts, y)
      },
    },
    {
      kind: 'off_by_one',
      wrong: (p) => {
        const parts = p['parts']
        const x = p['x']
        const y = p['y']
        if (parts === undefined || x === undefined || y === undefined) return null
        const middle = Math.floor((x + y) / 2)
        return middle === x || middle === y ? null : fractionText(middle, parts)
      },
    },
    {
      kind: 'off_by_one',
      wrong: (p) => {
        const parts = p['parts']
        const y = p['y']
        if (parts === undefined || y === undefined || y + 1 >= parts) return null
        return fractionText(y + 1, parts)
      },
    },
  ],
})

// ─────────────────────────────────────────────────────────────
// Lv4 — 소수 한 자리
// ─────────────────────────────────────────────────────────────

export const w7Lv4ReadDecimal: AnyQuestionTemplate = defineTemplate({
  id: 'w7_lv4_read_decimal',
  world: 7,
  level: 4,
  skill: 'decimal_read',
  inputType: 'decimal',
  params: { tenths: [1, 9] },
  render: () => '색칠한 부분을\n소수로 쓰면?',
  figure: (p) => ({
    kind: 'fractionBars',
    bars: [{ label: '', parts: 10, filled: p.tenths }],
  }),
  answer: (p) => decimalText(p.tenths),
  hint: () => '열 칸으로 나눈 것 중 한 칸이 0.1이야. 몇 칸인지 세어 봐.',
})

export const w7Lv4FractionToDecimal: AnyQuestionTemplate = defineTemplate({
  id: 'w7_lv4_fraction_to_decimal',
  world: 7,
  level: 4,
  skill: 'decimal_read',
  inputType: 'decimal',
  params: { tenths: [1, 9] },
  render: (p) => `${fractionText(p.tenths, 10)} 를\n소수로 쓰면?`,
  answer: (p) => decimalText(p.tenths),
  hint: () => '1/10 이 0.1이야. 위 수가 소수점 뒤로 내려온다고 생각해 봐.',
})

// ─────────────────────────────────────────────────────────────
// Lv5 — 소수 비교, 분수와 소수 섞기
// ─────────────────────────────────────────────────────────────

export const w7Lv5CompareDecimal: AnyQuestionTemplate = defineTemplate({
  id: 'w7_lv5_compare_decimal',
  world: 7,
  level: 5,
  skill: 'decimal_compare',
  inputType: 'choice',
  params: { a: [1, 9], b: [1, 9], askSmall: [0, 1] },
  valid: (p) => p.a < p.b,
  render: (p) => (p.askSmall === 1 ? '연료가 더 적은 탱크는?' : '연료가 더 많은 탱크는?'),
  figure: (p) => ({
    kind: 'fractionBars',
    bars: [
      { label: decimalText(p.a), parts: 10, filled: p.a },
      { label: decimalText(p.b), parts: 10, filled: p.b },
    ],
  }),
  answer: (p) => decimalText(p.askSmall === 1 ? p.a : p.b),
  hint: () => '소수점 뒤 숫자가 클수록 커. 열 칸 중 몇 칸인지로 생각해 봐.',
  distractors: [
    {
      kind: 'operation_reversed',
      wrong: (p) => {
        const a = p['a']
        const b = p['b']
        const askSmall = p['askSmall']
        if (a === undefined || b === undefined || askSmall === undefined) return null
        return decimalText(askSmall === 1 ? b : a)
      },
    },
    // 소수점을 무시하고 정수처럼 읽는다
    {
      kind: 'decimal_shift',
      wrong: (p) => {
        const a = p['a']
        const askSmall = p['askSmall']
        const b = p['b']
        if (a === undefined || b === undefined || askSmall === undefined) return null
        return String(askSmall === 1 ? a : b)
      },
    },
    {
      kind: 'decimal_shift',
      wrong: (p) => {
        const a = p['a']
        const b = p['b']
        const askSmall = p['askSmall']
        if (a === undefined || b === undefined || askSmall === undefined) return null
        return (((askSmall === 1 ? a : b) / 100) as number).toFixed(2)
      },
    },
    {
      kind: 'off_by_one',
      wrong: (p) => {
        const b = p['b']
        return b === undefined || b + 1 > 9 ? null : decimalText(b + 1)
      },
    },
    {
      kind: 'off_by_one',
      wrong: (p) => {
        const a = p['a']
        return a === undefined || a - 1 < 1 ? null : decimalText(a - 1)
      },
    },
  ],
})

export const w7Lv5Word: AnyQuestionTemplate = defineTemplate({
  id: 'w7_lv5_word',
  world: 7,
  level: 5,
  skill: 'decimal_read',
  inputType: 'decimal',
  params: { a: [1, 4], b: [1, 5] },
  valid: (p) => p.a + p.b <= 9,
  render: (p) =>
    `연료를 ${decimalText(p.a)}L 넣고\n${decimalText(p.b)}L 를 더 넣었어.\n모두 몇 L 일까?`,
  // 0.2 를 수직선에 2로 찍으면 소수를 배우다 말고 정수로 되돌아간다.
  // 열 칸 막대 둘을 보여주는 편이 "0.1이 몇 개" 를 그대로 보여준다.
  figure: (p) => ({
    kind: 'fractionBars',
    bars: [
      { label: decimalText(p.a), parts: 10, filled: p.a },
      { label: decimalText(p.b), parts: 10, filled: p.b },
    ],
  }),
  answer: (p) => decimalText(p.a + p.b),
  hint: () => '0.1이 몇 개씩인지 세어서 더해 봐.',
})

// ─────────────────────────────────────────────────────────────
// 보스 — 연료 탱크 셋 중 가장 많은 것
// ─────────────────────────────────────────────────────────────

/**
 * 설계서가 적은 그대로 "분수·소수 혼합 표시" 다.
 * 세 탱크를 각각 분수와 소수로 섞어 적어 두고, 그림으로 견줄 수 있게 한다.
 * 표기가 달라도 같은 잣대로 볼 수 있느냐가 이 월드의 마지막 관문이다.
 */
export const w7BossTanks: AnyQuestionTemplate = defineTemplate({
  id: 'w7_boss_tanks',
  world: 7,
  level: 'boss',
  skill: 'decimal_compare',
  inputType: 'choice',
  params: { a: [1, 9], b: [1, 9], c: [1, 9], askSmall: [0, 1] },
  valid: (p) => p.a < p.b && p.b < p.c,
  render: (p) => (p.askSmall === 1 ? '연료가 가장 적은 탱크는?' : '연료가 가장 많은 탱크는?'),
  figure: (p) => ({
    kind: 'fractionBars',
    bars: [
      { label: decimalText(p.a), parts: 10, filled: p.a },
      { label: fractionText(p.b, 10), parts: 10, filled: p.b },
      { label: decimalText(p.c), parts: 10, filled: p.c },
    ],
  }),
  // 답은 그림표에 적힌 그대로 쓴다. 표기가 달라도 고를 수 있어야 한다.
  answer: (p) => (p.askSmall === 1 ? decimalText(p.a) : decimalText(p.c)),
  hint: () => '1/10 은 0.1과 같아. 모두 소수로 바꿔 놓고 견줘 봐.',
  distractors: [
    {
      kind: 'operation_reversed',
      wrong: (p) => {
        const a = p['a']
        const c = p['c']
        const askSmall = p['askSmall']
        if (a === undefined || c === undefined || askSmall === undefined) return null
        return decimalText(askSmall === 1 ? c : a)
      },
    },
    // 가운데 것을 고른다. 분수로 적혀 있어 크기를 못 견줄 때 나온다
    {
      kind: 'fraction_flipped',
      wrong: (p) => {
        const b = p['b']
        return b === undefined ? null : fractionText(b, 10)
      },
    },
    {
      kind: 'decimal_shift',
      wrong: (p) => {
        const c = p['c']
        const askSmall = p['askSmall']
        const a = p['a']
        if (a === undefined || c === undefined || askSmall === undefined) return null
        return String(askSmall === 1 ? a : c)
      },
    },
    {
      kind: 'off_by_one',
      wrong: (p) => {
        const c = p['c']
        return c === undefined || c + 1 > 9 ? null : decimalText(c + 1)
      },
    },
    {
      kind: 'off_by_one',
      wrong: (p) => {
        const a = p['a']
        return a === undefined || a - 1 < 1 ? null : decimalText(a - 1)
      },
    },
  ],
})

export const w7BossFraction: AnyQuestionTemplate = defineTemplate({
  id: 'w7_boss_fraction',
  world: 7,
  level: 'boss',
  skill: 'fraction_read',
  inputType: 'choice',
  params: { parts: [4, 9], filled: [1, 8] },
  valid: (p) => p.filled < p.parts,
  render: () => '남은 연료는\n전체의 얼마일까?',
  figure: (p) => ({
    kind: 'fractionBars',
    bars: [{ label: '', parts: p.parts, filled: p.filled }],
  }),
  answer: (p) => fractionText(p.filled, p.parts),
  hint: () => '나눈 칸 수가 아래, 색칠한 칸 수가 위야.',
  distractors: [
    {
      kind: 'fraction_flipped',
      wrong: (p) => {
        const parts = p['parts']
        const filled = p['filled']
        return parts === undefined || filled === undefined || parts === filled
          ? null
          : fractionText(parts, filled)
      },
    },
    {
      kind: 'fraction_part_counted',
      wrong: (p) => {
        const parts = p['parts']
        const filled = p['filled']
        if (parts === undefined || filled === undefined) return null
        const rest = parts - filled
        return rest === filled ? null : fractionText(rest, parts)
      },
    },
    {
      kind: 'off_by_one',
      wrong: (p) => {
        const parts = p['parts']
        const filled = p['filled']
        if (parts === undefined || filled === undefined || filled + 1 >= parts) return null
        return fractionText(filled + 1, parts)
      },
    },
    {
      kind: 'off_by_one',
      wrong: (p) => {
        const parts = p['parts']
        const filled = p['filled']
        if (parts === undefined || filled === undefined || parts + 1 > 12) return null
        return fractionText(filled, parts + 1)
      },
    },
    {
      kind: 'off_by_one',
      wrong: (p) => {
        const parts = p['parts']
        const filled = p['filled']
        if (parts === undefined || filled === undefined || filled <= 1) return null
        return fractionText(filled - 1, parts)
      },
    },
  ],
})

export const w7BossDecimal: AnyQuestionTemplate = defineTemplate({
  id: 'w7_boss_decimal',
  world: 7,
  level: 'boss',
  skill: 'decimal_read',
  inputType: 'decimal',
  params: { tenths: [1, 9] },
  render: (p) => `${fractionText(p.tenths, 10)} 만큼 남았어.\n소수로 쓰면 몇일까?`,
  figure: (p) => ({
    kind: 'fractionBars',
    bars: [{ label: '', parts: 10, filled: p.tenths }],
  }),
  answer: (p) => decimalText(p.tenths),
  hint: () => '열 칸 중 한 칸이 0.1이야.',
})

export const world7Templates: readonly AnyQuestionTemplate[] = [
  w7Lv1ReadFraction,
  w7Lv2UnitCompare,
  w7Lv3SameDenominator,
  w7Lv4ReadDecimal,
  w7Lv4FractionToDecimal,
  w7Lv5CompareDecimal,
  w7Lv5Word,
  w7BossTanks,
  w7BossFraction,
  w7BossDecimal,
]
