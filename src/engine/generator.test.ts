import { describe, expect, it } from 'vitest'

import { checkAnswer, generateQuestion, isSameAnswer } from './generator'
import { josa } from './korean'
import {
  additionWithCarry,
  allFixtures,
  multiplicationBlank,
  multiplicationChoice,
  placeValue,
  sortAscending,
} from './fixtures'
import { defineTemplate, type AnswerValue, type AnyQuestionTemplate } from './types'

/** 템플릿마다 이 개수만큼 생성해 정답을 검증한다. (CLAUDE.md 절대 규칙 1: 최소 20회) */
const RUNS = 40
const seeds = Array.from({ length: RUNS }, (_, i) => i + 1)

function generateAll(template: AnyQuestionTemplate) {
  return seeds.map((seed) => generateQuestion(template, seed))
}

describe('generateQuestion — 재현성', () => {
  it('같은 템플릿에 같은 시드면 완전히 같은 문제가 나온다', () => {
    for (const template of allFixtures) {
      for (const seed of [1, 7, 12345]) {
        expect(generateQuestion(template, seed)).toEqual(generateQuestion(template, seed))
      }
    }
  })

  it('시드가 다르면 대체로 다른 문제가 나온다', () => {
    const ids = new Set(generateAll(multiplicationChoice).map((q) => q.id))
    expect(ids.size).toBeGreaterThan(RUNS / 2)
  })

  it('같은 시드라도 템플릿이 다르면 파라미터가 갈린다', () => {
    // 구간이 같은 두 템플릿이 서로 같은 수열을 쓰면, 한 스테이지 안에서
    // 두 문제가 늘 같은 수로 나온다. 우연히 겹치는 시드는 있어도 되지만
    // 수열 자체가 같아서는 안 된다.
    const same = seeds.filter((seed) => {
      const left = generateQuestion(multiplicationChoice, seed).params
      const right = generateQuestion(multiplicationBlank, seed).params
      return left['a'] === right['a'] && left['b'] === right['b']
    })
    expect(same.length).toBeLessThan(RUNS / 4)
  })
})

describe('generateQuestion — 파라미터', () => {
  it('선언한 구간을 벗어나지 않는다', () => {
    for (const template of allFixtures) {
      for (const question of generateAll(template)) {
        for (const [key, range] of Object.entries(template.params)) {
          const value = question.params[key]
          expect(value, `${template.id}.${key}`).toBeDefined()
          expect(Number.isInteger(value)).toBe(true)
          expect(value as number).toBeGreaterThanOrEqual(range[0])
          expect(value as number).toBeLessThanOrEqual(range[1])
        }
      }
    }
  })

  it('구간의 경계값도 실제로 출제된다', () => {
    // 조건이 없는 템플릿이라 2와 9가 모두 나와야 한다
    const questions = Array.from({ length: 300 }, (_, i) =>
      generateQuestion(multiplicationChoice, i + 1),
    )
    const aValues = new Set(questions.map((q) => q.params['a']))
    const bValues = new Set(questions.map((q) => q.params['b']))
    for (const values of [aValues, bValues]) {
      expect(values.has(2)).toBe(true)
      expect(values.has(9)).toBe(true)
    }
  })

  it('valid 조건을 어기는 파라미터는 나오지 않는다', () => {
    for (const question of generateAll(additionWithCarry)) {
      const a = question.params['a'] as number
      const b = question.params['b'] as number
      expect((a % 10) + (b % 10), question.prompt).toBeGreaterThanOrEqual(10)
    }
    for (const question of generateAll(placeValue)) {
      const { h, t, o } = question.params as Record<string, number>
      expect(new Set([h, t, o]).size, question.prompt).toBe(3)
    }
    for (const question of generateAll(sortAscending)) {
      const { x, y, z } = question.params as Record<string, number>
      expect(new Set([x, y, z]).size, question.prompt).toBe(3)
    }
  })
})

describe('generateQuestion — 정답', () => {
  it('곱셈구구: 정답이 실제 곱이다', () => {
    for (const question of generateAll(multiplicationChoice)) {
      const a = question.params['a'] as number
      const b = question.params['b'] as number
      expect(question.answer, question.prompt).toBe(a * b)
      expect(question.prompt).toBe(`${a} × ${b} = ?`)
    }
  })

  it('□ 채우기: 문장에 적힌 곱과 정답이 맞아떨어진다', () => {
    for (const question of generateAll(multiplicationBlank)) {
      const a = question.params['a'] as number
      const answer = question.answer as number
      // 화면에 보이는 곱을 그대로 읽어서 검증한다
      const shown = Number(question.prompt.split('=')[1]?.trim())
      expect(a * answer, question.prompt).toBe(shown)
    }
  })

  it('받아올림 덧셈: 정답이 실제 합이다', () => {
    for (const question of generateAll(additionWithCarry)) {
      const a = question.params['a'] as number
      const b = question.params['b'] as number
      expect(question.answer, question.prompt).toBe(a + b)
    }
  })

  it('자릿값: 물어본 숫자의 자릿값이 정답이다', () => {
    for (const question of generateAll(placeValue)) {
      const { h, t, o, place } = question.params as Record<string, number>
      const number = (h as number) * 100 + (t as number) * 10 + (o as number)
      const digit = place === 1 ? h : t
      const expected = place === 1 ? (h as number) * 100 : (t as number) * 10
      expect(question.prompt).toBe(`${number}에서 ${josa(String(digit), '이/가')} 나타내는 값은?`)
      expect(question.answer, question.prompt).toBe(expected)
    }
  })

  it('순서 배열: 정답이 오름차순 배열이다', () => {
    for (const question of generateAll(sortAscending)) {
      const answer = question.answer as number[]
      expect(Array.isArray(answer)).toBe(true)
      expect(answer).toHaveLength(3)
      expect(answer).toEqual([...answer].sort((a, b) => a - b))
      const given = ['x', 'y', 'z'].map((key) => question.params[key] as number)
      expect([...answer].sort((a, b) => a - b)).toEqual(given.sort((a, b) => a - b))
    }
  })
})

describe('generateQuestion — 4지선다 보기', () => {
  const choiceFixtures = [multiplicationChoice, additionWithCarry, placeValue]

  it('보기가 4개이고 정답이 정확히 하나 들어 있다', () => {
    for (const template of choiceFixtures) {
      for (const question of generateAll(template)) {
        const choices = question.choices
        expect(choices, `${template.id} ${question.prompt}`).toBeDefined()
        expect(choices).toHaveLength(4)
        const matches = (choices ?? []).filter((c) => isSameAnswer(c, question.answer))
        expect(matches, question.prompt).toHaveLength(1)
      }
    }
  })

  it('보기끼리 겹치지 않는다', () => {
    for (const template of choiceFixtures) {
      for (const question of generateAll(template)) {
        const keys = (question.choices ?? []).map((c) => String(c))
        expect(new Set(keys).size, question.prompt).toBe(keys.length)
      }
    }
  })

  it('보기는 모두 0 이상의 정수다. 음수나 소수를 아이에게 보여주지 않는다', () => {
    for (const template of choiceFixtures) {
      for (const question of generateAll(template)) {
        for (const choice of question.choices ?? []) {
          expect(typeof choice, question.prompt).toBe('number')
          expect(Number.isInteger(choice)).toBe(true)
          expect(choice as number).toBeGreaterThanOrEqual(0)
        }
      }
    }
  })

  it('오답은 전부 설명 가능한 실수다. 무작위 값이 섞이지 않는다', () => {
    for (const question of generateAll(multiplicationChoice)) {
      const a = question.params['a'] as number
      const b = question.params['b'] as number
      const answer = a * b
      // 곱셈을 덧셈으로 / 구구단 한 칸 밀림 / 한 칸 세기 실수
      const explainable = new Set([a + b, a * (b + 1), a * (b - 1), answer - 1, answer + 1])
      for (const choice of question.choices ?? []) {
        if (isSameAnswer(choice, question.answer)) continue
        expect(explainable, `${question.prompt} 의 보기 ${String(choice)}`).toContain(choice)
      }
    }
  })

  it('구간 안의 어떤 조합에서도 보기 4개를 채운다', () => {
    // 특정 파라미터에서만 보기가 모자라 터지는 일이 없어야 한다.
    // 아이가 문제를 푸는 중에 화면이 죽는 것이 이 엔진에서 가장 나쁜 실패다.
    for (const template of choiceFixtures) {
      for (let seed = 1; seed <= 1500; seed += 1) {
        const question = generateQuestion(template, seed)
        expect(question.choices, `${template.id} seed=${seed}`).toHaveLength(4)
      }
    }
  })

  it('곱셈구구 64가지 조합을 모두 내도 보기가 무너지지 않는다', () => {
    // 2 × 2 는 곱과 합이 둘 다 4라서 오답 규칙 하나가 통째로 무효가 된다
    const combos = new Set<string>()
    for (let seed = 1; seed <= 1500; seed += 1) {
      const question = generateQuestion(multiplicationChoice, seed)
      combos.add(`${String(question.params['a'])}x${String(question.params['b'])}`)
      expect(question.choices).toHaveLength(4)
    }
    expect(combos.size).toBe(64)
  })

  it('보기 순서가 고정되어 있지 않다. 정답 자리를 외울 수 없다', () => {
    const positions = new Set(
      generateAll(multiplicationChoice).map((q) =>
        (q.choices ?? []).findIndex((c) => isSameAnswer(c, q.answer)),
      ),
    )
    expect(positions.size).toBeGreaterThan(2)
  })

  it('숫자패드 문제에는 보기를 만들지 않는다', () => {
    for (const question of generateAll(multiplicationBlank)) {
      expect(question.choices).toBeUndefined()
      expect('choices' in question).toBe(false)
    }
  })
})

describe('generateQuestion — 잘못 만든 템플릿을 잡아낸다', () => {
  it('4지선다인데 distractors 가 없으면 오류를 낸다', () => {
    const broken = defineTemplate({
      id: 'fx_broken_no_distractors',
      world: 3,
      level: 1,
      skill: 'multiplication_table',
      inputType: 'choice',
      params: { a: [2, 9] },
      render: (p) => `${p.a} × 2 = ?`,
      answer: (p) => p.a * 2,
      hint: () => '2단이야.',
    })
    expect(() => generateQuestion(broken, 1)).toThrow(/distractors/)
  })

  it('오답 규칙이 모자라면 무작위로 메우지 않고 오류를 낸다', () => {
    const broken = defineTemplate({
      id: 'fx_broken_thin_distractors',
      world: 3,
      level: 1,
      skill: 'multiplication_table',
      inputType: 'choice',
      params: { a: [2, 9] },
      render: (p) => `${p.a} × 2 = ?`,
      answer: (p) => p.a * 2,
      hint: () => '2단이야.',
      // 보기 4개에는 오답 3개가 필요한데 규칙이 하나뿐이다
      distractors: [{ kind: 'off_by_one', wrong: (_p, answer) => (answer as number) + 1 }],
    })
    expect(() => generateQuestion(broken, 1)).toThrow(/오답 보기가 3개 필요한데 1개/)
  })

  it('valid 를 통과할 수 없는 구간이면 오류를 낸다', () => {
    const impossible = defineTemplate({
      id: 'fx_broken_impossible',
      world: 2,
      level: 1,
      skill: 'addition_no_carry',
      inputType: 'numpad',
      params: { a: [2, 9], b: [2, 9] },
      valid: (p) => p.a > 100 && p.b > 100,
      render: (p) => `${p.a} + ${p.b} = ?`,
      answer: (p) => p.a + p.b,
      hint: () => '더해 볼까?',
    })
    expect(() => generateQuestion(impossible, 1)).toThrow(/valid/)
  })
})

describe('generateQuestion — 중복 회피', () => {
  it('최근에 낸 문제는 피한다', () => {
    const first = generateQuestion(multiplicationChoice, 3)
    const second = generateQuestion(multiplicationChoice, 3, { recent: [first.id] })
    expect(second.id).not.toBe(first.id)
  })

  it('스테이지 8문제를 이어 뽑으면 파라미터가 겹치지 않는다', () => {
    const asked: string[] = []
    for (let i = 0; i < 8; i += 1) {
      const question = generateQuestion(multiplicationChoice, 100 + i, { recent: asked })
      asked.push(question.id)
    }
    expect(new Set(asked).size).toBe(8)
  })

  it('피할 수 없으면 문제를 못 내는 대신 반복을 허용한다', () => {
    // 조합이 두 가지뿐인데 둘 다 이미 냈다
    const tiny = defineTemplate({
      id: 'fx_tiny',
      world: 3,
      level: 1,
      skill: 'multiplication_table',
      inputType: 'numpad',
      params: { a: [2, 3] },
      render: (p) => `${p.a} × 2 = ?`,
      answer: (p) => p.a * 2,
      hint: () => '2단이야.',
    })
    const all = new Set<string>()
    for (let seed = 1; seed <= 40; seed += 1) all.add(generateQuestion(tiny, seed).id)
    expect(all.size).toBe(2)

    const question = generateQuestion(tiny, 1, { recent: [...all] })
    expect(all.has(question.id)).toBe(true)
    expect(question.answer).toBe((question.params['a'] as number) * 2)
  })
})

describe('generateQuestion — 인스턴스 id', () => {
  it('설계서의 wrongQueue 모양을 따른다', () => {
    const question = generateQuestion(multiplicationChoice, 1)
    expect(question.id).toMatch(/^fx_w3_lv1_table#\d{4}$/)
  })

  it('같은 파라미터면 같은 id, 다른 파라미터면 다른 id 다', () => {
    const byParams = new Map<string, string>()
    for (let seed = 1; seed <= 300; seed += 1) {
      const question = generateQuestion(multiplicationChoice, seed)
      const key = `${String(question.params['a'])},${String(question.params['b'])}`
      const known = byParams.get(key)
      if (known === undefined) {
        byParams.set(key, question.id)
      } else {
        expect(question.id).toBe(known)
      }
    }
    // 64가지 조합이 서로 다른 id 를 가져야 오답 큐가 제 문제를 가리킨다
    expect(new Set(byParams.values()).size).toBe(byParams.size)
  })
})

describe('checkAnswer', () => {
  it('맞으면 correct 이고 힌트를 띄우지 않는다', () => {
    const question = generateQuestion(multiplicationChoice, 11)
    const result = checkAnswer(question, question.answer)
    expect(result.correct).toBe(true)
    expect(result.hint).toBe('')
    expect(result.skill).toBe('multiplication_table')
  })

  it('틀리면 정답과 한 줄 이유를 함께 준다', () => {
    const question = generateQuestion(additionWithCarry, 11)
    const result = checkAnswer(question, 0)
    expect(result.correct).toBe(false)
    expect(result.expected).toBe(question.answer)
    expect(result.hint.length).toBeGreaterThan(0)
  })

  it('숫자패드로 들어온 문자열을 수로 본다', () => {
    const question = generateQuestion(multiplicationBlank, 11)
    expect(checkAnswer(question, String(question.answer)).correct).toBe(true)
    expect(checkAnswer(question, ` ${String(question.answer)} `).correct).toBe(true)
  })

  it('앞의 0을 붙여 넣어도 맞는 것으로 본다', () => {
    const question = generateQuestion(multiplicationBlank, 11)
    expect(checkAnswer(question, `0${String(question.answer)}`).correct).toBe(true)
  })

  it('순서 배열은 순서까지 같아야 맞다', () => {
    const question = generateQuestion(sortAscending, 11)
    const answer = question.answer as number[]
    expect(checkAnswer(question, answer).correct).toBe(true)
    expect(checkAnswer(question, [...answer].reverse()).correct).toBe(false)
  })

  it('모든 템플릿에서 정답을 그대로 넣으면 맞는다', () => {
    for (const template of allFixtures) {
      for (const question of generateAll(template)) {
        expect(checkAnswer(question, question.answer).correct, question.prompt).toBe(true)
      }
    }
  })

  it('모든 4지선다에서 오답 보기는 전부 틀린 것으로 채점된다', () => {
    for (const template of [multiplicationChoice, additionWithCarry, placeValue]) {
      for (const question of generateAll(template)) {
        for (const choice of question.choices ?? []) {
          const expected = isSameAnswer(choice, question.answer)
          expect(checkAnswer(question, choice).correct, question.prompt).toBe(expected)
        }
      }
    }
  })
})

describe('isSameAnswer', () => {
  it('배열과 스칼라는 서로 같지 않다', () => {
    expect(isSameAnswer(3, [3] as AnswerValue)).toBe(false)
  })

  it('길이가 다른 배열은 같지 않다', () => {
    expect(isSameAnswer([1, 2], [1, 2, 3])).toBe(false)
  })

  it('부등호 같은 기호도 비교한다', () => {
    expect(isSameAnswer('>', '>')).toBe(true)
    expect(isSameAnswer('>', '<')).toBe(false)
  })
})

describe('모든 템플릿 공통', () => {
  it('문제 문장과 힌트가 비어 있지 않다', () => {
    for (const template of allFixtures) {
      for (const question of generateAll(template)) {
        expect(question.prompt.trim().length, template.id).toBeGreaterThan(0)
        expect(question.hint.trim().length, template.id).toBeGreaterThan(0)
      }
    }
  })

  it('템플릿이 선언한 메타데이터를 그대로 물려받는다', () => {
    for (const template of allFixtures) {
      const question = generateQuestion(template, 1)
      expect(question.templateId).toBe(template.id)
      expect(question.world).toBe(template.world)
      expect(question.level).toBe(template.level)
      expect(question.skill).toBe(template.skill)
      expect(question.inputType).toBe(template.inputType)
    }
  })
})
