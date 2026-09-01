# 우주 로봇 수학 모험

초등 2~3학년 수학 학습용 웹 게임. 행성을 하나씩 클리어하며 로봇 부품을 모아 최종 합체한다.
태블릿·스마트폰 세로 모드 전용이며 서버 없이 브라우저에서만 동작한다.

- 기획: [`docs/설계서.md`](docs/설계서.md)
- 작업 규칙: [`CLAUDE.md`](CLAUDE.md)
- 작업 순서: [`TASKS.md`](TASKS.md)

## 개발

```bash
npm install
npm run dev        # 개발 서버
npm test           # Vitest
npm run typecheck  # 타입 검사
npm run build      # 프로덕션 빌드 (dist/)
npm run preview    # 빌드 결과 확인
```

### 배포

```bash
npm run build      # dist/ 에 정적 파일과 서비스 워커가 나온다
```

`dist/` 를 아무 정적 호스팅에나 올리면 된다. `base` 가 `./` 라 하위 경로에 두어도
열린다. 홈 화면에 추가하면 주소창 없이 세로로 고정돼 앱처럼 뜬다.

#### GitHub Pages

`.github/workflows/deploy.yml` 이 푸시할 때마다 빌드해서 올린다.
한 번만 해 두면 되는 설정이 있다.

**저장소 Settings → Pages → Source 를 `GitHub Actions` 로 바꾼다.**

`Deploy from a branch` 로 두면 브랜치의 파일이 그대로 서빙되는데,
`index.html` 이 `/src/main.tsx` 를 부르고 브라우저는 TypeScript 를 실행하지
못하므로 빈 화면이 뜬다. 빌드한 결과를 올려야 한다.

워크플로는 타입 검사와 테스트를 통과해야 배포한다. 문제가 틀린 채로 아이에게
나가면 안 된다.

아이콘을 바꾸려면 `scripts/icon.svg` 를 고치고 `npm run icons` 를 돌린다.
PNG 를 손으로 여러 장 만들면 나중에 한 장을 빠뜨린다.

### 오프라인 검사

```bash
npm run build
npm run preview &     # 4173 포트
npm run check:offline
```

한 번 열어 서비스 워커가 파일을 받게 한 뒤 네트워크를 끊고 다시 연다.
매니페스트, 폰트, 실제 문제 화면까지 비행기 모드에서 확인한다.

### 화면 검사

"스크롤 없이 한 화면에 문제 하나"는 눈으로만 확인할 수 없어서 스크립트로 잰다.
실기기 뷰포트 5종에서 스크롤 발생 여부, 48px 미만 터치 타깃, 64px 미만 숫자키,
16px 미만 글자, 화면 밖으로 나간 요소를 검사한다.

```bash
npm run dev &        # 5173 포트
npm run check:layout
```

각 화면은 `harness.html` 로 고정된 상태로 띄워 잰다. 이 페이지는 개발 서버에서만
열리며 `vite build` 의 입력이 아니라 배포본에는 들어가지 않는다.

휴대폰 실기기에서 볼 때는 `npm run dev -- --host` 로 띄우고 같은 와이파이에서 접속한다.

## 기술 스택

Vite · React 18 · TypeScript(strict) · Tailwind CSS 3 · Vitest

Tailwind는 3.x를 쓴다. 4.x는 Safari 16.4 / Chrome 111 이상을 요구해서 구형 태블릿에서 스타일이 깨질 수 있다.

## 폰트

제목은 Jua, 본문·숫자는 Pretendard를 쓴다.
오프라인 동작이 필요하므로 CDN을 쓰지 않고 `public/fonts/` 에 직접 넣었다.
두 폰트 모두 SIL Open Font License 1.1이며 라이선스 전문은 같은 폴더에 있다.

## 진행 상황

**Phase 6 까지 완료 — MVP 완성.**

월드 1~3 을 처음부터 끝까지 플레이할 수 있고, 진행이 기기에 저장되며,
홈 화면에 추가해 비행기 모드에서 돌아간다.

MVP 이후 더한 것
- 스테이지 중간에 나가기
- **60초 도전** — 보스를 깨면 월드마다 열리는 놀이 구간. 진행과 무관하고
  기록만 남아서, 별을 다 받은 뒤에도 다시 켤 이유가 된다.
- W1 5단계를 카드를 직접 놓아 수를 만드는 방식으로 바꿈

다음은 `TASKS.md` 의 Phase 7 이후지만, 그 전에 아이에게 먼저 줘 보고
관찰 결과에 따라 우선순위를 정한다.
