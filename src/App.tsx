import { useState } from 'react'

import { AppShell } from './components/AppShell'
import {
  isChallenge,
  STAGE_ORDER,
  stageRuleFor,
  templatesFor,
  WORLDS,
  worldById,
} from './data/worlds'
import { buildStage, stageSeed, starsFor, type StageLevel, type WorldId } from './engine'
import { HangarScreen } from './screens/HangarScreen'
import { PartRewardScreen } from './screens/PartRewardScreen'
import { ResultScreen } from './screens/ResultScreen'
import { StageScreen, type StageOutcome } from './screens/StageScreen'
import { TitleScreen } from './screens/TitleScreen'
import { WorldMapScreen } from './screens/WorldMapScreen'
import { bestChallengeOf, playsOf } from './state/save'
import { ProgressProvider, useProgress } from './state/useProgress'

/**
 * 화면 흐름.
 *
 * 제목 → 월드맵 → (행성) 단계 목록 → 스테이지 → 결과 → 단계 목록
 * 격납고는 Phase 6 에서 붙인다.
 */
type Route =
  | { name: 'title' }
  | { name: 'map'; openWorld: WorldId | null }
  | { name: 'hangar' }
  | { name: 'stage'; world: WorldId; level: StageLevel; attempt: number }
  | { name: 'reward'; world: WorldId }
  | {
      name: 'result'
      world: WorldId
      level: StageLevel
      attempt: number
      outcome: StageOutcome
      /** 이 판에서 부품을 처음 받았는지. 받았다면 결과 다음에 획득 연출이 온다. */
      newPart: boolean
      /** 도전 모드에 들어가기 전의 최고 기록. 신기록인지 가리는 데 쓴다. */
      bestBefore: number
    }

export default function App({ storage }: { storage?: Storage }) {
  return (
    <ProgressProvider {...(storage === undefined ? {} : { storage })}>
      <AppShell>
        <Router />
      </AppShell>
    </ProgressProvider>
  )
}

function Router() {
  const { save, finishStage } = useProgress()
  const [route, setRoute] = useState<Route>({ name: 'title' })

  if (route.name === 'title') {
    return <TitleScreen onStart={() => setRoute({ name: 'map', openWorld: null })} />
  }

  if (route.name === 'map') {
    return (
      <WorldMapScreen
        save={save}
        openWorld={route.openWorld}
        onOpenWorld={(world) => setRoute({ name: 'map', openWorld: world })}
        onPlay={(world, level) =>
          setRoute({ name: 'stage', world, level, attempt: playsOf(save, world, level) })
        }
        onHangar={() => setRoute({ name: 'hangar' })}
      />
    )
  }

  if (route.name === 'hangar') {
    return <HangarScreen save={save} onBack={() => setRoute({ name: 'map', openWorld: null })} />
  }

  if (route.name === 'reward') {
    const world = worldById(route.world)
    return (
      <PartRewardScreen
        part={world.part}
        partName={world.partName}
        parts={save.parts}
        totalParts={WORLDS.length}
        onContinue={() => setRoute({ name: 'hangar' })}
      />
    )
  }

  if (route.name === 'stage') {
    const world = worldById(route.world)
    const templates = templatesFor(world, route.level)
    const rule = stageRuleFor(world.id, route.level)
    const questions = buildStage(templates, stageSeed(world.id, route.level, route.attempt), {
      count: rule.count,
    })
    return (
      <StageScreen
        key={`${String(route.world)}-${String(route.level)}-${String(route.attempt)}`}
        questions={questions}
        templates={templates}
        {...(rule.timeLimitSeconds === undefined
          ? {}
          : { timeLimitSeconds: rule.timeLimitSeconds })}
        countUp={isChallenge(route.level)}
        label={`${world.name} · ${levelLabel(route.level)}`}
        onQuit={() => setRoute({ name: 'map', openWorld: route.world })}
        onFinish={(outcome) => {
          const stars = starsFor(outcome.correct, outcome.total, rule.starThresholds)
          const hadPart = save.parts.includes(world.part)
          const bestBefore = bestChallengeOf(save, route.world)
          finishStage({
            world: route.world,
            level: route.level,
            stars,
            correct: outcome.correct,
            skillLog: outcome.skillLog,
            ...(route.level === 'boss' ? { part: world.part } : {}),
          })
          setRoute({
            ...route,
            name: 'result',
            outcome,
            // 이미 가진 부품을 또 받는 연출은 하지 않는다
            newPart: route.level === 'boss' && stars >= 1 && !hadPart,
            bestBefore,
          })
        }}
      />
    )
  }

  const world = worldById(route.world)
  const rule = stageRuleFor(route.world, route.level)
  const stars = starsFor(route.outcome.correct, route.outcome.total, rule.starThresholds)
  const nextLevel = STAGE_ORDER[STAGE_ORDER.indexOf(route.level) + 1]
  const gotPart = route.level === 'boss' && stars >= 1

  // 도전 모드는 별도 부품도 없다. 기록만 남는다.
  if (isChallenge(route.level)) {
    return (
      <ResultScreen
        correct={route.outcome.correct}
        total={route.outcome.total}
        challenge={{
          best: Math.max(route.bestBefore, route.outcome.correct),
          isRecord: route.outcome.correct > route.bestBefore,
        }}
        nextLabel="우주로"
        onRetry={() =>
          setRoute({
            name: 'stage',
            world: route.world,
            level: route.level,
            attempt: route.attempt + 1,
          })
        }
        onNext={() => setRoute({ name: 'map', openWorld: route.world })}
      />
    )
  }

  return (
    <ResultScreen
      correct={route.outcome.correct}
      total={route.outcome.total}
      {...(gotPart ? { earnedPart: world.partName } : {})}
      nextLabel={route.newPart ? '부품 받기' : nextLevel === undefined ? '우주로' : '다음 단계'}
      onRetry={() =>
        setRoute({
          name: 'stage',
          world: route.world,
          level: route.level,
          attempt: route.attempt + 1,
        })
      }
      onNext={() =>
        setRoute(
          route.newPart
            ? { name: 'reward', world: route.world }
            : nextLevel === undefined
              ? { name: 'map', openWorld: route.world }
              : {
                  name: 'stage',
                  world: route.world,
                  level: nextLevel,
                  attempt: playsOf(save, route.world, nextLevel),
                },
        )
      }
      {...(nextLevel === undefined
        ? {}
        : { onMap: () => setRoute({ name: 'map', openWorld: route.world }) })}
    />
  )
}

function levelLabel(level: StageLevel): string {
  if (level === 'boss') return '보스'
  if (level === 'challenge') return '60초 도전'
  return `${String(level)}단계`
}
