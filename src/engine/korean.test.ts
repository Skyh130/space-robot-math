import { describe, expect, it } from 'vitest'

import { josa, josaOf, readNumberKo } from './korean'

describe('josa — 숫자', () => {
  it('받침이 있는 숫자에는 이/은/을/과를 붙인다', () => {
    // 1 일, 3 삼, 6 육, 7 칠, 8 팔, 0 영
    for (const digit of ['0', '1', '3', '6', '7', '8']) {
      expect(josa(digit, '이/가'), digit).toBe(`${digit}이`)
      expect(josa(digit, '은/는'), digit).toBe(`${digit}은`)
      expect(josa(digit, '을/를'), digit).toBe(`${digit}을`)
      expect(josa(digit, '와/과'), digit).toBe(`${digit}과`)
    }
  })

  it('받침이 없는 숫자에는 가/는/를/와를 붙인다', () => {
    // 2 이, 4 사, 5 오, 9 구
    for (const digit of ['2', '4', '5', '9']) {
      expect(josa(digit, '이/가'), digit).toBe(`${digit}가`)
      expect(josa(digit, '은/는'), digit).toBe(`${digit}는`)
      expect(josa(digit, '을/를'), digit).toBe(`${digit}를`)
      expect(josa(digit, '와/과'), digit).toBe(`${digit}와`)
    }
  })

  it('여러 자리 수는 마지막 자리로 정한다', () => {
    expect(josa('784', '이/가')).toBe('784가') // 사
    expect(josa('137', '이/가')).toBe('137이') // 칠
    expect(josa('1000', '은/는')).toBe('1000은') // 영
  })
})

describe('josa — 한글', () => {
  it('받침이 있으면 이/은/을/과를 붙인다', () => {
    expect(josa('로봇', '이/가')).toBe('로봇이')
    expect(josa('부품', '은/는')).toBe('부품은')
    expect(josa('연필', '을/를')).toBe('연필을')
  })

  it('받침이 없으면 가/는/를/와를 붙인다', () => {
    expect(josa('사과', '이/가')).toBe('사과가')
    expect(josa('바나나', '은/는')).toBe('바나나는')
    expect(josa('구슬', '을/를')).toBe('구슬을')
    expect(josa('접시', '을/를')).toBe('접시를')
  })
})

describe('josa — 으로/로', () => {
  it('받침이 없으면 로를 쓴다', () => {
    expect(josa('2', '으로/로')).toBe('2로')
    expect(josa('접시', '으로/로')).toBe('접시로')
  })

  it('받침이 있으면 으로를 쓴다', () => {
    expect(josa('3', '으로/로')).toBe('3으로')
    expect(josa('부품', '으로/로')).toBe('부품으로')
  })

  it('ㄹ 받침은 예외로 로를 쓴다', () => {
    expect(josa('1', '으로/로')).toBe('1로') // 일
    expect(josa('7', '으로/로')).toBe('7로') // 칠
    expect(josa('8', '으로/로')).toBe('8로') // 팔
    expect(josa('연필', '으로/로')).toBe('연필로')
  })
})

describe('josa — 가장자리', () => {
  it('빈 문자열이면 받침 없는 형태를 쓴다', () => {
    expect(josa('', '이/가')).toBe('가')
  })

  it('받침을 알 수 없는 글자는 받침 없는 형태로 본다', () => {
    expect(josa('robot', '이/가')).toBe('robot가')
  })

  it('뒤에 붙은 공백은 무시한다', () => {
    expect(josa('5 ', '이/가')).toBe('5 가')
  })
})

describe('josa — 서술격 이야/야', () => {
  it('받침이 있으면 이야를 쓴다', () => {
    expect(josa('7', '이야/야')).toBe('7이야') // 칠
    expect(josa('28', '이야/야')).toBe('28이야') // 팔
    expect(josa('로봇', '이야/야')).toBe('로봇이야')
  })

  it('받침이 없으면 야를 쓴다', () => {
    expect(josa('4', '이야/야')).toBe('4야') // 사
    expect(josa('62', '이야/야')).toBe('62야') // 이
    expect(josa('사과', '이야/야')).toBe('사과야')
  })
})

describe('josaOf', () => {
  it('조사만 돌려준다', () => {
    expect(josaOf('7', '이야/야')).toBe('이야')
    expect(josaOf('4', '이야/야')).toBe('야')
    expect(josaOf('5', '이/가')).toBe('가')
  })
})

describe('readNumberKo', () => {
  it('한 자리 수', () => {
    expect(readNumberKo(0)).toBe('영')
    expect(readNumberKo(1)).toBe('일')
    expect(readNumberKo(7)).toBe('칠')
  })

  it('십 자리 앞의 1은 읽지 않는다', () => {
    expect(readNumberKo(10)).toBe('십')
    expect(readNumberKo(15)).toBe('십오')
    expect(readNumberKo(20)).toBe('이십')
    expect(readNumberKo(47)).toBe('사십칠')
  })

  it('세 자리 수', () => {
    expect(readNumberKo(100)).toBe('백')
    expect(readNumberKo(342)).toBe('삼백사십이')
    expect(readNumberKo(472)).toBe('사백칠십이')
    expect(readNumberKo(999)).toBe('구백구십구')
  })

  it('0인 자리는 건너뛴다', () => {
    expect(readNumberKo(305)).toBe('삼백오')
    expect(readNumberKo(350)).toBe('삼백오십')
    expect(readNumberKo(300)).toBe('삼백')
    expect(readNumberKo(101)).toBe('백일')
  })

  it('네 자리 수', () => {
    expect(readNumberKo(1000)).toBe('천')
    expect(readNumberKo(2010)).toBe('이천십')
    expect(readNumberKo(3042)).toBe('삼천사십이')
    expect(readNumberKo(9999)).toBe('구천구백구십구')
    expect(readNumberKo(1234)).toBe('천이백삼십사')
  })

  it('0~9999 밖은 거부한다', () => {
    expect(() => readNumberKo(-1)).toThrow()
    expect(() => readNumberKo(10000)).toThrow()
    expect(() => readNumberKo(1.5)).toThrow()
  })

  it('모든 세 자리 수를 읽어도 깨지지 않는다', () => {
    for (let n = 100; n <= 999; n += 1) {
      const text = readNumberKo(n)
      expect(text.length, String(n)).toBeGreaterThan(0)
      expect(text, String(n)).not.toContain('undefined')
    }
  })
})
