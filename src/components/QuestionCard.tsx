type QuestionCardProps = {
  prompt: string
}

/**
 * 화면 맨 위의 문제 카드.
 *
 * 문제는 위, 입력은 아래에 둔다. 손이 문제를 가리면 안 된다. (CLAUDE.md UI 규격)
 *
 * 글자 크기는 줄마다 따로 정한다.
 * 수와 기호로만 된 줄은 36px, 읽는 문장은 22px 다.
 * 문장까지 36px 로 키우면 한 줄이 화면을 넘어가고, 식을 22px 로 줄이면
 * "숫자는 32px 이상" 을 어긴다. 둘 다 지키려면 줄을 나눠 봐야 한다.
 */

/** 수·기호로만 이루어진 줄인지. `37 + 45 = ?`, `4213 □ 4231`, `230, 240, □, 260` */
const EXPRESSION = /^[\d\s+\-−×÷=<>□?.,()]+$/

/**
 * 식은 크게 쓰되, 수가 길게 늘어선 줄은 한 단계씩 줄인다.
 * 360px 폰에서 뛰어 세기 다섯 칸을 36px 로 쓰면 줄이 넘어가고 화면이 밀린다.
 */
function sizeOf(line: string): string {
  if (!EXPRESSION.test(line)) return 'text-question'
  if (line.length <= 14) return 'text-number'
  if (line.length <= 20) return 'text-number-tight'
  return 'text-question'
}

export function QuestionCard({ prompt }: QuestionCardProps) {
  const lines = prompt.split('\n')

  return (
    <div
      className="
        flex w-full flex-1 flex-col items-center justify-center gap-1.5 rounded-3xl border-3
        border-outline bg-paper px-5 py-4 shadow-hard
      "
    >
      {lines.map((line, index) => (
        <p
          key={index}
          className={`
            break-keep text-center font-bold text-outline
            ${sizeOf(line)}
          `}
        >
          {line}
        </p>
      ))}
    </div>
  )
}
