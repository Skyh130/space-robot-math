import type { QuestionFigure, ShapeName } from '../engine'

import { HintVisualView } from './HintVisual'

/**
 * 문제와 함께 보여주는 그림.
 *
 * 그림은 언제나 종이색 문제 카드 위에 그려진다. 글자와 눈금은 outline 색으로
 * 쓴다. 화면 배경에 맞춰 종이색으로 쓰면 카드 위에서 통째로 사라진다.
 * (실제로 막대그래프의 눈금과 이름이 안 보이는 채로 검사를 통과한 적이 있다.
 *  화면이 넘치지 않는지만 재는 검사기는 이런 것을 잡지 못한다.)
 *
 * 템플릿은 "무엇을 그릴지"만 데이터로 적고 그리는 일은 전부 여기서 한다.
 * data/ 아래에 JSX 가 섞이면 문제 은행을 테스트하기 어려워진다. (HintVisual 과 같은 규칙)
 *
 * 힌트 그림과 겹치는 종류는 그쪽에 넘긴다. 수직선을 두 벌 그리면 언젠가 어긋난다.
 */
/**
 * 상자 높이를 정해 주면 제 비율을 지키며 줄어드는 그림.
 *
 * SVG 한 장으로 그리는 것들이다. 표나 도형 줄은 HTML 로 짜서 글자 크기에 따라
 * 높이가 정해지므로, 상자에 가두면 글자가 잘린다. 둘을 갈라 다루어야 한다.
 */
const SCALABLE = new Set(['clock', 'shape', 'ruler', 'fractionBars', 'barChart', 'dotGroups'])

export function isScalableFigure(figure: QuestionFigure): boolean {
  return SCALABLE.has(figure.kind)
}

export function QuestionFigureView({ figure }: { figure: QuestionFigure }) {
  switch (figure.kind) {
    case 'clock':
      return <Clock hour={figure.hour} minute={figure.minute} />
    case 'shape':
      return (
        <ShapeView shape={figure.shape} {...(figure.marks === undefined ? {} : { marks: figure.marks })} />
      )
    case 'ruler':
      return <Ruler lengthMm={figure.lengthMm} />
    case 'fractionBars':
      return <FractionBars bars={figure.bars} />
    case 'barChart':
      return <BarChart unit={figure.unit} bars={figure.bars} />
    case 'dataTable':
      return (
        <DataTable
          headers={figure.headers}
          rows={figure.rows}
          {...(figure.highlight === undefined ? {} : { highlight: figure.highlight })}
        />
      )
    case 'shapePattern':
      return <ShapePattern items={figure.items} blankAt={figure.blankAt} />
    default:
      /*
        힌트 그림을 문제에 그대로 쓴 것이다. 힌트에서는 폭을 꽉 채우고 높이는
        비율대로 늘어나면 되지만, 문제에서는 남는 높이에 맞춰 줄어들어야 한다.
        자식 선택자가 안쪽 svg 의 h-auto/w-full 을 눌러 높이 기준으로 맞춘다.
      */
      return (
        <div className="flex h-full max-h-full w-full items-center justify-center [&>svg]:max-h-full [&>svg]:w-auto">
          <HintVisualView visual={figure} />
        </div>
      )
  }
}

const EDGE = { stroke: '#101838', strokeWidth: 3, strokeLinejoin: 'round' } as const

/**
 * 아날로그 시계.
 *
 * 아날로그 시계는 이 나이대 오답률 최상위 영역이다. (설계서 5장 W4 주의)
 * 그래서 눈금을 넉넉히 그린다. 분 눈금 60개를 다 찍고 5분마다 길게, 시각 숫자를
 * 크게 적는다. 시침은 굵고 짧게, 분침은 가늘고 길게 — 둘을 헷갈리는 것이
 * 가장 흔한 실수라 굵기와 길이를 눈에 띄게 벌려 놓았다.
 */
function Clock({ hour, minute }: { hour: number; minute: number }) {
  const minuteAngle = minute * 6
  // 시침은 분에 따라 조금씩 나아간다. 3시 50분에 시침이 3에 붙어 있으면 거짓말이다.
  const hourAngle = ((hour % 12) + minute / 60) * 30

  return (
    <svg viewBox="0 0 200 200" className="h-full w-full" role="img" aria-label={`${String(hour)}시 ${String(minute)}분을 가리키는 시계`}>
      <circle cx={100} cy={100} r={92} fill="#FFF6E5" stroke="#101838" strokeWidth={5} />

      {Array.from({ length: 60 }, (_, i) => {
        const long = i % 5 === 0
        const angle = (i * 6 * Math.PI) / 180
        const outer = 84
        const inner = long ? 72 : 79
        return (
          <line
            key={i}
            x1={100 + outer * Math.sin(angle)}
            y1={100 - outer * Math.cos(angle)}
            x2={100 + inner * Math.sin(angle)}
            y2={100 - inner * Math.cos(angle)}
            stroke="#101838"
            strokeWidth={long ? 4 : 2}
            strokeLinecap="round"
            opacity={long ? 1 : 0.45}
          />
        )
      })}

      {Array.from({ length: 12 }, (_, i) => {
        const value = i === 0 ? 12 : i
        const angle = (i * 30 * Math.PI) / 180
        return (
          <text
            key={value}
            x={100 + 57 * Math.sin(angle)}
            y={100 - 57 * Math.cos(angle) + 8}
            textAnchor="middle"
            fontSize={22}
            fontWeight="bold"
            fill="#101838"
          >
            {value}
          </text>
        )
      })}

      {/* 분침 — 가늘고 길다 */}
      <line
        x1={100}
        y1={100}
        x2={100 + 68 * Math.sin((minuteAngle * Math.PI) / 180)}
        y2={100 - 68 * Math.cos((minuteAngle * Math.PI) / 180)}
        stroke="#2C3E8F"
        strokeWidth={6}
        strokeLinecap="round"
      />
      {/* 시침 — 굵고 짧다 */}
      <line
        x1={100}
        y1={100}
        x2={100 + 44 * Math.sin((hourAngle * Math.PI) / 180)}
        y2={100 - 44 * Math.cos((hourAngle * Math.PI) / 180)}
        stroke="#FF6B5B"
        strokeWidth={11}
        strokeLinecap="round"
      />
      <circle cx={100} cy={100} r={7} fill="#101838" />
    </svg>
  )
}

/** 도형의 꼭짓점. 그리기와 세기를 한 곳에서 정해 둔다. */
const SHAPE_POINTS: Readonly<Record<Exclude<ShapeName, 'circle'>, readonly (readonly [number, number])[]>> = {
  triangle: [
    [100, 22],
    [174, 150],
    [26, 150],
  ],
  rightTriangle: [
    [34, 30],
    [34, 154],
    [162, 154],
  ],
  square: [
    [46, 40],
    [154, 40],
    [154, 148],
    [46, 148],
  ],
  rectangle: [
    [22, 52],
    [178, 52],
    [178, 136],
    [22, 136],
  ],
  pentagon: [
    [100, 20],
    [180, 78],
    [149, 160],
    [51, 160],
    [20, 78],
  ],
  hexagon: [
    [100, 18],
    [171, 58],
    [171, 138],
    [100, 178],
    [29, 138],
    [29, 58],
  ],
}

const SHAPE_LABEL: Readonly<Record<ShapeName, string>> = {
  triangle: '삼각형',
  rightTriangle: '직각삼각형',
  square: '정사각형',
  rectangle: '직사각형',
  pentagon: '오각형',
  hexagon: '육각형',
  circle: '원',
}

function ShapeView({ shape, marks }: { shape: ShapeName; marks?: 'vertices' | 'edges' | 'rightAngle' }) {
  const label = SHAPE_LABEL[shape]

  if (shape === 'circle') {
    return (
      <svg viewBox="0 0 200 200" className="h-full w-full" role="img" aria-label={label}>
        <circle cx={100} cy={100} r={76} fill="#2C3E8F" {...EDGE} strokeWidth={5} />
      </svg>
    )
  }

  const points = SHAPE_POINTS[shape]
  const path = `${points.map(([x, y]) => `${String(x)} ${String(y)}`).join(' L ')}`

  return (
    <svg viewBox="0 0 200 200" className="h-full w-full" role="img" aria-label={label}>
      <path d={`M ${path} Z`} fill="#2C3E8F" {...EDGE} strokeWidth={5} />

      {/* 변마다 색을 갈아 끼워 몇 개인지 세기 쉽게 한다 */}
      {marks === 'edges'
        ? points.map(([x, y], i) => {
            const next = points[(i + 1) % points.length] as readonly [number, number]
            return (
              <line
                key={i}
                x1={x}
                y1={y}
                x2={next[0]}
                y2={next[1]}
                stroke={i % 2 === 0 ? '#FFC93C' : '#4FD1C5'}
                strokeWidth={7}
                strokeLinecap="round"
              />
            )
          })
        : null}

      {marks === 'vertices'
        ? points.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={9} fill="#FFC93C" stroke="#101838" strokeWidth={4} />
          ))
        : null}

      {/* 직각 표시는 첫 꼭짓점에만 붙인다. 직각이 있는 도형에서만 쓴다. */}
      {marks === 'rightAngle' ? <RightAngleMark shape={shape} /> : null}
    </svg>
  )
}

/** 직각 표시(ㄱ자 네모). 도형마다 직각이 있는 자리가 다르다. */
function RightAngleMark({ shape }: { shape: Exclude<ShapeName, 'circle'> }) {
  const corner: Readonly<Partial<Record<ShapeName, readonly [number, number, number, number]>>> = {
    rightTriangle: [34, 154, 1, -1],
    square: [46, 148, 1, -1],
    rectangle: [22, 136, 1, -1],
  }
  const spot = corner[shape]
  if (!spot) return null
  const [x, y, dx, dy] = spot
  const size = 22
  return (
    <path
      d={`M ${String(x + dx * size)} ${String(y)} L ${String(x + dx * size)} ${String(y + dy * size)} L ${String(x)} ${String(y + dy * size)}`}
      fill="none"
      stroke="#FFC93C"
      strokeWidth={5}
    />
  )
}

/**
 * 자와 막대.
 *
 * 0 에서 시작하게 그린다. 자를 삐뚤게 대고 재는 실수까지 여기서 가르칠 수는 없고,
 * 눈금을 세는 것부터가 이 단계의 목표다. mm 눈금을 다 찍고 cm 마다 숫자를 적는다.
 */
function Ruler({ lengthMm }: { lengthMm: number }) {
  const totalCm = 10
  const totalMm = totalCm * 10
  const left = 12
  const width = 260
  const at = (mm: number) => left + (mm / totalMm) * width

  return (
    <svg viewBox="0 0 284 96" className="h-full w-full" role="img" aria-label={`자 위에 놓인 ${String(lengthMm / 10)}센티미터 막대`}>
      {/* 재는 막대 */}
      <rect x={at(0)} y={14} width={at(lengthMm) - at(0)} height={22} rx={4} fill="#FF6B5B" {...EDGE} />

      {/* 자 */}
      <rect x={left} y={44} width={width} height={40} rx={4} fill="#FFF6E5" {...EDGE} />
      {Array.from({ length: totalMm + 1 }, (_, mm) => {
        const isCm = mm % 10 === 0
        const isHalf = mm % 5 === 0
        return (
          <line
            key={mm}
            x1={at(mm)}
            y1={44}
            x2={at(mm)}
            y2={isCm ? 64 : isHalf ? 58 : 53}
            stroke="#101838"
            strokeWidth={isCm ? 2.5 : 1.5}
            opacity={isCm ? 1 : 0.5}
          />
        )
      })}
      {Array.from({ length: totalCm + 1 }, (_, cm) => (
        <text key={cm} x={at(cm * 10)} y={79} textAnchor="middle" fontSize={11} fontWeight="bold" fill="#101838">
          {cm}
        </text>
      ))}
    </svg>
  )
}

/**
 * 칸을 나눈 막대.
 *
 * W7 은 시각 자료 비중을 다른 월드의 2배로 두라고 못 박혀 있다. (설계서 5장)
 * 분수도 소수도 결국 "전체를 몇으로 나눈 것 중 몇" 이라 같은 그림으로 보여준다.
 */
function FractionBars({
  bars,
}: {
  bars: readonly { readonly label: string; readonly parts: number; readonly filled: number }[]
}) {
  const width = 240
  const height = 42
  const gap = 14
  const labelWidth = 46

  return (
    <svg
      viewBox={`0 0 ${String(labelWidth + width + 8)} ${String(bars.length * (height + gap))}`}
      className="h-full w-full"
      role="img"
      aria-label={bars
        .map((bar) => `${bar.label} ${String(bar.parts)}칸 중 ${String(bar.filled)}칸`)
        .join(', ')}
    >
      {bars.map((bar, row) => {
        const y = row * (height + gap)
        const cell = width / bar.parts
        return (
          <g key={row}>
            {bar.label === '' ? null : (
              <text x={0} y={y + height / 2 + 6} fontSize={17} fontWeight="bold" fill="#101838">
                {bar.label}
              </text>
            )}
            {Array.from({ length: bar.parts }, (_, i) => (
              <rect
                key={i}
                x={labelWidth + i * cell}
                y={y}
                width={cell}
                height={height}
                fill={i < bar.filled ? '#4FD1C5' : '#FFF6E5'}
                stroke="#101838"
                strokeWidth={2.5}
              />
            ))}
          </g>
        )
      })}
    </svg>
  )
}

/** 막대그래프. 눈금을 그려야 "몇 칸인지" 를 셀 수 있다. */
function BarChart({
  unit,
  bars,
}: {
  unit: string
  bars: readonly { readonly label: string; readonly value: number }[]
}) {
  const max = Math.max(...bars.map((bar) => bar.value), 1)
  const steps = max
  const plotHeight = 120
  const barWidth = 34
  const gap = 20
  const left = 30
  const width = left + bars.length * (barWidth + gap) + 10
  const y = (value: number) => plotHeight - (value / max) * plotHeight

  return (
    <svg
      viewBox={`0 0 ${String(width)} ${String(plotHeight + 42)}`}
      className="h-full w-full"
      role="img"
      aria-label={bars.map((bar) => `${bar.label} ${String(bar.value)}${unit}`).join(', ')}
    >
      {Array.from({ length: steps + 1 }, (_, i) => (
        <g key={i}>
          <line x1={left - 4} y1={y(i)} x2={width - 6} y2={y(i)} stroke="#101838" strokeWidth={1.5} opacity={0.3} />
          <text x={left - 8} y={y(i) + 5} textAnchor="end" fontSize={12} fontWeight="bold" fill="#101838">
            {i}
          </text>
        </g>
      ))}

      {bars.map((bar, i) => {
        const x = left + i * (barWidth + gap) + gap / 2
        return (
          <g key={bar.label}>
            <rect
              x={x}
              y={y(bar.value)}
              width={barWidth}
              height={plotHeight - y(bar.value)}
              fill="#FFC93C"
              stroke="#101838"
              strokeWidth={3}
            />
            <text x={x + barWidth / 2} y={plotHeight + 22} textAnchor="middle" fontSize={15} fontWeight="bold" fill="#101838">
              {bar.label}
            </text>
          </g>
        )
      })}
      <line x1={left - 4} y1={plotHeight} x2={width - 6} y2={plotHeight} stroke="#101838" strokeWidth={3} />
    </svg>
  )
}

/**
 * 표.
 *
 * 줄 여백을 4px 로 얇게 잡았고, 세로가 짧은 기기에서는 2px 까지 줄인다.
 * 표는 SVG 와 달리 스스로 줄어들지 않아서, 여기서 아낀 높이가 그대로 작은 폰의
 * '확인' 버튼 자리가 된다. 글자는 어디서도 16px 을 지킨다.
 * 물어보는 칸은 테두리를 밝게 해 어디를 보라는 건지 짚어 준다.
 */
function DataTable({
  headers,
  rows,
  highlight,
}: {
  headers: readonly string[]
  rows: readonly (readonly string[])[]
  highlight?: readonly [number, number]
}) {
  return (
    <table className="w-full table-fixed border-collapse overflow-hidden rounded-2xl border-3 border-outline">
      <thead>
        <tr>
          {headers.map((head) => (
            <th
              key={head}
              className="border-2 border-outline bg-panel px-1.5 py-1 text-base font-bold text-paper short:py-0.5"
            >
              {head}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, r) => (
          <tr key={r}>
            {row.map((cell, c) => (
              <td
                key={c}
                className={`
                  border-2 border-outline px-1.5 py-1 text-center text-base font-bold short:py-0.5
                  ${highlight?.[0] === r && highlight[1] === c ? 'bg-energy text-outline' : 'bg-paper text-outline'}
                `}
              >
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/** 도형이 반복되는 줄. 빈칸에는 물음표를 놓는다. */
function ShapePattern({ items, blankAt }: { items: readonly ShapeName[]; blankAt: number }) {
  return (
    <div className="flex w-full items-center justify-center gap-1.5">
      {items.map((shape, i) => (
        <div key={i} className="h-12 w-12 shrink-0">
          {i === blankAt ? (
            <div className="flex h-full w-full items-center justify-center rounded-xl border-3 border-dashed border-outline/60 text-2xl font-bold text-outline">
              ?
            </div>
          ) : (
            <ShapeView shape={shape} />
          )}
        </div>
      ))}
    </div>
  )
}
