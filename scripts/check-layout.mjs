/**
 * 실기기 뷰포트에서 화면이 넘치지 않는지 검사한다.
 *
 * "스크롤 없이 한 화면에 문제 하나가 다 들어와야 한다"는 눈으로만 확인할 수 없다.
 * npm run build && npm run preview 를 띄운 뒤 이 스크립트를 돌린다.
 */
import { chromium } from 'playwright'

const BASE = process.env.BASE_URL ?? 'http://localhost:4173/'
const SHOT_DIR = process.env.SHOT_DIR ?? null

/** 실제로 아이가 쓸 법한 기기들. 위쪽이 가장 좁고 낮다. */
const DEVICES = [
  { name: '작은 안드로이드 360x640', width: 360, height: 640 },
  { name: '아이폰 SE 375x667', width: 375, height: 667 },
  { name: '아이폰 14 390x844', width: 390, height: 844 },
  { name: '큰 폰 430x932', width: 430, height: 932 },
  { name: '태블릿 820x1180', width: 820, height: 1180 },
]

/** 화면마다 여기까지 눌러 본 뒤 검사한다. */
const STATES = [
  { name: '문제 풀기 전', steps: [] },
  { name: '정답 피드백', steps: ['7', '확인'] },
  { name: '오답 피드백(그림 힌트 포함)', steps: ['6', '확인'] },
]

let failed = 0

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })

for (const device of DEVICES) {
  for (const state of STATES) {
    const ctx = await browser.newContext({
      viewport: { width: device.width, height: device.height },
      hasTouch: true,
      isMobile: true,
      deviceScaleFactor: 2,
    })
    const page = await ctx.newPage()
    await page.goto(BASE, { waitUntil: 'networkidle' })
    await page.evaluate(() => document.fonts.ready)

    for (const step of state.steps) {
      await page.getByRole('button', { name: step, exact: true }).click()
    }
    await page.waitForTimeout(60)

    const report = await page.evaluate(() => {
      const doc = document.documentElement
      const overflowingY = doc.scrollHeight > window.innerHeight + 1
      const overflowingX = doc.scrollWidth > window.innerWidth + 1

      // 터치 타깃과 글자 크기를 실제 렌더 결과에서 잰다
      const buttons = [...document.querySelectorAll('button')]
      const small = buttons
        .map((b) => ({ label: b.textContent?.trim() || b.getAttribute('aria-label') || '?', r: b.getBoundingClientRect() }))
        .filter(({ r }) => r.width < 48 || r.height < 48)
        .map(({ label, r }) => `${label} ${Math.round(r.width)}x${Math.round(r.height)}`)

      const numberKeys = buttons
        .filter((b) => /^[0-9]$/.test(b.textContent?.trim() ?? ''))
        .map((b) => b.getBoundingClientRect())
      const keyTooSmall = numberKeys.filter((r) => r.height < 64).length

      const texts = [...document.querySelectorAll('p, span, button')]
        .filter((el) => (el.textContent ?? '').trim().length > 0)
        .map((el) => ({
          text: (el.textContent ?? '').trim().slice(0, 20),
          size: Number.parseFloat(getComputedStyle(el).fontSize),
        }))
        .filter(({ size }) => size < 16)

      // 화면 밖으로 삐져나간 요소가 있는지
      const clipped = [...document.querySelectorAll('button, p, svg')]
        .map((el) => ({ el, r: el.getBoundingClientRect() }))
        .filter(({ r }) => r.height > 0 && (r.bottom > window.innerHeight + 1 || r.right > window.innerWidth + 1 || r.left < -1))
        .map(({ el, r }) => `${el.tagName} ${(el.textContent ?? '').trim().slice(0, 12)} bottom=${Math.round(r.bottom)}/${window.innerHeight}`)

      return { overflowingY, overflowingX, small, keyTooSmall, texts, clipped }
    })

    const problems = []
    if (report.overflowingY) problems.push('세로 스크롤 발생')
    if (report.overflowingX) problems.push('가로 스크롤 발생')
    if (report.small.length) problems.push(`48px 미만 터치 타깃: ${report.small.join(', ')}`)
    if (report.keyTooSmall) problems.push(`64px 미만 숫자키 ${report.keyTooSmall}개`)
    if (report.texts.length) problems.push(`16px 미만 글자: ${report.texts.map((t) => `"${t.text}" ${t.size}px`).join(', ')}`)
    if (report.clipped.length) problems.push(`화면 밖으로 나감: ${report.clipped.join(' / ')}`)

    if (problems.length) {
      failed += 1
      console.log(`✗ ${device.name} — ${state.name}`)
      for (const p of problems) console.log(`    ${p}`)
    } else {
      console.log(`✓ ${device.name} — ${state.name}`)
    }

    if (SHOT_DIR) {
      const slug = `${device.width}x${device.height}-${state.name}`.replace(/[^\w가-힣x-]/g, '_')
      await page.screenshot({ path: `${SHOT_DIR}/${slug}.png` })
    }
    await ctx.close()
  }
}

await browser.close()
console.log(failed === 0 ? '\n전부 통과' : `\n${failed}건 실패`)
process.exit(failed === 0 ? 0 : 1)
