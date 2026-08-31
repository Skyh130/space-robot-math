/**
 * 조사 붙이기.
 *
 * 문제 문장이 파라미터에 따라 만들어지므로 "5이 나타내는 값"처럼 조사가 틀린
 * 문장이 그대로 아이에게 나간다. 2학년이 읽는 글이라 이런 건 그냥 오류다.
 * 모든 월드의 템플릿이 이 함수를 거쳐 조사를 붙인다.
 */

export type JosaPair = '이/가' | '은/는' | '을/를' | '와/과' | '으로/로' | '이야/야'

/** 숫자를 소리 내어 읽었을 때 마지막 음절에 받침이 있는지. 0 영, 1 일, 2 이 ... */
const DIGIT_HAS_FINAL: Readonly<Record<string, boolean>> = {
  '0': true, // 영
  '1': true, // 일
  '2': false, // 이
  '3': true, // 삼
  '4': false, // 사
  '5': false, // 오
  '6': true, // 육
  '7': true, // 칠
  '8': true, // 팔
  '9': false, // 구
}

const HANGUL_START = 0xac00
const HANGUL_END = 0xd7a3
const FINAL_COUNT = 28

/** ㄹ 받침은 '으로/로'에서 받침 없는 것처럼 쓴다. 예: 1로, 8로가 아니라 1로. */
const RIEUL_FINAL = 8

type Final = { has: boolean; isRieul: boolean }

function finalOf(word: string): Final | null {
  const last = word.trim().slice(-1)
  if (last === '') return null

  const digit = DIGIT_HAS_FINAL[last]
  if (digit !== undefined) {
    // 1 일, 7 칠, 8 팔 은 ㄹ 받침이다
    return { has: digit, isRieul: last === '1' || last === '7' || last === '8' }
  }

  const code = last.charCodeAt(0)
  if (code >= HANGUL_START && code <= HANGUL_END) {
    const finalIndex = (code - HANGUL_START) % FINAL_COUNT
    return { has: finalIndex !== 0, isRieul: finalIndex === RIEUL_FINAL }
  }

  return null
}

const FORMS: Readonly<Record<JosaPair, readonly [withFinal: string, withoutFinal: string]>> = {
  '이/가': ['이', '가'],
  '은/는': ['은', '는'],
  '을/를': ['을', '를'],
  '와/과': ['과', '와'],
  '으로/로': ['으로', '로'],
  // 서술격 조사 '이다'. "답은 7이야" / "답은 4야"
  '이야/야': ['이야', '야'],
}

/**
 * 단어 뒤에 알맞은 조사를 붙여 돌려준다.
 *
 * ```ts
 * josa('5', '이/가')   // '5가'
 * josa('7', '이/가')   // '7이'
 * josa('사과', '을/를') // '사과를'
 * ```
 *
 * 받침을 알 수 없는 글자(영문·기호)는 받침이 없는 것으로 본다.
 */
export function josa(word: string, pair: JosaPair): string {
  return `${word}${josaOf(word, pair)}`
}

/**
 * 조사만 돌려준다.
 * 숫자만 크게 그리고 조사는 보통 크기로 쓸 때처럼, 둘을 따로 그려야 할 때 쓴다.
 */
export function josaOf(word: string, pair: JosaPair): string {
  const forms = FORMS[pair]
  const final = finalOf(word)

  if (final === null) return forms[1]

  // 'ㄹ' 받침은 '으로'가 아니라 '로'를 쓴다
  if (pair === '으로/로' && final.isRieul) return forms[1]

  return final.has ? forms[0] : forms[1]
}
