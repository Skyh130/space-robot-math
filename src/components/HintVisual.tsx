import type { HintVisual } from '../engine'

/**
 * 그림 힌트를 그린다.
 *
 * 템플릿은 "무엇을 그릴지"만 데이터로 적고, 그리는 일은 전부 여기서 한다.
 * data/ 아래에 JSX 가 섞이면 문제 은행을 테스트하기 어려워진다.
 */
export function HintVisualView({ visual }: { visual: HintVisual }) {
  switch (visual.kind) {
    case 'placeValue':
      return <PlaceValueChart value={visual.value} {...(visual.highlight === undefined ? {} : { highlight: visual.highlight })} />
    case 'placeValueCompare':
      return <PlaceValueCompare left={visual.left} right={visual.right} />
    case 'numberLine':
      return <NumberLine values={visual.values} {...(visual.highlight === undefined ? {} : { highlight: visual.highlight })} />
    case 'dotGroups':
      return <DotGroups step={visual.step} times={visual.times} />
    case 'columnMath':
      return <ColumnMath left={visual.left} right={visual.right} operation={visual.operation} />
  }
}

/**
 * 세로셈 그림.
 *
 * 자리를 맞춰 세워 놓고, 받아올림 1이 어느 자리 위로 올라가는지 / 어느 자리에서
 * 10을 빌려 오는지를 표시한다. 표시는 왼쪽부터 차례로 나타난다.
 * prefers-reduced-motion 을 켠 기기에서는 애니메이션 없이 바로 보인다.
 */
function ColumnMath({
  left,
  right,
  operation,
}: {
  left: number
  right: number
  operation: 'add' | 'subtract'
}) {
  const width = Math.max(String(left).length, String(right).length) + (operation === 'add' ? 1 : 0)
  const answer = operation === 'add' ? left + right : left - right

  const topDigits = pad(left, width)
  const bottomDigits = pad(right, width)
  const answerDigits = pad(answer, width)
  const marks = operation === 'add' ? carryMarks(left, right, width) : borrowMarks(left, right, width)

  return (
    <div className="flex justify-center">
      <div className="inline-flex flex-col items-end gap-0.5 rounded-xl border-3 border-outline bg-paper px-3 py-2">
        <Row cells={marks} tone="mark" />
        <Row cells={topDigits} tone="normal" />
        <Row cells={bottomDigits} tone="normal" sign={operation === 'add' ? '+' : '−'} />
        <div className="my-0.5 h-[3px] w-full rounded bg-outline" />
        <Row cells={answerDigits} tone="answer" />
      </div>
    </div>
  )
}

function Row({
  cells,
  tone,
  sign,
}: {
  cells: readonly string[]
  tone: 'normal' | 'mark' | 'answer'
  sign?: string
}) {
  const color =
    tone === 'mark' ? 'text-coral' : tone === 'answer' ? 'text-outline' : 'text-outline/80'
  const size = tone === 'mark' ? 'text-sm h-5' : 'text-2xl h-8'

  return (
    <div className="flex items-center">
      <span className={`w-5 text-right text-2xl font-bold text-outline/80`}>{sign ?? ''}</span>
      {cells.map((cell, index) => (
        <span
          key={index}
          className={`w-7 text-center font-bold tabular-nums ${size} ${color} ${
            tone === 'mark' && cell !== '' ? 'animate-carry' : ''
          }`}
          style={tone === 'mark' && cell !== '' ? { animationDelay: `${(cells.length - index) * 0.25}s` } : undefined}
        >
          {cell}
        </span>
      ))}
    </div>
  )
}

function pad(value: number, width: number): string[] {
  return String(value).padStart(width, ' ').split('')
}

/** 받아올림 1이 붙는 자리. 자리마다 왼쪽 칸 위에 1을 적는다. */
function carryMarks(a: number, b: number, width: number): string[] {
  const marks = Array.from({ length: width }, () => '')
  let carry = 0
  for (let column = 0; column < width; column += 1) {
    const sum = digitAt(a, column) + digitAt(b, column) + carry
    carry = sum >= 10 ? 1 : 0
    // 올라간 1은 한 자리 왼쪽 위에 적힌다
    const slot = width - 1 - (column + 1)
    if (carry === 1 && slot >= 0) marks[slot] = '1'
  }
  return marks
}

/** 10을 빌려 오는 자리에 점을 찍는다. */
function borrowMarks(a: number, b: number, width: number): string[] {
  const marks = Array.from({ length: width }, () => '')
  let borrow = 0
  for (let column = 0; column < width; column += 1) {
    const top = digitAt(a, column) - borrow
    const bottom = digitAt(b, column)
    if (top < bottom) {
      borrow = 1
      const slot = width - 1 - (column + 1)
      if (slot >= 0) marks[slot] = '•'
    } else {
      borrow = 0
    }
  }
  return marks
}

function digitAt(value: number, column: number): number {
  return Math.floor(value / 10 ** column) % 10
}

const PLACE_LABELS = ['천', '백', '십', '일'] as const

/** 자릿값 표. 숫자를 자리마다 떼어 놓으면 "7이 나타내는 값"이 눈에 보인다. */
function PlaceValueChart({ value, highlight }: { value: number; highlight?: 0 | 1 | 2 | 3 }) {
  const digits = String(value).padStart(4, ' ').split('')
  // highlight 는 일의 자리가 0. 표는 천의 자리부터 그리므로 뒤집는다.
  const highlightColumn = highlight === undefined ? -1 : 3 - highlight

  return (
    <div className="flex justify-center gap-1.5">
      {digits.map((digit, column) => {
        if (digit === ' ') return null
        const isTarget = column === highlightColumn
        return (
          <div key={column} className="flex w-14 flex-col items-center gap-1">
            <span className="text-sm font-bold text-outline/60">{PLACE_LABELS[column]}</span>
            <div
              className={`
                flex h-12 w-full items-center justify-center rounded-xl border-3 border-outline
                text-2xl font-bold
                ${isTarget ? 'bg-energy text-outline' : 'bg-paper text-outline/70'}
              `}
            >
              {digit}
            </div>
            {isTarget ? (
              <span className="text-sm font-bold text-coral">
                {Number(digit) * 10 ** (3 - column)}
              </span>
            ) : (
              <span className="text-sm text-transparent">·</span>
            )}
          </div>
        )
      })}
    </div>
  )
}

/** 두 수를 자리마다 맞춰 놓고 위에서부터 비교한다. */
function PlaceValueCompare({ left, right }: { left: number; right: number }) {
  const width = Math.max(String(left).length, String(right).length)
  const leftDigits = String(left).padStart(width, ' ').split('')
  const rightDigits = String(right).padStart(width, ' ').split('')
  // 처음으로 달라지는 자리가 대소를 가른다
  const decidingColumn = leftDigits.findIndex((digit, index) => digit !== rightDigits[index])

  return (
    <div className="flex flex-col items-center gap-1">
      {[leftDigits, rightDigits].map((digits, row) => (
        <div key={row} className="flex gap-1.5">
          {digits.map((digit, column) => (
            <div
              key={column}
              className={`
                flex h-10 w-10 items-center justify-center rounded-lg border-3 border-outline
                text-xl font-bold
                ${column === decidingColumn ? 'bg-energy text-outline' : 'bg-paper text-outline/70'}
              `}
            >
              {digit}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

/** 수직선. 늘어놓은 수 중 한 칸을 강조한다. */
function NumberLine({ values, highlight }: { values: readonly number[]; highlight?: number }) {
  return (
    <div className="flex items-center justify-center gap-1">
      {values.map((value, index) => (
        <div key={index} className="flex items-center gap-1">
          {index > 0 ? <span className="text-outline/40">›</span> : null}
          <div
            className={`
              flex h-11 min-w-[54px] items-center justify-center rounded-xl border-3
              border-outline px-1.5 text-base font-bold
              ${value === highlight ? 'bg-energy text-outline' : 'bg-paper text-outline/70'}
            `}
          >
            {value}
          </div>
        </div>
      ))}
    </div>
  )
}

/** ○ 묶음. 4씩 7묶음이면 4, 8, 12 … 로 세어 가는 과정이 보인다. */
function DotGroups({ step, times }: { step: number; times: number }) {
  const columns = Math.min(step, 3)
  const rows = Math.ceil(step / columns)
  const box = 12 + columns * 12
  const boxHeight = 12 + rows * 12
  const gap = 6
  const width = times * box + (times - 1) * gap
  const height = boxHeight + 18

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-auto w-full"
      role="img"
      aria-label={`${step}씩 ${times}묶음을 세는 그림`}
    >
      {Array.from({ length: times }, (_, index) => {
        const x = index * (box + gap)
        return (
          <g key={index}>
            <rect x={x} y={0} width={box} height={boxHeight} rx={5} fill="#FFF6E5" stroke="#101838" strokeWidth={2} />
            {Array.from({ length: step }, (_, dot) => (
              <circle
                key={dot}
                cx={x + 9 + (dot % columns) * 12}
                cy={9 + Math.floor(dot / columns) * 12}
                r={3.5}
                fill="#4FD1C5"
                stroke="#101838"
                strokeWidth={1.5}
              />
            ))}
            <text
              x={x + box / 2}
              y={height - 3}
              textAnchor="middle"
              fontSize={11}
              fontWeight="bold"
              fill="#101838"
            >
              {step * (index + 1)}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
