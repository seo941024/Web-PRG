// 1. JSON 객체 배열 만들기 (5권의 책 정보)
const books = [
  { id: 1, title: "자바스크립트 완벽 가이드", price: 35000 },
  { id: 2, title: "모던 리액트", price: 28000 },
  { id: 3, title: "HTML/CSS 기초", price: 12000 },
  { id: 4, title: "코딩 테스트 합격자 되기", price: 25000 },
  { id: 5, title: "알기 쉬운 알고리즘", price: 14000 }
];

// 2. localStorage에 저장하기
// 주의: localStorage는 문자열만 저장할 수 있으므로 JSON.stringify()로 변환해야 합니다.
localStorage.setItem("bookList", JSON.stringify(books));

// 3. localStorage에서 다시 불러오기
// 문자열을 다시 자바스크립트 객체 배열로 되돌리기 위해 JSON.parse()를 사용합니다.
const storedBooks = JSON.parse(localStorage.getItem("bookList"));
console.log("저장된 전체 도서 목록:", storedBooks);

// 4. find 함수 활용: id가 3인 책 찾기
const targetBook = storedBooks.find(book => book.id === 3);
console.log("id가 3인 책:", targetBook); 
// 출력결과: { id: 3, title: 'HTML/CSS 기초', price: 12000 }

// 5. filter와 map 함수 활용: 가격이 15,000원 이상인 책들의 '제목'만 배열로 만들기
const expensiveBookTitles = storedBooks
  .filter(book => book.price >= 15000) // 15,000원 이상인 책만 걸러냄 (3권이 남음)
  .map(book => book.title);            // 남은 책들에서 'title'만 쏙 뽑아냄

console.log("15,000원 이상인 책 제목들:", expensiveBookTitles);
// 출력결과: ['자바스크립트 완벽 가이드', '모던 리액트', '코딩 테스트 합격자 되기']