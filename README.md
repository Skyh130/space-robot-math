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

Phase 4 (저장과 월드맵) 완료. 다음은 Phase 5 월드 2, 3.
