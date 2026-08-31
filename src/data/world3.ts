import { adjacentTable, multiplyAsAdd, offByOne } from '../engine/distractors'
import { josa } from '../engine/korean'
import { defineTemplate, type AnyQuestionTemplate, type DistractorRule } from '../engine/types'

/**
 * W3 에너지 코어 공장 — 곱셈구구 (설계서 5장)
 *
 * Lv1 2·5단                      4지선다
 * Lv2 3·4·6단                    숫자 입력
 * Lv3 7·8·9단                    숫자 입력
 * Lv4 전체 섞기 + □ 채우기       숫자 입력
 * Lv5 문장제 → 곱셈식 세우기     4지선다 + 숫자 입력
 * 보스 60초 안에 코어 12개 충전  4지선다 — 게임 전체에서 유일한 타이머
 *
 * 7·8단 정답률이 낮으면 다음 세션 복습으로 자동 편성한다. (설계서 5장 주의)
 * skill 을 단별로 나눠 두어야 그 편성이 가능하다.
 */

/** aKind 로 고를 수 있는 단. */
function pickTable(tables: readonly number[], kind: number): number {
  return tables[kind] ?? (tables[0] as number)
}

/** 한 자리를 잘못 세는 실수는 마지막 보루로만 쓴다. 앞의 규칙이 겹칠 때를 위한 것이다. */
const TABLE_DISTRACTORS: readonly DistractorRule[] = [
  multiplyAsAdd('a', 'b'),
  adjacentTable('a', 'b', 1),
  adjacentTable('a', 'b', -1),
  offByOne(-1),
  offByOne(1),
]

/** ○ 묶음 그림. 곱셈은 "몇 씩 몇 묶음"으로 보여줘야 뜻이 남는다. */
function groupsVisual(a: number, b: number) {
  return { kind: 'dotGroups', step: a, times: b } as const
}

// ─────────────────────────────────────────────────────────────
// Lv1 — 2단과 5단
// ─────────────────────────────────────────────────────────────

const EASY_TABLES = [2, 5] as const

export const w3Lv1EasyTables: AnyQuestionTemplate = defineTemplate({
  id: 'w3_lv1_easy',
  world: 3,
  level: 1,
  skill: 'multiplication_table',
  inputType: 'choice',
  params: { aKind: [0, 1], b: [2, 9] },
  render: (p) => `${pickTable(EASY_TABLES, p.aKind)} × ${p.b} = ?`,
  answer: (p) => pickTable(EASY_TABLES, p.aKind) * p.b,
  hint: (p) => `${josa(String(pickTable(EASY_TABLES, p.aKind)), '이/가')} ${p.b}묶음이야.`,
  hintVisual: (p) => groupsVisual(pickTable(EASY_TABLES, p.aKind), p.b),
  distractors: [
    {
      kind: 'multiply_as_add',
      wrong: (p) => {
        const a = p['aKind'] === undefined ? null : pickTable(EASY_TABLES, p['aKind'])
        const b = p['b']
        return a === null || b === undefined ? null : a + b
      },
    },
    {
      kind: 'adjacent_table',
      wrong: (p) => {
        const a = p['aKind'] === undefined ? null : pickTable(EASY_TABLES, p['aKind'])
        const b = p['b']
        return a === null || b === undefined ? null : a * (b + 1)
      },
    },
    {
      kind: 'adjacent_table',
      wrong: (p) => {
        const a = p['aKind'] === undefined ? null : pickTable(EASY_TABLES, p['aKind'])
        const b = p['b']
        return a === null || b === undefined || b <= 1 ? null : a * (b - 1)
      },
    },
    offByOne(-1),
    offByOne(1),
  ],
})

// ─────────────────────────────────────────────────────────────
// Lv2·Lv3 — 단을 나눠 익힌다
// ─────────────────────────────────────────────────────────────

const MIDDLE_TABLES = [3, 4, 6] as const
const HARD_TABLES = [7, 8, 9] as const

export const w3Lv2MiddleTables: AnyQuestionTemplate = defineTemplate({
  id: 'w3_lv2_middle',
  world: 3,
  level: 2,
  skill: 'multiplication_table',
  inputType: 'numpad',
  params: { aKind: [0, 2], b: [2, 9] },
  render: (p) => `${pickTable(MIDDLE_TABLES, p.aKind)} × ${p.b} = ?`,
  answer: (p) => pickTable(MIDDLE_TABLES, p.aKind) * p.b,
  hint: (p) => `${pickTable(MIDDLE_TABLES, p.aKind)}단을 순서대로 세어 볼까?`,
  hintVisual: (p) => groupsVisual(pickTable(MIDDLE_TABLES, p.aKind), p.b),
})

export const w3Lv3HardTables: AnyQuestionTemplate = defineTemplate({
  id: 'w3_lv3_hard',
  world: 3,
  level: 3,
  skill: 'multiplication_table',
  inputType: 'numpad',
  params: { aKind: [0, 2], b: [2, 9] },
  render: (p) => `${pickTable(HARD_TABLES, p.aKind)} × ${p.b} = ?`,
  answer: (p) => pickTable(HARD_TABLES, p.aKind) * p.b,
  hint: (p) => `${pickTable(HARD_TABLES, p.aKind)}단을 순서대로 세어 볼까?`,
  hintVisual: (p) => groupsVisual(pickTable(HARD_TABLES, p.aKind), p.b),
})

// ─────────────────────────────────────────────────────────────
// Lv4 — 전체 섞기와 □ 채우기
// ─────────────────────────────────────────────────────────────

export const w3Lv4Mixed: AnyQuestionTemplate = defineTemplate({
  id: 'w3_lv4_mixed',
  world: 3,
  level: 4,
  skill: 'multiplication_table',
  inputType: 'numpad',
  params: { a: [2, 9], b: [2, 9] },
  render: (p) => `${p.a} × ${p.b} = ?`,
  answer: (p) => p.a * p.b,
  hint: (p) => `${p.a}단을 순서대로 세어 볼까?`,
  hintVisual: (p) => groupsVisual(p.a, p.b),
})

export const w3Lv4Blank: AnyQuestionTemplate = defineTemplate({
  id: 'w3_lv4_blank',
  world: 3,
  level: 4,
  skill: 'multiplication_blank',
  inputType: 'numpad',
  params: { a: [2, 9], b: [2, 9] },
  render: (p) => `${p.a} × □ = ${p.a * p.b}`,
  answer: (p) => p.b,
  hint: (p) => `${p.a}단을 순서대로 세어 볼까?`,
  hintVisual: (p) => groupsVisual(p.a, p.b),
})

// ─────────────────────────────────────────────────────────────
// Lv5 — 문장제
// ─────────────────────────────────────────────────────────────

const BOXES = ['상자', '접시', '칸'] as const
const ITEMS = ['코어', '부품', '별사탕'] as const

function boxName(kind: number): string {
  return BOXES[kind] ?? '상자'
}

function itemName(kind: number): string {
  return ITEMS[kind] ?? '코어'
}

export const w3Lv5WordAnswer: AnyQuestionTemplate = defineTemplate({
  id: 'w3_lv5_word',
  world: 3,
  level: 5,
  skill: 'word_problem_multiply',
  inputType: 'numpad',
  params: { a: [2, 9], b: [2, 9], box: [0, 2], item: [0, 2] },
  render: (p) =>
    `${boxName(p.box)} ${p.a}개에\n${itemName(p.item)}가 ${p.b}개씩 있어.\n모두 몇 개?`,
  answer: (p) => p.a * p.b,
  hint: (p) => `${p.b}개씩 ${p.a}묶음이야.`,
  hintVisual: (p) => groupsVisual(p.b, p.a),
})

/** 문장을 곱셈식으로 옮기는 문제. 답을 구하기 전에 식을 세울 줄 알아야 한다. */
export const w3Lv5WordEquation: AnyQuestionTemplate = defineTemplate({
  id: 'w3_lv5_equation',
  world: 3,
  level: 5,
  skill: 'word_problem_multiply',
  inputType: 'choice',
  params: { a: [2, 9], b: [2, 9], box: [0, 2] },
  valid: (p) => p.a !== p.b,
  render: (p) => `${boxName(p.box)} ${p.a}개에\n코어가 ${p.b}개씩 있어.\n알맞은 식은?`,
  answer: (p) => `${p.a} × ${p.b}`,
  hint: (p) => `묶음 수 ${p.a}, 한 묶음에 ${p.b}개야.`,
  hintVisual: (p) => groupsVisual(p.b, p.a),
  distractors: [
    // 곱셈을 덧셈으로 바꿔 쓴다
    {
      kind: 'multiply_as_add',
      wrong: (p) => {
        const a = p['a']
        const b = p['b']
        return a === undefined || b === undefined ? null : `${a} + ${b}`
      },
    },
    // 빼기로 잘못 세운다
    {
      kind: 'operation_reversed',
      wrong: (p) => {
        const a = p['a']
        const b = p['b']
        return a === undefined || b === undefined || a <= b ? null : `${a} − ${b}`
      },
    },
    // 한 칸 밀린 수로 식을 세운다
    {
      kind: 'adjacent_table',
      wrong: (p) => {
        const a = p['a']
        const b = p['b']
        return a === undefined || b === undefined ? null : `${a} × ${b + 1}`
      },
    },
    {
      kind: 'adjacent_table',
      wrong: (p) => {
        const a = p['a']
        const b = p['b']
        return a === undefined || b === undefined || b <= 1 ? null : `${a} × ${b - 1}`
      },
    },
  ],
})

// ─────────────────────────────────────────────────────────────
// 보스 — 60초 안에 코어 12개 충전
// ─────────────────────────────────────────────────────────────

/**
 * 게임 전체에서 타이머를 쓰는 유일한 구간이다. (설계서 5장, CLAUDE.md 절대 규칙 3)
 * 구구단은 속도 자동화가 학습 목표라 여기서만 시간을 잰다.
 * 빨리 눌러야 하므로 숫자 입력이 아니라 4지선다다. 타자 속도를 재는 게 아니다.
 */
export const w3BossCharge: AnyQuestionTemplate = defineTemplate({
  id: 'w3_boss_charge',
  world: 3,
  level: 'boss',
  skill: 'multiplication_table',
  inputType: 'choice',
  params: { a: [2, 9], b: [2, 9] },
  render: (p) => `${p.a} × ${p.b} = ?`,
  answer: (p) => p.a * p.b,
  hint: (p) => `${p.a}단이야.`,
  hintVisual: (p) => groupsVisual(p.a, p.b),
  distractors: TABLE_DISTRACTORS,
})

export const world3Templates: readonly AnyQuestionTemplate[] = [
  w3Lv1EasyTables,
  w3Lv2MiddleTables,
  w3Lv3HardTables,
  w3Lv4Mixed,
  w3Lv4Blank,
  w3Lv5WordAnswer,
  w3Lv5WordEquation,
  w3BossCharge,
]
