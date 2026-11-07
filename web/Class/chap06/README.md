# chap06 · CSS 적용 방식과 선택자

레드향 소개 문서에 인라인·내부·외부 스타일을 적용하고, 선택자마다 다른 글자색을 준 우선순위 비교 화면 구성.

Do it! 교재 예제와 연습문제 기반.

## 다룬 개념

| 개념 | 뜻과 사용 방법 |
|---|---|
| CSS 규칙 | `선택자 { 속성: 값; }` 형태로 어느 요소에 어떤 스타일을 줄지 정하는 문장 |
| 인라인 스타일 | 태그의 `style` 속성에 쓰는 스타일. 그 요소 하나에만 적용되며 `<h1 style="color: red">`처럼 사용 |
| 내부 스타일 시트 | `<head>` 안 `<style>` 태그에 모아 쓰는 스타일. 그 문서 전체에 적용 |
| 외부 스타일 시트 | 별도 `.css` 파일에 쓰고 `<link rel="stylesheet" href>`로 연결하는 스타일. 여러 문서가 같은 파일을 함께 사용 |
| 전체 선택자 `*` | 문서의 모든 요소를 고르는 선택자. `margin: 0; padding: 0`으로 브라우저 기본 여백 초기화 |
| 타입 선택자 | 태그 이름으로 같은 태그 전체를 고르는 선택자. `p { font-style: italic; }`로 모든 문단 기울임 |
| 클래스 선택자 `.` | `class` 값이 같은 요소를 고르는 선택자. `class="accent bg"`처럼 한 요소에 클래스 여러 개 적용 |
| 아이디 선택자 `#` | `id` 값으로 문서 안 요소 하나를 고르는 선택자. `#container`로 본문 영역의 너비, 가운데 배치, 테두리 지정 |
| 조합 선택자 | 선택자를 붙여 써서 조건을 좁히는 방식. `p.special`은 special 클래스인 문단, `#important.highlight`는 두 조건을 모두 갖춘 요소 |
| 우선순위 | 한 요소에 스타일이 겹칠 때 더 구체적인 선택자가 이기는 규칙. 전체, 타입, 클래스, 아이디, 인라인 순으로 강하고 `!important`는 모든 규칙보다 앞섬 |
| 캐스케이딩 | 우선순위가 같은 규칙이 여러 번 나오면 나중에 쓴 규칙이 적용되는 원리. `p`의 색을 `black`으로 쓴 뒤 `blue`로 다시 지정해 확인 |
| `<div>`·`<span>` | 의미 없이 영역을 묶는 태그. `<div>`는 한 줄을 다 차지하는 블록, `<span>`은 글자 단위로 묶는 인라인 |

## 파일별 내용

### 스타일 적용 방식

| 파일 | 내용 | 핵심 코드 |
|---|---|---|
| [no-style.html](no-style.html) | 스타일을 넣지 않은 레드향 소개 문서 | `<h1>`, `<p>` |
| [cssTest.html](cssTest.html) | 제목 두 개에 서로 다른 인라인 글자색 지정 | `style="color: red"`, `style="color: orange"` |
| [inline.html](inline.html) | 인라인 스타일 예제 시작 파일. 스타일 없는 레드향 소개 문서 | |
| [stylesheet-1.html](stylesheet-1.html) | 내부 스타일 시트로 전체 여백을 없애고 제목에 검은 배경, 흰 글자, 기울임 지정. 외부 파일 연결 코드는 주석 | `<style>`, `* { margin: 0px; }`, `background-color: #222` |
| [stylesheet-2.html](stylesheet-2.html) | 외부 스타일 시트 연결 예제 시작 파일. 스타일 없는 레드향 소개 문서 | |
| [style01.css](style01.css) | 제목 배경색, 글자색, 여백을 담은 외부 스타일. stylesheet-1.html에 주석으로 연결 | `h1 { background-color: #222; color: #fff; }` |
| [quiz-1.html](quiz-1.html) | 연습문제 1. 웹 기술 목록에 외부 스타일 시트를 연결하고 같은 규칙의 내부 스타일은 주석 처리 | `<link href="./css/mystyles.css" rel="stylesheet">` |
| [quiz-2.html](quiz-2.html) | 연습문제 2 시작 파일. 탐라국 입춘굿 소개 문단과 강조용 `span`, 빈 `<style>` | `<span class="accent">`, `<sup>` |

### 선택자

| 파일 | 내용 | 핵심 코드 |
|---|---|---|
| [universe.html](universe.html) | 전체 선택자 예제 시작 파일. 고양이 사진 한 장 | `<img src="images/cat.jpg">` |
| [type.html](type.html) | 타입 선택자 예제 시작 파일. `<div>` 안의 레드향 소개 | |
| [class.html](class.html) | 문단 기울임, `.accent` 테두리, `.bg` 배경 규칙을 정의한 문서. 요소에 클래스를 지정하기 전 상태 | `.accent { border:1px solid #000; }`, `.bg` |
| [id.html](id.html) | `#container`로 본문 영역의 너비, 가운데 배치, 안쪽 여백, 테두리 지정 | `#container`, `margin: 10px auto` |
| [basic-style.html](basic-style.html) | 아이디·타입·클래스 선택자를 함께 쓴 레드향 소개. 제목에 클래스 두 개, 본문 단어에 테두리 클래스 적용 | `class="accent bg"`, `<span class="accent">` |
| [group.html](group.html) | 그룹 선택자 예제 시작 파일. 강조용 `span`이 있는 레드향 소개 | |
| [cssDiv.html](cssDiv.html) | 블록 요소 `<div>`와 인라인 요소 `<span>`으로 HTML·CSS 뜻 표시 | `<div>`, `<span>` |

### 우선순위와 캐스케이딩

| 파일 | 내용 | 핵심 코드 |
|---|---|---|
| [cascading1.html](cascading1.html) | 같은 `p` 규칙을 두 번 쓰고 인라인 스타일을 겹쳐 최종 글자색 비교 | `p { color: blue; }`, `style="color: red"` |
| [cascading2.html](cascading2.html) | 부모 요소 스타일 상속 예제 시작 파일. 레드향 소개 문단과 `span` | |
| [cssPriority1.html](cssPriority1.html) | 전체, 타입, 클래스, 아이디, 인라인, `!important` 순으로 문단 글자색 비교 | `.important-text { color: red !important; }` |
| [cssPriority2.html](cssPriority2.html) | 조합 선택자와 아이디·클래스 조합까지 넣어 문단마다 적용되는 글자색 비교 | `p.special`, `#important.highlight`, `.forced { color: black !important; }` |

### css 폴더

| 파일 | 내용 | 핵심 코드 |
|---|---|---|
| [css/mystyles.css](css/mystyles.css) | quiz-1.html에 연결한 제목·목록 스타일. 제목 검은 띠, 불릿 없는 파란 목록 | `display: inline-block`, `list-style:none` |
| [css/mystyle-result.css](css/mystyle-result.css) | mystyles.css와 같은 규칙, 들여쓰기만 다른 파일 | `li { color:blue; }` |
| [css/style.css](css/style.css) | 외부 스타일 시트 작성용 파일. 안내 주석만 있음 | |
| [css/register.css](css/register.css) | chap05 회원가입 폼 스타일에서 `#container` 규칙만 뺀 파일. 이 폴더 HTML에서는 연결하지 않음 | `li label`, `#buttons input:hover` |

`images/`: 전체 선택자 예제에 쓴 고양이 사진.

## 적용 방식 비교

| 구분 | 인라인 스타일 | 내부 스타일 시트 | 외부 스타일 시트 |
|---|---|---|---|
| 작성 위치 | 태그의 `style` 속성 | `<head>` 안 `<style>` | 별도 `.css` 파일 |
| 적용 범위 | 그 요소 하나 | 그 문서 전체 | 연결한 모든 문서 |
| 이 폴더 예제 | cssTest.html | stylesheet-1.html | quiz-1.html |
