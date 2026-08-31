type TimerBarProps = {
  remainingSeconds: number
  totalSeconds: number
}

/**
 * 남은 시간 막대.
 *
 * 게임 전체에서 이 컴포넌트를 쓰는 곳은 W3 보스 하나뿐이다.
 * (설계서 5장, CLAUDE.md 절대 규칙 3) 다른 어떤 화면에도 붙이지 않는다.
 * 구구단은 속도 자동화가 학습 목표라 여기서만 시간을 잰다.
 */
export function TimerBar({ remainingSeconds, totalSeconds }: TimerBarProps) {
  const ratio = totalSeconds === 0 ? 0 : Math.max(0, remainingSeconds) / totalSeconds
  const hurry = remainingSeconds <= 10

  return (
    <div className="flex items-center gap-2" aria-label={`남은 시간 ${Math.max(0, Math.ceil(remainingSeconds))}초`}>
      <div className="h-4 flex-1 overflow-hidden rounded-full border-3 border-outline bg-panel">
        <div
          className={`h-full rounded-full transition-[width] duration-300 ease-linear ${hurry ? 'bg-coral' : 'bg-energy'}`}
          style={{ width: `${String(ratio * 100)}%` }}
        />
      </div>
      <span className={`w-10 text-right text-lg font-bold tabular-nums ${hurry ? 'text-coral' : 'text-paper'}`}>
        {Math.max(0, Math.ceil(remainingSeconds))}
      </span>
    </div>
  )
}
