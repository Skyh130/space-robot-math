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

휴대폰 실기기에서 볼 때는 `npm run dev -- --host` 로 띄우고 같은 와이파이에서 접속한다.

## 기술 스택

Vite · React 18 · TypeScript(strict) · Tailwind CSS 3 · Vitest

Tailwind는 3.x를 쓴다. 4.x는 Safari 16.4 / Chrome 111 이상을 요구해서 구형 태블릿에서 스타일이 깨질 수 있다.

## 폰트

제목은 Jua, 본문·숫자는 Pretendard를 쓴다.
오프라인 동작이 필요하므로 CDN을 쓰지 않고 `public/fonts/` 에 직접 넣었다.
두 폰트 모두 SIL Open Font License 1.1이며 라이선스 전문은 같은 폴더에 있다.

## 진행 상황

Phase 0 (프로젝트 셋업) 완료. 다음은 Phase 1 문제 엔진.
