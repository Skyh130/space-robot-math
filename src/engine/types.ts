/**
 * 문제 엔진의 타입.
 *
 * 문제는 개별로 저장하지 않고 템플릿 + 파라미터로 매번 생성한다. (설계서 4장)
 * 아이가 답을 통째로 외우는 것을 막고, 적은 설계로 문제 수를 무한히 늘리기 위해서다.
 */

/** 행성(월드) 번호. 1~3이 MVP 범위다. */
export type WorldId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

/** 스테이지 단계. 한 월드는 Lv1~Lv5 + 보스 하나로 이루어진다. */
export type StageLevel = 1 | 2 | 3 | 4 | 5 | 'boss'

/**
 * 입력 방식.
 * drag 는 W4 시계 바늘 / W5 도형 조립 / W6 똑같이 나누기 세 곳에만 쓴다.
 * 모바일에서 정밀 드래그는 실패율이 높다. (설계서 4장)
 */
export type InputType = 'numpad' | 'choice' | 'drag' | 'order'

/**
 * 통계 집계 키. 부모 대시보드의 취약 영역 그래프와 복습 문제 편성의 근거가 된다.
 * 여기 있는 값은 설계서 5장에서 MVP 범위인 W1~W3 것만 뽑은 것이다.
 * W4~W8 키는 Phase 8에서 추가한다.
 */
export type SkillKey =
  // W1 숫자 소행성대
  | 'number_read'
  | 'place_value'
  | 'skip_counting'
  | 'number_compare'
  | 'number_make'
  // W2 중력 협곡
  | 'addition_no_carry'
  | 'addition_carry'
  | 'subtraction_borrow'
  | 'equation_blank'
  | 'word_problem_add_sub'
  // W3 에너지 코어 공장
  | 'multiplication_table'
  | 'multiplication_blank'
  | 'word_problem_multiply'

/** 파라미터가 뽑히는 구간. 양끝을 포함한다. */
export type ParamRange = readonly [min: number, max: number]

/** 템플릿이 선언하는 파라미터 구간표. 예: `{ a: [2, 9], b: [2, 9] }` */
export type ParamSpec = Readonly<Record<string, ParamRange>>

/** 구간표에서 실제로 뽑힌 값. 예: `{ a: 4, b: 7 }` */
export type ParamsOf<S extends ParamSpec> = { readonly [K in keyof S]: number }

/** 정답 한 칸에 들어갈 수 있는 값. */
export type AnswerScalar = number | string

/** 정답. 순서 배열 문제는 배열이 답이 된다. */
export type AnswerValue = AnswerScalar | readonly AnswerScalar[]

/**
 * 아이가 실제로 하는 실수의 종류.
 * 4지선다 오답 보기는 무작위로 만들지 않고 이 중 하나를 재현한 값이어야 한다.
 */
export type MistakeKind =
  | 'carry_missed' // 받아올림 누락: 37 + 45 → 72
  | 'borrow_missed' // 받아내림 누락: 52 − 28 → 36
  | 'digit_shift' // 자릿수 밀림: 245 + 13 을 245 + 130 으로
  | 'multiply_as_add' // 곱셈을 덧셈으로: 4 × 6 → 10
  | 'adjacent_table' // 구구단 한 칸 밀림: 7 × 8 을 7 × 7 로
  | 'operation_reversed' // 뺄셈을 덧셈으로, 또는 그 반대
  | 'place_confused' // 자릿값 혼동: 472 의 7 을 7 이나 700 으로
  | 'off_by_one' // 한 칸 세기 실수
  | 'off_by_ten' // 십의 자리만 어긋남

/** 실수 하나를 재현하는 규칙. 재현할 수 없는 파라미터면 null 을 준다. */
export type DistractorRule<S extends ParamSpec = ParamSpec> = {
  readonly kind: MistakeKind
  readonly wrong: (params: ParamsOf<S>, answer: AnswerValue) => AnswerValue | null
}

/**
 * 오답일 때 함께 보여줄 그림 힌트.
 *
 * 정답만 알려주면 다음에 또 틀린다. (설계서 6장)
 * data/ 는 순수 데이터로 두어야 해서 JSX 가 아니라 무엇을 그릴지만 적는다.
 * 실제 그림은 components/HintVisual.tsx 가 그린다.
 */
export type HintVisual =
  /** 자릿값 표. 천·백·십·일 칸에 숫자를 넣고 한 칸을 강조한다. */
  | { readonly kind: 'placeValue'; readonly value: number; readonly highlight?: 0 | 1 | 2 | 3 }
  /** 두 수를 자릿값 표에 위아래로 놓고 비교한다. */
  | { readonly kind: 'placeValueCompare'; readonly left: number; readonly right: number }
  /** 수직선 위에 수를 늘어놓고 한 칸을 강조한다. */
  | { readonly kind: 'numberLine'; readonly values: readonly number[]; readonly highlight?: number }
  /** ○를 묶음으로 늘어놓고 누적 수를 적는다. 곱셈·뛰어 세기용. */
  | { readonly kind: 'dotGroups'; readonly step: number; readonly times: number }

/**
 * 문제 템플릿.
 *
 * render / answer / hint 는 모두 순수 함수여야 한다.
 * 같은 파라미터면 언제나 같은 결과가 나와야 테스트로 정답을 검증할 수 있다.
 */
export type QuestionTemplate<S extends ParamSpec = ParamSpec> = {
  readonly id: string
  readonly world: WorldId
  readonly level: StageLevel
  readonly skill: SkillKey
  readonly inputType: InputType

  /** 파라미터를 뽑을 구간. */
  readonly params: S

  /**
   * 뽑힌 파라미터가 이 문제로 쓸 만한지 판단한다.
   * 예: 받아올림 없는 덧셈만 내고 싶을 때 `(p) => p.a % 10 + p.b % 10 < 10`.
   * 없으면 구간 안의 모든 조합을 쓴다.
   */
  readonly valid?: (params: ParamsOf<S>) => boolean

  /** 화면에 보일 문제 문장. */
  readonly render: (params: ParamsOf<S>) => string

  /** 정답. */
  readonly answer: (params: ParamsOf<S>) => AnswerValue

  /** 틀렸을 때 보여줄 한 줄 이유. 정답만 던지고 넘어가지 않는다. */
  readonly hint: (params: ParamsOf<S>) => string

  /** 한 줄 이유와 함께 보여줄 그림 힌트. */
  readonly hintVisual?: (params: ParamsOf<S>) => HintVisual

  /** 4지선다용 오답 보기 규칙. inputType 이 'choice' 면 반드시 있어야 한다. */
  readonly distractors?: readonly DistractorRule<S>[]

  /** 보기 개수. 기본 4개. */
  readonly choiceCount?: number
}

/** 여러 템플릿을 한 배열에 담을 때 쓰는, 파라미터 모양을 지운 타입. */
export type AnyQuestionTemplate = QuestionTemplate<ParamSpec>

/**
 * 템플릿을 쓸 때 파라미터 이름을 자동으로 추론시키는 헬퍼.
 * 이걸 거치면 render/answer 안에서 `p.a` 가 타입 검사를 받는다.
 */
export function defineTemplate<const S extends ParamSpec>(
  template: QuestionTemplate<S>,
): AnyQuestionTemplate {
  // 파라미터 모양만 지우는 캐스트다. 배열에 담아 쓰기 위한 것이고,
  // 실제 값은 generator 가 template.params 를 보고 그대로 만들어 넘긴다.
  return template as unknown as AnyQuestionTemplate
}

/** 템플릿에서 실제로 만들어진 문제 한 개. */
export type Question = {
  /** 인스턴스 id. `w2_lv4#8821` 꼴이며 오답 큐에 이 값을 넣는다. (설계서 8장) */
  readonly id: string
  readonly templateId: string
  readonly world: WorldId
  readonly level: StageLevel
  readonly skill: SkillKey
  readonly inputType: InputType
  /** 화면에 보일 문장. */
  readonly prompt: string
  readonly params: Readonly<Record<string, number>>
  readonly answer: AnswerValue
  /** 4지선다일 때의 보기. 정답 하나와 실수 기반 오답들이 섞여 있다. */
  readonly choices?: readonly AnswerValue[]
  readonly hint: string
  readonly hintVisual?: HintVisual
}

/** 채점 결과. */
export type AnswerResult = {
  readonly correct: boolean
  readonly given: AnswerValue
  readonly expected: AnswerValue
  /** 틀렸을 때 보여줄 한 줄 이유. 맞았으면 빈 문자열이다. */
  readonly hint: string
  /** 통계 집계용. */
  readonly skill: SkillKey
}
