import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { AppShell } from './components/AppShell'
import { HintVisualView } from './components/HintVisual'
import { STAGE_ORDER, templatesFor, worldById } from './data/worlds'
import { buildStage, checkAnswer, stageSeed, type StageLevel } from './engine'
import { Feedback } from './components/Feedback'
import { QuestionCard } from './components/QuestionCard'
import { ResultScreen } from './screens/ResultScreen'
import { StageScreen } from './screens/StageScreen'
import { TitleScreen } from './screens/TitleScreen'
import './styles/index.css'

/**
 * 화면 검사용 하네스. 제품에는 들어가지 않는다.
 *
 * vite build 의 입력은 index.html 하나뿐이라 이 페이지는 dist 에 나오지 않는다.
 * scripts/check-layout.mjs 가 개발 서버로 이 페이지를 열어, 각 화면이
 * 실기기 뷰포트에서 넘치지 않는지 잰다. 실제 게임에서는 문제를 풀어야만 닿는
 * 화면들을 고정된 상태로 바로 띄우기 위한 것이다.
 */
const params = new URLSearchParams(window.location.search)
const screen = params.get('screen') ?? 'title'
const world = worldById(1)

function stageAt(level: StageLevel) {
  return buildStage(templatesFor(world, level), stageSeed(world.id, level, 0))
}

function View() {
  if (screen === 'title') {
    return <TitleScreen onStart={() => undefined} />
  }

  if (screen === 'result') {
    return (
      <ResultScreen
        correct={7}
        total={8}
        earnedPart={world.partName}
        onRetry={() => undefined}
        onNext={() => undefined}
      />
    )
  }

  if (screen === 'feedback') {
    // 가장 키가 큰 상태다. 그림 힌트까지 다 펴고도 넘치지 않아야 한다.
    const question = stageAt(2)[0]
    if (!question) return null
    const wrong = (question.choices ?? []).find((c) => String(c) !== String(question.answer))
    return (
      <div className="flex flex-1 flex-col gap-3 overflow-hidden p-4">
        <QuestionCard prompt={question.prompt} />
        <Feedback
          result={checkAnswer(question, wrong ?? 0)}
          {...(question.hintVisual === undefined
            ? {}
            : { visual: <HintVisualView visual={question.hintVisual} /> })}
          onRetry={() => undefined}
          onNext={() => undefined}
        />
      </div>
    )
  }

  const level = (STAGE_ORDER.find((candidate) => String(candidate) === screen) ??
    1) as StageLevel
  return (
    <StageScreen
      questions={stageAt(level)}
      label={`${world.name} · ${level === 'boss' ? '보스' : `${String(level)}단계`}`}
      onFinish={() => undefined}
    />
  )
}

const container = document.getElementById('root')
if (container) {
  createRoot(container).render(
    <StrictMode>
      <AppShell>
        <View />
      </AppShell>
    </StrictMode>,
  )
}
