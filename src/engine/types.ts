/**
 * 문제 엔진의 타입.
 *
 * 문제는 개별로 저장하지 않고 템플릿 + 파라미터로 매번 생성한다. (설계서 4장)
 * 아이가 답을 통째로 외우는 것을 막고, 적은 설계로 문제 수를 무한히 늘리기 위해서다.
 */

/** 행성(월드) 번호. 1~3이 MVP 범위다. */
export type WorldId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

/**
 * 스테이지 단계.
 *
 * Lv1~Lv5 와 보스가 배우는 곳이고, 'challenge' 는 보스를 깨야 열리는 도전 모드다.
 * 도전 모드는 진행에 아무 영향이 없다. 부품도 해금도 걸려 있지 않은 순수 놀이라
 * 시간을 재도 배우는 데 방해가 되지 않는다.
 */
export type StageLevel = 1 | 2 | 3 | 4 | 5 | 'boss' | 'challenge'

/**
 * 입력 방식.
 *
 * decimal 은 소수점 키가 붙은 숫자패드다. W7 소수 문제에만 쓴다.
 * 소수 정답은 문자열('0.5')로 둔다. 0.1 + 0.2 같은 부동소수 오차를 채점에
 * 끌어들이지 않기 위해서다. 검사기도 수 정답은 정수만 받는다.
 *
 * drag 는 쓰지 않는다. 설계서는 W4 시계·W5 도형·W6 나누기에 드래그를 적었지만,
 * 같은 문서가 "모바일에서 정밀 드래그는 실패율이 높다"고도 적었다. 8살이 답을
 * 아는데 손이 미끄러져 틀리면 그건 오답이 아니라 우리 잘못이다. 그 세 곳은
 * 그림을 문제에 붙이고(figure) 탭으로 고르게 했다. 타입은 남겨 두되 쓰지 않는다.
 */
export type InputType = 'numpad' | 'choice' | 'drag' | 'order' | 'decimal'

/**
 * 통계 집계 키. 부모 대시보드의 취약 영역 그래프와 복습 문제 편성의 근거가 된다.
 * 값은 설계서 5장의 월드별 학습 주제에서 뽑았다.
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
  /**
   * 7·8·9단만 따로 센다. 설계서 5장이 "7·8단 정답률이 낮으면 다음 세션 복습으로
   * 자동 편성"하라고 못 박았는데, 모든 단을 한 키로 묶으면 그 판단을 할 수 없다.
   */
  | 'multiplication_table_hard'
  | 'multiplication_blank'
  | 'word_problem_multiply'
  // W4 관제 스테이션
  | 'clock_read'
  | 'time_calc'
  | 'word_problem_time'
  // W5 구조물 격납고
  | 'shape_classify'
  | 'shape_parts'
  | 'length_measure'
  | 'length_calc'
  // W6 암흑 행성
  | 'division_share'
  | 'division_fact'
  | 'division_remainder'
  | 'multiply_two_digit'
  | 'word_problem_divide'
  // W7 액체 행성
  | 'fraction_read'
  | 'fraction_compare'
  | 'decimal_read'
  | 'decimal_compare'
  // W8 적 모선
  | 'table_read'
  | 'graph_read'
  | 'pattern_find'
  | 'word_problem_multi'

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
  | 'clock_hands_swapped' // 시침과 분침을 바꿔 읽음: 3시 10분을 2시 15분으로
  | 'clock_mark_as_minute' // 시계 눈금 숫자를 그대로 분으로: 3 을 3분으로
  | 'unit_confused' // 단위 혼동: 1cm 를 1mm 로, 2m 를 2cm 로
  | 'remainder_ignored' // 나머지를 버리거나 몫과 뒤바꿈
  | 'fraction_flipped' // 분자와 분모를 뒤집음: 3/4 를 4/3 으로
  | 'fraction_part_counted' // 색칠한 칸 수만 세고 전체 칸 수를 놓침
  | 'decimal_shift' // 소수점 자리를 밀어 읽음: 0.7 을 7 이나 0.07 로
  | 'pattern_step_missed' // 규칙의 뛰는 폭을 한 번 빠뜨림

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
   * 세로셈. 자리를 맞춰 놓고 받아올림 1이 윗자리로 올라가는(또는 10을 빌려 오는)
   * 과정을 보여준다. W2 의 핵심 힌트다. (설계서 5장)
   */
  | {
      readonly kind: 'columnMath'
      readonly left: number
      readonly right: number
      readonly operation: 'add' | 'subtract'
    }

/** 도형 이름. 그리는 일은 components/QuestionFigure.tsx 가 한다. */
export type ShapeName =
  | 'triangle'
  | 'rightTriangle'
  | 'square'
  | 'rectangle'
  | 'pentagon'
  | 'hexagon'
  | 'circle'

/**
 * 문제와 함께 보여주는 그림.
 *
 * 힌트 그림(HintVisual)과 다르다. 힌트는 틀린 뒤에 나오지만 이것은 문제의 일부다.
 * 시계를 안 보여주고 "몇 시야?" 라고 물을 수는 없다.
 *
 * 힌트 그림에 이미 있는 종류는 그대로 다시 쓴다. 수직선과 ○ 묶음은 문제에도
 * 힌트에도 필요한데, 같은 것을 두 번 그리면 언젠가 둘이 어긋난다.
 */
export type FigureOnly =
  /** 아날로그 시계. hour 는 1~12, minute 는 0~59. */
  | { readonly kind: 'clock'; readonly hour: number; readonly minute: number }
  /** 도형 하나. marks 로 꼭짓점·변·직각 표시를 켠다. */
  | {
      readonly kind: 'shape'
      readonly shape: ShapeName
      readonly marks?: 'vertices' | 'edges' | 'rightAngle'
    }
  /** 자 위에 놓인 막대. 눈금은 mm 로 재고 cm 마다 숫자를 적는다. */
  | { readonly kind: 'ruler'; readonly lengthMm: number }
  /** 칸을 나눈 막대 여럿. 분수와 소수를 눈으로 비교한다. */
  | {
      readonly kind: 'fractionBars'
      readonly bars: readonly {
        readonly label: string
        readonly parts: number
        readonly filled: number
      }[]
    }
  /** 막대그래프. */
  | {
      readonly kind: 'barChart'
      readonly unit: string
      readonly bars: readonly { readonly label: string; readonly value: number }[]
    }
  /** 표. 첫 줄이 머리글이다. */
  | {
      readonly kind: 'dataTable'
      readonly headers: readonly string[]
      readonly rows: readonly (readonly string[])[]
      /** 물어보는 칸. [행, 열] 이며 0부터 센다. */
      readonly highlight?: readonly [number, number]
    }
  /** 도형이 반복되는 줄. blankAt 자리는 물음표로 비운다. */
  | {
      readonly kind: 'shapePattern'
      readonly items: readonly ShapeName[]
      readonly blankAt: number
    }

export type QuestionFigure = HintVisual | FigureOnly

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

  /**
   * 문장과 함께 보여줄 그림. 시계·도형·표처럼 그림이 곧 문제인 경우에 쓴다.
   * 힌트 그림과 달리 처음부터 보인다.
   */
  readonly figure?: (params: ParamsOf<S>) => QuestionFigure

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
  /** 문장과 함께 보여줄 그림. */
  readonly figure?: QuestionFigure
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
