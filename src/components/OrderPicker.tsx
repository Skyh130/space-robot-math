import { useState } from 'react'

import type { AnswerScalar } from '../engine'

type OrderPickerProps = {
  items: readonly AnswerScalar[]
  onSubmit: (order: readonly AnswerScalar[]) => void
  disabled?: boolean
  /**
   * 빈칸 위에 붙는 방향 안내. ['작은 수', '큰 수'] 처럼 양끝을 적는다.
   * 무엇을 어느 쪽부터 놓으라는 건지 글로만 말하면 8살은 한 번에 못 읽는다.
   */
  ends?: readonly [string, string]
}

/**
 * 순서 배열 입력. W1 보스의 좌표 정렬에 쓴다.
 *
 * 끌어서 옮기지 않고 차례로 누른다. 모바일에서 정밀 드래그는 실패율이 높아
 * 드래그는 W4·W5·W6 세 곳으로 제한한다. (설계서 4장)
 * 잘못 눌러도 되돌리기가 있으니 벌이 없다.
 */
export function OrderPicker({ items, onSubmit, disabled = false, ends }: OrderPickerProps) {
  const [picked, setPicked] = useState<number[]>([])

  const remaining = items.map((_, index) => index).filter((index) => !picked.includes(index))
  const done = remaining.length === 0

  const pick = (index: number) => setPicked([...picked, index])
  const undo = () => setPicked(picked.slice(0, -1))

  return (
    <div className="flex w-full flex-col gap-3">
      {ends === undefined ? null : (
        <div className="flex items-center gap-2 px-1">
          <span className="text-sm font-bold text-paper/70">{ends[0]}</span>
          <div className="h-0.5 flex-1 rounded bg-paper/30" />
          <ArrowRight />
          <span className="text-sm font-bold text-paper/70">{ends[1]}</span>
        </div>
      )}

      <PickedRow items={items} picked={picked} />

      <div className="flex flex-wrap justify-center gap-2.5">
        {items.map((item, index) =>
          picked.includes(index) ? null : (
            <button
              key={`${String(item)}-${String(index)}`}
              type="button"
              onClick={() => pick(index)}
              disabled={disabled}
              className="
                min-h-key min-w-[88px] rounded-2xl border-3 border-outline bg-paper px-4
                text-number font-bold text-outline shadow-hard transition-transform
                active:translate-y-1 active:shadow-none
              "
            >
              {String(item)}
            </button>
          ),
        )}
      </div>

      <div className="flex gap-2.5">
        <button
          type="button"
          onClick={undo}
          disabled={disabled || picked.length === 0}
          className="
            min-h-touch flex-1 rounded-2xl border-3 border-outline bg-mint px-4 py-3
            font-title text-xl text-outline shadow-hard transition-transform
            active:translate-y-1 active:shadow-none
            disabled:translate-y-1 disabled:border-outline/40 disabled:bg-panel
            disabled:text-paper/40 disabled:shadow-none
          "
        >
          되돌리기
        </button>
        <button
          type="button"
          onClick={() => onSubmit(picked.map((index) => items[index] as AnswerScalar))}
          disabled={disabled || !done}
          className="
            min-h-touch flex-1 rounded-2xl border-3 border-outline bg-energy px-4 py-3
            font-title text-xl text-outline shadow-hard transition-transform
            active:translate-y-1 active:shadow-none
            disabled:translate-y-1 disabled:border-outline/40 disabled:bg-panel
            disabled:text-paper/40 disabled:shadow-none
          "
        >
          확인
        </button>
      </div>
    </div>
  )
}

function ArrowRight() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden="true">
      <path
        d="M2 8h11M9 4l4 4-4 4"
        fill="none"
        stroke="#FFF6E5"
        strokeOpacity={0.5}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** 지금까지 고른 순서. 빈 자리는 점선으로 남겨 몇 개를 더 눌러야 하는지 보인다. */
function PickedRow({
  items,
  picked,
}: {
  items: readonly AnswerScalar[]
  picked: readonly number[]
}) {
  return (
    <div className="flex min-h-16 items-center justify-center gap-2 rounded-2xl border-3 border-outline bg-panel px-3 py-2">
      {items.map((_, slot) => {
        const index = picked[slot]
        const value = index === undefined ? null : items[index]
        return (
          <div
            key={slot}
            className={`
              flex h-11 flex-1 items-center justify-center rounded-xl border-3 text-xl font-bold
              ${value === null ? 'border-dashed border-paper/40 text-transparent' : 'border-outline bg-paper text-outline'}
            `}
          >
            {value === null ? '·' : String(value)}
          </div>
        )
      })}
    </div>
  )
}
