/**
 * 실기기 뷰포트에서 화면이 넘치지 않는지 검사한다.
 *
 * "스크롤 없이 한 화면에 문제 하나가 다 들어와야 한다"는 눈으로만 확인할 수 없다.
 * 각 화면을 harness.html 로 고정된 상태로 띄운 뒤, 스크롤 발생·터치 타깃 크기·
 * 글자 크기·화면 밖으로 나간 요소를 실제 렌더 결과에서 잰다.
 *
 *   npm run dev &        # 5173 포트. harness.html 은 개발 서버에서만 열린다.
 *   npm run check:layout
 */
import { chromium } from 'playwright'

const BASE = process.env.BASE_URL ?? 'http://localhost:5173/'
const SHOT_DIR = process.env.SHOT_DIR ?? null

/** 실제로 아이가 쓸 법한 기기들. 위쪽이 가장 좁고 낮다. */
const DEVICES = [
  { name: '작은 안드로이드 360x640', width: 360, height: 640 },
  { name: '아이폰 SE 375x667', width: 375, height: 667 },
  { name: '아이폰 14 390x844', width: 390, height: 844 },
  { name: '큰 폰 430x932', width: 430, height: 932 },
  { name: '태블릿 820x1180', width: 820, height: 1180 },
]

/** 검사할 화면들. harness.html?screen= 값과 같다. */
const SCREENS = [
  { name: '제목', screen: 'title' },
  { name: '월드맵', screen: 'map' },
  { name: '단계 목록', screen: 'stages' },
  { name: '단계 목록(도전 해금)', screen: 'stages-cleared' },
  { name: '60초 도전', screen: 'challenge' },
  { name: '도전 결과(신기록)', screen: 'challenge-result' },
  { name: 'Lv1 4지선다', screen: '1' },
  { name: 'Lv2 자릿값', screen: '2' },
  { name: 'Lv3 숫자패드', screen: '3' },
  { name: 'Lv4 부등호', screen: '4' },
  { name: 'Lv5 숫자 카드', screen: '5' },
  { name: '보스 순서 배열', screen: 'boss' },
  { name: '오답 피드백(그림 힌트)', screen: 'feedback' },
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

function measure() {
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
  const keyTooSmall = numberKeys.filter((r) => r.height < 64).length

  const tinyText = [...document.querySelectorAll('p, span, button')]
    .filter((el) => (el.textContent ?? '').trim().length > 0)
    .filter((el) => el.getBoundingClientRect().height > 0)
    // 자릿값 표의 자리 이름처럼 곁들이는 글자는 뺀다
    .filter((el) => !el.hasAttribute('data-aside'))
    .map((el) => ({
      text: (el.textContent ?? '').trim().slice(0, 16),
      size: Number.parseFloat(getComputedStyle(el).fontSize),
    }))
    .filter(({ size }) => size < 14)

  const clipped = [...document.querySelectorAll('button, p, svg, h1')]
    // 장식은 일부러 화면 밖까지 퍼진다. overflow-hidden 이 잘라 주므로 스크롤은 생기지 않는다.
    .filter((el) => el.closest('[aria-hidden="true"]') === null && el.getAttribute('aria-hidden') !== 'true')
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

  return { overflowingY, overflowingX, small, keyTooSmall, tinyText, clipped }
}

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

    const report = await page.evaluate(measure)

    const problems = []
    if (errors.length) problems.push(`화면에서 오류가 났다: ${errors.join(' / ')}`)
    if (report.overflowingY) problems.push('세로 스크롤 발생')
    if (report.overflowingX) problems.push('가로 스크롤 발생')
    if (report.small.length) problems.push(`48px 미만 터치 타깃: ${report.small.join(', ')}`)
    if (report.keyTooSmall) problems.push(`64px 미만 숫자키 ${report.keyTooSmall}개`)
    if (report.tinyText.length) {
      problems.push(
        `14px 미만 글자: ${report.tinyText.map((t) => `"${t.text}" ${t.size}px`).join(', ')}`,
      )
    }
    if (report.clipped.length) problems.push(`화면 밖으로 나감: ${report.clipped.join(' / ')}`)

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
console.log(failed === 0 ? '\n전부 통과' : `\n${failed}건 실패`)
process.exit(failed === 0 ? 0 : 1)
