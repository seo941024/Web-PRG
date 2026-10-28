# Web-PRG · 웹 프로그래밍 실습

HTML · CSS · JavaScript 수업 실습과 웹 프로젝트 모음.

| 폴더 | 내용 |
|---|---|
| `petcare/` | 펫케어: 초보 반려인을 위한 케어 서비스 웹. 입양 전 준비·시뮬레이션, 유기동물 입양 정보, 건강 관리, 금지 음식·응급 처치, 동네 멘토·성장 일기, 품종 퀴즈 |
| `todolist/` | 파스텔 루틴 투두리스트 |
| `web/Class/` | 수업 회차별 실습: chap04~chap13, chap17, chap19, 15·16·18·20회차 |
| `web_practice/` | 첫 HTML 실습: 종합 실습 1~3, BLT 샌드위치 소개 페이지 |

## 펫케어 실행

```
cd petcare
node server.js        # http://localhost:3000
```

- 유기동물 정보는 공공데이터포털 API, 지도는 카카오 지도 API 사용
- API 키 설정
  - `config.example.js`를 `config.js`로 복사 후 공공데이터포털·카카오 JavaScript 키 입력
  - `keys.example.json`을 `keys.local.json`으로 복사 후 공공데이터포털 인증키 입력
- 키 없이 실행하면 데모 데이터로 표시
