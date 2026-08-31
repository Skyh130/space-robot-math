import type { RobotPart } from '../data/worlds'

type RobotFigureProps = {
  /** 지금까지 모은 부품. */
  parts: readonly RobotPart[]
  /** 방금 붙인 부품. 빛나면서 들어온다. */
  highlight?: RobotPart | undefined
  className?: string
}

/**
 * 오리지널 로봇.
 *
 * 기존 로봇 IP 의 이름·디자인·형태를 쓰지 않는다. (CLAUDE.md 절대 규칙 5)
 * 뭉툭한 상자와 두꺼운 외곽선으로 그린 우리 로봇이다.
 *
 * 아직 없는 부품은 점선 자리로 남긴다. 빈칸이 보여야 모으고 싶어진다.
 */
export function RobotFigure({ parts, highlight, className }: RobotFigureProps) {
  const has = (part: RobotPart) => parts.includes(part)

  return (
    <svg
      viewBox="0 0 200 250"
      className={className ?? 'h-full w-full'}
      role="img"
      aria-label={`부품 ${parts.length}개를 붙인 로봇`}
    >
      {/* 뒤에서부터 겹쳐 그린다: 부스터 → 다리 → 팔 → 몸통 → 머리 → 웨폰 */}
      {/* 어깨 뒤로 솟은 추진기. 몸통과 팔에 가리지 않게 위쪽이 드러나도록 놓는다. */}
      <Slot part="booster" has={has('booster')} highlight={highlight} label="부스터">
        <rect x={44} y={78} width={30} height={44} rx={12} fill="#4FD1C5" stroke="#101838" strokeWidth={5} />
        <rect x={126} y={78} width={30} height={44} rx={12} fill="#4FD1C5" stroke="#101838" strokeWidth={5} />
        <circle cx={59} cy={90} r={7} fill="#FFC93C" stroke="#101838" strokeWidth={4} />
        <circle cx={141} cy={90} r={7} fill="#FFC93C" stroke="#101838" strokeWidth={4} />
      </Slot>

      <Slot part="left_leg" has={has('left_leg')} highlight={highlight} label="왼다리">
        <rect x={70} y={176} width={26} height={54} rx={9} fill="#2C3E8F" stroke="#101838" strokeWidth={5} />
        <rect x={64} y={220} width={38} height={16} rx={7} fill="#4FD1C5" stroke="#101838" strokeWidth={5} />
      </Slot>

      <Slot part="right_leg" has={has('right_leg')} highlight={highlight} label="오른다리">
        <rect x={104} y={176} width={26} height={54} rx={9} fill="#2C3E8F" stroke="#101838" strokeWidth={5} />
        <rect x={98} y={220} width={38} height={16} rx={7} fill="#4FD1C5" stroke="#101838" strokeWidth={5} />
      </Slot>

      <Slot part="left_arm" has={has('left_arm')} highlight={highlight} label="왼팔">
        <rect x={34} y={112} width={24} height={56} rx={10} fill="#2C3E8F" stroke="#101838" strokeWidth={5} />
        <circle cx={46} cy={174} r={12} fill="#4FD1C5" stroke="#101838" strokeWidth={5} />
      </Slot>

      <Slot part="right_arm" has={has('right_arm')} highlight={highlight} label="오른팔">
        <rect x={142} y={112} width={24} height={56} rx={10} fill="#2C3E8F" stroke="#101838" strokeWidth={5} />
        <circle cx={154} cy={174} r={12} fill="#4FD1C5" stroke="#101838" strokeWidth={5} />
      </Slot>

      <Slot part="body" has={has('body')} highlight={highlight} label="몸통">
        <rect x={62} y={102} width={76} height={76} rx={16} fill="#2C3E8F" stroke="#101838" strokeWidth={5} />
        <circle cx={100} cy={132} r={14} fill="#FFC93C" stroke="#101838" strokeWidth={5} />
        <rect x={80} y={154} width={40} height={10} rx={5} fill="#101838" opacity={0.3} />
      </Slot>

      <Slot part="head" has={has('head')} highlight={highlight} label="헤드 유닛">
        <rect x={72} y={44} width={56} height={52} rx={14} fill="#2C3E8F" stroke="#101838" strokeWidth={5} />
        <rect x={82} y={60} width={36} height={18} rx={8} fill="#FFC93C" stroke="#101838" strokeWidth={4} />
        <rect x={96} y={28} width={8} height={18} fill="#101838" />
        <circle cx={100} cy={26} r={6} fill="#FF6B5B" stroke="#101838" strokeWidth={4} />
      </Slot>

      {/* 오른손이 쥐는 자리에 맞춰 놓는다. 팔 위에 떠 있으면 들고 있는 것으로 보이지 않는다. */}
      <Slot part="weapon" has={has('weapon')} highlight={highlight} label="메인 웨폰">
        <rect x={156} y={164} width={38} height={20} rx={7} fill="#FF6B5B" stroke="#101838" strokeWidth={5} />
        <rect x={186} y={168} width={11} height={12} rx={4} fill="#FFC93C" stroke="#101838" strokeWidth={4} />
      </Slot>
    </svg>
  )
}

/**
 * 부품 한 자리.
 * 있으면 그대로 그리고, 없으면 자리만 흐리게 남긴다.
 */
function Slot({
  part,
  has,
  highlight,
  label,
  children,
}: {
  part: RobotPart
  has: boolean
  highlight: RobotPart | undefined
  label: string
  children: React.ReactNode
}) {
  if (!has) {
    return (
      <g opacity={0.18} aria-label={`${label} 자리`}>
        {children}
      </g>
    )
  }

  const isNew = highlight === part
  return (
    <g className={isNew ? 'animate-attach' : ''} aria-label={label}>
      {children}
    </g>
  )
}
