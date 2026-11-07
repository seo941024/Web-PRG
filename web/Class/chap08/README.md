# chap08 · 박스 모델과 배치

요소를 감싸는 박스의 크기, 테두리, 여백을 지정하고 display, float, position으로 메뉴, 2단·3단 레이아웃, 여행 카드 화면 배치.

Do it! 교재 예제와 연습문제 기반.

## 다룬 개념

| 개념 | 뜻과 사용 방법 |
|---|---|
| 박스 모델 | 모든 요소를 내용, 패딩, 테두리, 마진이 차례로 둘러싼 사각형으로 보는 방식 |
| `width`·`height` | 박스 내용 영역의 너비와 높이 |
| `box-sizing` | 너비를 계산하는 기준. 기본값 `content-box`는 내용 너비만, `border-box`는 패딩과 테두리까지 포함한 너비 |
| `border` | 박스 테두리. `border-style` 선 모양, `border-width` 굵기, `border-color` 색을 따로 쓰거나 `border: 3px dotted orange`처럼 한 줄로 묶어 지정 |
| `border-radius` | 꼭짓점을 둥글게 만드는 속성. `border-top-left-radius`처럼 꼭짓점별로 지정하고 `50px/30px`로 가로·세로 반지름을 다르게 지정 |
| `box-shadow` | 박스 그림자. 가로 거리, 세로 거리, 번짐 정도, 색 순서로 지정 |
| `padding` | 테두리와 내용 사이 안쪽 여백. 값이 하나면 네 방향, 둘이면 위아래·좌우, 넷이면 위·오른쪽·아래·왼쪽 순서로 적용 |
| `margin` | 박스 바깥 여백. 왼쪽·오른쪽 마진을 `auto`로 주면 블록 박스가 가로 가운데에 위치 |
| 블록과 인라인 | 블록 요소는 한 줄을 다 차지하고 위아래로 쌓이는 요소, 인라인 요소는 내용만큼만 차지하고 옆으로 이어지는 요소 |
| `display` | 요소의 표시 방식을 바꾸는 속성. `inline-block`으로 메뉴 항목을 크기를 지정한 채 가로로 나란히 배치 |
| `visibility`·`overflow` | `visibility: hidden`은 자리를 남긴 채 요소를 숨기는 값. `overflow`는 박스 크기를 벗어난 내용을 `hidden` 자르기, `scroll` 스크롤바, `auto` 필요할 때만 스크롤바로 처리 |
| `float`·`clear` | `float`는 요소를 왼쪽이나 오른쪽에 띄워 뒤 내용이 옆으로 흐르게 하는 속성. `clear`는 앞선 float의 영향을 끊고 다음 줄에서 시작하게 하는 속성 |
| `position` | 요소 위치를 정하는 기준. `relative`는 원래 자리, `absolute`는 위치를 지정한 가장 가까운 조상, `fixed`는 브라우저 화면을 기준으로 `left`·`top`·`right`·`bottom` 거리만큼 이동 |
| `z-index` | 위치를 지정한 요소끼리 겹칠 때 쌓이는 순서. 값이 클수록 위에 표시 |

## 파일별 내용

### 박스 크기와 표시 방식

| 파일 | 내용 | 핵심 코드 |
|---|---|---|
| [box-width.html](box-width.html) | 너비·높이 예제 시작 파일. 테두리 있는 문단 박스 두 개 | `border: 1px solid #000` |
| [box-sizing.html](box-sizing.html) | 같은 너비·패딩·테두리 값을 준 박스를 기본 계산 방식과 `border-box`로 비교 | `box-sizing: border-box` |
| [block.html](block.html) | 모든 요소에 파란 테두리를 둘러 블록 요소 영역 표시, `<div>` 안 `<p>`가 줄을 나누는 모습 확인 | `body * { border:1px solid blue; }` |
| [inline.html](inline.html) | block.html과 같은 문장에서 강조 단어를 `<span>`으로 바꿔 인라인 요소 영역 표시, 로컬 서버 주소 링크 | `<span class="accent">`, `<a target="_blank">` |
| [display.html](display.html) | 메뉴 항목을 같은 크기 상자로 바꿔 가로로 나란히 배치 | `display: inline-block`, `line-height: 40px` |
| [display1.html](display1.html) | 주황 배경 `<div>` 안의 `<div>`를 인라인으로 바꿔 한 줄 배치, `<span>`에 너비·높이 지정 | `div div { display: inline; }` |
| [visibility.html](visibility.html) | 괄호 속 단어를 숨긴 빈칸 맞히기 화면 | `visibility: hidden` |
| [overflow.html](overflow.html) | 작은 박스를 벗어난 문장을 네 가지 `overflow` 값으로 처리해 비교 | `overflow: hidden`, `overflow: scroll`, `overflow: auto` |

### 테두리와 그림자

| 파일 | 내용 | 핵심 코드 |
|---|---|---|
| [border-1.html](border-1.html) | 테두리 스타일 예제 시작 파일. 굵기만 지정한 상자 세 개 | `border-width:5px` |
| [border-2.html](border-2.html) | 첫 상자에 위·오른쪽·아래·왼쪽 테두리 굵기를 다르게 지정 | `border-width: 3px 5px 7px 9px` |
| [border-3.html](border-3.html) | 테두리 색 예제 시작 파일. 점선 테두리 상자 두 개 | `border-style:dashed` |
| [border-4.html](border-4.html) | 제목 아래쪽 파란 실선, 문단 전체 주황 점선 테두리를 한 줄로 지정 | `border-bottom: 3px solid blue`, `border: 3px dotted orange` |
| [border-5.html](border-5.html) | 고양이 사진 꼭짓점마다 다른 반지름으로 둥글게 처리 | `border-radius: 10px 20px 30px` |
| [border-6.html](border-6.html) | 이미지 원형 표시 예제 시작 파일. 같은 사진 두 장 | |
| [border-7.html](border-7.html) | 원하는 꼭짓점만 둥글게 하는 예제 시작 파일. 크기만 지정한 빈 `div` | |
| [border-8.html](border-8.html) | 가로·세로 반지름 비율과 꼭짓점별 반지름을 다르게 준 노란 상자 비교 | `border-radius: 50px/30px`, `border-bottom-right-radius: 50% 30%` |
| [border-9.html](border-9.html) | 원형, 대각선 두 꼭짓점, 같은 반지름 꼭짓점 상자 비교 | `border-radius: 100px`, `border-top-right-radius: 50%` |
| [box-shadow.html](box-shadow.html) | 버튼 오른쪽 아래에 그림자 지정 | `box-shadow: 2px 2px 2px #222` |
| [button.html](button.html) | 둥근 연두색 테두리 버튼 두 개를 회색 테두리 상자 가운데에 배치 | `border-radius: 20px`, `margin: auto` |

### 여백

| 파일 | 내용 | 핵심 코드 |
|---|---|---|
| [padding.html](padding.html) | 같은 제목에 값 개수가 다른 패딩을 주어 안쪽 여백 비교 | `padding: 10px 30px`, `padding: 10px 20px 30px 40px` |
| [margin-1.html](margin-1.html) | 값 개수가 다른 마진을 준 상자 비교 | `margin: 30px 50px`, `margin: 30px 20px 50px` |
| [margin-2.html](margin-2.html) | 왼쪽·오른쪽 마진 `auto`로 상자 가로 가운데 정렬 | `margin-left: auto`, `margin-right: auto` |
| [margin-3.html](margin-3.html) | 색 상자 세 개를 인라인 블록으로 나란히 두고 사방 마진 지정 | `margin: 30px`, `display: inline-block` |
| [margin-4.html](margin-4.html) | 마진 예제 시작 파일. 인라인 블록 색 상자 세 개 | `display: inline-block` |
| [margin-5.html](margin-5.html) | 왼쪽 마진을 단계별로 늘려 계단 모양으로 배치한 색 상자 | `margin-left: 100px`, `margin-left: 300px` |

### float와 다단 레이아웃

| 파일 | 내용 | 핵심 코드 |
|---|---|---|
| [float-1.html](float-1.html) | 나무 그림을 왼쪽에 띄워 뒤 문단이 그림 오른쪽으로 흐르는 배치 | `float: left`, `margin-right: 50px` |
| [float-2.html](float-2.html) | 나무 그림을 오른쪽에 띄운 배치 | `float:right` |
| [float-3.html](float-3.html) | 박스 두 개를 왼쪽에 띄워 나란히 두고 문단이 옆으로 흐르는 배치 | `float: left` |
| [float-4.html](float-4.html) | 사이드바 박스 두 개를 왼쪽에 띄우고 두 번째 문단에 `clear` 지정 | `float: left`, `.clear { clear: right; }` |
| [float-5.html](float-5.html) | 사진 세 장을 너비 3분의 1 상자에 넣어 가로로 나란히 배치 | `width: 33.33%`, `float: left`, `box-sizing: border-box` |
| [2column-layout.html](2column-layout.html) | 헤더, 왼쪽 사이드바, 본문, 푸터로 나눈 2단 레이아웃 | `float: left`, `clear: both` |
| [3column-layout.html](3column-layout.html) | 헤더, 왼쪽 사이드바, 본문, 오른쪽 사이드바, 푸터로 나눈 3단 레이아웃 | `float: right`, `clear: both` |

### position과 z-index

| 파일 | 내용 | 핵심 코드 |
|---|---|---|
| [position.html](position.html) | 가운데 정렬한 색 상자 세 개를 기본 배치로 쌓은 화면 | `position: static`, `margin: auto` |
| [position-1.html](position-1.html) | 기본 배치, 원래 자리 기준 이동, 화면 고정 상자 비교 | `position:relative`, `top:-50px`, `position:fixed` |
| [position-relative.html](position-relative.html) | 글자 상자에 마우스를 올리면 원래 자리에서 아래나 위로 이동 | `#down:hover`, `position : relative` |
| [left-top.html](left-top.html) | 문단 세 개를 화면 왼쪽 위, 오른쪽 위, 왼쪽 아래 기준 거리로 배치 | `position:absolute`, `right:100px`, `bottom:100px` |
| [position-absolute.html](position-absolute.html) | 크리스마스 트리 그림 위에 MERRY 글자 상자를 좌표로 배치 | `position: absolute`, `style="left: 50px; top: 30px"` |
| [position-fixed.html](position-fixed.html) | 스크롤과 관계없이 화면 오른쪽 아래에 고정되는 빨간 상자 | `position: fixed`, `bottom: 10px`, `right: 10px` |
| [position-2.html](position-2.html) | 배경 사진 상자 안에서 제목을 오른쪽·아래 기준 거리로 배치 | `position: relative`, `position: absolute`, `text-shadow` |
| [css/position-2.css](css/position-2.css) | position-2.html과 같은 배치 규칙의 외부 스타일, 제목 아래쪽 거리만 다른 파일. 연결하는 HTML 없음 | `bottom: 250px` |
| [z-index.html](z-index.html) | 스페이드 카드 네 장을 겹쳐 놓고 쌓이는 순서 지정 | `z-index : 7`, `position : absolute` |

### 레이아웃 틀과 연습문제

| 파일 | 내용 | 핵심 코드 |
|---|---|---|
| [boxmodel.html](boxmodel.html) | 헤더, 로고, 메뉴, 본문 두 구역, 푸터 영역만 나눈 빈 레이아웃 틀 | `<header>`, `<nav>`, `<footer>`, `css/style.css` |
| [boxmodel-1.html](boxmodel-1.html) | boxmodel.html과 같은 틀, 연결 스타일 파일 이름만 다름 | `css/style-1.css` |
| [boxmodel-2.html](boxmodel-2.html) | boxmodel.html과 같은 틀, 연결 스타일 파일 이름만 다름 | `css/style-2.css` |
| [quiz-1.html](quiz-1.html) | 연습문제 1 시작 파일. 곰인형 사진을 담은 350px 가운데 컨테이너 | `#container { margin:30px auto; }` |
| [quiz-2.html](quiz-2.html) | 연습문제 2. 여행 카드 네 장을 가로로 나란히 두고 원형 사진과 둥근 카드 테두리로 꾸민 여가 시간 화면 | `display: inline-block`, `border-radius: 100px`, `border-radius: 20px` |

`images/`: 고양이, 나무, 곰인형, 여행 카드, 풍경, 배경 사진 등 예제 이미지. `media/`: 크리스마스 트리 그림과 스페이드 카드 그림.

## lab 폴더

chap04 레드향 소개 페이지에 박스 모델 스타일을 입힌 응용 화면.

| 파일 | 내용 | 핵심 코드 |
|---|---|---|
| [lab/lab.html](lab/lab.html) | 소개, 레시피, 상품 구성을 800px 박스 세 개로 나누고 맨 위 사진과 박스 위쪽 모서리, 맨 아래 박스 아래쪽 모서리를 둥글게 처리 | `border-top-left-radius: 30px`, `box-shadow: 0px 0px 10px #222`, `margin: 30px auto` |
| [lab/css/poster.css](lab/css/poster.css) | 800px 가운데 컨테이너와 표 테두리 스타일. lab.html에서는 연결하지 않음 | `border-collapse: collapse` |

`lab/images/`: lab.html 맨 위 레드향 사진. `lab/top.jpg`: lab.html에서 쓰지 않는 상단 사진.

## position 값 비교

| 값 | 위치 기준 | 이 폴더 예제 |
|---|---|---|
| `static` | 문서 흐름 그대로, 이동 없음 | position.html, position-1.html |
| `relative` | 요소의 원래 자리 | position-1.html, position-relative.html |
| `absolute` | 위치를 지정한 가장 가까운 조상, 없으면 문서 첫 화면 | left-top.html, position-absolute.html, position-2.html |
| `fixed` | 브라우저 화면, 스크롤해도 같은 자리 | position-1.html, position-fixed.html |
