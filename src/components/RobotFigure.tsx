import type { RobotPart } from '../data/worlds'

type RobotFigureProps = {
  /** 지금까지 모은 부품. */
  parts: readonly RobotPart[]
  /** 방금 붙인 부품. 빛나면서 들어온다. */
  highlight?: RobotPart | undefined
  className?: string
}

/**
 * 오리지널 메카닉.
 *
 * 기존 로봇 IP 의 이름·디자인·형태를 쓰지 않는다. (CLAUDE.md 절대 규칙 5)
 * 특정 작품의 얼굴 생김새나 배색을 흉내 내지 않되, 각진 장갑판과 패널 라인으로
 * 장난감이 아니라 기체처럼 보이게 그린다.
 *
 * 색은 CLAUDE.md 팔레트 그대로 쓰되 역할을 나눈다.
 *   paper  바깥 장갑판 (머리·가슴·어깨·팔뚝·정강이)
 *   panel  보조 장갑판 (허벅지·허리·부스터·총몸)
 *   deep   관절과 속프레임 (목·위팔·무릎·발·주먹·흡기구)
 *   energy 바이저와 추진기 / coral 가슴 코어와 총구 / mint 센서 포드
 * 어두운 장갑끼리만 겹치면 덩어리로 보인다. 밝은 판을 크게 얹어야 실루엣이 산다.
 * 실루엣 바깥으로 삐져나오는 조각에는 deep 을 쓰지 않는다. 배경과 같은 색이라
 * 속이 빈 철사처럼 보인다. 바깥으로 나가는 조각은 panel 이상으로 밝게 둔다.
 *
 * 아직 없는 부품은 흐린 자리로 남긴다. 빈칸이 보여야 모으고 싶어진다.
 */

/** 장갑 바깥선. 두께를 4로 두어 뭉툭해 보이지 않게 한다. */
const EDGE = { stroke: '#101838', strokeWidth: 4, strokeLinejoin: 'round' } as const
/** 장갑 위에 긋는 얇은 패널 라인. 이것 하나로 덩어리가 기계가 된다. */
const PANEL = { stroke: '#101838', strokeWidth: 2, opacity: 0.4, fill: 'none' } as const

export function RobotFigure({ parts, highlight, className }: RobotFigureProps) {
  const has = (part: RobotPart) => parts.includes(part)

  return (
    <svg
      viewBox="0 0 200 250"
      className={className ?? 'h-full w-full'}
      role="img"
      aria-label={`부품 ${parts.length}개를 붙인 로봇`}
    >
      {/* 뒤에서부터 겹쳐 그린다: 부스터 → 웨폰 → 다리 → 팔 → 몸통 → 머리 */}

      {/* 등에 진 추진기. 어깨 너머로 노즐이 솟아 실루엣을 넓힌다. */}
      <Slot part="booster" has={has('booster')} highlight={highlight} label="부스터">
        <path d="M74 112 L54 100 L34 70 L56 56 L80 88 Z" fill="#2C3E8F" {...EDGE} />
        <path d="M126 112 L146 100 L166 70 L144 56 L120 88 Z" fill="#2C3E8F" {...EDGE} />
        <path d="M34 70 L56 56 L47 45 L25 59 Z" fill="#1B2A6B" {...EDGE} />
        <path d="M166 70 L144 56 L153 45 L175 59 Z" fill="#1B2A6B" {...EDGE} />
        <path d="M25 59 L47 45 L42 38 L20 52 Z" fill="#FFC93C" {...EDGE} />
        <path d="M175 59 L153 45 L158 38 L180 52 Z" fill="#FFC93C" {...EDGE} />
        <path d="M66 102 L46 74" {...PANEL} />
        <path d="M134 102 L154 74" {...PANEL} />
      </Slot>

      {/* 메인 웨폰. 팔보다 먼저 그려야 주먹이 손잡이를 덮어 쥔 것처럼 보인다. */}
      <Slot part="weapon" has={has('weapon')} highlight={highlight} label="메인 웨폰">
        <path d="M146 186 L186 186 L186 200 L146 200 Z" fill="#2C3E8F" {...EDGE} />
        <path d="M156 178 L178 178 L178 186 L156 186 Z" fill="#1B2A6B" {...EDGE} />
        <path d="M146 196 L160 196 L158 214 L146 214 Z" fill="#1B2A6B" {...EDGE} />
        <path d="M186 188 L198 188 L198 198 L186 198 Z" fill="#FF6B5B" {...EDGE} />
        <path d="M164 193 L180 193" {...PANEL} />
      </Slot>

      {/* 다리. 허벅지·무릎·정강이·발로 나눠 마디가 보이게 한다. */}
      <Slot part="left_leg" has={has('left_leg')} highlight={highlight} label="왼다리">
        <path d="M74 176 L96 176 L96 202 L76 204 Z" fill="#2C3E8F" {...EDGE} />
        <path d="M75 204 L96 202 L98 214 L74 216 Z" fill="#1B2A6B" {...EDGE} />
        <path d="M74 216 L98 214 L100 240 L72 240 Z" fill="#FFF6E5" {...EDGE} />
        <path d="M66 240 L100 240 L100 250 L62 250 Z" fill="#1B2A6B" {...EDGE} />
        <path d="M78 224 L96 223" {...PANEL} />
      </Slot>

      <Slot part="right_leg" has={has('right_leg')} highlight={highlight} label="오른다리">
        <path d="M126 176 L104 176 L104 202 L124 204 Z" fill="#2C3E8F" {...EDGE} />
        <path d="M125 204 L104 202 L102 214 L126 216 Z" fill="#1B2A6B" {...EDGE} />
        <path d="M126 216 L102 214 L100 240 L128 240 Z" fill="#FFF6E5" {...EDGE} />
        <path d="M134 240 L100 240 L100 250 L138 250 Z" fill="#1B2A6B" {...EDGE} />
        <path d="M122 224 L104 223" {...PANEL} />
      </Slot>

      {/* 팔. 어깨 장갑을 크게 얹어 실루엣을 넓힌다. */}
      <Slot part="left_arm" has={has('left_arm')} highlight={highlight} label="왼팔">
        <path d="M24 106 L54 96 L64 110 L62 136 L26 138 Z" fill="#FFF6E5" {...EDGE} />
        <path d="M38 138 L60 136 L60 160 L38 162 Z" fill="#1B2A6B" {...EDGE} />
        <path d="M36 162 L60 160 L62 190 L34 190 Z" fill="#FFF6E5" {...EDGE} />
        <path d="M38 190 L60 190 L58 204 L40 204 Z" fill="#1B2A6B" {...EDGE} />
        <path d="M31 114 L56 105" {...PANEL} />
        <path d="M40 170 L56 169 M40 178 L56 177" {...PANEL} />
      </Slot>

      <Slot part="right_arm" has={has('right_arm')} highlight={highlight} label="오른팔">
        <path d="M176 106 L146 96 L136 110 L138 136 L174 138 Z" fill="#FFF6E5" {...EDGE} />
        <path d="M162 138 L140 136 L140 160 L162 162 Z" fill="#1B2A6B" {...EDGE} />
        <path d="M164 162 L140 160 L138 190 L166 190 Z" fill="#FFF6E5" {...EDGE} />
        <path d="M162 190 L140 190 L142 204 L160 204 Z" fill="#1B2A6B" {...EDGE} />
        <path d="M169 114 L144 105" {...PANEL} />
        <path d="M160 170 L144 169 M160 178 L144 177" {...PANEL} />
      </Slot>

      {/* 몸통. 가슴 흡기구와 콕핏 이음선을 넣는다. */}
      <Slot part="body" has={has('body')} highlight={highlight} label="몸통">
        <path
          d="M66 110 L80 100 L120 100 L134 110 L134 142 L124 152 L76 152 L66 142 Z"
          fill="#FFF6E5"
          {...EDGE}
        />
        <path d="M80 112 L96 108 L94 128 L78 130 Z" fill="#1B2A6B" {...EDGE} />
        <path d="M120 112 L104 108 L106 128 L122 130 Z" fill="#1B2A6B" {...EDGE} />
        <path d="M92 134 L108 134 L106 148 L94 148 Z" fill="#FF6B5B" {...EDGE} />
        <path d="M84 152 L116 152 L118 168 L82 168 Z" fill="#1B2A6B" {...EDGE} />
        <path d="M94 166 L106 166 L104 186 L96 186 Z" fill="#1B2A6B" {...EDGE} />
        <path d="M76 168 L98 168 L96 184 L80 184 Z" fill="#FFF6E5" {...EDGE} />
        <path d="M124 168 L102 168 L104 184 L120 184 Z" fill="#FFF6E5" {...EDGE} />
        <path d="M100 102 L100 132 M76 132 L92 132 M124 132 L108 132" {...PANEL} />
        <path d="M83 117 L93 115 M83 123 L93 121" {...PANEL} />
        <path d="M117 117 L107 115 M117 123 L107 121" {...PANEL} />
      </Slot>

      {/* 머리. 가로로 긴 바이저와 턱 가드. 안테나 대신 센서 포드를 얹는다. */}
      <Slot part="head" has={has('head')} highlight={highlight} label="헤드 유닛">
        <path d="M88 86 L112 86 L110 100 L90 100 Z" fill="#1B2A6B" {...EDGE} />
        <path d="M70 58 L78 56 L78 72 L70 70 Z" fill="#2C3E8F" {...EDGE} />
        <path d="M130 58 L122 56 L122 72 L130 70 Z" fill="#2C3E8F" {...EDGE} />
        <path d="M92 30 L108 30 L110 40 L90 40 Z" fill="#2C3E8F" {...EDGE} />
        <path
          d="M78 52 L86 40 L114 40 L122 52 L122 74 L114 86 L86 86 L78 74 Z"
          fill="#FFF6E5"
          {...EDGE}
        />
        <path d="M82 56 L118 56 L114 70 L86 70 Z" fill="#FFC93C" {...EDGE} />
        <circle cx={100} cy={32} r={4} fill="#4FD1C5" stroke="#101838" strokeWidth={3} />
        <path d="M100 57 L100 69" {...PANEL} />
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
  highlight?: RobotPart | undefined
  label: string
  children: React.ReactNode
}) {
  if (!has) {
    return (
      <g opacity={0.16} aria-label={`${label} 자리`}>
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
