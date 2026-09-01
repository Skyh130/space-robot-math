/**
 * 연속 정답 배지.
 *
 * 정해진 고비(3, 5, 8, 그 뒤로 4개마다)를 넘길 때만 잠깐 뜬다.
 * 매번 띄우면 금세 배경이 되고, 연속이 끊겼다고 알려 주면 그게 곧 벌이다.
 * 끊길 때는 아무것도 하지 않는다. (CLAUDE.md 절대 규칙 4)
 */

/** 이 수에서 배지를 띄울지. */
export function isComboMilestone(streak: number): boolean {
  if (streak === 3 || streak === 5 || streak === 8) return true
  return streak > 8 && streak % 4 === 0
}

/** 고비마다 다른 한 마디. 셋을 돌려 쓴다. */
function cheer(streak: number): string {
  if (streak >= 12) return '멈추질 않아!'
  if (streak >= 8) return '대단해!'
  if (streak >= 5) return '불붙었다!'
  return '좋아!'
}

export function ComboBadge({ streak }: { streak: number }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="
        flex animate-pop-in items-center justify-center gap-2 rounded-2xl border-3
        border-outline bg-coral px-4 py-2 shadow-hard
      "
    >
      <FlameIcon />
      <span className="font-title text-xl text-paper">{streak}연속 {cheer(streak)}</span>
    </div>
  )
}

function FlameIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
      <path
        d="M12 2c1 4-3 5-3 9a3 3 0 0 0 6 0c0-1-.5-2-.5-2 2 1.5 3.5 3.5 3.5 6a6 6 0 0 1-12 0c0-5 6-6 6-13z"
        fill="#FFC93C"
        stroke="#101838"
        strokeWidth={2}
        strokeLinejoin="round"
      />
    </svg>
  )
}
