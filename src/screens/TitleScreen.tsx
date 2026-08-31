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

/** 오리지널 로봇 얼굴. 기존 로봇 IP 의 이름·디자인을 쓰지 않는다. (CLAUDE.md 절대 규칙 5) */
function RobotMark() {
  return (
    <svg viewBox="0 0 120 120" className="w-40" role="img" aria-label="로봇 얼굴">
      <rect x={22} y={12} width={76} height={16} rx={8} fill="#4FD1C5" stroke="#101838" strokeWidth={4} />
      <rect x={56} y={4} width={8} height={12} fill="#101838" />
      <rect x={16} y={30} width={88} height={72} rx={16} fill="#2C3E8F" stroke="#101838" strokeWidth={4} />
      <circle cx={42} cy={58} r={11} fill="#FFC93C" stroke="#101838" strokeWidth={4} />
      <circle cx={78} cy={58} r={11} fill="#FFC93C" stroke="#101838" strokeWidth={4} />
      <rect x={40} y={80} width={40} height={12} rx={6} fill="#FF6B5B" stroke="#101838" strokeWidth={4} />
      <rect x={4} y={48} width={12} height={28} rx={5} fill="#4FD1C5" stroke="#101838" strokeWidth={4} />
      <rect x={104} y={48} width={12} height={28} rx={5} fill="#4FD1C5" stroke="#101838" strokeWidth={4} />
    </svg>
  )
}
