import type { ReactNode } from 'react'

import { RotateNotice } from './RotateNotice'

type AppShellProps = {
  children: ReactNode
}

/**
 * 모든 화면이 이 셸 안에 들어간다.
 *
 * - 세로 한 화면. 높이를 100dvh 로 못 박는다. min-height 로 두면 셸이 화면보다
 *   길어질 수 있어서, 안쪽 flex-1 이 남는 공간을 나눠 갖지 못하고 화면이 넘친다.
 * - 태블릿에서는 최대 폭 480px, 최대 높이 960px 로 가운데에 놓는다.
 *   폭만 묶고 높이를 놓아 두면 12.9인치 태블릿에서 문제 카드가 1300px 짜리 빈
 *   상자가 되고, 문제와 숫자패드가 서로 멀어져 손이 오간다.
 *   가장 큰 폰(932px)보다 조금 큰 값이라 폰에서는 위아래가 잘리지 않는다.
 *   가로 레이아웃은 만들지 않는다.
 * - 노치·홈 인디케이터를 피하도록 safe-area inset 만큼 안쪽 여백을 준다.
 * - 기기를 눕히면 게임을 가리고 회전 안내를 띄운다.
 */
export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex h-dvh items-center justify-center bg-deep">
      <RotateNotice />
      <div
        className="
          flex h-full max-h-app w-full max-w-app flex-col overflow-hidden bg-deep
          pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)]
          pr-[env(safe-area-inset-right)] pt-[env(safe-area-inset-top)]
          rotated:hidden
        "
      >
        {children}
      </div>
    </div>
  )
}
