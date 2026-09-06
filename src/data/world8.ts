import { multiplyAsAdd, offByOne, offByTen, operationReversed } from '../engine/distractors'
import { defineTemplate, type AnyQuestionTemplate, type ShapeName } from '../engine/types'

/**
 * W8 적 모선 — 자료와 규칙, 종합 (설계서 5장)
 *
 * Lv1 표 읽기                        숫자 입력 (표)
 * Lv2 막대그래프 읽기                숫자 입력 (그래프)
 * Lv3 규칙 찾기 (수 배열, 도형 배열)  숫자 입력 + 4지선다
 * Lv4 흩어진 자료를 표로 정리         숫자 입력 (표)
 * Lv5 2단계 복합 문장제               숫자 입력
 * 보스 3라운드 — 계산 / 도형·시간 / 복합
 *
 * 설계서의 최종 보스는 3라운드다. 라운드마다 묻는 것이 달라야 해서 보스 템플릿을
 * 세 갈래로 나눴다. 1라운드는 앞 월드의 계산, 2라운드는 도형과 시간, 3라운드는
 * 두 단계를 잇는 문장제다. 스테이지가 여덟 문제를 섞어 내므로 세 라운드가 고루 나온다.
 */

/** 표와 그래프에 쓰는 이름. 고정해 두면 표 읽는 요령이 몸에 붙는다. */
const CREWS = ['가람', '나래', '다솜', '라온'] as const

// ─────────────────────────────────────────────────────────────
// Lv1 — 표 읽기
// ─────────────────────────────────────────────────────────────

export const w8Lv1ReadTable: AnyQuestionTemplate = defineTemplate({
  id: 'w8_lv1_read_table',
  world: 8,
  level: 1,
  skill: 'table_read',
  inputType: 'numpad',
  params: { a: [2, 9], b: [2, 9], c: [2, 9], who: [0, 2] },
  render: (p) => `${CREWS[p.who] ?? CREWS[0]} 대원의 부품은?`,
  figure: (p) => ({
    kind: 'dataTable',
    headers: ['대원', '부품(개)'],
    rows: [
      [CREWS[0], String(p.a)],
      [CREWS[1], String(p.b)],
      [CREWS[2], String(p.c)],
    ],
  }),
  answer: (p) => [p.a, p.b, p.c][p.who] ?? p.a,
  hint: () => '왼쪽에서 이름을 찾고, 그 줄을 오른쪽으로 따라가 봐.',
})

export const w8Lv1TableTotal: AnyQuestionTemplate = defineTemplate({
  id: 'w8_lv1_table_total',
  world: 8,
  level: 1,
  skill: 'table_read',
  inputType: 'numpad',
  params: { a: [2, 9], b: [2, 9], c: [2, 9] },
  render: () => '부품은 모두 몇 개일까?',
  figure: (p) => ({
    kind: 'dataTable',
    headers: ['대원', '부품(개)'],
    rows: [
      [CREWS[0], String(p.a)],
      [CREWS[1], String(p.b)],
      [CREWS[2], String(p.c)],
    ],
  }),
  answer: (p) => p.a + p.b + p.c,
  hint: () => '표의 수를 모두 더하는 거야. 위에서부터 차례로 더해 봐.',
})

// ─────────────────────────────────────────────────────────────
// Lv2 — 막대그래프 읽기
// ─────────────────────────────────────────────────────────────

export const w8Lv2ReadGraph: AnyQuestionTemplate = defineTemplate({
  id: 'w8_lv2_read_graph',
  world: 8,
  level: 2,
  skill: 'graph_read',
  inputType: 'numpad',
  params: { a: [1, 8], b: [1, 8], c: [1, 8], who: [0, 2] },
  render: (p) => `${CREWS[p.who] ?? CREWS[0]} 대원의 코어는?`,
  figure: (p) => ({
    kind: 'barChart',
    unit: '개',
    bars: [
      { label: CREWS[0], value: p.a },
      { label: CREWS[1], value: p.b },
      { label: CREWS[2], value: p.c },
    ],
  }),
  answer: (p) => [p.a, p.b, p.c][p.who] ?? p.a,
  hint: () => '막대 꼭대기에서 왼쪽으로 곧게 가면 몇인지 보여.',
})

export const w8Lv2GraphDiff: AnyQuestionTemplate = defineTemplate({
  id: 'w8_lv2_graph_diff',
  world: 8,
  level: 2,
  skill: 'graph_read',
  inputType: 'numpad',
  params: { a: [1, 8], b: [1, 8], c: [1, 8] },
  valid: (p) => p.a !== p.b && p.b !== p.c && p.a !== p.c,
  render: () => '가장 많은 대원과 가장 적은 대원은\n몇 개 차이일까?',
  figure: (p) => ({
    kind: 'barChart',
    unit: '개',
    bars: [
      { label: CREWS[0], value: p.a },
      { label: CREWS[1], value: p.b },
      { label: CREWS[2], value: p.c },
    ],
  }),
  answer: (p) => Math.max(p.a, p.b, p.c) - Math.min(p.a, p.b, p.c),
  hint: () => '가장 긴 막대와 가장 짧은 막대를 먼저 찾고 빼 봐.',
})

// ─────────────────────────────────────────────────────────────
// Lv3 — 규칙 찾기
// ─────────────────────────────────────────────────────────────

export const w8Lv3NumberRule: AnyQuestionTemplate = defineTemplate({
  id: 'w8_lv3_number_rule',
  world: 8,
  level: 3,
  skill: 'pattern_find',
  inputType: 'numpad',
  params: { start: [2, 30], step: [2, 9] },
  render: (p) => {
    const values = [0, 1, 2, 3].map((i) => p.start + p.step * i)
    return `${values.join(', ')}, □\n□ 에 들어갈 수는?`
  },
  answer: (p) => p.start + p.step * 4,
  hint: () => '앞의 수와 뒤의 수가 얼마씩 커지는지 먼저 찾아봐.',
  hintVisual: (p) => ({
    kind: 'numberLine',
    values: [0, 1, 2, 3, 4].map((i) => p.start + p.step * i),
    highlight: p.start + p.step * 4,
  }),
})

export const w8Lv3MultiplyRule: AnyQuestionTemplate = defineTemplate({
  id: 'w8_lv3_multiply_rule',
  world: 8,
  level: 3,
  skill: 'pattern_find',
  inputType: 'numpad',
  params: { start: [2, 9], step: [2, 9] },
  render: (p) => {
    const values = [1, 2, 3].map((i) => p.start * p.step * i)
    return `${values.join(', ')}, □\n□ 에 들어갈 수는?`
  },
  answer: (p) => p.start * p.step * 4,
  // 81씩 4묶음을 ○로 찍으면 324개다. 세는 그림이 아니라 벽지가 된다.
  hint: () => '몇씩 뛰어 세고 있는지 찾으면 다음 수가 보여.',
  hintVisual: (p) => ({
    kind: 'numberLine',
    values: [1, 2, 3, 4].map((i) => p.start * p.step * i),
    highlight: p.start * p.step * 4,
  }),
})

/** 도형 배열 규칙. 세 가지가 돌아가며 나온다. */
const PATTERN_SHAPES: readonly ShapeName[] = ['triangle', 'square', 'circle']

export const w8Lv3ShapeRule: AnyQuestionTemplate = defineTemplate({
  id: 'w8_lv3_shape_rule',
  world: 8,
  level: 3,
  skill: 'pattern_find',
  inputType: 'choice',
  params: { offset: [0, 2], blank: [3, 5] },
  render: () => '규칙을 찾아\n빈칸에 들어갈 도형을 골라 봐.',
  figure: (p) => ({
    kind: 'shapePattern',
    items: Array.from(
      { length: 6 },
      (_, i) => PATTERN_SHAPES[(i + p.offset) % PATTERN_SHAPES.length] as ShapeName,
    ),
    blankAt: p.blank,
  }),
  answer: (p) => {
    const shape = PATTERN_SHAPES[(p.blank + p.offset) % PATTERN_SHAPES.length]
    return shape === 'triangle' ? '삼각형' : shape === 'square' ? '정사각형' : '원'
  },
  hint: () => '앞에서부터 몇 개마다 같은 도형이 나오는지 세어 봐.',
  /*
    보기를 셋으로 둔다. 규칙에 쓰인 도형이 셋뿐인데 넷째 보기를 채우려면
    규칙에 없는 도형(육각형 같은 것)을 넣어야 하고, 그건 보자마자 지워져서
    문제가 쉬워진다. 규칙 안에서만 고르게 해야 규칙을 읽게 된다.
  */
  choiceCount: 3,
  distractors: [
    // 규칙을 한 칸 밀려 읽는다
    {
      kind: 'pattern_step_missed',
      wrong: (p) => {
        const blank = p['blank']
        const offset = p['offset']
        if (blank === undefined || offset === undefined) return null
        const shape = PATTERN_SHAPES[(blank + offset + 1) % PATTERN_SHAPES.length]
        return shape === 'triangle' ? '삼각형' : shape === 'square' ? '정사각형' : '원'
      },
    },
    {
      kind: 'pattern_step_missed',
      wrong: (p) => {
        const blank = p['blank']
        const offset = p['offset']
        if (blank === undefined || offset === undefined) return null
        const shape = PATTERN_SHAPES[(blank + offset + 2) % PATTERN_SHAPES.length]
        return shape === 'triangle' ? '삼각형' : shape === 'square' ? '정사각형' : '원'
      },
    },
  ],
})

// ─────────────────────────────────────────────────────────────
// Lv4 — 흩어진 자료를 표로 정리
// ─────────────────────────────────────────────────────────────

export const w8Lv4Tally: AnyQuestionTemplate = defineTemplate({
  id: 'w8_lv4_tally',
  world: 8,
  level: 4,
  skill: 'table_read',
  inputType: 'numpad',
  params: { a: [2, 9], b: [2, 9], c: [2, 9], who: [0, 2] },
  // 수는 표가 다 말해 준다. 문장이 같은 말을 되풀이하면 화면만 잡아먹는다.
  // 합계는 문장에 둔다. 표에까지 넣으면 줄이 하나 더 늘어 작은 폰에서 넘친다.
  render: (p) => `모두 ${String(p.a + p.b + p.c)}개야. 빈칸은?`,
  figure: (p) => {
    const rest = [0, 1, 2].filter((i) => i !== p.who)
    return {
      kind: 'dataTable',
      headers: ['대원', '부품(개)'],
      rows: [
        ...rest.map((i) => [CREWS[i] ?? '', String([p.a, p.b, p.c][i] ?? 0)]),
        [CREWS[p.who] ?? '', '?'],
      ],
      highlight: [2, 1] as const,
    }
  },
  answer: (p) => [p.a, p.b, p.c][p.who] ?? p.a,
  hint: () => '합계에서 이미 아는 수를 빼면 빈칸이 나와.',
})

// ─────────────────────────────────────────────────────────────
// Lv5 — 2단계 복합 문장제
// ─────────────────────────────────────────────────────────────

export const w8Lv5MultiplyThenSubtract: AnyQuestionTemplate = defineTemplate({
  id: 'w8_lv5_mult_sub',
  world: 8,
  level: 5,
  skill: 'word_problem_multi',
  inputType: 'numpad',
  params: { each: [3, 9], boxes: [3, 9], used: [2, 9] },
  valid: (p) => p.each * p.boxes > p.used,
  render: (p) =>
    `상자 ${String(p.boxes)}개에\n부품이 ${String(p.each)}개씩 있어.\n${String(p.used)}개를 썼다면\n남은 부품은 몇 개일까?`,
  answer: (p) => p.each * p.boxes - p.used,
  hint: () => '먼저 모두 몇 개인지 곱해서 구하고, 거기서 쓴 만큼 빼는 거야.',
  hintVisual: (p) => ({ kind: 'dotGroups', step: p.each, times: p.boxes }),
})

export const w8Lv5AddThenDivide: AnyQuestionTemplate = defineTemplate({
  id: 'w8_lv5_add_divide',
  world: 8,
  level: 5,
  skill: 'word_problem_multi',
  inputType: 'numpad',
  params: { a: [2, 9], b: [2, 9], groups: [2, 6] },
  valid: (p) => (p.a + p.b) % p.groups === 0,
  render: (p) =>
    `연료통을 ${String(p.a)}개 찾고\n${String(p.b)}개를 더 찾았어.\n${String(p.groups)}대에 똑같이 나누면\n한 대에 몇 개일까?`,
  answer: (p) => (p.a + p.b) / p.groups,
  hint: () => '먼저 모두 몇 개인지 더하고, 그 수를 나누는 거야.',
})

// ─────────────────────────────────────────────────────────────
// 최종 보스 — 3라운드 (설계서 5장)
// ─────────────────────────────────────────────────────────────

/** 1라운드: 계산. 앞 월드에서 배운 곱셈과 나눗셈을 그대로 쓴다. */
export const w8BossRound1: AnyQuestionTemplate = defineTemplate({
  id: 'w8_boss_r1_calc',
  world: 8,
  level: 'boss',
  skill: 'word_problem_multi',
  inputType: 'choice',
  params: { tens: [1, 5], ones: [2, 9], b: [3, 6] },
  valid: (p) => p.ones * p.b >= 10 && (p.tens * 10 + p.ones) * p.b < 400,
  render: (p) => `적 모선의 방패가\n${String(p.tens * 10 + p.ones)} × ${String(p.b)} 만큼 남았어.\n얼마일까?`,
  answer: (p) => (p.tens * 10 + p.ones) * p.b,
  hint: () => '일의 자리부터 곱하고, 넘은 만큼 십의 자리로 올려 줘.',
  distractors: [
    {
      kind: 'carry_missed',
      wrong: (p) => {
        const tens = p['tens']
        const ones = p['ones']
        const b = p['b']
        if (tens === undefined || ones === undefined || b === undefined) return null
        const carried = Math.floor((ones * b) / 10)
        return carried === 0 ? null : (tens * 10 + ones) * b - carried * 10
      },
    },
    multiplyAsAdd('tens', 'b'),
    operationReversed('tens', 'ones', 'add'),
    offByTen(1),
    offByTen(-1),
    offByOne(1),
  ],
})

/** 2라운드: 도형과 시간. W4·W5 에서 배운 것을 다시 꺼낸다. */
export const w8BossRound2: AnyQuestionTemplate = defineTemplate({
  id: 'w8_boss_r2_shape_time',
  world: 8,
  level: 'boss',
  skill: 'word_problem_multi',
  inputType: 'numpad',
  params: { side: [3, 9], sides: [3, 5] },
  render: (p) =>
    `방패는 한 변이 ${String(p.side)}cm 인\n변 ${String(p.sides)}개짜리 도형이야.\n둘레는 몇 mm 일까?`,
  answer: (p) => p.side * p.sides * 10,
  hint: () => '변을 모두 더해 둘레를 cm 로 구하고, 1cm 는 10mm 니까 10을 곱해 봐.',
  hintVisual: (p) => ({ kind: 'dotGroups', step: p.side, times: p.sides }),
})

export const w8BossRound2Time: AnyQuestionTemplate = defineTemplate({
  id: 'w8_boss_r2_time',
  world: 8,
  level: 'boss',
  skill: 'word_problem_multi',
  inputType: 'numpad',
  params: { h: [1, 9], m5: [1, 9], add5: [1, 9] },
  render: (p) =>
    `${String(p.h)}시 ${String(p.m5 * 5)}분에 공격이 시작돼.\n${String(p.add5 * 5)}분 동안 이어진다면\n끝나는 시각은 몇 분일까?`,
  answer: (p) => (p.m5 * 5 + p.add5 * 5) % 60,
  hint: () => '60분이 되면 시가 하나 올라가고 분은 0부터 다시 세는 거야.',
})

/** 3라운드: 복합 문장제. 두 단계를 이어야 답이 나온다. */
export const w8BossRound3: AnyQuestionTemplate = defineTemplate({
  id: 'w8_boss_r3_multi',
  world: 8,
  level: 'boss',
  skill: 'word_problem_multi',
  inputType: 'numpad',
  params: { each: [3, 9], boxes: [2, 8], per: [2, 6] },
  valid: (p) => (p.each * p.boxes) % p.per === 0 && p.each * p.boxes < 100,
  render: (p) =>
    `탄약 상자 ${String(p.boxes)}개에\n${String(p.each)}발씩 들어 있어.\n포 ${String(p.per)}문에 똑같이 나누면\n한 문에 몇 발일까?`,
  answer: (p) => (p.each * p.boxes) / p.per,
  hint: () => '먼저 모두 몇 발인지 곱하고, 그다음 나누는 거야.',
})

export const w8BossRound3Remainder: AnyQuestionTemplate = defineTemplate({
  id: 'w8_boss_r3_remainder',
  world: 8,
  level: 'boss',
  skill: 'word_problem_multi',
  inputType: 'numpad',
  params: { per: [3, 6], full: [3, 8], r: [1, 5] },
  valid: (p) => p.r < p.per,
  render: (p) =>
    `구조 대원 ${String(p.per * p.full + p.r)}명을\n${String(p.per)}명씩 태워 옮겨.\n몇 번 오가야 할까?`,
  answer: (p) => p.full + 1,
  hint: () => '남은 대원도 태워야 해. 남으면 한 번 더 가야 하는 거야.',
  hintVisual: (p) => ({ kind: 'dotGroups', step: p.per, times: p.full }),
})

export const world8Templates: readonly AnyQuestionTemplate[] = [
  w8Lv1ReadTable,
  w8Lv1TableTotal,
  w8Lv2ReadGraph,
  w8Lv2GraphDiff,
  w8Lv3NumberRule,
  w8Lv3MultiplyRule,
  w8Lv3ShapeRule,
  w8Lv4Tally,
  w8Lv5MultiplyThenSubtract,
  w8Lv5AddThenDivide,
  w8BossRound1,
  w8BossRound2,
  w8BossRound2Time,
  w8BossRound3,
  w8BossRound3Remainder,
]
