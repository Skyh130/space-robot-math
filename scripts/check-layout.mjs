/**
 * 실기기 뷰포트에서 화면이 넘치지 않는지 검사한다.
 *
 * "스크롤 없이 한 화면에 문제 하나가 다 들어와야 한다"는 눈으로만 확인할 수 없다.
 * 각 화면을 harness.html 로 고정된 상태로 띄운 뒤, 스크롤 발생·터치 타깃 크기·
 * 글자 크기·화면 밖으로 나간 요소·상자 안에서 잘린 내용을 실제 렌더 결과에서 잰다.
 *
 * 검사할 때마다 직접 빌드해서 그 결과를 띄운다. 개발 서버에 붙이면 tailwind 설정을
 * 고친 뒤 재시작하지 않았을 때 옛 CSS 를 재서, 멀쩡한 화면이 실패하거나 깨진 화면이
 * 통과한다. 실제로 한 번 그렇게 속았다.
 *
 *   npm run check:layout
 */
import { fileURLToPath, URL } from 'node:url'
import { build, preview } from 'vite'
import { chromium } from 'playwright'

const SHOT_DIR = process.env.SHOT_DIR ?? null
const PORT = 4199
const OUT_DIR = 'dist-harness'
const root = fileURLToPath(new URL('..', import.meta.url))

/**
 * 검사할 기기 크기.
 *
 * 위에서 아래로 좁은 것부터 넓은 것 순이다. 맨 위 둘이 진짜 시험대다.
 * 아이가 어떤 기기를 쓸지 모르니 폴더블 커버 화면부터 12.9인치 태블릿까지 본다.
 */
const DEVICES = [
  { name: '폴더블 커버 280x653', width: 280, height: 653 },
  { name: '아주 작은 폰 320x568', width: 320, height: 568 },
  { name: '작은 안드로이드 360x640', width: 360, height: 640 },
  { name: '아이폰 SE 375x667', width: 375, height: 667 },
  { name: '아이폰 14 390x844', width: 390, height: 844 },
  { name: '픽셀 412x915', width: 412, height: 915 },
  { name: '큰 폰 430x932', width: 430, height: 932 },
  { name: '아이패드 미니 768x1024', width: 768, height: 1024 },
  { name: '아이패드 에어 820x1180', width: 820, height: 1180 },
  { name: '아이패드 프로 1024x1366', width: 1024, height: 1366 },
]

/** 검사할 화면들. harness.html?screen= 값과 같다. */
const SCREENS = [
  { name: '제목', screen: 'title' },
  { name: '월드맵', screen: 'map' },
  { name: '월드맵(도전 기록)', screen: 'map-records' },
  { name: '단계 목록', screen: 'stages' },
  { name: '단계 목록(도전 해금)', screen: 'stages-cleared' },
  { name: '60초 도전', screen: 'challenge' },
  { name: '보스 등장 컷씬', screen: 'boss-intro' },
  { name: '도전 결과(신기록)', screen: 'challenge-result' },
  { name: 'Lv1 4지선다', screen: '1' },
  { name: 'Lv2 자릿값', screen: '2' },
  { name: 'Lv3 숫자패드', screen: '3' },
  { name: 'Lv4 부등호', screen: '4' },
  { name: 'Lv5 숫자 카드', screen: '5' },
  { name: '보스 순서 배열', screen: 'boss' },
  { name: '오답 피드백(처음 — 힌트만)', screen: 'feedback-first' },
  { name: '오답 피드백(그림 힌트)', screen: 'feedback' },
  { name: '콤보 배지 + 그림 힌트', screen: 'combo' },
  { name: 'W2 Lv1 덧셈', screen: 'w2-1' },
  { name: 'W2 Lv4 세 자리', screen: 'w2-4' },
  { name: 'W2 Lv5 문장제', screen: 'w2-5' },
  { name: 'W2 오답(세로셈 힌트)', screen: 'w2feedback' },
  { name: 'W3 Lv1 구구단', screen: 'w3-1' },
  { name: 'W3 Lv5 식 세우기', screen: 'w3-5' },
  { name: 'W3 보스(타이머)', screen: 'w3-boss' },
  { name: 'W3 오답(묶음 힌트)', screen: 'w3feedback' },
  { name: '결과 화면', screen: 'result' },
  { name: '격납고(3개)', screen: 'hangar' },
  { name: '격납고(8개 완성)', screen: 'hangar-full' },
  { name: '부품 획득 연출', screen: 'reward' },
]

function measure(minKeyHeight) {
  const doc = document.documentElement
  const overflowingY = doc.scrollHeight > window.innerHeight + 1
  const overflowingX = doc.scrollWidth > window.innerWidth + 1

  const buttons = [...document.querySelectorAll('button')]
  const small = buttons
    .map((b) => ({
      label: b.textContent?.trim() || b.getAttribute('aria-label') || '?',
      r: b.getBoundingClientRect(),
    }))
    .filter(({ r }) => r.width > 0 && (r.width < 48 || r.height < 48))
    .map(({ label, r }) => `${label} ${Math.round(r.width)}x${Math.round(r.height)}`)

  const numberKeys = buttons
    .filter((b) => /^[0-9]$/.test(b.textContent?.trim() ?? ''))
    .map((b) => b.getBoundingClientRect())
  const keyTooSmall = numberKeys.filter((r) => r.height < minKeyHeight).length

  const tinyText = [...document.querySelectorAll('p, span, button')]
    .filter((el) => (el.textContent ?? '').trim().length > 0)
    .filter((el) => el.getBoundingClientRect().height > 0)
    .map((el) => ({
      text: (el.textContent ?? '').trim().slice(0, 16),
      size: Number.parseFloat(getComputedStyle(el).fontSize),
    }))
    .filter(({ size }) => size < 14)

  // 장식은 일부러 화면 밖까지 퍼진다. overflow-hidden 이 잘라 주므로 스크롤은 생기지 않는다.
  const clipped = [...document.querySelectorAll('button, p, svg, h1')]
    .filter(
      (el) =>
        el.closest('[aria-hidden="true"]') === null && el.getAttribute('aria-hidden') !== 'true',
    )
    .map((el) => ({ el, r: el.getBoundingClientRect() }))
    .filter(
      ({ r }) =>
        r.height > 0 &&
        (r.bottom > window.innerHeight + 1 || r.right > window.innerWidth + 1 || r.left < -1),
    )
    .map(
      ({ el, r }) =>
        `${el.tagName} "${(el.textContent ?? '').trim().slice(0, 12)}" bottom=${Math.round(r.bottom)}/${window.innerHeight}`,
    )

  /*
   * 제 안에서 스크롤하는 상자.
   * 화면 전체는 안 넘치는데 상자 안에서 내용이 잘리면, 검사는 통과하면서
   * 아이는 문제를 못 읽는다. 일부러 스크롤하게 둔 곳(data-scrollable)만 봐준다.
   */
  const innerClipped = [...document.querySelectorAll('*')]
    .filter((el) => {
      const style = getComputedStyle(el)
      if (!/auto|scroll/.test(style.overflowY) && !/auto|scroll/.test(style.overflowX)) return false
      if (el.closest('[data-scrollable]')) return false
      return el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1
    })
    .map(
      (el) =>
        `${el.tagName} "${(el.textContent ?? '').trim().slice(0, 14)}" ${el.scrollHeight}>${el.clientHeight}`,
    )

  return { overflowingY, overflowingX, small, keyTooSmall, tinyText, clipped, innerClipped }
}

/** 검사용 빌드. harness.html 은 여기서만 들어가고 배포본에는 없다. */
await build({
  root,
  logLevel: 'warn',
  build: {
    outDir: OUT_DIR,
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: fileURLToPath(new URL('../index.html', import.meta.url)),
        harness: fileURLToPath(new URL('../harness.html', import.meta.url)),
      },
    },
  },
})

const server = await preview({
  root,
  logLevel: 'warn',
  build: { outDir: OUT_DIR },
  preview: { port: PORT, strictPort: true },
})
const BASE = `http://localhost:${String(PORT)}/`

let failed = 0
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })

for (const device of DEVICES) {
  for (const state of SCREENS) {
    const ctx = await browser.newContext({
      viewport: { width: device.width, height: device.height },
      hasTouch: true,
      isMobile: true,
      deviceScaleFactor: 2,
    })
    const page = await ctx.newPage()
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))

    await page.goto(`${BASE}harness.html?screen=${state.screen}`, { waitUntil: 'networkidle' })
    await page.evaluate(() => document.fonts.ready)
    await page.waitForTimeout(120)

    // 세로가 아주 짧은 기기에서는 숫자키를 48px 까지 줄인다. (tailwind 의 short 화면)
    const minKeyHeight = device.height <= 620 ? 48 : 64
    const report = await page.evaluate(measure, minKeyHeight)

    const problems = []
    if (errors.length) problems.push(`화면에서 오류가 났다: ${errors.join(' / ')}`)
    if (report.overflowingY) problems.push('세로 스크롤 발생')
    if (report.overflowingX) problems.push('가로 스크롤 발생')
    if (report.small.length) problems.push(`48px 미만 터치 타깃: ${report.small.join(', ')}`)
    if (report.keyTooSmall) {
      problems.push(`${minKeyHeight}px 미만 숫자키 ${report.keyTooSmall}개`)
    }
    if (report.tinyText.length) {
      problems.push(
        `14px 미만 글자: ${report.tinyText.map((t) => `"${t.text}" ${t.size}px`).join(', ')}`,
      )
    }
    if (report.clipped.length) problems.push(`화면 밖으로 나감: ${report.clipped.join(' / ')}`)
    if (report.innerClipped.length) {
      problems.push(`상자 안에서 잘림: ${report.innerClipped.join(' / ')}`)
    }

    if (problems.length) {
      failed += 1
      console.log(`✗ ${device.name} — ${state.name}`)
      for (const problem of problems) console.log(`    ${problem}`)
    } else {
      console.log(`✓ ${device.name} — ${state.name}`)
    }

    if (SHOT_DIR) {
      await page.screenshot({ path: `${SHOT_DIR}/${device.width}-${state.screen}.png` })
    }
    await ctx.close()
  }
}

await browser.close()
await server.close()

console.log(failed === 0 ? '\n전부 통과' : `\n${failed}건 실패`)
process.exit(failed === 0 ? 0 : 1)
