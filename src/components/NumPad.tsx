type NumPadProps = {
  /** 지금까지 누른 숫자. */
  value: string
  onChange: (next: string) => void
  onSubmit: () => void
  /** 몇 자리까지 받을지. 답이 네 자리를 넘는 문제는 없다. */
  maxLength?: number
  /**
   * 소수점 키를 붙일지. W7 소수 문제에만 쓴다.
   *
   * 소수는 한 자리까지만 받는다. 0.50 처럼 뒤에 0을 더 붙이면 '0.5' 와 글자가
   * 달라져 맞는 답이 틀린 답이 된다. 애초에 못 누르게 막는 편이 안전하고,
   * 3학년 소수는 한 자리까지가 범위다.
   */
  decimal?: boolean
  /**
   * 그림이 붙은 문제에서 쓰는 좁은 모드. 키를 64px 에서 56px 로 줄인다.
   * 시계나 표가 자리를 먹으므로 이만큼을 그림에 돌려준다.
   * 48px 아래로는 절대 내려가지 않는다. 그건 터치 최소치다.
   */
  compact?: boolean
  disabled?: boolean
}

const DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'] as const
const DEFAULT_MAX_LENGTH = 4

/**
 * 화면 아래쪽 숫자패드.
 *
 * 키는 64px 아래로 내려가지 않는다. 8살 손가락이 옆 키를 누르면 그건 오답이 아니라
 * 우리 잘못이다. 누른 순간 키가 4px 내려앉아 눌렸다는 것이 손끝으로 보인다.
 */
export function NumPad({
  value,
  onChange,
  onSubmit,
  maxLength = DEFAULT_MAX_LENGTH,
  decimal = false,
  compact = false,
  disabled = false,
}: NumPadProps) {
  const dotAt = value.indexOf('.')
  const decimalsTyped = dotAt === -1 ? 0 : value.length - dotAt - 1

  const press = (digit: string) => {
    if (value.length >= maxLength) return
    // 소수는 한 자리까지만. 0.50 을 못 만들게 막아 '0.5' 와 어긋나지 않게 한다.
    if (decimal && decimalsTyped >= 1) return
    // 앞자리 0만 계속 쌓이는 것을 막는다. 소수의 '0.' 은 0 이 앞에 와야 한다.
    onChange(value === '0' ? digit : value + digit)
  }

  /** 소수점. 비어 있을 때 누르면 '0.' 으로 시작한다. 점을 두 번 찍을 수는 없다. */
  const pressDot = () => {
    if (dotAt !== -1 || value.length + 1 >= maxLength) return
    onChange(value === '' ? '0.' : `${value}.`)
  }

  const erase = () => onChange(value.slice(0, -1))
  // 점으로 끝나는 '0.' 은 아직 답이 아니다
  const canSubmit = value.length > 0 && !value.endsWith('.') && !disabled

  return (
    <div className={`flex w-full flex-col short:gap-1.5 ${compact ? 'gap-1.5' : 'gap-3'}`}>
      <AnswerSlot value={value} compact={compact} />

      <div className={`grid grid-cols-3 short:gap-1.5 ${compact ? 'gap-2' : 'gap-2.5'}`}>
        {DIGITS.map((digit) => (
          <Key key={digit} onPress={() => press(digit)} disabled={disabled} tone="number" compact={compact}>
            {digit}
          </Key>
        ))}

        {decimal ? (
          <Key onPress={pressDot} disabled={disabled || dotAt !== -1} tone="number" label="소수점" compact={compact}>
            .
          </Key>
        ) : (
          <Key onPress={erase} disabled={disabled || value.length === 0} tone="erase" label="지우기" compact={compact}>
            <BackspaceIcon />
          </Key>
        )}

        <Key onPress={() => press('0')} disabled={disabled} tone="number" compact={compact}>
          0
        </Key>

        <Key onPress={onSubmit} disabled={!canSubmit} tone="submit" label="확인" compact={compact}>
          확인
        </Key>

        {/* 소수점 키가 자리를 하나 먹으므로 지우기를 한 줄 아래로 내린다 */}
        {decimal ? (
          <Key onPress={erase} disabled={disabled || value.length === 0} tone="erase" label="지우기" compact={compact}>
            <BackspaceIcon />
          </Key>
        ) : null}
      </div>
    </div>
  )
}

/** 누른 숫자가 쌓이는 칸. 비어 있을 때도 높이가 흔들리지 않는다. */
function AnswerSlot({ value, compact }: { value: string; compact: boolean }) {
  return (
    <div
      className={`
        flex w-full items-center justify-center rounded-2xl border-3
        border-outline bg-paper px-4 short:h-12
        ${compact ? 'h-12' : 'h-16'}
      `}
      aria-live="polite"
      aria-label="내가 쓴 답"
    >
      {value === '' ? (
        <span className="text-question text-outline/40">여기에 답을 써 줘</span>
      ) : (
        <span className="text-number font-bold text-outline">{value}</span>
      )}
    </div>
  )
}

type KeyTone = 'number' | 'erase' | 'submit'

const TONE_STYLE: Readonly<Record<KeyTone, string>> = {
  number: 'bg-paper text-outline',
  erase: 'bg-mint text-outline',
  submit: 'bg-energy text-outline',
}

function Key({
  children,
  onPress,
  disabled,
  tone,
  label,
  compact = false,
}: {
  children: React.ReactNode
  onPress: () => void
  disabled: boolean
  tone: KeyTone
  label?: string
  compact?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onPress}
      disabled={disabled}
      {...(label === undefined ? {} : { 'aria-label': label })}
      className={`
        flex items-center justify-center rounded-2xl border-3
        border-outline font-bold shadow-hard transition-transform
        short:h-12 short:min-h-touch short:text-number-tight
        ${compact ? 'h-14 min-h-touch text-number-tight' : 'h-16 min-h-key text-number'}
        active:translate-y-1 active:shadow-none
        disabled:translate-y-1 disabled:border-outline/40 disabled:bg-panel
        disabled:text-paper/40 disabled:shadow-none
        ${TONE_STYLE[tone]}
      `}
    >
      {children}
    </button>
  )
}

function BackspaceIcon() {
  return (
    <svg viewBox="0 0 32 24" className="h-7 w-9" aria-hidden="true">
      <path
        d="M11 2h17a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H11L2 12z"
        fill="none"
        stroke="#101838"
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <path
        d="M16 9l8 6M24 9l-8 6"
        stroke="#101838"
        strokeWidth={3}
        strokeLinecap="round"
      />
    </svg>
  )
}
