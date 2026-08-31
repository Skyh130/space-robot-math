import type { AnswerValue } from '../engine'

type ChoiceGridProps = {
  choices: readonly AnswerValue[]
  onPick: (choice: AnswerValue) => void
  disabled?: boolean
}

/**
 * 4지선다 보기.
 *
 * 보기는 2×2로 놓는다. 한 줄로 세우면 숫자가 작아지고, 세로로 넷을 쌓으면
 * 화면이 넘친다. 정답 자리는 매번 섞이므로 위치를 외울 수 없다. (generator)
 */
export function ChoiceGrid({ choices, onPick, disabled = false }: ChoiceGridProps) {
  return (
    <div className="grid w-full grid-cols-2 gap-3">
      {choices.map((choice) => (
        <button
          key={String(choice)}
          type="button"
          onClick={() => onPick(choice)}
          disabled={disabled}
          className="
            flex min-h-[72px] items-center justify-center rounded-2xl border-3
            border-outline bg-paper px-3 text-number font-bold text-outline
            shadow-hard transition-transform
            active:translate-y-1 active:shadow-none
            disabled:translate-y-1 disabled:border-outline/40 disabled:bg-panel
            disabled:text-paper/40 disabled:shadow-none
          "
        >
          {String(choice)}
        </button>
      ))}
    </div>
  )
}
