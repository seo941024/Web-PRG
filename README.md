# 🥪 BLT 샌드위치 소개 웹페이지

간단하지만 맛있는 **BLT 샌드위치**를 주제로 만든 HTML 웹페이지입니다.  
다양한 HTML 태그를 활용하여 음식 소개와 레시피를 시각적으로 표현했습니다.

---

## 📌 프로젝트 소개

이 웹페이지는 베이컨(Bacon), 양상추(Lettuce), 토마토(Tomato)를 활용한  
BLT 샌드위치를 소개하고 만드는 방법을 안내합니다.

---

## 🛠 사용 기술

- HTML5
- CSS3

---

## 📊 주요 기능

### ✔ 음식 소개
- BLT 샌드위치 특징 설명

### ✔ 표(Table)
- 재료를 카테고리별로 정리

### ✔ 리스트(List)
- 재료 목록 (ul)
- 조리 순서 (ol)

### ✔ 멀티미디어
- 이미지 삽입 (`img`)
- 동영상 삽입 (`video`)

### ✔ 내부 링크
- 페이지 내 이동(anchor)

---

## 🖼 실행 화면 및 코드

![preview](https://raw.githubusercontent.com/seo941024/Web-PRG/master/web_practice/LetsgoBLT.png)

```markdown
<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>내가 좋아하는 음식</title>
    <style>
      table,
      th,
      td {
        border: 1px solid #ccc;
        border-collapse: collapse;
      }
      td,
      th {
        padding: 10px 20px;
      }
      td:last-child {
        width: 200px;
      }
    </style>
  </head>

  <body>
    <div id="container">
      <img src="BLT sand.jpg" alt="BLT 샌드위치 이미지" width="80%" />

      <h1>BLT 샌드위치</h1>
      <h3>
        <em>베이컨의 고소한 맛과 토마토의 새콤함, 양상추의 아삭한 식감까지</em>
      </h3>

      <p>
        베이컨과 토마토, 양상추 모두가 어우러진 B.L.T.는 만들기도 간단하면서, 한
        끼 식사로도 충분합니다.<br />
        모든 음식이 그렇듯 신선한 재료로 만드는 것이 가장 중요한
        포인트입니다.<br />
        BLT 샌드위치를 소개하며 만드는 법과 재료를 간단히 소개합니다.
      </p>

      <table>
        <caption>
          <h2>재료와 설명 간단한 표로 보기</h2>
        </caption>
        <tbody>
          <tr>
            <th>구분</th>
            <th>종류</th>
            <th colspan="2">설명</th>
          </tr>

          <tr>
            <th rowspan="2">빵</th>
            <td>식빵</td>
            <td>기본 빵</td>
          </tr>

          <tr>
            <td>바게트</td>
            <td>바삭한 빵</td>
          </tr>

          <tr>
            <th>속재료</th>
            <td>베이컨, 토마토, 로메인</td>
            <td>아삭한 야채와 부드러운 고기</td>
          </tr>

          <tr>
            <th>소스</th>
            <td>아이올리 소스</td>
            <td>마늘, 양파, 마요네즈, 레몬즙 등이 들어간 소스</td>
          </tr>
        </tbody>
      </table>

      <div id="ingredients">
        <h2>BLT 샌드위치를 만들기 위한 기본 재료</h2>
        <ul>
          <li>베이컨</li>
          <li>토마토</li>
          <li>로메인</li>
          <li>아이올리 소스 <a href="#recipe">(*하단 레시피 참조)</a></li>
          <li>홀그레인 바게트</li>
        </ul>
      </div>

      <div id="cooking">
        <h2>BLT 샌드위치 만드는 순서</h2>
        <ol>
          <li>
            후라이팬을 달군 뒤 베이컨을 올려 중불에서 타지 않도록 노릇하게 구워
            주세요.
          </li>
          <li>다 구워진 베이컨은 종이타월 등에 올려 기름기를 빼주세요.</li>
          <li>
            양상추는 흐르는 물에 깨끗하게 씻은 뒤 물기를 제거해 준비하세요.
          </li>
          <li>토마토는 0.5cm 두께로 썰어 종이타월로 겉 수분을 제거하세요.</li>
          <li>빵은 팬에서 바삭하게 구워 주세요.</li>
          <li>
            빵에 아이올리 소스를 바르고, 양상추 → 토마토 → 베이컨 → 치즈 순으로
            올려 완성합니다.
          </li>
        </ol>
      </div>

      <div id="recipe">
        <h2>* 아이올리 소스 재료</h2>
        <h3>재료</h3>
        <ul>
          <li>마늘, 양파, 마요네즈, 아메리칸 머스타드, 레몬즙, 소금, 후추</li>
        </ul>

        <h2>* 아이올리 소스 만드는 순서</h2>
        <ol>
          <li>마늘과 양파는 핸드블렌더에 갈아 준비합니다.</li>
          <li>
            마요네즈와 머스타드를 섞은 뒤 마늘, 양파, 레몬즙을 넣습니다. (3:2
            비율)
          </li>
          <li>소금과 후추로 간을 하면 완성입니다.</li>
        </ol>

        <p><strong>* Tip</strong></p>
        <ul>
          <li>기호에 따라 마요네즈나 올리브오일로 대체 가능합니다.</li>
          <li>식감을 살리려면 재료를 잘게 다져 사용해도 좋습니다.</li>
        </ul>

        <a href="#cooking">샌드위치 만들기 순서로 이동</a>
      </div>

      <h2>간단하게 BLT 샌드위치 만들기</h2>
      <figure>
        <video src="Download.mp4" controls></video>
        <figcaption>간단하게 만드는 BLT 샌드위치</figcaption>
      </figure>

      <h2>완성 후 샌드위치 사진</h2>
      <figure>
        <img src="BLT sand2.jpg" alt="완성된 BLT 샌드위치 사진" width="80%" />
        <figcaption>이미지1. 확대된 BLT 샌드위치와 콜라</figcaption>

        <img src="BLT sand3.jpg" alt="완성된 BLT 샌드위치 사진" width="80%" />
        <figcaption>이미지2. BLT 샌드위치 전체샷</figcaption>
      </figure>

      <blockquote>
        <strong
          ><em
            >이미지 및 레시피 제공: 존쿡델리미트 by 에쓰푸드 (2014, INNOLAB)</em
          ></strong
        >
      </blockquote>

      <h2>관련 사이트</h2>
      <a href="https://m.blog.naver.com/adamiimo/223157560263">
        다른 BLT 샌드위치 레시피 보기
      </a>

      <h2><a href="#container">맨 위로 이동</a></h2>
    </div>
  </body>
</html>
```
