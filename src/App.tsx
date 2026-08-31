import { useState } from 'react'

import { AppShell } from './components/AppShell'
import { STAGE_ORDER, templatesFor, worldById } from './data/worlds'
import { buildStage, stageSeed, type StageLevel } from './engine'
import { ResultScreen } from './screens/ResultScreen'
import { StageScreen, type StageOutcome } from './screens/StageScreen'
import { TitleScreen } from './screens/TitleScreen'

/**
 * Phase 3 기준 화면 흐름.
 *
 * 제목 → 월드 1 의 Lv1 … Lv5 → 보스 → 제목
 * 월드맵과 저장은 Phase 4 에서 붙인다.
 */
type Route =
  | { name: 'title' }
  | { name: 'stage'; level: StageLevel; attempt: number }
  | { name: 'result'; level: StageLevel; attempt: number; outcome: StageOutcome }

const WORLD = worldById(1)

export default function App() {
  const [route, setRoute] = useState<Route>({ name: 'title' })

  return (
    <AppShell>
      <Router route={route} onNavigate={setRoute} />
    </AppShell>
  )
}

function Router({ route, onNavigate }: { route: Route; onNavigate: (next: Route) => void }) {
  if (route.name === 'title') {
    return <TitleScreen onStart={() => onNavigate({ name: 'stage', level: 1, attempt: 0 })} />
  }

  if (route.name === 'stage') {
    const templates = templatesFor(WORLD, route.level)
    const questions = buildStage(templates, stageSeed(WORLD.id, route.level, route.attempt))
    return (
      <StageScreen
        // 스테이지가 바뀌면 진행 상태를 처음부터 다시 잡는다
        key={`${String(route.level)}-${String(route.attempt)}`}
        questions={questions}
        label={`${WORLD.name} · ${levelLabel(route.level)}`}
        onFinish={(outcome) =>
          onNavigate({ name: 'result', level: route.level, attempt: route.attempt, outcome })
        }
      />
    )
  }

  const isBoss = route.level === 'boss'
  const nextLevel = STAGE_ORDER[STAGE_ORDER.indexOf(route.level) + 1]

  return (
    <ResultScreen
      correct={route.outcome.correct}
      total={route.outcome.total}
      {...(isBoss && route.outcome.correct > 0 ? { earnedPart: WORLD.partName } : {})}
      nextLabel={nextLevel === undefined ? '처음으로' : '다음 단계'}
      onRetry={() =>
        onNavigate({ name: 'stage', level: route.level, attempt: route.attempt + 1 })
      }
      onNext={() =>
        onNavigate(
          nextLevel === undefined
            ? { name: 'title' }
            : { name: 'stage', level: nextLevel, attempt: 0 },
        )
      }
    />
  )
}

function levelLabel(level: StageLevel): string {
  return level === 'boss' ? '보스' : `${String(level)}단계`
}
