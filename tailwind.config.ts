import type { Config } from 'tailwindcss'

/**
 * 컬러 토큰은 CLAUDE.md '비주얼 방향'을 그대로 옮긴 것이다.
 * 여기 없는 색은 화면에서 쓰지 않는다.
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      screens: {
        /*
         * 터치 기기를 가로로 눕혔을 때만 회전 안내를 띄운다.
         * pointer:coarse 조건이 없으면 노트북 브라우저에서도 계속 뜬다.
         */
        rotated: { raw: '(orientation: landscape) and (pointer: coarse)' },
      },
      colors: {
        deep: '#1B2A6B', // 우주 배경
        panel: '#2C3E8F', // 패널
        energy: '#FFC93C', // 에너지·정답·별
        coral: '#FF6B5B', // 보스·강조
        mint: '#4FD1C5', // 보조·힌트
        paper: '#FFF6E5', // 텍스트·카드 바탕
        outline: '#101838', // 모든 요소의 외곽선
      },
      fontFamily: {
        title: ['Jua', 'BM Dohyeon', 'Pretendard', 'sans-serif'],
        body: ['Pretendard', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // 설계서 UX 규격: 문제 텍스트 20px 이상, 숫자 32px 이상
        question: ['1.375rem', { lineHeight: '1.5' }], // 22px
        number: ['2.25rem', { lineHeight: '1.2' }], // 36px
      },
      borderWidth: {
        3: '3px',
      },
      boxShadow: {
        // 흐린 회색 그림자 대신 아래로 4px 오프셋된 단색 그림자
        hard: '0 4px 0 0 #101838',
        'hard-sm': '0 2px 0 0 #101838',
        'hard-lg': '0 6px 0 0 #101838',
      },
      minHeight: {
        touch: '48px', // 터치 타깃 최소치
        key: '64px', // 숫자패드 키
      },
      minWidth: {
        touch: '48px',
        key: '64px',
      },
      maxWidth: {
        app: '480px', // 태블릿에서 중앙 정렬되는 최대 폭
      },
      keyframes: {
        // 세로셈에서 받아올림 1이 위로 올라오는 모습
        carry: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        // 부품이 로봇에 철컥 붙는 순간
        attach: {
          '0%': { opacity: '0', transform: 'scale(1.8)' },
          '60%': { opacity: '1', transform: 'scale(0.94)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        popIn: {
          '0%': { opacity: '0', transform: 'scale(0.4)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shine: {
          '0%, 100%': { opacity: '0.35', transform: 'scale(1)' },
          '50%': { opacity: '0.85', transform: 'scale(1.08)' },
        },
        riseIn: {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        carry: 'carry 0.35s ease-out both',
        attach: 'attach 0.7s cubic-bezier(0.2, 1.4, 0.4, 1) both',
        'pop-in': 'popIn 0.5s cubic-bezier(0.2, 1.5, 0.4, 1) both',
        shine: 'shine 1.6s ease-in-out infinite',
        'rise-in': 'riseIn 0.5s ease-out both',
      },
    },
  },
  plugins: [],
} satisfies Config
