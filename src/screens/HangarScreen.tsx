import { RobotFigure } from '../components/RobotFigure'
import { WORLDS } from '../data/worlds'
import type { SaveData } from '../state/save'

type HangarScreenProps = {
  save: SaveData
  onBack: () => void
}

/**
 * 격납고. 지금까지 모은 부품이 로봇에 붙어 있는 모습을 본다. (설계서 6장)
 *
 * 여기는 조용한 화면이다. 화려한 연출은 부품을 받는 순간 한 곳에만 몰아준다.
 * (CLAUDE.md 비주얼 방향)
 */
export function HangarScreen({ save, onBack }: HangarScreenProps) {
  return (
    <div className="flex flex-1 flex-col gap-3 overflow-hidden p-4">
      <header className="flex items-center justify-between">
        <h1 className="font-title text-2xl text-energy">격납고</h1>
        <div className="rounded-xl border-3 border-outline bg-panel px-3 py-1">
          <span className="text-base font-bold text-paper">
            부품 {save.parts.length} / {WORLDS.length}
          </span>
        </div>
      </header>

      {/*
        SVG 를 그냥 두면 제 크기(200×250)만큼 자리를 차지해 작은 폰에서 화면이 넘친다.
        자리에서 떼어 내 남는 공간에만 그리게 한다.
      */}
      <div className="relative min-h-0 flex-1">
        <RobotFigure parts={save.parts} className="absolute inset-0 h-full w-full" />
      </div>

      <div className="grid shrink-0 grid-cols-2 gap-1.5">
        {WORLDS.map((world) => {
          const owned = save.parts.includes(world.part)
          return (
            <div
              key={world.id}
              className={`
                flex items-center gap-1.5 rounded-xl border-3 border-outline px-2 py-1
                ${owned ? 'bg-energy' : 'bg-panel'}
              `}
            >
              <span className={`text-sm font-bold ${owned ? 'text-outline' : 'text-paper/40'}`}>
                {owned ? '●' : '○'}
              </span>
              <span className={`text-sm font-bold ${owned ? 'text-outline' : 'text-paper/40'}`}>
                {world.partName}
              </span>
            </div>
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
