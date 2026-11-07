# Practice · Flexbox·float 화면 구성

Flexbox로 메뉴 막대와 본문·사이드바 화면 분할, 멤버별 색 테마 프로필 카드, 같은 경복궁 소개 페이지를 float와 Flexbox 두 방식으로 구성.

## 다룬 개념

| 개념 | 뜻과 사용 방법 |
|---|---|
| Flexbox 화면 분할 | `display: flex`인 부모 안에서 항목마다 `flex` 비율을 주어 너비를 나누는 방식. 본문 `flex: 3`, 사이드바 `flex: 1` |
| `flex` 단축 속성 | 늘어나는 비율, 줄어드는 비율, 기본 크기를 한 번에 지정. `flex: 3 1 0`은 기본 크기 0에서 남은 공간을 3의 비율로 차지 |
| `margin-left: auto` | 플렉스 항목의 왼쪽 여백이 남는 공간을 모두 차지하게 하는 설정. 로그인 메뉴 하나만 오른쪽 끝으로 이동 |
| float 레이아웃과 clearfix | `float: left`로 칸을 나란히 두면 부모가 높이를 잃는 문제를 `::after`에 `clear: both`를 넣어 해결하는 방식. `.row:after`, `nav.menu::after` |
| 멤버별 색 테마 | `body`에 `member1`~`member4` 클래스를 달고 `body.member1 ...` 같은 하위 선택자로 배경색·사진 그림자·버튼 그러데이션 교체 |
| 현재 페이지 표시 | 지금 보는 멤버 링크에만 `.on` 클래스를 달아 `opacity: 1`, `filter: saturate(1)`로 선명하게, 나머지는 흐리게 표시 |
| `@import` 웹 글꼴 | CSS 파일 안에서 Google Fonts 주소를 불러와 Orbitron 글꼴 사용 |
| 반응형 전환 | 미디어 쿼리로 800px 이하에서 `flex-direction: column`을 지정해 두 칸을 위아래로 배치 |

## 파일별 내용

| 파일 | 내용 | 핵심 코드 |
|---|---|---|
| [css_box채우기.html](css_box채우기.html) | 번호 붙은 주석 순서대로 스타일을 채운 여행 사이트 화면. 로고와 메뉴를 양 끝에 둔 메뉴 막대, 줄바꿈을 허용한 본문과 기본 너비 250px 사이드바 | `justify-content: space-between`, `flex: 3 1 0`, `flex-basis: 250px`, `flex-wrap: wrap` |
| [flexbox.html](flexbox.html) | 로고·제목·메뉴 세 칸 머리글, 포스트 목록과 사이드바로 나눈 본문, 바닥글로 구성한 화면 | `flex: 1`, `flex: 3`, `flex-direction: column`, `gap: 20px` |
| [lab2/member1.html](lab2/member1.html) | 멤버 1 프로필 카드. 메뉴 아이콘, 둥근 프로필 사진, 이름·직함, VIEW MORE 버튼, 연락처 목록, 다른 멤버 페이지로 가는 점 링크 | `<body class="member1">`, `<a href="member1.html" class="on">` |
| [lab2/member2.html](lab2/member2.html) | member1.html과 같은 구조의 멤버 2 프로필 카드 | `<body class="member2">` |
| [lab2/member3.html](lab2/member3.html) | member1.html과 같은 구조의 멤버 3 프로필 카드 | `<body class="member3">` |
| [lab2/member4.html](lab2/member4.html) | member1.html과 같은 구조의 멤버 4 프로필 카드 | `<body class="member4">` |
| [lab2/css/style.css](lab2/css/style.css) | 프로필 카드 공통 스타일과 멤버별 배경색·사진 그림자·버튼 그러데이션. 주석에 단계별 작성 순서 정리 | `body.member1 section a.btnView`, `linear-gradient(45deg, ...)`, `opacity: 0.4`, `filter: saturate(0.7)`, `@import url(...)` |
| [labs/palaces.html](labs/palaces.html) | 경복궁 소개 페이지 float 버전. 어둡게 덮은 근정전 사진 머리글, 위에 붙는 메뉴, 사진 카드 본문과 사이드 칸. chap10 `labs/palaces_responsive.html`에서 미디어 쿼리를 뺀 형태 | `float: left`, `width: 70%`, `.row:after { clear: both; }`, `position: sticky` |
| [labs/palaces_v2.html](labs/palaces_v2.html) | 같은 경복궁 소개 페이지를 Flexbox로 다시 배치. 로그인 메뉴만 오른쪽 끝, 좁은 화면에서 두 칸을 위아래로 배치 | `display: flex`, `margin-left: auto`, `flex: 7`, `flex: 3`, `@media screen and (max-width: 800px)` |

`lab2/img/`: 멤버 프로필 사진. `labs/images/`: 근정전·경회루 사진.

## float와 Flexbox 비교

| 구분 | float, labs/palaces.html | Flexbox, labs/palaces_v2.html |
|---|---|---|
| 칸 나누기 | `float: left`와 `width: 70%`·`30%` | `display: flex`와 `flex: 7`·`flex: 3` |
| 부모 높이 처리 | `.row:after`에 `clear: both` 필요 | 별도 처리 없음 |
| 오른쪽 끝 메뉴 | 인라인 `style="float:right"` | `margin-left: auto` |
| 좁은 화면 | 미디어 쿼리 없음 | 800px 이하 `flex-direction: column` |
