type TitleScreenProps = {
  onStart: () => void
}

export function TitleScreen({ onStart }: TitleScreenProps) {
  return (
    <div className="flex flex-1 flex-col p-6">
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-8">
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

      <Credits />
    </div>
  )
}

/**
 * 만든이.
 *
 * 제목 화면 맨 아래 한 줄로만 둔다. 따로 화면을 만들면 아이가 들어갈 일이 없고,
 * 여기라면 게임을 켤 때마다 스치듯 보인다.
 *
 * 버튼으로 만들지 않는다. 이 화면에 누를 것이 '출발!' 하나뿐이어야 8살이
 * 설명 없이도 무엇을 눌러야 할지 안다. (테스트가 버튼 개수를 지킨다)
 *
 * 글자는 14px 아래로 내리지 않는다. 작은 폰에서 안 보이는 잔글씨는
 * 적어 두나 마나다. (scripts/check-layout.mjs)
 * 좁은 화면에서는 두 줄로 접히는데, text-balance 를 걸어 두 줄 길이를 비슷하게
 * 맞춘다. 이게 없으면 마지막 한 단어만 떨어져 내려와 흘린 것처럼 보인다.
 * 이름과 메일은 가운뎃점으로 잇지 않고 줄을 나눈다. 280px 폭에서 접히면
 * 가운뎃점만 다음 줄 맨 앞에 남아 흘린 글자처럼 보였다.
 */
function Credits() {
  return (
    <footer
      className="
        flex shrink-0 flex-col items-center gap-0.5 text-balance pt-6 text-center text-sm
        short:pt-3
      "
    >
      <p className="text-mint">For Kai — who builds robots out of numbers.</p>
      <p className="text-paper/70">Made by SkyHan</p>
      <p className="text-paper/60">ai.teacher.sg@gmail.com</p>
    </footer>
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
