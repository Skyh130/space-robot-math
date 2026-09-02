type TitleScreenProps = {
  onStart: () => void
}

export function TitleScreen({ onStart }: TitleScreenProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 p-6">
      <RobotMark />

      <div className="flex flex-col items-center gap-2">
        <h1 className="font-title text-4xl text-energy">우주 로봇</h1>
        <h1 className="font-title text-4xl text-energy">수학 모험</h1>
      </div>

      <button
        type="button"
        onClick={onStart}
        className="
          min-h-touch w-full max-w-xs rounded-2xl border-3 border-outline bg-coral px-6 py-4
          font-title text-3xl text-paper shadow-hard transition-transform
          active:translate-y-1 active:shadow-none
        "
      >
        출발!
      </button>
    </div>
  )
}

/**
 * 오리지널 메카닉의 헤드 유닛.
 *
 * 기존 로봇 IP 의 이름·디자인·형태를 쓰지 않는다. (CLAUDE.md 절대 규칙 5)
 * 격납고에 서 있는 기체(RobotFigure)와 같은 조형이어야 같은 로봇으로 읽힌다.
 */
function RobotMark() {
  const edge = { stroke: '#101838', strokeWidth: 4, strokeLinejoin: 'round' } as const
  return (
    <svg viewBox="0 0 120 120" className="w-40" role="img" aria-label="로봇 얼굴">
      <path d="M44 96 L76 96 L73 114 L47 114 Z" fill="#2C3E8F" {...edge} />
      <path d="M16 48 L28 44 L28 76 L16 72 Z" fill="#2C3E8F" {...edge} />
      <path d="M104 48 L92 44 L92 76 L104 72 Z" fill="#2C3E8F" {...edge} />
      <path d="M49 4 L71 4 L74 18 L46 18 Z" fill="#2C3E8F" {...edge} />
      <path d="M28 40 L42 18 L78 18 L92 40 L92 76 L78 96 L42 96 L28 76 Z" fill="#FFF6E5" {...edge} />
      <path d="M34 46 L86 46 L79 68 L41 68 Z" fill="#FFC93C" {...edge} />
      <path d="M60 47 L60 67" stroke="#101838" strokeWidth={2} opacity={0.4} />
      <circle cx={60} cy={9} r={5} fill="#4FD1C5" stroke="#101838" strokeWidth={3} />
    </svg>
  )
}
