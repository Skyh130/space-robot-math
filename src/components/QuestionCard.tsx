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
/**
 * 세로가 아주 짧은 기기에서는 한 단계씩 줄인다.
 * 문장은 20px 아래로 내려가지 않는다. 수는 30px 까지 양보하는데,
 * 그러지 않으면 숫자패드의 '확인' 버튼이 화면 밖으로 나간다.
 */
function sizeOf(line: string): string {
  if (!EXPRESSION.test(line)) return 'text-question short:text-[1.25rem]'
  if (line.length <= 14) return 'text-number short:text-[1.875rem]'
  if (line.length <= 20) return 'text-number-tight short:text-[1.5rem]'
  return 'text-question short:text-[1.25rem]'
}

export function QuestionCard({ prompt }: QuestionCardProps) {
  const lines = prompt.split('\n')

  return (
    <div
      /*
        일부러 min-h-0 도 overflow 도 걸지 않는다.
        카드가 제 안에서 스크롤하면 문제 윗줄과 아랫줄이 잘려 나가는데,
        그러면 화면 검사는 통과하면서 아이는 문제를 못 읽는다.
        자리가 모자라면 차라리 화면이 넘쳐서 검사에 걸리는 편이 낫다.
      */
      className="
        flex w-full flex-1 flex-col items-center justify-center gap-1.5
        rounded-3xl border-3 border-outline bg-paper px-5 py-4 shadow-hard
        short:gap-1 short:px-3 short:py-2
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
