import { defineTemplate, type AnyQuestionTemplate } from '../engine/types'

/**
 * W4 관제 스테이션 — 시각과 시간 (설계서 5장)
 *
 * Lv1 5분 단위로 시각 읽기          4지선다 (시계 그림)
 * Lv2 1분 단위로 분 읽기            숫자 입력 (시계 그림)
 * Lv3 눈금 숫자 ↔ 분 바꾸기         숫자 입력
 * Lv4 몇 분 뒤, 오전·오후 사이 시간  4지선다 + 숫자 입력
 * Lv5 분·초 바꾸기, 시각표 계산     숫자 입력 (표)
 * 보스 우주선 넷의 도착 시각표      4지선다 (표)
 *
 * 설계서는 Lv3 에 "시계 바늘 직접 돌려 맞추기 (드래그)" 를 적었다. 같은 문서가
 * "모바일에서 정밀 드래그는 실패율이 높다" 고도 적었고, 8살이 답을 아는데 손이
 * 미끄러져 틀리면 그건 오답이 아니라 우리 잘못이다. 바늘을 돌려 배우는 것은
 * 결국 '분 ↔ 눈금 숫자' 를 잇는 일이라, 그 변환을 양방향으로 묻는 것으로 바꿨다.
 *
 * 아날로그 시계는 이 나이대 오답률 최상위 영역이다. (설계서 5장 주의)
 * 그래서 Lv1·Lv2 에 시계 그림을 반드시 붙이고, 오답 보기도 실제로 아이가 하는
 * 두 실수 — 시침과 분침을 바꿔 읽기, 눈금 숫자를 그대로 분으로 읽기 — 로 만든다.
 */

/** `3시 20분` 꼴로 적는다. 시각을 문자열로 다루면 보기 네 개가 서로 안 겹친다. */
function timeText(hour: number, minute: number): string {
  return `${String(hour)}시 ${String(minute)}분`
}

/** 12시를 넘거나 0시로 내려가지 않게 시를 감는다. */
function wrapHour(hour: number): number {
  const wrapped = hour % 12
  return wrapped === 0 ? 12 : wrapped
}

// ─────────────────────────────────────────────────────────────
// Lv1 — 5분 단위로 읽기
// ─────────────────────────────────────────────────────────────

/**
 * 정각(0분)은 내지 않는다. `3시 0분` 은 우리말로 어색하고, 정각 읽기는
 * 이 단계에서 물어볼 것이 없다. 정각은 Lv4 문장제에서 자연스럽게 나온다.
 */
export const w4Lv1ReadFive: AnyQuestionTemplate = defineTemplate({
  id: 'w4_lv1_read5',
  world: 4,
  level: 1,
  skill: 'clock_read',
  inputType: 'choice',
  params: { h: [1, 12], m5: [1, 11] },
  render: () => '지금 몇 시 몇 분일까?',
  figure: (p) => ({ kind: 'clock', hour: p.h, minute: p.m5 * 5 }),
  answer: (p) => timeText(p.h, p.m5 * 5),
  hint: () => '짧은바늘이 지나온 숫자가 "시"야. 긴바늘은 숫자 하나에 5분씩이야.',
  distractors: [
    // 시침과 분침을 바꿔 읽는다. 이 단계에서 가장 흔한 실수다.
    {
      kind: 'clock_hands_swapped',
      wrong: (p) => {
        const h = p['h']
        const m5 = p['m5']
        if (h === undefined || m5 === undefined) return null
        // 바꿔 읽어도 같은 시각이 되면 보기로 쓸 수 없다
        if (m5 === h) return null
        if (h * 5 > 59) return null
        return timeText(m5, h * 5)
      },
    },
    // 긴바늘이 가리키는 눈금 숫자를 그대로 분으로 읽는다. 4를 4분으로.
    {
      kind: 'clock_mark_as_minute',
      wrong: (p) => {
        const h = p['h']
        const m5 = p['m5']
        return h === undefined || m5 === undefined ? null : timeText(h, m5)
      },
    },
    {
      kind: 'off_by_one',
      wrong: (p) => {
        const h = p['h']
        const m5 = p['m5']
        return h === undefined || m5 === undefined ? null : timeText(wrapHour(h + 1), m5 * 5)
      },
    },
    {
      kind: 'off_by_one',
      wrong: (p) => {
        const h = p['h']
        const m5 = p['m5']
        return h === undefined || m5 === undefined ? null : timeText(wrapHour(h + 11), m5 * 5)
      },
    },
    {
      kind: 'off_by_ten',
      wrong: (p) => {
        const h = p['h']
        const m5 = p['m5']
        if (h === undefined || m5 === undefined || m5 + 1 > 11) return null
        return timeText(h, (m5 + 1) * 5)
      },
    },
    {
      kind: 'off_by_ten',
      wrong: (p) => {
        const h = p['h']
        const m5 = p['m5']
        if (h === undefined || m5 === undefined || m5 - 1 < 1) return null
        return timeText(h, (m5 - 1) * 5)
      },
    },
  ],
})

// ─────────────────────────────────────────────────────────────
// Lv2 — 1분 단위로 읽기
// ─────────────────────────────────────────────────────────────

export const w4Lv2ReadMinute: AnyQuestionTemplate = defineTemplate({
  id: 'w4_lv2_read1',
  world: 4,
  level: 2,
  skill: 'clock_read',
  inputType: 'numpad',
  params: { h: [1, 12], m: [1, 59] },
  // 5의 배수는 Lv1 에서 이미 했다. 여기서는 눈금 사이를 세는 것이 목표다.
  valid: (p) => p.m % 5 !== 0,
  render: () => '긴바늘은 몇 분을 가리킬까?',
  figure: (p) => ({ kind: 'clock', hour: p.h, minute: p.m }),
  answer: (p) => p.m,
  hint: () => '큰 숫자까지 5분씩 세고, 남은 작은 눈금을 1분씩 더 세어 봐.',
})

// ─────────────────────────────────────────────────────────────
// Lv3 — 눈금 숫자와 분을 잇는다 (설계서의 '바늘 맞추기' 를 대신한다)
// ─────────────────────────────────────────────────────────────

export const w4Lv3MarkToMinute: AnyQuestionTemplate = defineTemplate({
  id: 'w4_lv3_mark_to_minute',
  world: 4,
  level: 3,
  skill: 'clock_read',
  inputType: 'numpad',
  params: { h: [1, 12], mark: [1, 11] },
  render: (p) => `긴바늘이 ${String(p.mark)}을 가리켜.\n몇 분일까?`,
  figure: (p) => ({ kind: 'clock', hour: p.h, minute: p.mark * 5 }),
  answer: (p) => p.mark * 5,
  hint: () => '눈금 숫자 하나가 5분이야. 5씩 뛰어 세어 봐.',
  hintVisual: (p) => ({ kind: 'dotGroups', step: 5, times: p.mark }),
})

export const w4Lv3MinuteToMark: AnyQuestionTemplate = defineTemplate({
  id: 'w4_lv3_minute_to_mark',
  world: 4,
  level: 3,
  skill: 'clock_read',
  inputType: 'numpad',
  params: { h: [1, 12], mark: [1, 11] },
  // 그림을 붙이지 않는다. 이건 머릿속에서 되돌려 보는 문제다.
  render: (p) => `${String(p.h)}시 ${String(p.mark * 5)}분이야.\n긴바늘은 어느 숫자를 가리킬까?`,
  answer: (p) => p.mark,
  hint: () => '5분이 몇 번 들어가는지 세면 그게 눈금 숫자야.',
  hintVisual: (p) => ({ kind: 'dotGroups', step: 5, times: p.mark }),
})

// ─────────────────────────────────────────────────────────────
// Lv4 — 시간 계산
// ─────────────────────────────────────────────────────────────

export const w4Lv4After: AnyQuestionTemplate = defineTemplate({
  id: 'w4_lv4_after',
  world: 4,
  level: 4,
  skill: 'time_calc',
  inputType: 'choice',
  params: { h: [1, 11], m5: [1, 8], add5: [1, 9] },
  // 시를 넘기는 경우와 안 넘기는 경우가 둘 다 나오게 둔다
  render: (p) => `지금부터 ${String(p.add5 * 5)}분 뒤는 몇 시 몇 분일까?`,
  figure: (p) => ({ kind: 'clock', hour: p.h, minute: p.m5 * 5 }),
  answer: (p) => {
    const total = p.m5 * 5 + p.add5 * 5
    return timeText(wrapHour(p.h + Math.floor(total / 60)), total % 60)
  },
  hint: () => '60분이 되면 한 시간이 넘어가. 60을 넘는지부터 봐.',
  distractors: [
    // 60분을 넘겼는데 시를 올리지 않고 분을 그대로 쓴다
    {
      kind: 'carry_missed',
      wrong: (p) => {
        const h = p['h']
        const m5 = p['m5']
        const add5 = p['add5']
        if (h === undefined || m5 === undefined || add5 === undefined) return null
        const total = m5 * 5 + add5 * 5
        return total < 60 ? null : timeText(h, total)
      },
    },
    // 시만 넘기고 분은 60을 빼지 않는다
    {
      kind: 'carry_missed',
      wrong: (p) => {
        const h = p['h']
        const m5 = p['m5']
        const add5 = p['add5']
        if (h === undefined || m5 === undefined || add5 === undefined) return null
        const total = m5 * 5 + add5 * 5
        if (total >= 60) return null
        return timeText(wrapHour(h + 1), total)
      },
    },
    // 더하는 대신 뺀다
    {
      kind: 'operation_reversed',
      wrong: (p) => {
        const h = p['h']
        const m5 = p['m5']
        const add5 = p['add5']
        if (h === undefined || m5 === undefined || add5 === undefined) return null
        const diff = m5 * 5 - add5 * 5
        return diff < 0 ? null : timeText(h, diff)
      },
    },
    {
      kind: 'off_by_one',
      wrong: (p) => {
        const h = p['h']
        const m5 = p['m5']
        const add5 = p['add5']
        if (h === undefined || m5 === undefined || add5 === undefined) return null
        const total = m5 * 5 + add5 * 5
        return timeText(wrapHour(h + Math.floor(total / 60) + 1), total % 60)
      },
    },
    {
      kind: 'off_by_ten',
      wrong: (p) => {
        const h = p['h']
        const m5 = p['m5']
        const add5 = p['add5']
        if (h === undefined || m5 === undefined || add5 === undefined) return null
        const total = m5 * 5 + add5 * 5 + 5
        return timeText(wrapHour(h + Math.floor(total / 60)), total % 60)
      },
    },
    {
      kind: 'off_by_ten',
      wrong: (p) => {
        const h = p['h']
        const m5 = p['m5']
        const add5 = p['add5']
        if (h === undefined || m5 === undefined || add5 === undefined) return null
        const total = m5 * 5 + add5 * 5 - 5
        return total < 0 ? null : timeText(wrapHour(h + Math.floor(total / 60)), total % 60)
      },
    },
  ],
})

export const w4Lv4Span: AnyQuestionTemplate = defineTemplate({
  id: 'w4_lv4_span',
  world: 4,
  level: 4,
  skill: 'time_calc',
  inputType: 'numpad',
  params: { start: [7, 11], end: [1, 6] },
  render: (p) =>
    `오전 ${String(p.start)}시에 출발해서\n오후 ${String(p.end)}시에 도착했어.\n몇 시간 걸렸을까?`,
  answer: (p) => 12 - p.start + p.end,
  hint: () => '낮 12시까지 먼저 세고, 12시부터 다시 세어서 더해 봐.',
})

// ─────────────────────────────────────────────────────────────
// Lv5 — 초, 그리고 시각표
// ─────────────────────────────────────────────────────────────

export const w4Lv5Seconds: AnyQuestionTemplate = defineTemplate({
  id: 'w4_lv5_seconds',
  world: 4,
  level: 5,
  skill: 'time_calc',
  inputType: 'numpad',
  params: { m: [1, 5], s: [1, 59] },
  render: (p) => `${String(p.m)}분 ${String(p.s)}초는\n몇 초일까?`,
  answer: (p) => p.m * 60 + p.s,
  // ○를 240개 찍는 그림은 세는 데 도움이 되지 않는다. 60씩 뛰어 세는 수직선이 낫다.
  hint: () => '1분은 60초야. 분을 먼저 초로 바꾸고 남은 초를 더해 봐.',
  hintVisual: (p) => ({
    kind: 'numberLine',
    values: Array.from({ length: p.m + 1 }, (_, i) => i * 60),
    highlight: p.m * 60,
  }),
})

/** 시각표에 올리는 우주선. 이름이 고정이면 표를 읽는 요령이 몸에 붙는다. */
const SHIPS = ['가람호', '나래호', '다솜호', '라온호'] as const

export const w4Lv5Timetable: AnyQuestionTemplate = defineTemplate({
  id: 'w4_lv5_timetable',
  world: 4,
  level: 5,
  skill: 'word_problem_time',
  inputType: 'numpad',
  params: { h: [1, 9], m1: [1, 11], m2: [1, 11] },
  render: () => '가람호가 떠난 뒤\n라온호가 떠날 때까지\n몇 분 걸릴까?',
  figure: (p) => ({
    kind: 'dataTable',
    headers: ['우주선', '출발'],
    rows: [
      ['가람호', timeText(p.h, p.m1 * 5)],
      ['나래호', timeText(p.h + 1, 0)],
      ['라온호', timeText(p.h + 1, p.m2 * 5)],
    ],
  }),
  answer: (p) => 60 - p.m1 * 5 + p.m2 * 5,
  hint: () => '먼저 다음 정각까지 몇 분인지 세고, 거기서 다시 세어 더해 봐.',
})

// ─────────────────────────────────────────────────────────────
// 보스 — 도착 시각표 읽기
// ─────────────────────────────────────────────────────────────

/**
 * 우주선 넷의 도착 시각을 표로 주고 가장 먼저(또는 나중에) 닿는 배를 고른다.
 *
 * 배는 넷이므로 오답 보기는 나머지 셋이 그대로 된다. 순위를 어긋나게 고르는
 * 세 가지 실수 — 반대쪽 끝을 고르기, 분만 보고 고르기, 표에서 한 줄 밀려 읽기 —
 * 가 각각 나머지 배 하나씩에 대응한다.
 */
const BOSS_MINUTES = [5, 20, 35, 50] as const

/** i번째 배의 도착 시각. shift 로 순서를 돌려 답이 늘 같은 자리에 오지 않게 한다. */
function bossHourRank(index: number, shift: number): number {
  return (index + shift) % 4
}

function bossMinute(index: number, shift: number): number {
  return BOSS_MINUTES[(index * 3 + shift) % 4] as number
}

/** 시각 순위(0이 가장 이름)가 rank 인 배의 번호. */
function shipAtRank(rank: number, shift: number): number {
  return (rank - shift + 8) % 4
}

function bossRows(baseH: number, shift: number): readonly (readonly string[])[] {
  return SHIPS.map((ship, i) => [ship, timeText(baseH + bossHourRank(i, shift), bossMinute(i, shift))])
}

export const w4BossArrival: AnyQuestionTemplate = defineTemplate({
  id: 'w4_boss_arrival',
  world: 4,
  level: 'boss',
  skill: 'word_problem_time',
  inputType: 'choice',
  params: { baseH: [1, 8], shift: [0, 3], askLast: [0, 1] },
  render: (p) =>
    p.askLast === 1 ? '가장 늦게 도착하는 배는?' : '가장 먼저 도착하는 배는?',
  figure: (p) => ({
    kind: 'dataTable',
    headers: ['우주선', '도착'],
    rows: bossRows(p.baseH, p.shift),
  }),
  answer: (p) => SHIPS[shipAtRank(p.askLast === 1 ? 3 : 0, p.shift)] as string,
  hint: () => '분보다 시를 먼저 봐. 시가 같을 때만 분을 비교하는 거야.',
  distractors: [
    // 먼저를 물었는데 나중을 고른다 (또는 그 반대)
    {
      kind: 'operation_reversed',
      wrong: (p) => {
        const shift = p['shift']
        const askLast = p['askLast']
        if (shift === undefined || askLast === undefined) return null
        return SHIPS[shipAtRank(askLast === 1 ? 0 : 3, shift)] as string
      },
    },
    // 시를 무시하고 분만 보고 고른다
    {
      kind: 'clock_mark_as_minute',
      wrong: (p) => {
        const shift = p['shift']
        const askLast = p['askLast']
        if (shift === undefined || askLast === undefined) return null
        const target = askLast === 1 ? Math.max(...BOSS_MINUTES) : Math.min(...BOSS_MINUTES)
        const index = SHIPS.findIndex((_, i) => bossMinute(i, shift) === target)
        const answerIndex = shipAtRank(askLast === 1 ? 3 : 0, shift)
        return index === -1 || index === answerIndex ? null : (SHIPS[index] as string)
      },
    },
    // 표에서 한 줄 밀려 읽는다
    {
      kind: 'off_by_one',
      wrong: (p) => {
        const shift = p['shift']
        const askLast = p['askLast']
        if (shift === undefined || askLast === undefined) return null
        return SHIPS[shipAtRank(askLast === 1 ? 2 : 1, shift)] as string
      },
    },
    {
      kind: 'off_by_one',
      wrong: (p) => {
        const shift = p['shift']
        const askLast = p['askLast']
        if (shift === undefined || askLast === undefined) return null
        return SHIPS[shipAtRank(askLast === 1 ? 1 : 2, shift)] as string
      },
    },
  ],
})

/*
  처음에는 "가장 먼저 온 배와 가장 늦게 온 배는 몇 시간 차이?" 로 두었는데,
  시 순위가 늘 0과 3이라 답이 언제나 3이었다. 여덟 문제 중 두어 번만 나와도
  아이는 표를 안 보고 3을 누르게 된다. 답이 파라미터에 따라 움직여야 한다.
*/
export const w4BossGap: AnyQuestionTemplate = defineTemplate({
  id: 'w4_boss_gap',
  world: 4,
  level: 'boss',
  skill: 'word_problem_time',
  inputType: 'numpad',
  params: { baseH: [1, 8], shift: [0, 3] },
  render: () => '가장 먼저 도착한 배는\n몇 시에 왔을까?',
  figure: (p) => ({
    kind: 'dataTable',
    headers: ['우주선', '도착'],
    rows: bossRows(p.baseH, p.shift),
  }),
  answer: (p) => p.baseH,
  hint: () => '시가 가장 작은 줄을 찾아봐. 분은 그다음에 보는 거야.',
})

export const w4BossLater: AnyQuestionTemplate = defineTemplate({
  id: 'w4_boss_later',
  world: 4,
  level: 'boss',
  skill: 'time_calc',
  inputType: 'numpad',
  params: { h: [1, 11], m5: [1, 8], add5: [1, 9] },
  render: (p) => `${timeText(p.h, p.m5 * 5)}에서\n${String(p.add5 * 5)}분이 지나면\n몇 분일까?`,
  answer: (p) => (p.m5 * 5 + p.add5 * 5) % 60,
  hint: () => '60분이 되면 0분부터 다시 세는 거야.',
  hintVisual: (p) => ({ kind: 'dotGroups', step: 5, times: p.add5 }),
})

export const world4Templates: readonly AnyQuestionTemplate[] = [
  w4Lv1ReadFive,
  w4Lv2ReadMinute,
  w4Lv3MarkToMinute,
  w4Lv3MinuteToMark,
  w4Lv4After,
  w4Lv4Span,
  w4Lv5Seconds,
  w4Lv5Timetable,
  w4BossArrival,
  w4BossGap,
  w4BossLater,
]
