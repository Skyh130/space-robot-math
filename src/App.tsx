import { AppShell } from './components/AppShell'

/**
 * Phase 0 자리표시 화면.
 * 배경색·폰트·외곽선·단색 그림자가 실제 기기에서 제대로 나오는지 확인하는 용도이며,
 * Phase 2에서 문제 화면으로 교체된다.
 */
export default function App() {
  return (
    <AppShell>
      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
        <h1 className="font-title text-4xl text-energy">우주 로봇 수학 모험</h1>

        <p className="text-question text-paper">부품을 모아 로봇을 완성하자!</p>

        <div className="w-full rounded-3xl border-3 border-outline bg-panel px-5 py-6 shadow-hard">
          <p className="text-paper">이 카드가 두꺼운 외곽선과 단색 그림자로 보이면 정상이다.</p>
          <p className="mt-3 text-number font-bold text-energy">1234567890</p>
        </div>
      </main>
    </AppShell>
  )
}
