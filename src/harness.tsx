import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { AppShell } from './components/AppShell'
import { HintVisualView } from './components/HintVisual'
import { STAGE_ORDER, stageRuleFor, templatesFor, worldById } from './data/worlds'
import { buildStage, checkAnswer, stageSeed, type StageLevel, type WorldId } from './engine'
import { Feedback } from './components/Feedback'
import { QuestionCard } from './components/QuestionCard'
import { ResultScreen } from './screens/ResultScreen'
import { BossIntroScreen } from './screens/BossIntroScreen'
import { HangarScreen } from './screens/HangarScreen'
import { PartRewardScreen } from './screens/PartRewardScreen'
import { WorldMapScreen } from './screens/WorldMapScreen'
import { WORLDS } from './data/worlds'
import { defaultSave, recordStage } from './state/save'
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

function stageAt(level: StageLevel, worldId: WorldId = 1) {
  const meta = worldById(worldId)
  const rule = stageRuleFor(worldId, level)
  return buildStage(templatesFor(meta, level), stageSeed(worldId, level, 0), { count: rule.count })
}

/** 몇 판 해 본 저장. 잠금이 풀린 모습과 별이 붙은 모습을 함께 본다. */
function playedSave() {
  let save = defaultSave()
  save = recordStage(save, { world: 1, level: 1, stars: 3, correct: 8, skillLog: [] })
  save = recordStage(save, { world: 1, level: 2, stars: 2, correct: 7, skillLog: [] })
  save = recordStage(save, { world: 1, level: 3, stars: 0, correct: 4, skillLog: [] })
  return save
}

/** 보스까지 깬 저장. 도전 모드가 열린 모습을 보려면 필요하다. */
function clearedSave() {
  let save = playedSave()
  for (const level of [4, 5] as const) {
    save = recordStage(save, { world: 1, level, stars: 3, correct: 8, skillLog: [] })
  }
  save = recordStage(save, {
    world: 1,
    level: 'boss',
    stars: 3,
    correct: 8,
    skillLog: [],
    part: 'head',
  })
  return recordStage(save, { world: 1, level: 'challenge', stars: 0, correct: 17, skillLog: [] })
}

function View() {
  if (screen === 'hangar') {
    return (
      <HangarScreen
        save={{ ...defaultSave(), parts: ['head', 'left_arm', 'right_arm'] }}
        onBack={() => undefined}
      />
    )
  }

  if (screen === 'hangar-full') {
    return (
      <HangarScreen
        save={{ ...defaultSave(), parts: WORLDS.map((w) => w.part) }}
        onBack={() => undefined}
      />
    )
  }

  if (screen === 'reward') {
    return (
      <PartRewardScreen
        part="right_arm"
        partName="오른팔"
        parts={['head', 'left_arm', 'right_arm']}
        totalParts={8}
        onContinue={() => undefined}
      />
    )
  }

  if (screen === 'map-records') {
    return (
      <WorldMapScreen
        save={clearedSave()}
        openWorld={null}
        onOpenWorld={() => undefined}
        onPlay={() => undefined}
        onHangar={() => undefined}
      />
    )
  }

  if (screen === 'map') {
    return (
      <WorldMapScreen
        save={playedSave()}
        openWorld={null}
        onOpenWorld={() => undefined}
        onPlay={() => undefined}
      />
    )
  }

  if (screen === 'stages-cleared') {
    return (
      <WorldMapScreen
        save={clearedSave()}
        openWorld={1}
        onOpenWorld={() => undefined}
        onPlay={() => undefined}
      />
    )
  }

  if (screen === 'challenge') {
    const templates = templatesFor(world, 'challenge')
    return (
      <StageScreen
        questions={buildStage(templates, stageSeed(1, 'challenge', 0), { count: 40 })}
        label={`${world.name} · 60초 도전`}
        onFinish={() => undefined}
        onQuit={() => undefined}
        timeLimitSeconds={60}
        countUp
      />
    )
  }

  if (screen === 'stages') {
    return (
      <WorldMapScreen
        save={playedSave()}
        openWorld={1}
        onOpenWorld={() => undefined}
        onPlay={() => undefined}
      />
    )
  }

  if (screen === 'title') {
    return <TitleScreen onStart={() => undefined} />
  }

  if (screen === 'boss-intro') {
    return <BossIntroScreen world={world} onStart={() => undefined} />
  }

  if (screen === 'challenge-result') {
    return (
      <ResultScreen
        correct={19}
        total={40}
        challenge={{ best: 19, isRecord: true, weekBest: 19, lastWeekBest: 12 }}
        nextLabel="우주로"
        onRetry={() => undefined}
        onNext={() => undefined}
      />
    )
  }

  if (screen === 'result') {
    return (
      <ResultScreen
        correct={7}
        total={8}
        earnedPart={world.partName}
        onRetry={() => undefined}
        onNext={() => undefined}
        onMap={() => undefined}
      />
    )
  }

  // w2-3, w3-boss 처럼 월드를 지정해 여는 화면
  const scoped = /^w(\d)-(\w+)$/.exec(screen)
  if (scoped) {
    const worldId = Number(scoped[1]) as WorldId
    const raw = scoped[2] ?? '1'
    const level = (raw === 'boss' ? 'boss' : Number(raw)) as StageLevel
    const meta = worldById(worldId)
    const rule = stageRuleFor(worldId, level)
    return (
      <StageScreen
        questions={stageAt(level, worldId)}
        label={`${meta.name} · ${level === 'boss' ? '보스' : `${String(level)}단계`}`}
        onFinish={() => undefined}
        onQuit={() => undefined}
        {...(rule.timeLimitSeconds === undefined ? {} : { timeLimitSeconds: rule.timeLimitSeconds })}
      />
    )
  }

  if (screen === 'w2feedback') {
    // 세로셈 그림 힌트가 펴진 가장 키 큰 상태
    const question = stageAt(4, 2)[0]
    if (!question) return null
    return (
      <div className="flex flex-1 flex-col gap-3 overflow-hidden p-4">
        <QuestionCard prompt={question.prompt} />
        <Feedback
          result={checkAnswer(question, 0)}
          showAnswer
          {...(question.hintVisual === undefined
            ? {}
            : { visual: <HintVisualView visual={question.hintVisual} /> })}
          onRetry={() => undefined}
          onNext={() => undefined}
        />
      </div>
    )
  }

  if (screen === 'w3feedback') {
    const question = stageAt(3, 3)[0]
    if (!question) return null
    return (
      <div className="flex flex-1 flex-col gap-3 overflow-hidden p-4">
        <QuestionCard prompt={question.prompt} />
        <Feedback
          result={checkAnswer(question, 0)}
          showAnswer
          {...(question.hintVisual === undefined
            ? {}
            : { visual: <HintVisualView visual={question.hintVisual} /> })}
          onRetry={() => undefined}
          onNext={() => undefined}
        />
      </div>
    )
  }

  if (screen === 'combo') {
    // 콤보 배지 + 그림 힌트까지 다 펴진, 가장 키가 큰 상태
    const question = stageAt(2)[0]
    if (!question) return null
    const wrong = (question.choices ?? []).find((c) => String(c) !== String(question.answer))
    return (
      <div className="flex flex-1 flex-col gap-3 overflow-hidden p-4">
        <QuestionCard prompt={question.prompt} />
        <Feedback
          result={checkAnswer(question, wrong ?? 0)}
          showAnswer
          streak={8}
          {...(question.hintVisual === undefined
            ? {}
            : { visual: <HintVisualView visual={question.hintVisual} /> })}
          onRetry={() => undefined}
          onNext={() => undefined}
        />
      </div>
    )
  }

  if (screen === 'feedback-first') {
    // 처음 틀렸을 때. 답도 풀이도 없이 힌트 한 줄만 있는 상태다.
    const question = stageAt(2)[0]
    if (!question) return null
    const wrong = (question.choices ?? []).find((c) => String(c) !== String(question.answer))
    return (
      <div className="flex flex-1 flex-col gap-3 overflow-hidden p-4">
        <QuestionCard prompt={question.prompt} />
        <Feedback
          result={checkAnswer(question, wrong ?? 0)}
          showAnswer={false}
          onRetry={() => undefined}
          onNext={() => undefined}
        />
      </div>
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
          showAnswer
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
      onQuit={() => undefined}
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
