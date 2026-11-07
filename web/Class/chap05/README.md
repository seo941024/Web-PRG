# chap05 · 웹 폼

레드향 주문서, 로그인, 회원가입, 봉사동아리 가입 신청서를 입력 요소, 선택 목록, 버튼으로 구성.

Do it! 교재 예제와 연습문제 기반.

## 다룬 개념

| 개념 | 뜻과 사용 방법 |
|---|---|
| `<form>` | 사용자가 입력한 값을 서버로 보내는 영역. `action`에 값을 받을 주소, `method`에 `get`·`POST` 전송 방식 지정 |
| `<fieldset>`·`<legend>` | 관련 입력 항목을 테두리로 묶고 묶음에 제목을 붙이는 태그. 상품 선택, 배송 정보처럼 구역을 나누는 데 사용 |
| `<label>` | 입력 요소의 이름표. `<label>` 안에 `<input>`을 넣거나 `for`와 `id`를 같은 값으로 맞추면 이름표를 눌러도 입력 요소 선택 |
| 텍스트 입력 | 값 종류에 맞춘 한 줄 입력창. `type="text"`, `password`, `email`, `tel`, `url`로 구분하고 `size`로 화면 너비, `maxlength`로 최대 글자 수 지정 |
| 체크박스·라디오 버튼 | 체크박스는 여러 항목 동시 선택, 라디오 버튼은 같은 `name` 묶음에서 하나만 선택. 상품 선택과 포장 여부 선택에 사용 |
| 숫자 입력 | `type="number"`로 위아래 화살표가 붙은 숫자 입력창 표시. `min`·`max`로 상품 수량 범위 제한 |
| 날짜·시간 입력 | `type="date"`, `month`, `week`, `time`, `datetime-local`로 달력과 시간 선택창 표시. `min`·`max`로 고를 수 있는 날짜 범위 제한 |
| 버튼 | `submit`은 폼 전송, `reset`은 입력값 초기화, `button`은 `onclick`으로 자바스크립트 실행, `image`는 그림을 전송 버튼으로 사용 |
| 히든 필드·파일 첨부 | `type="hidden"`은 화면에 보이지 않고 값만 전송하는 필드, `type="file"`은 파일 선택 버튼 |
| `<select>`·`<option>` | 드롭다운 목록. `size`로 한 번에 보이는 항목 수, `multiple`로 여러 항목 선택, `selected`로 처음 선택된 항목, `<optgroup>`으로 항목 묶음 지정 |
| `<textarea>` | 여러 줄 텍스트 입력창. `cols`·`rows`로 가로 글자 수와 줄 수 지정 |
| 입력 보조 속성 | `placeholder`는 입력 전 흐리게 보이는 안내 문구, `autofocus`는 페이지를 열 때 커서가 놓일 칸, `required`는 비워 두면 전송이 막히는 필수 칸, `readonly`는 수정할 수 없는 칸 |
| 상대 경로 | 현재 파일 위치를 기준으로 다른 파일을 가리키는 경로. `css/` 폴더 안 파일에서 `../images/`로 한 단계 위 폴더의 이미지 참조 |

## 파일별 내용

### 폼 구성과 텍스트 입력

| 파일 | 내용 | 핵심 코드 |
|---|---|---|
| [fieldset.html](fieldset.html) | 이름·연락처 묶음과 취미·전공 묶음을 나눈 폼, 전송하면 register.html로 GET 요청 | `<form action="register.html" method="get">`, `<fieldset>`, `<legend>` |
| [label-1.html](label-1.html) | `<label>` 안에 `<input>`을 넣는 예제 시작 파일. 빈 폼 | |
| [label-2.html](label-2.html) | `for`로 `<label>`과 `<input>`을 연결하는 예제 시작 파일. 빈 폼 | |
| [t-field.html](t-field.html) | 배송 정보 폼. 이름, 배송 주소, 이메일, 연락처 입력창을 이름표와 연결 | `maxlength="10"`, `type="email"`, `type="tel"`, `<label for>` |
| [login.html](login.html) | 아이디·비밀번호 입력창, 그림 로그인 버튼, 초기화 버튼을 둔 로그인 폼 | `type="password"`, `type="image" src="./images/login.png"`, `type="reset"` |
| [login-image.html](login-image.html) | 그림 버튼 예제 시작 파일. 아이디·비밀번호 입력창과 그림 버튼 세로 정렬 스타일 | `input[type="image"] { vertical-align: middle; }` |
| [hidden.html](hidden.html) | 히든 필드 예제 시작 파일. 아이디·비밀번호 입력창과 로그인 버튼 | `type="submit"` |

### 선택 항목과 날짜

| 파일 | 내용 | 핵심 코드 |
|---|---|---|
| [radio-check.html](radio-check.html) | 상품 체크박스와 수량 입력, 포장 여부 라디오 버튼, 배송 정보로 구성한 주문 폼 | `type="checkbox"`, `type="radio" name="gift"` |
| [number.html](number.html) | 상품마다 수량 스핀 박스를 붙인 주문 폼과 제출·취소 버튼 | `type="number" min="0" max="5"` |
| [range.html](range.html) | 슬라이드 막대 예제 시작 파일. 소리 조절하기 제목과 빈 폼 | |
| [select.html](select.html) | 상품 목록을 펼쳐 보이고 여러 개를 고를 수 있는 목록 상자, 가정용 3kg 기본 선택 | `<select size="4" multiple>`, `selected` |
| [select2.html](select2.html) | 선물용·가정용으로 항목을 묶은 드롭다운 목록 | `<optgroup label="선물용">` |
| [date-1.html](date-1.html) | 날짜, 월, 주, 시간, 날짜와 시간 입력창을 한 줄에 배치 | `type="date"`, `type="month"`, `type="week"`, `type="datetime-local"` |
| [date-2.html](date-2.html) | 날짜·월·주 입력창 아래 시간 입력 예제 시작 파일 | `type="month"`, `type="week"` |
| [time.html](time.html) | 고를 수 있는 날짜를 제한한 날짜 입력창. 시간 입력 예제 시작 파일 | `<input type="date" min="2020-02-01" max="2020-02-15">` |
| [date-3.html](date-3.html) | 날짜 범위 예제 시작 파일. 제목만 있는 폼 | |

### 버튼과 입력 보조 속성

| 파일 | 내용 | 핵심 코드 |
|---|---|---|
| [button-1.html](button-1.html) | 반품 정보 폼. 전송·리셋 버튼 예제 시작 파일 | `<form action="return.php" method="POST">` |
| [button-2.html](button-2.html) | notice.html을 새 창으로 여는 버튼, 파일 첨부, 숨은 값 필드를 넣은 폼 | `onclick="window.open('notice.html')"`, `type="file"`, `type="hidden"` |
| [button-3.html](button-3.html) | 배송 정보 폼. `<button>` 태그 예제 시작 파일 | `type="date"`, `<textarea>` |
| [file.html](file.html) | 반품 정보 폼과 반품하기·취소하기 버튼. 파일 첨부 예제 시작 파일 | `type="submit"`, `type="reset"` |
| [textarea.html](textarea.html) | 배송 정보 폼과 주문·취소 버튼. 메모 입력 예제 시작 파일 | `type="email"`, `type="tel"` |
| [required.html](required.html) | 배송 정보 폼에 이름 칸 자동 커서와 연락처 입력 안내 문구 지정 | `autofocus`, `placeholder`, `css/form2.css` |
| [placeholder.html](placeholder.html) | 주문 상품 읽기 전용, 이름·주소·이메일·연락처 필수 입력, 안내 문구, 자동 커서를 모두 지정한 배송 정보 폼 | `readonly`, `required`, `autofocus`, `placeholder` |

### 완성 폼과 화면

| 파일 | 내용 | 핵심 코드 |
|---|---|---|
| [order.html](order.html) | 레드향 주문서. chap04 order.html과 같은 폼에서 제목 위치만 다름 | `<fieldset>`, `type="number"`, `css/order.css` |
| [register.html](register.html) | 회원가입 예제 시작 파일. 600px 가운데 컨테이너와 제목만 있는 화면 | `#container { margin:10px auto; }` |
| [register-2.html](register-2.html) | 아이디, 이메일, 비밀번호, 가입 경로, 메모, 메일 수신 여부를 받는 회원가입 폼 | `required`, `placeholder`, `<select>`, `css/register.css` |
| [Homework.html](Homework.html) | 대학교 봉사동아리 회원가입 신청서. 학생 정보, 희망 봉사 장소 체크박스, 환영회 참석 라디오 버튼, 봉사 날짜·시간 입력으로 구성 | `<select>`, `type="checkbox"`, `type="date"`, `type="time"` |
| [notice.html](notice.html) | 배경 이미지 위에 제목과 문단을 얹은 공지사항 화면. button-2.html 버튼이 여는 문서 | `css/notice.css` |
| [pf.html](pf.html) | FUNNYCOM 포트폴리오 화면 틀. 헤더 메뉴와 홈, 소개, 프로젝트, 연락 구역 | `<header>`, `<nav>`, `<section>`, `<footer>` |

### 연습문제

| 파일 | 내용 | 핵심 코드 |
|---|---|---|
| [quiz-1.html](quiz-1.html) | 연습문제 1 시작 파일. 예약 정보 제목과 목록·라벨 스타일 | `label { float:left; }` |
| [sol-1.html](sol-1.html) | 연습문제 1 풀이. 이름, 휴대폰, 이메일을 받는 예약 폼 | `type="tel"`, `type="email"`, `<label for>` |
| [quiz-2.html](quiz-2.html) | 연습문제 2 시작 파일. 프런트엔드 개발자 지원서 제목과 빈 폼 | `fieldset`, `legend` |
| [sol-2.html](sol-2.html) | 연습문제 2 풀이. 개인정보, 지원 분야 라디오 버튼, 지원 동기 입력으로 구성한 지원서 | `autofocus`, `placeholder`, `type="radio" name="field"`, `<textarea>` |

### css 폴더

| 파일 | 내용 | 핵심 코드 |
|---|---|---|
| [css/PathTest.html](css/PathTest.html) | 상대 경로와 외부 주소로 이미지 표시, 외부 사이트를 새 탭으로 여는 링크 | `src="../images/notice.jpg"`, `target="_blank"` |
| [css/order.css](css/order.css) | order.html, placeholder.html 주문서 스타일. 배송 정보 라벨을 왼쪽에 띄우고 버튼을 가로로 배치 | `float:left`, `display:flex` |
| [css/order2.css](css/order2.css) | order.css와 같은 주문서 스타일에서 버튼을 `<button>` 기준으로 지정하고 첫 버튼 강조. 이 폴더 HTML에서는 연결하지 않음 | `form > div > button:first-of-type` |
| [css/form2.css](css/form2.css) | required.html 배송 정보 폼 스타일. 라벨 너비, 입력창 너비, 버튼 그림자 | `#shipping li label`, `box-shadow` |
| [css/register.css](css/register.css) | register-2.html 회원가입 폼 스타일. 라벨 너비, 입력창 크기, 드롭다운 크기, 버튼 마우스 오버 색 | `li label`, `#buttons input:hover` |
| [css/notice.css](css/notice.css) | notice.html 공지사항 스타일. 화면 가운데 정렬과 배경 이미지 | `display:flex`, `background:url('../images/notice.jpg')` |

`images/`: 로그인 그림 버튼, 공지사항 배경, 경로 확인용 사진.
