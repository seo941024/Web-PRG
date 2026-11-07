# 20 · localStorage와 배열 메서드

브라우저 localStorage에 JSON 문자열로 데이터를 저장하고 불러와 `find`·`filter`·`map`으로 가공하는 학생·도서·물품 조회 화면, 이름 저장, 테마 기억, 할 일 관리 화면 구현.

## 다룬 개념

| 개념 | 뜻과 사용 방법 |
|---|---|
| localStorage | 브라우저에 키와 값을 문자열로 저장해 새로 고침하거나 창을 닫은 뒤에도 남는 저장소. `setItem`으로 저장, `getItem`으로 읽기, `removeItem`으로 삭제 |
| JSON | 객체와 배열을 문자열로 표현하는 데이터 형식. `JSON.stringify()`로 객체 배열을 문자열로 바꿔 저장하고 `JSON.parse()`로 다시 객체 배열로 복원 |
| `JSON.stringify(값, null, 2)` | 들여쓰기를 넣어 읽기 쉬운 문자열로 바꾸는 사용법. `<pre>` 영역에 조회 결과를 줄 맞춰 표시 |
| 객체 배열 | 같은 모양의 객체를 여러 개 담은 배열. 학생, 도서, 물품, 할 일 데이터를 `id`와 속성으로 구성 |
| `find()` | 조건에 맞는 첫 요소 하나를 돌려주는 배열 메서드. `id`가 같은 학생·도서·할 일 찾기 |
| `filter()` | 조건에 맞는 요소만 모아 새 배열을 돌려주는 메서드. 점수·가격 기준으로 걸러내고 삭제할 할 일만 뺀 새 배열 구성 |
| `map()` | 요소마다 함수를 적용한 결과로 새 배열을 만드는 메서드. 이름·제목만 뽑은 배열과 통과 여부를 붙인 객체 배열 구성 |
| 메서드 체이닝 | 메서드가 돌려준 결과에 바로 다음 메서드를 이어 호출하는 방식. `filter()` 결과에 `map()`을 이어 조건에 맞는 제목만 추출 |
| 화살표 함수 콜백 | 배열 메서드에 넘기는 짧은 함수. `book => book.id === 3`처럼 본문이 한 식이면 그 값을 바로 반환 |
| `classList`와 테마 저장 | `classList.add`·`remove`·`contains`로 다크 모드 클래스를 바꾸고 고른 테마를 localStorage에 저장해 다시 열 때 적용 |
| 데이터 기준 화면 갱신 | 배열이 바뀔 때마다 저장 후 목록을 `innerHTML = ""`로 비우고 `forEach()`와 `createElement()`로 항목을 새로 만들어 화면과 데이터를 일치시키는 방식 |

## 파일별 내용

| 파일 | 내용 | 핵심 코드 |
|---|---|---|
| [localStorageEx01.html](localStorageEx01.html) | 이름을 입력해 저장·불러오기·삭제하고 결과 문구를 성공·경고 색으로 표시 | `localStorage.setItem`, `localStorage.getItem`, `localStorage.removeItem` |
| [localStorageEx02.html](localStorageEx02.html) | 버튼으로 라이트·다크 모드를 바꾸고 선택을 저장해 새로 고침 뒤에도 같은 테마 적용 | `classList.contains("dark-mode")`, `localStorage.setItem("theme", ...)` |
| [3ex.js](3ex.js) | 도서 객체 배열을 JSON 문자열로 저장한 뒤 다시 읽고, id로 찾기와 가격 조건 제목 추출 결과를 콘솔 출력 | `JSON.stringify()`, `JSON.parse()`, `find()`, `filter().map()` |
| [test.html](test.html) | 학생 객체 배열에서 id로 찾기, 80점 이상 걸러내기, 이름만 뽑기, 통과 여부 객체 배열 만들기 | `find()`, `filter()`, `map()`, 조건 연산자 |
| [통합예제.html](통합예제.html) | 학생 데이터를 버튼별로 저장·불러오기·id 찾기·80점 이상 보기·이름만 보기, 결과를 들여쓴 JSON으로 표시 | `addEventListener("click")`, `JSON.stringify(..., null, 2)`, `<pre>` |
| [test3.html](test3.html) | 같은 버튼 구성으로 도서 데이터 저장·불러오기·id 찾기·15,000원 이상 필터·제목 배열 만들기 | `find((book) => book.id === 3)`, `filter((book) => book.price >= 15000)` |
| [test_items.html](test_items.html) | 같은 버튼 구성으로 물품 데이터 저장·불러오기·id 찾기·조건 필터·이름 배열 만들기 | `localStorage.setItem("items", ...)`, `filter()`, `map()` |
| [todoList.html](todoList.html) | 할 일을 등록하면 localStorage에 저장하고 목록을 다시 그리며, 글자 클릭으로 완료 표시, 삭제 버튼, 완료 개수와 남은 할 일 이름 요약 표시 | `Date.now()`, `find()`, `filter()`, `map()`, `createElement()`, `localStorage.setItem("myTodos", ...)` |

## 버튼 조회 화면 비교

| 파일 | 데이터 | 찾기 조건 | 걸러내기 조건 | 뽑아내는 값 |
|---|---|---|---|---|
| 통합예제.html | 학생 | `id === 2` | `score >= 80` | 이름 |
| test3.html | 도서 | `id === 3` | `price >= 15000` | 제목 |
| test_items.html | 물품 | `id === 2` | `score >= 80` | 이름 |
