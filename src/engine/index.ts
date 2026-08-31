/** 문제 엔진 공개 창구. 화면 코드는 여기서만 가져다 쓴다. */

export * from './types'
export { createRng, hashSeed, type Rng } from './rng'
export {
  generateQuestion,
  composeQuestion,
  checkAnswer,
  isSameAnswer,
  type GenerateOptions,
} from './generator'
export {
  findTemplateIssues,
  describeIssues,
  type TemplateIssue,
  type ValidateOptions,
} from './validate'
export { josa, josaOf, readNumberKo, type JosaPair } from './korean'
export {
  buildStage,
  stageSeed,
  starsFor,
  QUESTIONS_PER_STAGE,
  type BuildStageOptions,
} from './stage'
export {
  adjacentTable,
  borrowMissed,
  carryMissed,
  digitShift,
  multiplyAsAdd,
  offByOne,
  offByTen,
  operationReversed,
  placeConfused,
} from './distractors'
