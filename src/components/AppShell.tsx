import type { ReactNode } from 'react'

type AppShellProps = {
  children: ReactNode
}

/**
 * 모든 화면이 이 셸 안에 들어간다.
 *
 * - 세로 한 화면. 스크롤이 생기지 않게 높이를 100dvh 로 잡는다.
 * - 태블릿에서는 최대 폭 480px 로 중앙 정렬한다. 가로 레이아웃은 만들지 않는다.
 * - 노치·홈 인디케이터를 피하도록 safe-area inset 만큼 안쪽 여백을 준다.
 */
export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex min-h-dvh justify-center bg-deep">
      <div
        className="
          flex w-full max-w-app flex-col overflow-hidden bg-deep
          pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)]
          pr-[env(safe-area-inset-right)] pt-[env(safe-area-inset-top)]
        "
      >
        {children}
      </div>
    </div>
  )
}
