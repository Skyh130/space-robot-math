type NumPadProps = {
  /** 지금까지 누른 숫자. */
  value: string
  onChange: (next: string) => void
  onSubmit: () => void
  /** 몇 자리까지 받을지. 답이 네 자리를 넘는 문제는 없다. */
  maxLength?: number
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
  disabled = false,
}: NumPadProps) {
  const press = (digit: string) => {
    if (value.length >= maxLength) return
    // 앞자리 0만 계속 쌓이는 것을 막는다
    onChange(value === '0' ? digit : value + digit)
  }

  const erase = () => onChange(value.slice(0, -1))
  const canSubmit = value.length > 0 && !disabled

  return (
    <div className="flex w-full flex-col gap-3 short:gap-1.5">
      <AnswerSlot value={value} />

      <div className="grid grid-cols-3 gap-2.5 short:gap-1.5">
        {DIGITS.map((digit) => (
          <Key key={digit} onPress={() => press(digit)} disabled={disabled} tone="number">
            {digit}
          </Key>
        ))}

        <Key onPress={erase} disabled={disabled || value.length === 0} tone="erase" label="지우기">
          <BackspaceIcon />
        </Key>

        <Key onPress={() => press('0')} disabled={disabled} tone="number">
          0
        </Key>

        <Key onPress={onSubmit} disabled={!canSubmit} tone="submit" label="확인">
          확인
        </Key>
      </div>
    </div>
  )
}

/** 누른 숫자가 쌓이는 칸. 비어 있을 때도 높이가 흔들리지 않는다. */
function AnswerSlot({ value }: { value: string }) {
  return (
    <div
      className="
        flex h-16 w-full items-center justify-center rounded-2xl border-3
        border-outline bg-paper px-4 short:h-12
      "
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
}: {
  children: React.ReactNode
  onPress: () => void
  disabled: boolean
  tone: KeyTone
  label?: string
}) {
  return (
    <button
      type="button"
      onClick={onPress}
      disabled={disabled}
      {...(label === undefined ? {} : { 'aria-label': label })}
      className={`
        flex h-16 min-h-key items-center justify-center rounded-2xl border-3
        border-outline text-number font-bold shadow-hard transition-transform
        short:h-12 short:min-h-touch short:text-number-tight
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
