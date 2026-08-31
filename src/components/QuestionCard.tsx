type QuestionCardProps = {
  prompt: string
}

/**
 * 화면 맨 위의 문제 카드.
 *
 * 문제는 위, 입력은 아래에 둔다. 손이 문제를 가리면 안 된다. (CLAUDE.md UI 규격)
 * 계산식처럼 짧은 문제는 크게, 문장제처럼 긴 문제는 조금 작게 보여준다.
 * 어느 쪽이든 20px 아래로는 내려가지 않는다.
 */
const LONG_PROMPT = 22

export function QuestionCard({ prompt }: QuestionCardProps) {
  const isLong = prompt.length > LONG_PROMPT

  return (
    <div
      className="
        flex w-full flex-1 items-center justify-center rounded-3xl border-3
        border-outline bg-paper px-5 py-6 shadow-hard
      "
    >
      <p
        className={`
          break-keep text-center font-bold text-outline
          ${isLong ? 'text-question' : 'text-number'}
        `}
      >
        {prompt}
      </p>
    </div>
  )
}
