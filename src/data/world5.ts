import { offByOne, offByTen } from '../engine/distractors'
import { josa } from '../engine/korean'
import { defineTemplate, type AnyQuestionTemplate, type ShapeName } from '../engine/types'

/**
 * W5 구조물 격납고 — 평면도형과 길이 (설계서 5장)
 *
 * Lv1 도형 이름 고르기               4지선다 (도형 그림)
 * Lv2 변·꼭짓점 세기                 숫자 입력 (도형 그림)
 * Lv3 자로 길이 재기, cm ↔ mm        숫자 입력 (자 그림)
 * Lv4 직각 찾기, 사각형 구분         4지선다 (도형 그림)
 * Lv5 길이 계산(m·cm), 둘레          숫자 입력
 * 보스 조건에 맞는 부품 도형 고르기   4지선다
 *
 * 설계서는 보스를 "부품 도형을 골라 몸통 조립" 이라 적었다. 조립을 드래그로
 * 만들지 않고, 조건 두 개(변의 수와 직각 여부)를 동시에 만족하는 도형을 고르는
 * 것으로 바꿨다. 조립의 어려움은 손이 아니라 조건을 겹쳐 보는 데 있다.
 */

/**
 * 도형과 변의 수. 그림과 정답이 한곳에서 나온다.
 *
 * 여기에는 정사각형·직사각형을 따로 두지 않고 '사각형' 하나로 둔다.
 * 설계서의 Lv1 은 "삼각형·사각형·원 분류" 이고, 둘을 가르는 것은 Lv4 의 일이다.
 * 함께 내놓으면 변이 4개인 답이 둘이 되어, 아이가 맞는 답을 고르고도 틀린다.
 * 변의 수가 모두 다르므로 "변이 N개인 도형" 을 물어도 답이 하나로 정해진다.
 */
const SHAPES: readonly { readonly shape: ShapeName; readonly name: string; readonly sides: number }[] = [
  { shape: 'triangle', name: '삼각형', sides: 3 },
  { shape: 'square', name: '사각형', sides: 4 },
  { shape: 'pentagon', name: '오각형', sides: 5 },
  { shape: 'hexagon', name: '육각형', sides: 6 },
  { shape: 'circle', name: '원', sides: 0 },
]

function shapeAt(index: number) {
  return SHAPES[index] ?? (SHAPES[0] as (typeof SHAPES)[number])
}

// ─────────────────────────────────────────────────────────────
// Lv1 — 도형 이름
// ─────────────────────────────────────────────────────────────

export const w5Lv1Name: AnyQuestionTemplate = defineTemplate({
  id: 'w5_lv1_name',
  world: 5,
  level: 1,
  skill: 'shape_classify',
  inputType: 'choice',
  params: { kind: [0, 4] },
  render: () => '이 부품은 무슨 도형일까?',
  figure: (p) => ({ kind: 'shape', shape: shapeAt(p.kind).shape }),
  answer: (p) => shapeAt(p.kind).name,
  hint: () => '변이 몇 개인지 세어 봐. 둥글면 변이 없는 거야.',
  distractors: [
    // 변의 수를 하나 더 세거나 덜 센다
    {
      kind: 'off_by_one',
      wrong: (p) => {
        const kind = p['kind']
        return kind === undefined ? null : shapeAt((kind + 1) % SHAPES.length).name
      },
    },
    {
      kind: 'off_by_one',
      wrong: (p) => {
        const kind = p['kind']
        return kind === undefined ? null : shapeAt((kind + SHAPES.length - 1) % SHAPES.length).name
      },
    },
    // 네모끼리, 또는 각진 것끼리 헷갈린다
    {
      kind: 'place_confused',
      wrong: (p) => {
        const kind = p['kind']
        return kind === undefined ? null : shapeAt((kind + 2) % SHAPES.length).name
      },
    },
    {
      kind: 'place_confused',
      wrong: (p) => {
        const kind = p['kind']
        return kind === undefined ? null : shapeAt((kind + 3) % SHAPES.length).name
      },
    },
  ],
})

// ─────────────────────────────────────────────────────────────
// Lv2 — 변과 꼭짓점
// ─────────────────────────────────────────────────────────────

/** 원은 뺀다. 변도 꼭짓점도 없는 도형은 세는 연습이 되지 않는다. */
const ANGLED = SHAPES.filter((entry) => entry.sides > 0)

function angledAt(index: number) {
  return ANGLED[index] ?? (ANGLED[0] as (typeof ANGLED)[number])
}

export const w5Lv2Edges: AnyQuestionTemplate = defineTemplate({
  id: 'w5_lv2_edges',
  world: 5,
  level: 2,
  skill: 'shape_parts',
  inputType: 'numpad',
  params: { kind: [0, 3] },
  render: () => '변이 몇 개일까?',
  figure: (p) => ({ kind: 'shape', shape: angledAt(p.kind).shape, marks: 'edges' }),
  answer: (p) => angledAt(p.kind).sides,
  hint: () => '색이 바뀌는 곳마다 변 하나야. 한 바퀴 돌면서 세어 봐.',
})

export const w5Lv2Vertices: AnyQuestionTemplate = defineTemplate({
  id: 'w5_lv2_vertices',
  world: 5,
  level: 2,
  skill: 'shape_parts',
  inputType: 'numpad',
  params: { kind: [0, 3] },
  render: () => '꼭짓점이 몇 개일까?',
  figure: (p) => ({ kind: 'shape', shape: angledAt(p.kind).shape, marks: 'vertices' }),
  answer: (p) => angledAt(p.kind).sides,
  hint: () => '뾰족하게 만나는 자리가 꼭짓점이야. 노란 점을 세어 봐.',
})

// ─────────────────────────────────────────────────────────────
// Lv3 — 자로 재기, cm 와 mm
// ─────────────────────────────────────────────────────────────

export const w5Lv3Measure: AnyQuestionTemplate = defineTemplate({
  id: 'w5_lv3_measure',
  world: 5,
  level: 3,
  skill: 'length_measure',
  inputType: 'numpad',
  params: { cm: [1, 9] },
  render: () => '막대는 몇 cm 일까?',
  figure: (p) => ({ kind: 'ruler', lengthMm: p.cm * 10 }),
  answer: (p) => p.cm,
  hint: () => '0에서 시작해서 막대 끝이 닿은 큰 눈금을 읽어 봐.',
})

export const w5Lv3MeasureMm: AnyQuestionTemplate = defineTemplate({
  id: 'w5_lv3_measure_mm',
  world: 5,
  level: 3,
  skill: 'length_measure',
  inputType: 'numpad',
  params: { cm: [1, 8], mm: [1, 9] },
  render: () => '막대는 몇 mm 일까?',
  figure: (p) => ({ kind: 'ruler', lengthMm: p.cm * 10 + p.mm }),
  answer: (p) => p.cm * 10 + p.mm,
  hint: () => '1cm 는 10mm 야. 큰 눈금까지 10씩 세고 작은 눈금을 더해 봐.',
})

export const w5Lv3CmToMm: AnyQuestionTemplate = defineTemplate({
  id: 'w5_lv3_cm_to_mm',
  world: 5,
  level: 3,
  skill: 'length_calc',
  inputType: 'numpad',
  params: { cm: [1, 9], mm: [1, 9] },
  render: (p) => `${String(p.cm)}cm ${String(p.mm)}mm 는\n몇 mm 일까?`,
  answer: (p) => p.cm * 10 + p.mm,
  hint: () => '1cm 는 10mm 야. cm 를 먼저 mm 로 바꾸고 더해 봐.',
  hintVisual: (p) => ({ kind: 'dotGroups', step: 10, times: p.cm }),
})

// ─────────────────────────────────────────────────────────────
// Lv4 — 직각과 사각형 구분
// ─────────────────────────────────────────────────────────────

/** 직각이 있는 도형과 없는 도형. 조건을 겹쳐 보는 연습이다. */
const RIGHT_ANGLE_SHAPES: readonly { readonly shape: ShapeName; readonly name: string; readonly right: boolean }[] = [
  { shape: 'square', name: '정사각형', right: true },
  { shape: 'rectangle', name: '직사각형', right: true },
  { shape: 'rightTriangle', name: '직각삼각형', right: true },
  { shape: 'triangle', name: '삼각형', right: false },
  { shape: 'pentagon', name: '오각형', right: false },
  { shape: 'hexagon', name: '육각형', right: false },
]

function rightAt(index: number) {
  return RIGHT_ANGLE_SHAPES[index] ?? (RIGHT_ANGLE_SHAPES[0] as (typeof RIGHT_ANGLE_SHAPES)[number])
}

export const w5Lv4RightAngle: AnyQuestionTemplate = defineTemplate({
  id: 'w5_lv4_right_angle',
  world: 5,
  level: 4,
  skill: 'shape_classify',
  inputType: 'choice',
  params: { kind: [0, 5] },
  render: () => '이 부품의 이름은?',
  figure: (p) => {
    const entry = rightAt(p.kind)
    return entry.right
      ? { kind: 'shape', shape: entry.shape, marks: 'rightAngle' }
      : { kind: 'shape', shape: entry.shape }
  },
  answer: (p) => rightAt(p.kind).name,
  hint: () => '노란 표시가 직각이야. 네 변의 길이가 모두 같으면 정사각형이야.',
  distractors: [
    {
      kind: 'place_confused',
      wrong: (p) => {
        const kind = p['kind']
        return kind === undefined ? null : rightAt((kind + 1) % RIGHT_ANGLE_SHAPES.length).name
      },
    },
    {
      kind: 'place_confused',
      wrong: (p) => {
        const kind = p['kind']
        return kind === undefined
          ? null
          : rightAt((kind + RIGHT_ANGLE_SHAPES.length - 1) % RIGHT_ANGLE_SHAPES.length).name
      },
    },
    {
      kind: 'off_by_one',
      wrong: (p) => {
        const kind = p['kind']
        return kind === undefined ? null : rightAt((kind + 2) % RIGHT_ANGLE_SHAPES.length).name
      },
    },
    {
      kind: 'off_by_one',
      wrong: (p) => {
        const kind = p['kind']
        return kind === undefined ? null : rightAt((kind + 3) % RIGHT_ANGLE_SHAPES.length).name
      },
    },
  ],
})

// ─────────────────────────────────────────────────────────────
// Lv5 — 길이 계산과 둘레
// ─────────────────────────────────────────────────────────────

export const w5Lv5AddLength: AnyQuestionTemplate = defineTemplate({
  id: 'w5_lv5_add_length',
  world: 5,
  level: 5,
  skill: 'length_calc',
  inputType: 'numpad',
  params: { m1: [1, 4], cm1: [1, 9], m2: [1, 4], cm2: [1, 9] },
  // 받아올림이 나면 m 까지 답해야 해서 칸이 둘이 된다. cm 끼리는 100 을 넘기지 않는다.
  valid: (p) => p.cm1 * 10 + p.cm2 * 10 < 100,
  render: (p) =>
    `${String(p.m1)}m ${String(p.cm1 * 10)}cm 짜리와\n${String(p.m2)}m ${String(p.cm2 * 10)}cm 짜리를 이으면\n몇 cm 일까?`,
  answer: (p) => (p.m1 + p.m2) * 100 + (p.cm1 + p.cm2) * 10,
  // ○를 수백 개 찍어 봐야 셀 수 없다. 100씩 뛰어 세는 수직선으로 보여준다.
  hint: () => '1m 는 100cm 야. m 를 전부 cm 로 바꾸고 더해 봐.',
  hintVisual: (p) => ({
    kind: 'numberLine',
    values: Array.from({ length: p.m1 + p.m2 + 1 }, (_, i) => i * 100),
    highlight: (p.m1 + p.m2) * 100,
  }),
})

export const w5Lv5Perimeter: AnyQuestionTemplate = defineTemplate({
  id: 'w5_lv5_perimeter',
  world: 5,
  level: 5,
  skill: 'length_calc',
  inputType: 'numpad',
  params: { side: [2, 9], kind: [0, 2] },
  render: (p) => {
    const sides = p.kind + 3
    return `${josa(`한 변이 ${String(p.side)}cm 인 도형`, '이/가')} 있어.\n변이 ${String(sides)}개일 때\n둘레는 몇 cm 일까?`
  },
  figure: (p) => ({
    kind: 'shape',
    shape: ([`triangle`, `square`, `pentagon`] as const)[p.kind] ?? 'triangle',
    marks: 'edges',
  }),
  answer: (p) => p.side * (p.kind + 3),
  hint: () => '둘레는 변을 모두 더한 길이야. 변의 수만큼 더해 봐.',
  hintVisual: (p) => ({ kind: 'dotGroups', step: p.side, times: p.kind + 3 }),
})

// ─────────────────────────────────────────────────────────────
// 보스 — 조건에 맞는 부품 고르기
// ─────────────────────────────────────────────────────────────

/** 변의 수만 듣고 도형을 고른다. SHAPES 의 변 수가 모두 달라 답이 하나로 정해진다. */
export const w5BossPick: AnyQuestionTemplate = defineTemplate({
  id: 'w5_boss_pick',
  world: 5,
  level: 'boss',
  skill: 'shape_classify',
  inputType: 'choice',
  params: { kind: [0, 3] },
  render: (p) => {
    const entry = angledAt(p.kind)
    return `변이 ${String(entry.sides)}개인 부품이 필요해.\n어느 것을 끼울까?`
  },
  answer: (p) => angledAt(p.kind).name,
  hint: () => '이름 앞의 삼·사·오·육이 변의 수야.',
  distractors: [
    {
      kind: 'off_by_one',
      wrong: (p) => {
        const kind = p['kind']
        return kind === undefined ? null : angledAt((kind + 1) % ANGLED.length).name
      },
    },
    {
      kind: 'off_by_one',
      wrong: (p) => {
        const kind = p['kind']
        return kind === undefined ? null : angledAt((kind + ANGLED.length - 1) % ANGLED.length).name
      },
    },
    {
      kind: 'place_confused',
      wrong: (p) => {
        const kind = p['kind']
        return kind === undefined ? null : angledAt((kind + 2) % ANGLED.length).name
      },
    },
  ],
})

export const w5BossPerimeter: AnyQuestionTemplate = defineTemplate({
  id: 'w5_boss_perimeter',
  world: 5,
  level: 'boss',
  skill: 'length_calc',
  inputType: 'numpad',
  params: { side: [3, 9], kind: [0, 1] },
  render: (p) =>
    `몸통 판은 한 변이 ${String(p.side)}cm 인\n${p.kind === 0 ? '정사각형' : '삼각형'}이야.\n둘레는 몇 mm 일까?`,
  // cm 를 재고 mm 로 답한다. 단위를 두 번 건너야 해서 보스답다.
  answer: (p) => p.side * (p.kind === 0 ? 4 : 3) * 10,
  hint: () => '둘레를 cm 로 먼저 구하고, 1cm 는 10mm 니까 10을 곱해 봐.',
})

export const w5BossMm: AnyQuestionTemplate = defineTemplate({
  id: 'w5_boss_mm',
  world: 5,
  level: 'boss',
  skill: 'length_calc',
  inputType: 'choice',
  params: { cm: [1, 9], mm: [1, 9] },
  render: (p) => `${String(p.cm)}cm ${String(p.mm)}mm 는 몇 mm 일까?`,
  answer: (p) => p.cm * 10 + p.mm,
  hint: () => '1cm 는 10mm 야. cm 를 먼저 mm 로 바꿔 봐.',
  hintVisual: (p) => ({ kind: 'dotGroups', step: 10, times: p.cm }),
  distractors: [
    // cm 와 mm 를 그냥 이어 붙이거나, 단위를 바꾸지 않고 더한다
    {
      kind: 'unit_confused',
      wrong: (p) => {
        const cm = p['cm']
        const mm = p['mm']
        return cm === undefined || mm === undefined ? null : cm + mm
      },
    },
    {
      kind: 'unit_confused',
      wrong: (p) => {
        const cm = p['cm']
        const mm = p['mm']
        return cm === undefined || mm === undefined ? null : cm * 100 + mm
      },
    },
    offByTen(1),
    offByOne(1),
    offByOne(-1),
  ],
})

export const world5Templates: readonly AnyQuestionTemplate[] = [
  w5Lv1Name,
  w5Lv2Edges,
  w5Lv2Vertices,
  w5Lv3Measure,
  w5Lv3MeasureMm,
  w5Lv3CmToMm,
  w5Lv4RightAngle,
  w5Lv5AddLength,
  w5Lv5Perimeter,
  w5BossPick,
  w5BossPerimeter,
  w5BossMm,
]
