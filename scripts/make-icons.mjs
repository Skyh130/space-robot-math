/**
 * 아이콘 PNG 를 만든다.
 *
 * SVG 하나에서 크기만 바꿔 뽑는다. 손으로 여러 장을 그리면 나중에 색을 바꿀 때
 * 한 장을 빠뜨린다. assets/ 에 외부 이미지 파일을 두지 않는다는 규칙과도 맞는다.
 */
import { readFileSync } from 'node:fs'
import { chromium } from 'playwright'

const svg = readFileSync(new URL('./icon.svg', import.meta.url), 'utf8')
const OUT = new URL('../public/', import.meta.url)

/** 마스커블 아이콘은 가장자리가 잘리므로 안전 영역 안으로 줄여 그린다. */
const TARGETS = [
  { file: 'icon-192.png', size: 192, padding: 0 },
  { file: 'icon-512.png', size: 512, padding: 0 },
  { file: 'icon-maskable-512.png', size: 512, padding: 0.12 },
  { file: 'apple-touch-icon.png', size: 180, padding: 0 },
]

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })

for (const { file, size, padding } of TARGETS) {
  const inset = Math.round(size * padding)
  const page = await browser.newPage({
    viewport: { width: size, height: size },
    deviceScaleFactor: 1,
  })
  await page.setContent(
    `<!doctype html><html><body style="margin:0;background:#1B2A6B">
      <div style="width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;background:#1B2A6B">
        <div style="width:${size - inset * 2}px;height:${size - inset * 2}px">${svg}</div>
      </div>
    </body></html>`,
    { waitUntil: 'load' },
  )
  await page.screenshot({ path: new URL(file, OUT).pathname, omitBackground: false })
  await page.close()
  console.log(`${file} ${size}x${size}`)
}

await browser.close()
