import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

import {
  defaultSave,
  loadSave,
  recordStage,
  writeSave,
  type SaveData,
  type StageRecord,
} from './save'

/**
 * 진행 상태 훅.
 *
 * 상태 라이브러리는 쓰지 않는다. (CLAUDE.md 기술 스택)
 * 저장은 값이 바뀔 때마다 바로 기록한다. 아이가 앱을 갑자기 닫아도 별이 남아야 한다.
 */

type ProgressValue = {
  readonly save: SaveData
  /** 스테이지 결과를 반영하고 곧바로 저장한다. */
  readonly finishStage: (record: StageRecord) => SaveData
  /** 처음부터 다시 시작한다. */
  readonly reset: () => void
}

const ProgressContext = createContext<ProgressValue | null>(null)

export function ProgressProvider({
  children,
  storage,
}: {
  children: ReactNode
  /** 테스트에서 가짜 저장소를 넣기 위한 구멍. */
  storage?: Storage
}) {
  const [save, setSave] = useState<SaveData>(() => loadSave(storage))

  const finishStage = useCallback(
    (record: StageRecord) => {
      const next = recordStage(save, record)
      setSave(next)
      writeSave(next, storage)
      return next
    },
    [save, storage],
  )

  const reset = useCallback(() => {
    const next = defaultSave()
    setSave(next)
    writeSave(next, storage)
  }, [storage])

  const value = useMemo<ProgressValue>(
    () => ({ save, finishStage, reset }),
    [save, finishStage, reset],
  )

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
}

export function useProgress(): ProgressValue {
  const value = useContext(ProgressContext)
  if (!value) {
    throw new Error('useProgress 는 ProgressProvider 안에서만 쓸 수 있다.')
  }
  return value
}
