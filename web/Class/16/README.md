# 16 · 변수·자료형·조건문·반복문

변수와 상수, 자료형과 형 변환, 조건문과 반복문으로 배수 판별·계절 판별·구구단·자리 배치도·메뉴 선택 화면 구현.

Do it! 교재 예제와 연습문제 기반.

## 다룬 개념

| 개념 | 뜻과 사용 방법 |
|---|---|
| 변수 `let`과 `var` | 값을 담아 두는 이름 붙은 저장 공간. `let`은 같은 이름 재선언을 막고 `var`는 허용. var-3.html에서 `var sum`을 다시 선언한 결과 확인 |
| 상수 `const` | 처음 넣은 값을 바꿀 수 없는 변수. 원주율 `PI`를 상수로 두고 원 넓이 계산 |
| 자료형과 `typeof` | 숫자, 문자열, `undefined`, `null`처럼 값의 종류. `typeof`로 확인하며 `prompt()` 입력값은 문자열 |
| `undefined`와 `null` | `undefined`는 선언만 하고 값을 넣지 않은 상태, `null`은 값이 없음을 일부러 넣은 상태 |
| 형 변환 | 값의 자료형을 바꾸는 일. `parseInt()`는 정수, `parseFloat()`는 실수로 변환. 문자열과 숫자를 `+`로 더하면 숫자가 문자열로 바뀌어 이어 붙음 |
| 템플릿 리터럴 | 백틱으로 감싼 문자열 안에 `${변수}`로 값을 끼워 넣는 문법. 판별 결과와 구구단 식 출력에 사용 |
| 나머지·비교 연산자 | `%`로 나눈 나머지를 구하고 `===`로 값과 자료형이 모두 같은지 비교. 3의 배수와 4의 배수 판별에 사용 |
| `if`·`else` 조건문 | 조건식이 참이면 한쪽, 거짓이면 다른 쪽 코드를 실행하는 문법. 입력하지 않거나 취소한 경우를 먼저 걸러 내는 중첩 조건으로 작성 |
| 조건 연산자 | `조건 ? 참일 때 값 : 거짓일 때 값` 형태로 `if`문을 한 줄로 줄인 식 |
| `switch`문 | 한 값에 따라 여러 `case` 중 하나를 실행하는 문법. `break` 없는 `case`를 이어 붙여 여러 달을 한 계절로 묶음 |
| `for`문 | 시작값, 조건, 증감식으로 정한 횟수만큼 반복하는 문법. 합계 계산, 중첩 `for`로 구구단과 좌석 표 출력 |
| `while`문과 `break` | 조건이 참인 동안 반복하는 문법과 반복을 즉시 끝내는 명령. `while (1)` 무한 반복 안에서 종료 번호를 고르면 `break`로 탈출 |
| `forEach()` | 배열 요소마다 지정한 함수를 실행하는 배열 메서드. 요소와 인덱스를 받아 이름 앞에 순번을 붙여 출력 |
| `toFixed()` | 숫자를 지정한 소수 자릿수까지 반올림한 문자열로 바꾸는 메서드. 섭씨 온도를 소수 첫째 자리까지 표시 |

## 파일별 내용

| 파일 | 내용 | 핵심 코드 |
|---|---|---|
| [var-1.html](var-1.html) | 예제 시작 파일. 변수 선언 코드를 넣을 빈 스크립트 영역 | 빈 `<script>` |
| [var-2.html](var-2.html) | 반지름을 입력받아 상수 `PI`로 원 넓이를 계산해 콘솔 출력 | `const PI`, `prompt()`, `console.log()` |
| [var-3.html](var-3.html) | `var`로 같은 이름 변수를 다시 선언한 결과 확인, 화씨 온도를 섭씨로 바꿔 알림 창 출력 | `var sum`, `parseFloat()`, `toFixed(1)` |
| [undefinedNull.html](undefinedNull.html) | 값을 넣지 않은 변수와 `null`을 넣은 변수를 콘솔에 출력해 비교 | `let first, second`, `null` |
| [consoleTest.html](consoleTest.html) | 입력값의 자료형 확인과 3의 배수 판별, 문자열과 숫자를 더한 결과의 자료형 확인 | `typeof`, `num % 3 == 0`, 템플릿 리터럴 |
| [convertFunc.html](convertFunc.html) | 예제 시작 파일. 화씨를 섭씨로 바꾸는 식과 알림 창 출력 틀, 입력 코드를 넣을 자리 | `(f - 32) / 1.8`, `alert()` |
| [if-1.html](if-1.html) | 입력한 숫자가 3의 배수인지 판별, 입력하지 않거나 취소하면 안내 문구 출력 | 중첩 `if`, `parseInt()`, `% 3 === 0` |
| [if-2.html](if-2.html) | 예제 시작 파일. 취소 버튼 확인 뒤 3의 배수를 판별하는 순서를 주석으로 정리 | 주석 |
| [if-3.html](if-3.html) | 3의 배수 판별을 조건 연산자 한 줄로 작성 | `조건 ? 값 : 값` |
| [and.html](and.html) | 예제 시작 파일. AND 연산자 조건 코드를 넣을 빈 스크립트 영역 | 빈 `<script>` |
| [or.html](or.html) | 예제 시작 파일. OR 연산자 조건 코드를 넣을 빈 스크립트 영역 | 빈 `<script>` |
| [switch.html](switch.html) | 생일 달을 입력받아 봄·여름·가을·겨울 중 태어난 계절을 콘솔 출력 | `switch`, `case`, `break`, `default` |
| [repeat-1.html](repeat-1.html) | 1부터 5까지 더하며 단계별 합계를 콘솔 출력 | `for`, `sum += i` |
| [repeat-2.html](repeat-2.html) | 예제 시작 파일. `for`문 합계 코드를 넣을 빈 스크립트 영역 | 빈 `<script>` |
| [repeat-3.html](repeat-3.html) | 학생 이름 배열의 길이를 출력하고 순번을 붙여 이름 출력 | `students.length`, `forEach(function (student, index) {...})` |
| [even.html](even.html) | 예제 시작 파일. 짝수 합 제목만 있는 화면, 반복문 코드를 넣을 자리 | `<h1>` |
| [while.html](while.html) | 예제 시작 파일. `while`문으로 별을 표시할 빈 스크립트 영역 | 빈 `<script>` |
| [dowhile.html](dowhile.html) | 예제 시작 파일. `do...while`문으로 별을 표시할 빈 스크립트 영역 | 빈 `<script>` |
| [test2.html](test2.html) | 중식 메뉴 번호를 반복해서 입력받고 종료 번호를 고르면 반복 종료 | `while (1)`, `prompt()`, `break` |
| [timestable-1.html](timestable-1.html) | 몇 단까지 출력할지 입력받아 2단부터 단별 상자로 구구단 출력 | 중첩 `for`, `document.write()`, `display: flex` |
| [timestable-2.html](timestable-2.html) | 1단부터 9단까지 단 제목과 곱셈식을 차례로 출력 | 중첩 `for`, `<h3>` |
| [timestable-3.html](timestable-3.html) | 2단부터 9단까지 단별 상자로 구구단 출력, 외부 CSS 연결 | 중첩 `for`, `<div class="times">` |
| [with-table.html](with-table.html) | 2단부터 9단까지 단마다 표 하나로 구구단 출력 | `<table>`, `<th>`, `<td>` |
| [seat-1.html](seat-1.html) | 예제 시작 파일. 전체 인원과 한 줄 인원으로 필요한 줄 수를 구하는 방법을 주석으로 정리 | 주석 |
| [seat-2.html](seat-2.html) | 입장객 수와 한 줄 좌석 수를 입력받아 필요한 줄 수를 출력하고 좌석 표 작성 | `memNum % colNum`, `parseInt(memNum / colNum) + 1`, 중첩 `for` |
| [seat-2-2.html](seat-2-2.html) | 좌석 번호를 행과 열로 계산해 표에 넣고 입장객 수를 넘으면 반복 종료 | `i * colNum + j`, `break` |
| [quiz-1.html](quiz-1.html) | 연습문제 시작 파일. 4의 배수 판별 제목만 있는 화면 틀 | `<h2>` |
| [sol-1.html](sol-1.html) | 연습문제 1 풀이. 입력한 숫자가 4의 배수인지 문서에 출력 | `% 4 === 0`, `document.write()` |
| [quiz-2.html](quiz-2.html) | 연습문제 시작 파일. 3의 배수 찾기 제목만 있는 화면 틀 | `<h2>` |
| [sol-2.html](sol-2.html) | 연습문제 2 풀이. 입력한 수까지 3의 배수를 모두 출력하고 개수 집계 | `prompt("...", "100")`, `for`, `count++` |

`css/`: switch.css는 switch.html 배경과 글자 스타일, with-table.css는 with-table.html 표 테두리와 칸 여백, timestable.css는 timestable-3.html에 연결한 빈 스타일 파일.
