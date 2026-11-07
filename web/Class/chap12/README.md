# chap12 · CSS Grid 레이아웃

행과 열을 함께 나누는 2차원 배치 방식인 CSS Grid 구성과 항목 배치, 사진 갤러리 구현.

## 다룬 개념

| 개념 | 뜻과 사용 방법 |
|---|---|
| 그리드 컨테이너 | `display: grid`를 지정한 부모 요소. 자식 요소가 그리드 항목으로 배치됨 |
| 열·행 크기 지정 | `grid-template-columns`, `grid-template-rows`로 열 너비와 행 높이 지정. `px` 고정값, `fr` 남은 공간 비율, `auto` 내용 크기 |
| `repeat()` | 같은 크기의 열·행을 반복 지정. `repeat(3, 1fr)`은 같은 너비 열 3개 |
| `minmax()` | 열·행의 최소·최대 크기 지정. 내용이 늘어나면 최소값 이상으로 커짐 |
| `auto-fill`과 `auto-fit` | 컨테이너 너비에 맞춰 열 개수를 자동 결정. `auto-fill`은 빈 열 자리를 남기고, `auto-fit`은 빈 자리를 없애고 항목을 늘림 |
| 암시적 행 `grid-auto-rows` | 지정한 행보다 항목이 많을 때 자동으로 생기는 행의 높이 |
| `gap` | 항목 사이 행 간격과 열 간격 |
| 라인 번호 배치 | `grid-column: 1 / 4`, `grid-row: 2 / 4`처럼 그리드 선 번호로 항목이 차지할 범위 지정 |
| 영역 이름 배치 | `grid-template-areas`에 영역 이름으로 화면 배치를 그리고, 항목에 `grid-area`로 이름 연결 |

## 파일별 내용

| 파일 | 내용 | 핵심 코드 |
|---|---|---|
| [grid-1.html](grid-1.html) | 그리드 컨테이너에 열 너비와 행 높이 지정 | `grid-template-columns`, `grid-template-rows` |
| [grid-2.html](grid-2.html) | 고정 너비 열 3개, 항목 수만큼 자동 생성되는 행 높이 지정 | `grid-auto-rows: 100px` |
| [grid-3.html](grid-3.html) | 같은 너비 열 3개, 내용에 따라 늘어나는 행 높이 | `repeat(3, 1fr)`, `minmax(100px, auto)` |
| [grid-4.html](grid-4.html) | `auto-fill`과 `auto-fit`을 나란히 두고 빈 열 처리 차이 비교 | `repeat(auto-fill, minmax(100px, 1fr))` |
| [grid-5.html](grid-5.html) | 행 간격과 열 간격을 다르게 지정, 홀짝 항목 배경색 구분 | `gap: 20px 30px`, `:nth-child(odd)` |
| [grid-6.html](grid-6.html) | 그리드 선 번호로 항목마다 차지할 칸 지정 | `grid-column`, `grid-row`, `grid-row-start` |
| [grid-7.html](grid-7.html) | 영역 이름으로 화면 구획을 그리고 항목 배치 | `grid-template-areas`, `grid-area` |
| [gr.html](gr.html) | 상자 4개를 선 번호로 가로·세로로 걸쳐 배치하는 연습 | `grid-column: 1/4`, `grid-row: 2/4` |
| [gallery.html](gallery.html) | 영역 이름 기반 사진 갤러리 배치 | `grid-template-areas`, `grid-area` |
| [responsive.html](responsive.html) | 크기가 다른 항목 5개를 선 번호로 배치한 카드형 화면 | `grid-row: 1 / 3`, `grid-column: 2 / 4` |
| [quiz-1.html](quiz-1.html) | 연습문제 시작 파일. 숫자 상자 6개를 그리드로 배치할 화면 틀 | `display: flex`로 화면 가운데 정렬 |
| [quiz-2.html](quiz-2.html) | 연습문제 시작 파일. 항목 5개를 영역별로 배치할 화면 틀 | `.item1`~`.item5` 클래스 |

`images/`: 갤러리 예제에 쓴 사진.

## Flexbox와 비교

| 구분 | Flexbox, chap11 | Grid, chap12 |
|---|---|---|
| 배치 방향 | 한 방향, 가로 또는 세로 | 가로와 세로 동시 |
| 크기 기준 | 항목 내용과 `flex` 비율 | 컨테이너에 미리 그린 열·행 |
| 알맞은 곳 | 메뉴, 버튼 줄처럼 한 줄 정렬 | 갤러리, 전체 화면 구획 |
