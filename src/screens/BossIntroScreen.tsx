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
  const edge = { stroke: '#101838', strokeWidth: 5, strokeLinejoin: 'round' } as const
  return (
    <svg viewBox="0 0 120 100" className="w-48 animate-pop-in" role="img" aria-label="보스">
      <ellipse cx={60} cy={94} rx={40} ry={6} fill="#101838" opacity={0.35} />
      <path d="M28 28 L28 58 L2 12 Z" fill="#FF6B5B" {...edge} />
      <path d="M92 28 L92 58 L118 12 Z" fill="#FF6B5B" {...edge} />
      <path d="M54 6 L66 6 L70 22 L50 22 Z" fill="#2C3E8F" {...edge} />
      <path d="M38 80 L82 80 L76 92 L44 92 Z" fill="#2C3E8F" {...edge} />
      <path d="M22 44 L34 20 L86 20 L98 44 L98 64 L86 80 L34 80 L22 64 Z" fill="#FF6B5B" {...edge} />
      <path d="M28 46 L92 46 L84 62 L36 62 Z" fill="#FFC93C" {...edge} />
      <path d="M60 47 L60 61" stroke="#101838" strokeWidth={2} opacity={0.4} />
    </svg>
  )
}
