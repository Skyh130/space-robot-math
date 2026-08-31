import { useEffect, useState } from 'react'

import { RobotFigure } from '../components/RobotFigure'
import type { RobotPart } from '../data/worlds'

type PartRewardScreenProps = {
  /** 방금 받은 부품. */
  part: RobotPart
  partName: string
  /** 이 부품까지 포함해 지금까지 모은 부품 전부. */
  parts: readonly RobotPart[]
  totalParts: number
  onContinue: () => void
}

/**
 * 부품을 받는 순간.
 *
 * 게임 전체 보상의 정점이다. 다른 화면의 연출을 절제한 것은 전부 이 화면을
 * 위해서다. (설계서 5장, CLAUDE.md 비주얼 방향)
 *
 * 순서: 빛이 퍼지고 → 부품이 커다랗게 튀어나오고 → 로봇에 철컥 붙고 →
 * 몇 개를 모았는지 알려 준다. 다 붙기 전에는 버튼을 띄우지 않는다.
 * 버튼이 먼저 보이면 아이가 연출을 건너뛴다.
 */

/** 연출 단계가 넘어가는 시각(ms). */
const SHOW_PART_AT = 250
const ATTACH_AT = 1400
const SHOW_BUTTON_AT = 2200

type Beat = 'burst' | 'part' | 'attached' | 'ready'

export function PartRewardScreen({
  part,
  partName,
  parts,
  totalParts,
  onContinue,
}: PartRewardScreenProps) {
  const [beat, setBeat] = useState<Beat>('burst')

  useEffect(() => {
    const timers = [
      window.setTimeout(() => setBeat('part'), SHOW_PART_AT),
      window.setTimeout(() => setBeat('attached'), ATTACH_AT),
      window.setTimeout(() => setBeat('ready'), SHOW_BUTTON_AT),
    ]
    return () => timers.forEach((id) => window.clearTimeout(id))
  }, [])

  const attached = beat === 'attached' || beat === 'ready'
  const shownParts = attached ? parts : parts.filter((owned) => owned !== part)

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center gap-4 overflow-hidden p-6">
      <Burst />

      <p className="z-10 animate-pop-in font-title text-3xl text-energy">부품 획득!</p>

      <div className="relative z-10 min-h-0 w-full flex-1">
        <RobotFigure
          parts={shownParts}
          {...(attached ? { highlight: part } : {})}
          className="absolute inset-0 h-full w-full"
        />
      </div>

      {beat === 'part' ? (
        <p className="z-10 animate-pop-in font-title text-4xl text-paper">{partName}</p>
      ) : (
        <p
          className={`z-10 font-title text-4xl ${attached ? 'animate-rise-in text-energy' : 'text-transparent'}`}
        >
          {partName}
        </p>
      )}

      <p className="z-10 text-question text-paper">
        부품 <span className="text-number font-bold text-energy">{parts.length}</span>
        {` / ${String(totalParts)}`}
      </p>

      <button
        type="button"
        onClick={onContinue}
        className={`
          z-10 min-h-touch w-full rounded-2xl border-3 border-outline bg-energy px-4 py-4
          font-title text-2xl text-outline shadow-hard transition-transform
          active:translate-y-1 active:shadow-none
          ${beat === 'ready' ? 'animate-rise-in' : 'invisible'}
        `}
      >
        격납고로
      </button>
    </div>
  )
}

/**
 * 뒤에서 퍼지는 빛. 이 화면에서만 쓴다.
 *
 * 빛살은 로봇 바깥에서 시작한다. 로봇 위를 가로지르면 무엇을 받았는지가 안 보인다.
 */
function Burst() {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <div className="h-64 w-64 animate-shine rounded-full bg-energy/20 blur-3xl" />
      <svg viewBox="0 0 400 400" className="absolute h-[26rem] w-[26rem] animate-shine" aria-hidden="true">
        {Array.from({ length: 12 }, (_, index) => {
          const angle = (index * Math.PI) / 6 + Math.PI / 12
          return (
            <line
              key={index}
              x1={200 + Math.cos(angle) * 150}
              y1={200 + Math.sin(angle) * 150}
              x2={200 + Math.cos(angle) * 196}
              y2={200 + Math.sin(angle) * 196}
              stroke="#FFC93C"
              strokeWidth={9}
              strokeLinecap="round"
              opacity={0.4}
            />
          )
        })}
      </svg>
    </div>
  )
}
