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
 * - 태블릿에서는 최대 폭 480px 로 중앙 정렬한다. 가로 레이아웃은 만들지 않는다.
 * - 노치·홈 인디케이터를 피하도록 safe-area inset 만큼 안쪽 여백을 준다.
 * - 기기를 눕히면 게임을 가리고 회전 안내를 띄운다.
 */
export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex h-dvh justify-center bg-deep">
      <RotateNotice />
      <div
        className="
          flex w-full max-w-app flex-col overflow-hidden bg-deep
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
