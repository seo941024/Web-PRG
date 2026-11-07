# 18 · 배열과 내장 객체·브라우저 객체

Array·Date·Math 내장 객체와 window·screen·location 브라우저 객체로 배열 가공, 경과 일수 계산, 당첨자 추첨, 실시간 시계, 팝업 창 크기와 위치 지정 구현.

Do it! 교재 예제와 연습문제 기반.

## 다룬 개념

| 개념 | 뜻과 사용 방법 |
|---|---|
| 배열과 `length` | 여러 값을 순서대로 담는 자료. 0부터 시작하는 인덱스로 요소에 접근하고 `length`를 반복 범위로 사용 |
| `concat()`과 `join()` | 두 배열을 이어 새 배열을 만드는 메서드와 요소를 구분자로 이어 한 문자열로 만드는 메서드 |
| `push()`·`unshift()`·`pop()`·`shift()` | 배열 끝과 앞에 요소를 넣고 빼는 메서드. 넣는 메서드는 새 길이, 빼는 메서드는 꺼낸 요소를 돌려줌 |
| `splice()`와 `slice()` | `splice`는 원본 배열에서 요소를 지우거나 끼워 넣고 지운 요소를 반환, `slice`는 원본을 그대로 두고 지정 범위만 새 배열로 반환 |
| 객체와 메서드 | 프로퍼티와 동작을 함께 묶은 자료. 자동차 객체의 프로퍼티를 점 표기법으로 읽고 메서드 단축 구문으로 만든 동작 호출 |
| `Date` 객체 | 날짜와 시각을 다루는 내장 객체. `toLocaleString()`, `toLocaleTimeString()`으로 지역 형식 표시, `getTime()`의 밀리초 값 차이로 지난 일수 계산 |
| `Math` 객체 | 수학 계산용 내장 객체. `Math.random()`과 `Math.floor()`로 1부터 응모자 수 사이 정수 추첨, `Math.round()`로 일수 반올림 |
| `setInterval()` | 지정한 시간 간격마다 함수를 반복 실행하는 타이머. 1초마다 현재 시각 갱신 |
| `window.open()`과 `close()` | 새 창을 여는 메서드와 닫는 메서드. 세 번째 인수에 `width`, `height`, `left`, `top`을 적어 창 크기와 위치 지정 |
| 팝업 차단 확인 | 브라우저가 팝업을 막으면 `window.open()`이 `null`을 돌려주는 점을 이용해 차단 안내 알림 표시 |
| `screen` 객체 | 사용자 모니터 정보를 담은 객체. `availWidth`, `availHeight`에서 창 크기를 빼고 2로 나눠 화면 가운데 좌표 계산 |
| `location` 객체 | 현재 문서 주소 정보를 담은 객체. `href`, `host`, `port`를 출력하고 `replace()`로 방문 기록을 남기지 않고 다른 주소로 이동 |

## 파일별 내용

| 파일 | 내용 | 핵심 코드 |
|---|---|---|
| [array-1.html](array-1.html) | 예제 시작 파일. 배열 요소 출력 코드를 넣을 화면 틀 | 빈 `<script>` |
| [array-2.html](array-2.html) | 예제 시작 파일. 숫자·문자 배열과 합치기·추가·추출 단계별 주석 | `nums`, `chars` |
| [array-3.html](array-3.html) | 예제 시작 파일. 과목 배열과 `splice` 인수 개수별 주석 | `study` 배열 |
| [array-4.html](array-4.html) | 예제 시작 파일. 색 이름 배열과 `slice` 코드를 넣을 자리 | `colors` 배열 |
| [time-1.html](time-1.html) | 현재 날짜와 시간을 콘솔과 문서에 출력, 자동차 객체의 프로퍼티 읽기와 메서드 호출 | `new Date()`, 객체 리터럴, `car.startEngine()` |
| [time-2.html](time-2.html) | 예제 시작 파일. 지역 형식 날짜 출력 코드를 넣을 빈 스크립트 영역 | 빈 `<script>` |
| [current.html](current.html) | 1초마다 현재 시각을 지역 형식으로 바꿔 화면에 갱신 | `setInterval(displayNow, 1000)`, `toLocaleTimeString()`, `innerHTML` |
| [days.html](days.html) | 예제 시작 파일. 연속 독서 일수를 표시할 원형 화면 틀 | `<span id="result">` |
| [event.html](event.html) | 예제 시작 파일. 당첨자 발표 화면 틀 | 빈 `<script>` |
| [event-2.html](event-2.html) | 응모자 수와 당첨자 수를 입력받아 당첨 번호를 여러 개 뽑아 출력 | `Math.floor((Math.random() * seed) + 1)`, `for` |
| [notice.html](notice.html) | 예제 시작 파일. 팝업 창에 띄울 공지사항 화면, 닫기 버튼에 기능을 연결할 자리 | `<button>닫기</button>` |
| [popup.html](popup.html) | 예제 시작 파일. 팝업 창 표시 코드를 넣을 빈 스크립트 영역 | 빈 `<script>` |
| [position.html](position.html) | 예제 시작 파일. 팝업 창 이름과 위치 지정 코드를 넣을 빈 스크립트 영역 | 빈 `<script>` |
| [popup-check.html](popup-check.html) | 예제 시작 파일. 팝업 차단 확인 코드를 넣을 빈 스크립트 영역 | 빈 `<script>` |
| [center.html](center.html) | 공지사항 팝업 창을 크기만 지정해 열기, 화면 가운데 배치 코드를 더할 시작 코드 | `window.open('notice.html', 'pop', 'width=500, height=400')` |
| [close.html](close.html) | 버튼으로 팝업 창을 열고 같은 창 닫기 | `window.open()`, `myWin.close()`, `onclick` |
| [screen.html](screen.html) | 예제 시작 파일. 화면 크기 정보를 출력할 빈 스크립트 영역 | 빈 `<script>` |
| [location.html](location.html) | 예제 시작 파일. 주소 정보 출력 영역과 출판사 홈페이지 이동 버튼 화면 틀 | `<div id="display">` |
| [quiz-1.html](quiz-1.html) | 연습문제 시작 파일. 현재 시각 표시 영역만 있는 화면 | `<span id="current">` |
| [sol-1.html](sol-1.html) | 연습문제 1 풀이. 1초마다 현재 시각 갱신 | `setInterval()`, `toLocaleTimeString()` |
| [quiz-2.html](quiz-2.html) | 연습문제 시작 파일. 현재 시간 보기 버튼과 빈 `displayTime()` 함수, 팝업 조건을 주석으로 정리 | `function displayTime()` |
| [sol-2.html](sol-2.html) | 연습문제 2 풀이. 버튼 클릭 시 current.html을 화면 가운데 팝업 창으로 표시 | `screen.availWidth`, `window.open('current.html', '', opt)` |

### results/ · 예제 완성 코드

위 예제 시작 파일과 같은 이름으로 짝을 이루는 완성 코드.

| 파일 | 내용 | 핵심 코드 |
|---|---|---|
| [array-1.html](results/array-1.html) | 배열 요소를 `length`만큼 반복하며 문단으로 출력 | `numbers.length`, `numbers[i]` |
| [array-2.html](results/array-2.html) | 두 배열 합치기, 구분자로 잇기, 앞뒤 요소 추가와 추출 결과 출력 | `concat()`, `join('/')`, `push()`, `unshift()`, `pop()`, `shift()` |
| [array-3.html](results/array-3.html) | `splice` 인수 개수에 따른 요소 삭제와 삽입 결과 출력 | `splice(2)`, `splice(1, 1)`, `splice(1, 0, 'typescript')` |
| [array-4.html](results/array-4.html) | 시작 인덱스만 준 경우와 끝 인덱스까지 준 경우의 `slice` 결과 비교 | `slice(2)`, `slice(2, 4)` |
| [time-1.html](results/time-1.html) | 현재 날짜와 시각을 문서에 출력 | `new Date()` |
| [time-2.html](results/time-2.html) | 현재 날짜와 시각을 지역 형식으로 출력 | `toLocaleString()` |
| [days.html](results/days.html) | 시작 날짜부터 오늘까지 지난 일수를 계산해 원형 화면에 표시 | `getTime()`, `Math.round()`, `innerText` |
| [event.html](results/event.html) | 응모자 수를 입력받아 당첨자 한 명 추첨 | `Math.random()`, `Math.floor()` |
| [notice.html](results/notice.html) | 닫기 버튼으로 팝업 창 닫기 | `window.close()` |
| [notice_open.html](results/notice_open.html) | 버튼으로 공지사항 팝업 창 열기 | `window.open('notice.html', '', 'width=500, height=400')` |
| [popup.html](results/popup.html) | 문서를 열면 notice.html을 팝업 창으로 표시 | `window.open()` |
| [position.html](results/position.html) | 팝업 창 이름과 왼쪽·위쪽 위치 지정 | `left=100, top=200` |
| [popup-check.html](results/popup-check.html) | 문서를 열 때 팝업을 띄우고 차단되면 안내 알림 | `onload`, `newWin == null` |
| [center.html](results/center.html) | 화면 크기에서 창 크기를 빼 가운데 좌표를 구하는 함수로 팝업 표시 | `openCenter()`, `screen.availWidth` |
| [screen.html](results/screen.html) | 화면 전체 크기와 사용 가능 크기 출력 | `screen.width`, `screen.availHeight` |
| [location.html](results/location.html) | 현재 주소·호스트·포트 출력, 버튼으로 출판사 홈페이지 이동 | `location.href`, `location.replace()` |
