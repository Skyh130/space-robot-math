/**
 * 기기를 눕혔을 때 뜨는 안내.
 *
 * 웹은 CSS만으로 화면 방향을 잠글 수 없어서, 가로가 되면 게임을 가리고
 * 세로로 돌리라고 알려준다. 진짜 잠금은 홈 화면에 추가했을 때
 * PWA 매니페스트의 orientation 이 처리한다. (Phase 6)
 *
 * 표시 조건은 tailwind.config.ts 의 `rotated` 스크린이 정한다.
 */
export function RotateNotice() {
  return (
    <div
      className="
        fixed inset-0 z-50 hidden flex-col items-center justify-center gap-5
        bg-deep px-8 text-center rotated:flex
      "
    >
      <RotateIcon />
      <p className="font-title text-3xl text-energy">화면을 세로로 돌려줘!</p>
      <p className="text-paper">이 게임은 세로로만 할 수 있어.</p>
    </div>
  )
}

function RotateIcon() {
  return (
    <svg
      viewBox="0 0 160 124"
      className="w-40"
      role="img"
      aria-label="기기를 세로로 돌리는 그림"
    >
      {/* 돌리는 방향을 알려주는 화살표 */}
      <path
        d="M44 34 A 42 42 0 0 1 116 34"
        fill="none"
        stroke="#FFC93C"
        strokeWidth={7}
        strokeLinecap="round"
      />
      <polygon
        points="123,46 104,34 122,24"
        fill="#FFC93C"
        stroke="#101838"
        strokeWidth={3}
        strokeLinejoin="round"
      />

      {/* 눕혀진 기기 */}
      <rect
        x={28}
        y={58}
        width={104}
        height={56}
        rx={12}
        fill="#2C3E8F"
        stroke="#101838"
        strokeWidth={5}
      />
      <rect x={40} y={70} width={80} height={32} rx={5} fill="#1B2A6B" />
    </svg>
  )
}
