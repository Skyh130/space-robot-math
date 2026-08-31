import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { world1Templates } from '../data/world1'
import { templatesFor, worldById } from '../data/worlds'
import { buildStage, stageSeed, type Question } from '../engine'
import { StageScreen, type StageOutcome } from './StageScreen'

const key = (name: string) => screen.getByRole('button', { name })

/** 숫자패드로 답을 넣는다. */
async function typeAnswer(user: ReturnType<typeof userEvent.setup>, value: string) {
  for (const digit of value) await user.click(key(digit))
  await user.click(key('확인'))
}

/** 지금 화면의 문제를 무조건 맞힌다. 입력 방식에 맞춰 알아서 누른다. */
async function solve(user: ReturnType<typeof userEvent.setup>, question: Question) {
  if (question.inputType === 'choice') {
    await user.click(key(String(question.answer)))
    return
  }
  if (question.inputType === 'order') {
    for (const value of question.answer as number[]) {
      await user.click(key(String(value)))
    }
    await user.click(key('확인'))
    return
  }
  await typeAnswer(user, String(question.answer))
}

function makeStage(count = 3): Question[] {
  return buildStage([world1Templates[1] as never], 7, { count })
}

describe('StageScreen — 스테이지 진행', () => {
  it('첫 문제부터 보여준다', () => {
    const questions = makeStage()
    render(<StageScreen questions={questions} label="숫자 소행성대 · 2단계" onFinish={vi.fn()} />)
    expect(screen.getByText(questions[0]?.prompt ?? '')).toBeInTheDocument()
    expect(screen.getByText('숫자 소행성대 · 2단계')).toBeInTheDocument()
  })

  it('남은 문제 수를 점으로 보여준다. 시간은 보여주지 않는다', () => {
    render(<StageScreen questions={makeStage(8)} label="x" onFinish={vi.fn()} />)
    expect(screen.getByLabelText('8문제 중 1번째')).toBeInTheDocument()
  })

  it('다 맞히면 정답 수를 세어 끝난다', async () => {
    const user = userEvent.setup()
    const questions = makeStage(3)
    const onFinish = vi.fn()
    render(<StageScreen questions={questions} label="x" onFinish={onFinish} />)

    for (const question of questions) {
      await solve(user, question)
      await user.click(key('다음'))
    }

    expect(onFinish).toHaveBeenCalledOnce()
    const outcome = onFinish.mock.calls[0]?.[0] as StageOutcome
    expect(outcome.correct).toBe(3)
    expect(outcome.total).toBe(3)
    expect(outcome.missed).toHaveLength(0)
  })

  it('첫 시도에 틀리면 다시 맞혀도 점수로 세지 않는다', async () => {
    const user = userEvent.setup()
    const questions = makeStage(2)
    const onFinish = vi.fn()
    render(<StageScreen questions={questions} label="x" onFinish={onFinish} />)

    // 첫 문제는 일부러 틀린 보기를 누른다
    const first = questions[0] as Question
    const wrong = (first.choices ?? []).find((c) => String(c) !== String(first.answer))
    await user.click(key(String(wrong)))
    expect(screen.getByText('아까워! 다시 볼까?')).toBeInTheDocument()

    await user.click(key('다시 하기'))
    await solve(user, first)
    await user.click(key('다음'))

    await solve(user, questions[1] as Question)
    await user.click(key('다음'))

    const outcome = onFinish.mock.calls[0]?.[0] as StageOutcome
    expect(outcome.correct).toBe(1)
    expect(outcome.missed).toHaveLength(1)
    expect(outcome.missed[0]?.id).toBe(first.id)
  })

  it('오답이면 그림 힌트가 함께 나온다', async () => {
    const user = userEvent.setup()
    const questions = makeStage(1)
    render(<StageScreen questions={questions} label="x" onFinish={vi.fn()} />)

    const first = questions[0] as Question
    const wrong = (first.choices ?? []).find((c) => String(c) !== String(first.answer))
    await user.click(key(String(wrong)))

    expect(screen.getByText(first.hint)).toBeInTheDocument()
    // 자릿값 표가 뜬다
    expect(screen.getByText('백')).toBeInTheDocument()
  })

  it('영역별 정답 기록을 남긴다', async () => {
    const user = userEvent.setup()
    const questions = makeStage(2)
    const onFinish = vi.fn()
    render(<StageScreen questions={questions} label="x" onFinish={onFinish} />)

    for (const question of questions) {
      await solve(user, question)
      await user.click(key('다음'))
    }

    const outcome = onFinish.mock.calls[0]?.[0] as StageOutcome
    expect(outcome.skillLog).toHaveLength(2)
    expect(outcome.skillLog[0]?.skill).toBe('place_value')
  })
})

describe('StageScreen — 입력 방식', () => {
  it('순서 배열 문제는 눌러서 차례를 만든다', async () => {
    const user = userEvent.setup()
    const world = worldById(1)
    const questions = buildStage(templatesFor(world, 'boss'), stageSeed(1, 'boss', 0), { count: 1 })
    const onFinish = vi.fn()
    render(<StageScreen questions={questions} label="보스" onFinish={onFinish} />)

    const question = questions[0] as Question
    const answer = question.answer as number[]

    // 다 고르기 전에는 확인을 누를 수 없다
    expect(key('확인')).toBeDisabled()

    for (const value of answer) await user.click(key(String(value)))
    await user.click(key('확인'))
    expect(screen.getByText('잘했어!')).toBeInTheDocument()
  })

  it('순서를 잘못 골라도 되돌리기로 고칠 수 있다', async () => {
    const user = userEvent.setup()
    const world = worldById(1)
    const questions = buildStage(templatesFor(world, 'boss'), stageSeed(1, 'boss', 3), { count: 1 })
    render(<StageScreen questions={questions} label="보스" onFinish={vi.fn()} />)

    const answer = (questions[0] as Question).answer as number[]
    const last = answer[answer.length - 1] as number

    await user.click(key(String(last)))
    await user.click(key('되돌리기'))
    for (const value of answer) await user.click(key(String(value)))
    await user.click(key('확인'))
    expect(screen.getByText('잘했어!')).toBeInTheDocument()
  })

  it('숫자 입력 문제는 숫자패드로 푼다', async () => {
    const user = userEvent.setup()
    const world = worldById(1)
    const questions = buildStage(templatesFor(world, 3), stageSeed(1, 3, 0), { count: 1 })
    render(<StageScreen questions={questions} label="x" onFinish={vi.fn()} />)

    await typeAnswer(user, String((questions[0] as Question).answer))
    expect(screen.getByText('잘했어!')).toBeInTheDocument()
  })
})

describe('StageScreen — 같은 세션 오답 재출제', () => {
  it('틀리면 3문제 뒤 문제가 그 템플릿으로 바뀐다', async () => {
    const user = userEvent.setup()
    const templates = [world1Templates[1] as never]
    const questions = buildStage(templates, 7)
    const before = questions.map((q) => q.prompt)

    render(
      <StageScreen questions={questions} templates={templates} label="x" onFinish={vi.fn()} />,
    )

    const first = questions[0] as Question
    const wrong = (first.choices ?? []).find((c) => String(c) !== String(first.answer))
    await user.click(key(String(wrong)))
    await user.click(key('다시 하기'))
    await solve(user, first)
    await user.click(key('다음'))

    // 1번, 2번을 지나 3번(0부터 세어 3)이 바뀌어 있어야 한다
    await solve(user, questions[1] as Question)
    await user.click(key('다음'))
    await solve(user, questions[2] as Question)
    await user.click(key('다음'))

    expect(screen.queryByText(before[3] ?? '')).not.toBeInTheDocument()
  })

  it('templates 를 주지 않으면 재출제하지 않는다', async () => {
    const user = userEvent.setup()
    const questions = buildStage([world1Templates[1] as never], 7)

    render(<StageScreen questions={questions} label="x" onFinish={vi.fn()} />)

    const first = questions[0] as Question
    const wrong = (first.choices ?? []).find((c) => String(c) !== String(first.answer))
    await user.click(key(String(wrong)))
    await user.click(key('다시 하기'))
    await solve(user, first)
    await user.click(key('다음'))
    await solve(user, questions[1] as Question)
    await user.click(key('다음'))
    await solve(user, questions[2] as Question)
    await user.click(key('다음'))

    expect(screen.getByText(questions[3]?.prompt ?? '')).toBeInTheDocument()
  })
})

describe('StageScreen — 타이머', () => {
  it('시간 제한이 없으면 타이머를 아예 그리지 않는다', () => {
    render(<StageScreen questions={makeStage(3)} label="x" onFinish={vi.fn()} />)
    expect(screen.queryByLabelText(/남은 시간/)).not.toBeInTheDocument()
  })

  it('시간 제한이 있으면 남은 시간을 보여준다', () => {
    render(
      <StageScreen questions={makeStage(3)} label="x" onFinish={vi.fn()} timeLimitSeconds={60} />,
    )
    expect(screen.getByLabelText('남은 시간 60초')).toBeInTheDocument()
  })

  it('시간을 재는 판에서는 다시 하기 없이 저절로 넘어간다', async () => {
    const user = userEvent.setup()
    const questions = makeStage(3)
    render(
      <StageScreen questions={questions} label="x" onFinish={vi.fn()} timeLimitSeconds={60} />,
    )

    const first = questions[0] as Question
    const wrong = (first.choices ?? []).find((c) => String(c) !== String(first.answer))
    await user.click(key(String(wrong)))

    // 정답만 스치듯 보여준다. 손을 멈추게 하는 버튼이 없다.
    expect(screen.queryByRole('button', { name: '다시 하기' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '다음' })).not.toBeInTheDocument()

    await waitFor(
      () => expect(screen.getByText(questions[1]?.prompt ?? '')).toBeInTheDocument(),
      { timeout: 4000 },
    )
  }, 10000)

  it('시간이 다 되면 그때까지의 점수로 끝난다', async () => {
    const onFinish = vi.fn()
    render(
      <StageScreen questions={makeStage(8)} label="x" onFinish={onFinish} timeLimitSeconds={0.4} />,
    )

    await waitFor(() => expect(onFinish).toHaveBeenCalled(), { timeout: 4000 })
    const outcome = onFinish.mock.calls[0]?.[0] as StageOutcome
    expect(outcome.correct).toBe(0)
    expect(outcome.total).toBe(8)
  }, 10000)

  it('시간이 다 돼도 끝나는 것은 한 번뿐이다', async () => {
    const onFinish = vi.fn()
    render(
      <StageScreen questions={makeStage(8)} label="x" onFinish={onFinish} timeLimitSeconds={0.4} />,
    )

    await waitFor(() => expect(onFinish).toHaveBeenCalled(), { timeout: 4000 })
    await new Promise((resolve) => setTimeout(resolve, 700))
    expect(onFinish).toHaveBeenCalledOnce()
  }, 10000)
})
