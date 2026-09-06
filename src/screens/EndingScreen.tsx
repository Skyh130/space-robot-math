import { useEffect, useState } from 'react'

import { RobotFigure } from '../components/RobotFigure'
import { WORLDS } from '../data/worlds'
import { totalStars, type SaveData } from '../state/save'

type EndingScreenProps = {
  save: SaveData
  onHangar: () => void
}

/**
 * 엔딩. 여덟 부품을 다 모았을 때 딱 한 번 지나가는 화면이다.
 *
 * "게임 전체 보상의 정점이므로 연출에 가장 많은 공을 들일 것" 이 설계서의 지시다.
 * (설계서 5장 최종 보스)
 *
 * 순서: 빛이 퍼지고 → 로봇이 완성된 모습으로 서고 → 합체 완료 → 여태 모은 것을
 * 세어 보여주고 → 그제야 버튼이 나온다. 버튼을 먼저 띄우면 아이가 건너뛴다.
 * 부품 획득 화면과 같은 규칙이되, 한 박자씩 길게 잡았다. 여기까지 온 판이다.
 *
 * 이 화면에는 나가는 길이 하나뿐이다. 다 끝낸 아이에게 고를 것을 주지 않는다.
 */

/** 연출 단계가 넘어가는 시각(ms). */
const SHOW_ROBOT_AT = 300
const SHOW_TITLE_AT = 1500
const SHOW_STATS_AT = 2400
const SHOW_BUTTON_AT = 3200

type Beat = 'burst' | 'robot' | 'title' | 'stats' | 'ready'

export function EndingScreen({ save, onHangar }: EndingScreenProps) {
  const [beat, setBeat] = useState<Beat>('burst')

  useEffect(() => {
    const timers = [
      window.setTimeout(() => setBeat('robot'), SHOW_ROBOT_AT),
      window.setTimeout(() => setBeat('title'), SHOW_TITLE_AT),
      window.setTimeout(() => setBeat('stats'), SHOW_STATS_AT),
      window.setTimeout(() => setBeat('ready'), SHOW_BUTTON_AT),
    ]
    return () => timers.forEach((id) => window.clearTimeout(id))
  }, [])

  const seen = (at: Beat) => ORDER.indexOf(beat) >= ORDER.indexOf(at)

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center gap-3 overflow-hidden p-5">
      <Starfield />

      <p
        className={`
          z-10 font-title text-lg text-mint
          ${seen('title') ? 'animate-rise-in' : 'invisible'}
        `}
      >
        모든 행성 탐사 완료
      </p>

      <div className="relative z-10 min-h-0 w-full flex-1">
        <RobotFigure
          parts={seen('robot') ? WORLDS.map((world) => world.part) : []}
          className="absolute inset-0 h-full w-full"
        />
      </div>

      <p
        className={`
          z-10 font-title text-4xl text-energy
          ${seen('title') ? 'animate-pop-in' : 'invisible'}
        `}
      >
        합체 완료!
      </p>

      <div
        className={`
          z-10 flex w-full items-stretch justify-center gap-2
          ${seen('stats') ? 'animate-rise-in' : 'invisible'}
        `}
      >
        <Stat label="부품" value={`${String(WORLDS.length)} / ${String(WORLDS.length)}`} />
        <Stat label="별" value={String(totalStars(save))} />
        <Stat label="행성" value={`${String(WORLDS.length)}곳`} />
      </div>

      <p
        className={`
          z-10 text-center text-question text-paper
          ${seen('stats') ? 'animate-rise-in' : 'invisible'}
        `}
      >
        네가 우주를 지켰어.
      </p>

      <button
        type="button"
        onClick={onHangar}
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

const ORDER: readonly Beat[] = ['burst', 'robot', 'title', 'stats', 'ready']

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-0.5 rounded-2xl border-3 border-outline bg-panel px-2 py-2">
      <span className="text-sm text-paper/70">{label}</span>
      <span className="text-xl font-bold tabular-nums text-energy">{value}</span>
    </div>
  )
}

/**
 * 뒤로 퍼지는 별빛.
 *
 * 부품 획득 화면의 빛살보다 넓게 깔되 로봇 위를 가로지르지 않는다.
 * 별은 고정된 자리에 그린다. 볼 때마다 자리가 바뀌면 무늬가 아니라 잡음이 된다.
 * [가로 %, 세로 %, 지름 px]
 */
const STARS: readonly (readonly [number, number, number])[] = [
  [12, 14, 7], [30, 6, 5], [52, 12, 6], [74, 8, 5], [90, 18, 7],
  [8, 40, 5], [94, 44, 6], [16, 68, 6], [88, 72, 5],
  [6, 88, 7], [34, 94, 5], [62, 92, 6], [92, 88, 5],
]

function Starfield() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 animate-shine rounded-full bg-energy/20 blur-3xl" />
      {/*
        별은 div 로 놓는다. SVG 를 preserveAspectRatio="none" 으로 늘리면
        동그란 별이 세로로 긴 타원이 된다. 세로로 긴 화면에서 특히 심하다.
      */}
      {STARS.map(([x, y, size], index) => (
        <span
          key={index}
          className="absolute animate-shine rounded-full bg-energy"
          style={{
            left: `${String(x)}%`,
            top: `${String(y)}%`,
            width: `${String(size)}px`,
            height: `${String(size)}px`,
            opacity: 0.55,
            animationDelay: `${String(index * 0.12)}s`,
          }}
        />
      ))}
    </div>
  )
}
