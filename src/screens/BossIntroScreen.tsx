import { useEffect, useState } from 'react'

import type { WorldMeta } from '../data/worlds'

type BossIntroScreenProps = {
  world: WorldMeta
  onStart: () => void
}

/**
 * 보스 등장 컷씬. (설계서 1장 "문제 8개 + 짧은 컷씬")
 *
 * 보스는 부품을 주는 판이다. 앞 단계와 똑같이 시작하면 무게가 실리지 않는다.
 * 다만 길면 두 번째부터는 방해가 되므로 2초 안에 끝내고, 아무 데나 눌러도
 * 곧장 넘어갈 수 있게 한다.
 */
const READY_AT = 1600

export function BossIntroScreen({ world, onStart }: BossIntroScreenProps) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const id = window.setTimeout(() => setReady(true), READY_AT)
    return () => window.clearTimeout(id)
  }, [])

  return (
    <button
      type="button"
      onClick={onStart}
      aria-label="보스전 시작"
      className="flex flex-1 flex-col items-center justify-center gap-6 overflow-hidden p-6 text-left"
    >
      <div className="flex w-full flex-col items-center gap-2">
        <WarningStripe />
        <p className="animate-pop-in font-title text-4xl text-coral">보스 등장!</p>
        <WarningStripe />
      </div>

      <BossMark />

      <div className="flex flex-col items-center gap-1">
        <p className="font-title text-2xl text-paper">{world.name}</p>
        <p className="text-question text-paper/70">{world.topic}</p>
      </div>

      <div className="animate-rise-in rounded-2xl border-3 border-outline bg-energy px-5 py-3 shadow-hard">
        <p className="font-title text-xl text-outline">이기면 {world.partName}</p>
      </div>

      <p
        className={`font-title text-xl text-paper/70 ${ready ? 'animate-rise-in' : 'invisible'}`}
      >
        눌러서 시작
      </p>
    </button>
  )
}

/** 경고 띠. 보스 화면에서만 쓴다. */
function WarningStripe() {
  return (
    <div className="flex h-3 w-full overflow-hidden rounded-full border-3 border-outline">
      {Array.from({ length: 10 }, (_, index) => (
        <div
          key={index}
          className={`h-full flex-1 ${index % 2 === 0 ? 'bg-coral' : 'bg-energy'}`}
        />
      ))}
    </div>
  )
}

/** 보스를 나타내는 그림. 오리지널이며 특정 IP 를 따르지 않는다. */
function BossMark() {
  return (
    <svg viewBox="0 0 120 100" className="w-48 animate-pop-in" role="img" aria-label="보스">
      <ellipse cx={60} cy={86} rx={40} ry={7} fill="#101838" opacity={0.35} />
      <path
        d="M20 52c0-18 18-30 40-30s40 12 40 30v6H20z"
        fill="#2C3E8F"
        stroke="#101838"
        strokeWidth={5}
        strokeLinejoin="round"
      />
      <rect x={14} y={56} width={92} height={20} rx={9} fill="#FF6B5B" stroke="#101838" strokeWidth={5} />
      <circle cx={40} cy={45} r={9} fill="#FFC93C" stroke="#101838" strokeWidth={4} />
      <circle cx={80} cy={45} r={9} fill="#FFC93C" stroke="#101838" strokeWidth={4} />
      <rect x={54} y={8} width={12} height={16} rx={4} fill="#4FD1C5" stroke="#101838" strokeWidth={4} />
    </svg>
  )
}
