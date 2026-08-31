import { StarRating } from '../components/StarRating'
import { isPlayable, STAGE_ORDER, WORLDS, type WorldMeta } from '../data/worlds'
import type { StageLevel, WorldId } from '../engine'
import {
  isStageUnlocked,
  isWorldUnlocked,
  starsOf,
  totalStars,
  worldProgress,
  type SaveData,
} from '../state/save'

type WorldMapScreenProps = {
  save: SaveData
  /** 지금 펼쳐 놓은 행성. null 이면 행성 목록을 보여준다. */
  openWorld: WorldId | null
  onOpenWorld: (world: WorldId | null) => void
  onPlay: (world: WorldId, level: StageLevel) => void
  /** 격납고 화면이 준비된 뒤부터 버튼을 그린다. (Phase 6) */
  onHangar?: () => void
}

/**
 * 월드맵. 행성 8개를 보여주고, 하나를 누르면 그 행성의 단계가 펼쳐진다.
 *
 * 잠긴 곳도 자리를 남겨 둔다. 앞으로 갈 곳이 보여야 계속할 마음이 생긴다.
 */
export function WorldMapScreen({
  save,
  openWorld,
  onOpenWorld,
  onPlay,
  onHangar,
}: WorldMapScreenProps) {
  if (openWorld !== null) {
    const world = WORLDS.find((candidate) => candidate.id === openWorld)
    if (world) {
      return <StageList world={world} save={save} onBack={() => onOpenWorld(null)} onPlay={onPlay} />
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-3 overflow-hidden p-4">
      <header className="flex items-center justify-between">
        <h1 className="font-title text-2xl text-energy">어디로 갈까?</h1>
        <div className="flex items-center gap-1.5 rounded-xl border-3 border-outline bg-panel px-3 py-1">
          <StarIcon />
          <span className="text-lg font-bold text-paper">{totalStars(save)}</span>
        </div>
      </header>

      <div className="grid flex-1 grid-cols-2 content-start gap-2.5 overflow-y-auto">
        {WORLDS.map((world) => (
          <PlanetCard
            key={world.id}
            world={world}
            save={save}
            onOpen={() => onOpenWorld(world.id)}
          />
        ))}
      </div>

      {onHangar === undefined ? null : (
        <button
          type="button"
          onClick={onHangar}
          className="
            min-h-touch w-full shrink-0 rounded-2xl border-3 border-outline bg-mint px-4 py-3
            font-title text-xl text-outline shadow-hard transition-transform
            active:translate-y-1 active:shadow-none
          "
        >
          격납고
        </button>
      )}
    </div>
  )
}

function PlanetCard({
  world,
  save,
  onOpen,
}: {
  world: WorldMeta
  save: SaveData
  onOpen: () => void
}) {
  const unlocked = isWorldUnlocked(save, world.id)
  const playable = isPlayable(world)
  const progress = worldProgress(save, world.id)
  const stars =
    progress.stars.reduce((sum, star) => sum + Math.max(0, star), 0) +
    Math.max(0, progress.bossStars)

  const open = unlocked && playable

  return (
    <button
      type="button"
      onClick={onOpen}
      disabled={!open}
      className={`
        flex min-h-[104px] flex-col items-center justify-center gap-1 rounded-2xl border-3
        border-outline px-2 py-3 shadow-hard transition-transform
        active:translate-y-1 active:shadow-none
        disabled:translate-y-1 disabled:shadow-none
        ${open ? 'bg-panel' : 'bg-panel/50'}
      `}
    >
      <Planet id={world.id} dimmed={!open} />
      <span className={`text-center text-sm font-bold ${open ? 'text-paper' : 'text-paper/50'}`}>
        {world.name}
      </span>
      {open ? (
        <span className="text-sm font-bold text-energy">★ {stars}</span>
      ) : (
        <span className="text-sm font-bold text-paper/50">
          {playable ? '잠김' : '준비 중'}
        </span>
      )}
    </button>
  )
}

const PLANET_COLORS = ['#FFC93C', '#4FD1C5', '#FF6B5B', '#FFF6E5', '#FFC93C', '#4FD1C5', '#FF6B5B', '#FFF6E5'] as const

function Planet({ id, dimmed }: { id: number; dimmed: boolean }) {
  const color = PLANET_COLORS[id - 1] ?? '#FFC93C'
  return (
    <svg viewBox="0 0 48 48" className="h-11 w-11" aria-hidden="true" opacity={dimmed ? 0.35 : 1}>
      <circle cx={24} cy={24} r={16} fill={color} stroke="#101838" strokeWidth={3} />
      {id % 2 === 0 ? (
        <ellipse
          cx={24}
          cy={26}
          rx={22}
          ry={6}
          fill="none"
          stroke="#101838"
          strokeWidth={3}
          transform="rotate(-18 24 26)"
        />
      ) : (
        <circle cx={18} cy={19} r={4} fill="#101838" opacity={0.25} />
      )}
    </svg>
  )
}

function StageList({
  world,
  save,
  onBack,
  onPlay,
}: {
  world: WorldMeta
  save: SaveData
  onBack: () => void
  onPlay: (world: WorldId, level: StageLevel) => void
}) {
  return (
    <div className="flex flex-1 flex-col gap-3 overflow-hidden p-4">
      <header className="flex flex-col items-center gap-1">
        <h1 className="font-title text-2xl text-energy">{world.name}</h1>
        <p className="text-sm text-paper/70">{world.topic}</p>
      </header>

      <div className="flex flex-1 flex-col justify-center gap-2.5">
        {STAGE_ORDER.map((level) => {
          const unlocked = isStageUnlocked(save, world.id, level)
          const stars = starsOf(save, world.id, level)
          const boss = level === 'boss'

          return (
            <button
              key={String(level)}
              type="button"
              onClick={() => onPlay(world.id, level)}
              disabled={!unlocked}
              className={`
                flex min-h-touch items-center justify-between rounded-2xl border-3 border-outline
                px-4 py-3 shadow-hard transition-transform
                active:translate-y-1 active:shadow-none
                disabled:translate-y-1 disabled:shadow-none
                ${boss ? 'bg-coral' : 'bg-panel'}
                ${unlocked ? '' : 'opacity-50'}
              `}
            >
              <span className="font-title text-xl text-paper">
                {boss ? `보스 · ${world.partName}` : `${String(level)}단계`}
              </span>
              {unlocked ? <StarRating count={Math.max(0, stars)} /> : <LockIcon />}
            </button>
          )
        })}
      </div>

      <button
        type="button"
        onClick={onBack}
        className="
          min-h-touch w-full shrink-0 rounded-2xl border-3 border-outline bg-mint px-4 py-3
          font-title text-xl text-outline shadow-hard transition-transform
          active:translate-y-1 active:shadow-none
        "
      >
        우주로
      </button>
    </div>
  )
}

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        d="M12 2.6l2.9 5.9 6.5.95-4.7 4.6 1.1 6.45L12 17.45 6.2 20.5l1.1-6.45-4.7-4.6 6.5-.95z"
        fill="#FFC93C"
        stroke="#101838"
        strokeWidth={2}
        strokeLinejoin="round"
      />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" role="img" aria-label="잠김">
      <rect x={4} y={10} width={16} height={11} rx={3} fill="#FFF6E5" stroke="#101838" strokeWidth={2.5} />
      <path d="M8 10V7.5a4 4 0 0 1 8 0V10" fill="none" stroke="#FFF6E5" strokeWidth={2.5} />
    </svg>
  )
}
