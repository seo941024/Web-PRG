# Practice/lab2 · 멤버 프로필 카드

[상위 폴더 README](../README.md)에서 다룬 개념과 나머지 예제 확인.

## 화면

| [member1.html](member1.html) · 프로필 카드 | [member2.html](member2.html) |
|---|---|
| ![프로필 카드](../screenshots/member1.png) | ![member2.html 화면](../screenshots/lab2_member2.png) |

| [member3.html](member3.html) | [member4.html](member4.html) |
|---|---|
| ![member3.html 화면](../screenshots/lab2_member3.png) | ![member4.html 화면](../screenshots/lab2_member4.png) |

## 파일

멤버 네 명의 프로필 카드 페이지. 같은 마크업에 `body` 클래스만 바꿔 배경색과 강조색을 다르게 지정.

| 파일 | 내용 | 핵심 코드 |
|---|---|---|
| [member1.html](member1.html) | 멤버 1 프로필 카드. 메뉴 아이콘, 둥근 프로필 사진, 이름·직함, VIEW MORE 버튼, 연락처 목록, 다른 멤버 페이지로 가는 점 링크 | `<body class="member1">`, `<a href="member1.html" class="on">` |
| [member2.html](member2.html) | member1.html과 같은 구조의 멤버 2 프로필 카드 | `<body class="member2">` |
| [member3.html](member3.html) | member1.html과 같은 구조의 멤버 3 프로필 카드 | `<body class="member3">` |
| [member4.html](member4.html) | member1.html과 같은 구조의 멤버 4 프로필 카드 | `<body class="member4">` |
| [css/style.css](css/style.css) | 프로필 카드 공통 스타일과 멤버별 배경색·사진 그림자·버튼 그러데이션. 주석에 단계별 작성 순서 정리 | `body.member1 section a.btnView`, `linear-gradient(45deg, ...)`, `opacity: 0.4`, `filter: saturate(0.7)`, `@import url(...)` |
