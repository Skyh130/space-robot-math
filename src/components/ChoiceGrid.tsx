import type { AnswerValue } from '../engine'

type ChoiceGridProps = {
  choices: readonly AnswerValue[]
  onPick: (choice: AnswerValue) => void
  /**
   * 그림이 붙은 문제에서 쓰는 좁은 모드.
   *
   * 시계나 막대 그림이 자리를 먹으므로 보기 칸을 낮추고 글자를 한 단계 줄인다.
   * 그림이 붙는 문제의 보기는 '3시 25분', '육각형', '3/4' 처럼 모두 글이라
   * "숫자는 32px 이상" 규격에 걸리지 않는다. 맨숫자 보기는 그림이 없다.
   */
  compact?: boolean
  disabled?: boolean
}

/**
 * 4지선다 보기.
 *
 * 보기는 2×2로 놓는다. 한 줄로 세우면 숫자가 작아지고, 세로로 넷을 쌓으면
 * 화면이 넘친다. 정답 자리는 매번 섞이므로 위치를 외울 수 없다. (generator)
 */
export function ChoiceGrid({ choices, onPick, compact = false, disabled = false }: ChoiceGridProps) {
  return (
    <div className={`grid w-full grid-cols-2 ${compact ? 'gap-2' : 'gap-3'}`}>
      {choices.map((choice) => (
        <button
          key={String(choice)}
          type="button"
          onClick={() => onPick(choice)}
          disabled={disabled}
          className={`
            flex items-center justify-center rounded-2xl border-3
            border-outline bg-paper px-3 font-bold text-outline
            shadow-hard transition-transform
            ${compact ? 'min-h-[56px] text-number-tight' : 'min-h-[72px] text-number'}
            active:translate-y-1 active:shadow-none
            disabled:translate-y-1 disabled:border-outline/40 disabled:bg-panel
            disabled:text-paper/40 disabled:shadow-none
          `}
        >
          {String(choice)}
        </button>
      ))}
    </div>
  )
}
