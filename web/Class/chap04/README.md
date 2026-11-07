# chap04 · 텍스트·목록·표·이미지·링크·멀티미디어 태그

레드향 상품 소개 페이지와 탐라국 입춘굿 포스터를 텍스트, 목록, 표, 이미지, 링크, 오디오·비디오 태그로 구성.

Do it! 교재 예제와 연습문제 기반.

## 다룬 개념

| 개념 | 뜻과 사용 방법 |
|---|---|
| 텍스트 태그 | 글자에 굵기, 기울임, 줄바꿈을 주는 태그. `<b>`·`<strong>`은 굵게, `<i>`·`<em>`은 기울임, `<br>`은 줄바꿈으로 레드향 소개 문단에 사용 |
| 순서 목록 `<ol>` | 항목 앞에 번호가 붙는 목록. 샐러드 레시피 순서와 축제 일정에 사용하고, `type="a"`로 번호를 알파벳으로 변경 |
| 순서 없는 목록 `<ul>` | 번호 대신 불릿이 붙는 목록. `type="square"`로 불릿 모양을 사각형으로 변경 |
| 설명 목록 `<dl>` | 용어와 설명을 짝지은 목록. `<dt>`에 상품 이름, `<dd>`에 과일 크기별 구성 |
| 표 구조 | `<table>` 안을 `<tr>` 행, `<th>` 제목 셀, `<td>` 데이터 셀로 구성. `<caption>`은 표 제목, `<thead>`·`<tbody>`는 머리글과 본문 구분 |
| 셀 합치기 | `rowspan`은 세로 방향, `colspan`은 가로 방향으로 셀을 합치는 속성. 같은 용도의 행을 `rowspan="2"`로 묶어 "선물용", "가정용"을 한 칸에 표시 |
| 열 묶음 `<colgroup>`·`<col>` | 표의 열 단위로 스타일을 주는 태그. 첫 열 배경색 지정, `span="2"`로 두 열 너비를 한 번에 지정 |
| `border-collapse` | 표와 셀의 테두리가 겹칠 때 한 줄로 합치는 CSS 속성. 표마다 `<style>`에서 `collapse`로 지정 |
| 이미지 `<img>` | `src`에 파일 경로, `alt`에 이미지를 못 볼 때 대신 읽히는 설명 지정. `width`·`height`는 단위 없이 쓰면 px, `%`는 부모 너비 대비 비율 |
| `<figure>`·`<figcaption>` | 이미지와 설명글을 한 묶음으로 만드는 태그. 사진마다 설명을 붙이거나 사진 여러 장에 설명 하나를 붙임 |
| 링크 `<a>` | `href`에 이동할 주소를 지정하는 태그. `target="_blank"`는 새 탭에서 열기, `<a>`로 `<img>`를 감싸면 이미지 링크 |
| 앵커 | 요소에 `id`를 주고 `href="#id"`로 같은 문서 안 위치로 이동하는 방식. `poster-image.html#schedule`처럼 다른 문서의 특정 위치로도 이동 |
| `<audio>`·`<video>` | 소리와 영상을 문서에 넣는 태그. `controls` 재생 막대, `autoplay` 자동 재생, `loop` 반복, `muted` 소리 끔, `poster` 재생 전 표시 이미지 |
| `<object>` | PDF 같은 외부 파일을 문서 안에 넣는 태그. `data="product.pdf"`로 상품 안내 PDF 삽입 |
| `<button>` | 클릭할 수 있는 버튼 태그. 포스터의 "자세한 정보 보기"를 `type="button"` 버튼으로 표시 |

## 파일별 내용

### 텍스트·목록

| 파일 | 내용 | 핵심 코드 |
|---|---|---|
| [heading.html](heading.html) | 제목 태그 예제 시작 파일. 본문에 안내 주석만 있는 빈 화면 | |
| [text.html](text.html) | 텍스트 태그 예제 시작 파일. 본문에 안내 주석만 있는 빈 화면 | |
| [p.html](p.html) | 레드향 페이지의 제목 틀. 문단 자리에 안내 주석, 레시피·상품 구성 소제목 | `<h1>`, `<h2>` |
| [list-1.html](list-1.html) | 레드향 소개 문단에 텍스트 태그 적용, 재료준비 아래 사각 불릿 목록 | `<em>`, `<strong>`, `<i>`, `<ul type="square">` |
| [list-2.html](list-2.html) | 샐러드 레시피를 순서 목록으로, 상품 구성을 설명 목록으로 작성 | `<ol>`, `<dl>`, `<dt>`, `<dd>` |
| [list-3.html](list-3.html) | 설명 목록 예제 시작 파일. 레시피 순서 목록까지 작성된 화면 | `<ol>`, `<li>` |
| [sol-10.html](sol-10.html) | 연습문제 1 풀이. 교내 방송국 수습 국원 모집 안내문을 제목, 문단, 목록, 이미지로 구성 | `<ol type="a">`, `<b>`, `<i>`, `<img>` |
| [quiz-1.html](quiz-1.html) | 연습문제 1 시작 파일. 본문이 비어 있는 문서 | |

### 표

| 파일 | 내용 | 핵심 코드 |
|---|---|---|
| [table-1.html](table-1.html) | 표 예제 시작 파일. 레드향 소개와 레시피까지 작성되고 상품 구성 표 자리에 안내 주석 | `<ol>`, `<strong>` |
| [table-2.html](table-2.html) | 용도, 중량, 갯수, 가격 열로 상품 구성 표 작성, 열 너비와 배경색을 열 묶음으로 지정 | `<caption>`, `<colgroup>`, `<col span="2">` |
| [table-3.html](table-3.html) | 머리글과 본문을 나눈 상품 구성 표. 같은 용도 셀을 합치기 전 상태 | `<thead>`, `<tbody>` |
| [table-4.html](table-4.html) | 같은 용도의 첫 셀을 세로로 합친 상품 구성 표 | `<td rowspan="2">` |
| [table-5.html](table-5.html) | 세로 셀 합치기에 첫 열 배경색과 뒤쪽 열 너비를 더한 상품 구성 표 | `<col style="background-color:#eee;">`, `<col style="width:150px">` |
| [tableTest.html](tableTest.html) | 4행 3열 표에서 두 줄짜리 캡션, 가로 셀 합치기, 세로 셀 합치기 확인 | `<caption>`, `colspan="2"`, `rowspan="2"` |
| [TableTest2.html](TableTest2.html) | 선물용 상품 가격표, 마지막 행 세 칸을 합쳐 품절 안내 표시 | `align="center"`, `rowspan="2"`, `colspan="3"` |
| [sol-11.html](sol-11.html) | 연습문제 2 풀이. 개인정보 세 행을 한 칸으로 묶은 수습 국원 지원 양식 표 | `rowspan="3"`, `colspan="2"`, `td:last-child` |
| [quiz-2.html](quiz-2.html) | 연습문제 2 시작 파일. 표 테두리와 셀 여백 스타일만 있는 빈 화면 | `td:last-child { width:200px; }` |

### 이미지

| 파일 | 내용 | 핵심 코드 |
|---|---|---|
| [image-1.html](image-1.html) | 레드향 제목 위에 귤 사진 삽입, 너비는 비율로 높이는 px로 지정, 소개와 레시피 사이 구분선 | `<img width="50%" height="200">`, `<hr>` |
| [image-2.html](image-2.html) | 이미지 크기 지정 예제 시작 파일. 원래 크기, 비율, 고정 너비 설명 문단과 크기 속성 없는 같은 사진 | `<img src="images/salad.jpg" alt="레드향">` |
| [figcaption-1.html](figcaption-1.html) | 제주 사계절 사진에 설명글을 붙이고, 가을·겨울 두 장은 설명 하나로 묶은 화면 | `<figure>`, `<figcaption>` |
| [figcaption-2.html](figcaption-2.html) | 여러 이미지에 설명 하나를 붙이는 예제 시작 파일. `<figure>` 안에 사계절 사진만 배치 | `<figure>` |
| [imgcaption.html](imgcaption.html) | 내용 없는 빈 파일 | |

### 링크

| 파일 | 내용 | 핵심 코드 |
|---|---|---|
| [link-1.html](link-1.html) | 레드향 페이지에 샐러드 영상과 새 탭으로 열리는 주문하기 텍스트 링크 추가 | `<a href="order.html" target="_blank">`, `<video>`, `css/poster.css` |
| [link-2.html](link-2.html) | 귤 사진을 주문서로 가는 이미지 링크로 만들고, 제목마다 이동용 `id` 지정 | `<a href="order.html"><img></a>`, `id="recipe"` |
| [link-3.html](link-3.html) | 새 탭 열기 예제 시작 파일. 이미지 링크와 주문서 텍스트 링크까지 작성된 화면 | `<a href="order.html">` |
| [link-4.html](link-4.html) | 위쪽 목차를 눌러 각 제목으로 이동, 처음으로 돌아가기와 포스터 문서의 일정 위치로 가는 링크 | `href="#red"`, `href="#container"`, `href="poster-image.html#schedule"` |
| [order.html](order.html) | 링크 예제에서 여는 레드향 주문서. 상품 체크박스, 수량, 포장 선택, 배송 정보 입력 폼 | `<fieldset>`, `type="number"`, `type="date"`, `<textarea>` |

### 오디오·비디오·PDF

| 파일 | 내용 | 핵심 코드 |
|---|---|---|
| [audio-1.html](audio-1.html) | 오디오 삽입 예제 시작 파일. 재생 막대 없는 `<audio>` 태그 | `<audio src>` |
| [audio-2.html](audio-2.html) | 재생 막대가 있는 오디오. 반복 재생 예제 시작 파일 | `<audio src="medias/spring.mp3" controls>` |
| [video-1.html](video-1.html) | 비디오 삽입 예제 시작 파일. 제목과 안내 주석만 있는 화면 | |
| [video-2.html](video-2.html) | 재생 막대와 너비를 지정한 샐러드 영상. 포스터 이미지 예제 시작 파일 | `<video controls width="700">` |
| [video-3.html](video-3.html) | 재생 전 샐러드 사진을 보여 주는 영상. 소리 끄고 반복 자동 재생하는 예제 시작 파일 | `poster="images/salad.jpg"` |
| [obj.html](obj.html) | 반복 자동 재생 오디오와 소리를 끈 반복 자동 재생 영상. PDF 삽입 코드는 주석 처리 | `autoplay`, `loop`, `muted`, `<object data="product.pdf">` |
| [embed.html](embed.html) | `<embed>` 예제 시작 파일. 제목과 안내 주석만 있는 화면 | |

### 탐라국 입춘굿 포스터

| 파일 | 내용 | 핵심 코드 |
|---|---|---|
| [poster.html](poster.html) | 포스터 예제 시작 파일. 빈 `#container`만 있는 화면 | `<div id="container">` |
| [poster-list.html](poster-list.html) | 축제 소개 문단과 일정·먹거리 소제목. 목록 예제 시작 파일 | `<p>`, `<br>`, `<h2>` |
| [poster-table1.html](poster-table1.html) | 축제 일정을 순서 없는 목록으로 작성, 먹거리 표 자리에 안내 주석 | `<ul>`, `border-collapse: collapse` |
| [poster-image.html](poster-image.html) | 먹거리 표, 축제 공지사항 외부 링크, 일정 제목의 앵커 `id`를 갖춘 포스터. 상단 이미지 자리는 주석 | `<a href>`, `id="schedule"`, `<table>` |
| [poster-link.html](poster-link.html) | 상단 사진, 외부 링크, 일정 목록, 먹거리 표를 모두 갖춘 포스터 | `<img width="100%">`, `<a href>`, `css/poster.css` |
| [button2.html](button2.html) | "자세한 정보 보기"를 버튼으로 바꾸고 일정을 순서 목록으로 표시한 포스터 | `<button type="button">`, `<ol>` |

### css 폴더

| 파일 | 내용 | 핵심 코드 |
|---|---|---|
| [css/poster.css](css/poster.css) | 포스터와 link-1.html에 연결한 스타일. 전체 여백 초기화와 480px 가운데 컨테이너 | `box-sizing: border-box`, `margin:40px auto` |
| [css/order.css](css/order.css) | order.html 주문서 스타일. 배송 정보 라벨을 왼쪽에 띄우고 주문·취소 버튼을 가로로 배치 | `float:left`, `display:flex`, `justify-content: space-around` |
| [css/order2.css](css/order2.css) | order.css와 같은 주문서 스타일에서 버튼을 `<button>` 기준으로 지정하고 첫 버튼을 파란색으로 강조. 이 폴더 HTML에서는 연결하지 않음 | `form > div > button:first-of-type` |
| [css/form2.css](css/form2.css) | chap05 required.html용 주문서 스타일과 같은 파일. 이 폴더 HTML에서는 연결하지 않음 | `input[type="submit"]`, `box-shadow` |
| [css/register.css](css/register.css) | chap05 회원가입 폼 스타일과 같은 파일. 이 폴더 HTML에서는 연결하지 않음 | `li label`, `#buttons input:hover` |
| [css/notice.css](css/notice.css) | chap05 공지사항 화면 스타일과 같은 파일. 이 폴더 HTML에서는 연결하지 않음 | `display:flex`, `min-height: 100vh` |

`images/`: 귤·샐러드·포스터 상단·제주 사계절·마이크 사진 등 예제 이미지. `medias/`: 오디오·비디오 예제에 쓴 mp3·mp4 파일. `product.pdf`: obj.html의 PDF 삽입 예제 파일.
