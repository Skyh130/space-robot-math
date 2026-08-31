/**
 * 비행기 모드에서 게임이 뜨는지 확인한다. (Phase 6 완료 조건)
 *
 * 한 번 열어 서비스 워커가 파일을 다 받아 두게 한 뒤, 네트워크를 끊고 다시 연다.
 * 글자가 깨지지 않는지 보려고 폰트가 실제로 로컬에서 나오는지도 함께 잰다.
 *
 *   npm run build && npm run preview &
 *   npm run check:offline
 */
import { chromium } from 'playwright'

const BASE = process.env.BASE_URL ?? 'http://localhost:4173/'

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  isMobile: true,
})
const page = await ctx.newPage()

let failed = 0
function check(label, ok, detail = '') {
  if (ok) {
    console.log(`✓ ${label}`)
  } else {
    failed += 1
    console.log(`✗ ${label}${detail ? ` — ${detail}` : ''}`)
  }
}

// 1. 처음 열기
await page.goto(BASE, { waitUntil: 'networkidle' })
await page.evaluate(() => document.fonts.ready)
check('처음 열기', await page.getByRole('button', { name: '출발!' }).isVisible())

// 2. 매니페스트
const manifestHref = await page.getAttribute('link[rel="manifest"]', 'href')
check('매니페스트가 붙어 있다', manifestHref !== null, String(manifestHref))

const manifest = await page.evaluate(async (href) => {
  const response = await fetch(href)
  return response.json()
}, manifestHref)
check('세로 모드로 잠근다', manifest.orientation === 'portrait', manifest.orientation)
check('앱처럼 뜬다', manifest.display === 'standalone', manifest.display)
check('아이콘이 세 장이다', manifest.icons?.length === 3, String(manifest.icons?.length))
check(
  '마스커블 아이콘이 있다',
  manifest.icons?.some((icon) => icon.purpose === 'maskable'),
)

// 3. 서비스 워커가 파일을 다 받을 때까지 기다린다
await page.waitForFunction(() => navigator.serviceWorker?.controller !== null, null, {
  timeout: 20000,
})
const cached = await page.evaluate(async () => {
  const names = await caches.keys()
  let total = 0
  for (const name of names) {
    const keys = await (await caches.open(name)).keys()
    total += keys.length
  }
  return total
})
check('파일을 미리 받아 뒀다', cached > 10, `${cached}개`)

// 4. 네트워크를 끊고 다시 연다
await ctx.setOffline(true)
await page.reload({ waitUntil: 'load' })
await page.evaluate(() => document.fonts.ready)

check('비행기 모드에서도 뜬다', await page.getByRole('button', { name: '출발!' }).isVisible())

// 화면에 아직 안 쓰인 폰트는 브라우저가 받아 두지 않는다.
// 캐시에서 실제로 나오는지 보려면 직접 불러 보게 해야 한다.
const offlineState = await page.evaluate(async () => {
  const loaded = await Promise.all([
    document.fonts.load('400 16px Jua', '가'),
    document.fonts.load('400 16px Pretendard', '가'),
    document.fonts.load('700 16px Pretendard', '가'),
  ])
  return {
    jua: loaded[0].length > 0,
    pretendard: loaded[1].length > 0 && loaded[2].length > 0,
    background: getComputedStyle(document.body).backgroundColor,
  }
})
check('비행기 모드에서 제목 폰트가 나온다', offlineState.jua)
check('비행기 모드에서 본문 폰트가 나온다', offlineState.pretendard)
check('배경색이 그대로다', offlineState.background === 'rgb(27, 42, 107)', offlineState.background)

// 5. 끊긴 채로 실제로 한 문제까지 들어간다
await page.getByRole('button', { name: '출발!' }).click()
check('비행기 모드에서 월드맵이 열린다', await page.getByText('어디로 갈까?').isVisible())
await page.getByRole('button', { name: /^숫자 소행성대/ }).click()
await page.getByRole('button', { name: /^1단계/ }).click()
check(
  '비행기 모드에서 문제가 나온다',
  await page.getByLabel('8문제 중 1번째').isVisible(),
)

await browser.close()
console.log(failed === 0 ? '\n전부 통과' : `\n${failed}건 실패`)
process.exit(failed === 0 ? 0 : 1)
