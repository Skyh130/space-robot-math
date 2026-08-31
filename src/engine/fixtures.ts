import {
  adjacentTable,
  carryMissed,
  multiplyAsAdd,
  offByOne,
  offByTen,
  operationReversed,
  placeConfused,
} from './distractors'
import { josa } from './korean'
import { defineTemplate, type AnyQuestionTemplate, type DistractorRule } from './types'

/**
 * 엔진 테스트용 템플릿.
 *
 * 실제 월드 문제은행은 Phase 3(W1)과 Phase 5(W2·W3)에서 data/ 아래에 만든다.
 * 여기 있는 것은 설계서 5장의 모양을 본떠 엔진의 각 기능
 * (조건부 파라미터, 4지선다 보기, 숫자 입력, 순서 배열)을 검사하기 위한 표본이다.
 */

/** W3 Lv1 — 곱셈구구 4지선다. 조건 없이 구간 전체를 쓴다. */
export const multiplicationChoice: AnyQuestionTemplate = defineTemplate({
  id: 'fx_w3_lv1_table',
  world: 3,
  level: 1,
  skill: 'multiplication_table',
  inputType: 'choice',
  params: { a: [2, 9], b: [2, 9] },
  render: (p) => `${p.a} × ${p.b} = ?`,
  answer: (p) => p.a * p.b,
  hint: (p) => `${p.a}단을 순서대로 세어 볼까?`,
  distractors: [
    multiplyAsAdd('a', 'b'),
    adjacentTable('a', 'b', 1),
    adjacentTable('a', 'b', -1),
    // 위 세 개가 서로 겹치는 2 × 2 같은 조합을 위한 마지막 보루
    offByOne(-1),
    offByOne(1),
  ],
})

/** W3 Lv4 — □ 채우기. 숫자패드 입력이라 보기가 없다. */
export const multiplicationBlank: AnyQuestionTemplate = defineTemplate({
  id: 'fx_w3_lv4_blank',
  world: 3,
  level: 4,
  skill: 'multiplication_blank',
  inputType: 'numpad',
  params: { a: [2, 9], b: [2, 9] },
  render: (p) => `${p.a} × □ = ${p.a * p.b}`,
  answer: (p) => p.b,
  hint: (p) => `${p.a}단을 순서대로 세어 볼까?`,
})

/** W2 Lv2 — 받아올림이 한 번 있는 두 자리 덧셈. valid 로 조건을 건다. */
export const additionWithCarry: AnyQuestionTemplate = defineTemplate({
  id: 'fx_w2_lv2_carry',
  world: 2,
  level: 2,
  skill: 'addition_carry',
  inputType: 'choice',
  params: { a: [12, 89], b: [12, 89] },
  // 일의 자리끼리 더해 10을 넘어야 받아올림이 생긴다
  valid: (p) => (p.a % 10) + (p.b % 10) >= 10,
  render: (p) => `${p.a} + ${p.b} = ?`,
  answer: (p) => p.a + p.b,
  hint: () => '일의 자리를 더하면 10이 넘어. 십의 자리로 1을 올려 줘.',
  distractors: [
    carryMissed('a', 'b'),
    offByTen(-1),
    offByTen(1),
    offByOne(1),
    // 기호를 잘못 본 실수. 합과 너무 멀어져 보기로서 약하니 마지막에 둔다
    operationReversed('a', 'b', 'add'),
  ],
})

/** 자릿값을 잘못 읽은 값을 보기로 만든다. 답이 t*10 이면 h*100 을, 그 반대면 t*10 을 준다. */
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

/** W1 Lv2 — 자릿값. 세 숫자가 모두 달라야 문제가 성립한다. */
export const placeValue: AnyQuestionTemplate = defineTemplate({
  id: 'fx_w1_lv2_place',
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
  distractors: [placeConfused(0.1), placeConfused(10), otherPlaceValue],
})

/** W1 보스 — 좌표 숫자를 작은 것부터 늘어놓기. 답이 배열이다. */
export const sortAscending: AnyQuestionTemplate = defineTemplate({
  id: 'fx_w1_boss_sort',
  world: 1,
  level: 'boss',
  skill: 'number_compare',
  inputType: 'order',
  params: { x: [100, 999], y: [100, 999], z: [100, 999] },
  valid: (p) => p.x !== p.y && p.y !== p.z && p.x !== p.z,
  render: (p) => `${p.x}, ${p.y}, ${p.z} 를 작은 수부터 늘어놓아 줘.`,
  answer: (p) => [p.x, p.y, p.z].sort((left, right) => left - right),
  hint: () => '백의 자리부터 비교해 봐.',
})

export const allFixtures: readonly AnyQuestionTemplate[] = [
  multiplicationChoice,
  multiplicationBlank,
  additionWithCarry,
  placeValue,
  sortAscending,
]
