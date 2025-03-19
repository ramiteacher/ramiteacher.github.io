// 음식 카테고리별 메뉴 데이터
const menuData = {
  korean: [
    "비빔밥", "김치찌개", "불고기", "갈비찜", "된장찌개", 
    "제육볶음", "잡채", "김밥", "떡국", "순두부찌개", 
    "김치전", "냉면", "해물파전", "전주비빔밥", "찜닭", 
    "오징어볶음", "나물무침", "갈비탕", "유린기", "쌈밥", 
    "고등어구이", "시금치나물", "동태찌개", "감자탕", "매운탕"
  ],
  western: [
    "스테이크", "파스타", "피자", "리조또", "샐러드", 
    "수프", "햄버거", "샌드위치", "퀘사디아", "치킨너겟", 
    "크로와상", "브리오슈", "마카롱", "타르트", "오믈렛", 
    "카프레제 샐러드", "소시지", "핫도그", "스프링롤", "푸아그라", 
    "블루베리 팬케이크", "퀴노아 샐러드", "로스트 비프", "크림 파스타", "피쉬앤칩스"
  ],
  japanese: [
    "초밥", "사시미", "라멘", "우동", "덮밥 (규동)", 
    "텐동", "오니기리", "가라아게", "스키야키", "미소시루", 
    "타코야키", "규카츠", "나가사키 짬뽕", "유부초밥", "돈부리", 
    "생선구이", "모듬회", "장어덮밥", "볶음밥 (야키밥)", "고로케", 
    "나베 (전골)", "스시 롤", "우나기", "오차즈케", "가츠동"
  ],
  chinese: [
    "짜장면", "짬뽕", "볶음밥", "마파두부", "양장피", 
    "탕수육", "군만두", "고추잡채", "팔보채", "꿔바로우", 
    "샤오롱바오", "양념치킨", "오향장육", "볶음면", "새우볶음밥", 
    "삼선짜장", "가지볶음", "베이징덕", "쭈꾸미 볶음", "해물짬뽕", 
    "마늘새우", "포장마차식 볶음밥", "두부요리", "쌀국수", "부추전"
  ]
};

// 색상 배열을 더 알록달록한 식욕 돋우는 색상으로 변경
const colors = [
  "#FF5A5F", "#FFBD59", "#FFE66D", "#8FD14F", 
  "#0ABF53", "#59D8E6", "#4B8AF9", "#A573E5",
  "#E15FED", "#FF6B6B", "#FFA06B", "#F9DB6D"
];

// 효과음 로드
const tickSound = new Audio();
tickSound.src = "https://assets.mixkit.co/active_storage/sfx/2865/2865-preview.mp3";
const resultSound = new Audio();
resultSound.src = "https://assets.mixkit.co/active_storage/sfx/2017/2017-preview.mp3";

// 전역 변수
let currentCategory = "korean";
let isSpinning = false;
let canvas = document.querySelector("canvas");
let ctx = canvas.getContext("2d");
let menuItems = [];
let rotation = 0;
let selectedItem = null;
let lastTickTime = 0;
let spinSpeed = 0;

// 페이지 로드 시 초기화
window.onload = function() {
  // 캔버스 해상도 높이기
  setupHiDPICanvas(canvas);
  
  initCategoryButtons();
  initRoulette();
  
  // 음향 버튼 추가 및 초기화
  addSoundToggle();
};

// 고해상도 캔버스 설정
function setupHiDPICanvas(canvas) {
  // 디바이스 픽셀 비율 가져오기
  const dpr = window.devicePixelRatio || 1;
  
  // 현재 캔버스 크기
  const rect = canvas.getBoundingClientRect();
  
  // 캔버스의 실제 크기 설정
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  
  // 캔버스의 CSS 크기 설정
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;
  
  // 컨텍스트 스케일 조정
  ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
}

// 사운드 토글 기능 추가
function addSoundToggle() {
  const footer = document.querySelector('.footer');
  const soundToggle = document.createElement('div');
  soundToggle.className = 'sound-toggle';
  soundToggle.innerHTML = '<i class="fas fa-volume-up"></i>';
  soundToggle.title = '효과음 켜기/끄기';
  
  let isMuted = false;
  soundToggle.addEventListener('click', function() {
    isMuted = !isMuted;
    if (isMuted) {
      tickSound.volume = 0;
      resultSound.volume = 0;
      soundToggle.innerHTML = '<i class="fas fa-volume-mute"></i>';
    } else {
      tickSound.volume = 0.5;
      resultSound.volume = 0.5;
      soundToggle.innerHTML = '<i class="fas fa-volume-up"></i>';
    }
  });
  
  // 기본 볼륨 설정
  tickSound.volume = 0.5;
  resultSound.volume = 0.5;
  
  document.querySelector('.container').appendChild(soundToggle);
}

// 카테고리 버튼 초기화
function initCategoryButtons() {
  const categoryButtons = document.querySelectorAll('.category-btn');
  categoryButtons.forEach(button => {
    button.addEventListener('click', function() {
      if (isSpinning) return;
      
      // 활성 버튼 상태 변경
      categoryButtons.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');
      
      // 현재 카테고리 업데이트 및 룰렛 다시 그리기
      currentCategory = this.dataset.category;
      initRoulette();
    });
  });
}

// 룰렛 초기화 및 그리기
function initRoulette() {
  menuItems = menuData[currentCategory];
  drawRoulette();
}

// 룰렛 회전 함수를 수정합니다
function rotate() {
  if (isSpinning) return;
  
  isSpinning = true;
  const spinButton = document.querySelector('.spin-button');
  spinButton.disabled = true;
  spinButton.classList.add('disabled');
  
  // 랜덤한 회전 각도 (라디안)
  const spinAngle = (Math.random() * 360 + 1440) * (Math.PI / 180); // 최소 4번 회전 후 멈춤
  const spinDuration = 5000; // 회전 시간(ms)
  const startTime = Date.now();
  const startRotation = rotation;
  
  function frame() {
    const currentTime = Date.now();
    const elapsedTime = currentTime - startTime;
    
    if (elapsedTime < spinDuration) {
      // 감속하는 회전 애니메이션
      const progress = elapsedTime / spinDuration;
      const easedProgress = 1 - Math.pow(1 - progress, 3); // 이징 함수
      
      rotation = startRotation + (spinAngle * easedProgress);
      
      // 티킹 효과음
      const currentSpeed = spinAngle * (3 * Math.pow(1 - progress, 2));
      spinSpeed = currentSpeed;
      
      if (currentTime - lastTickTime > (1000 / (currentSpeed * 1.5)) && currentSpeed > 0.5) {
        tickSound.currentTime = 0;
        tickSound.play().catch(e => console.log("효과음 재생 실패:", e));
        lastTickTime = currentTime;
      }
      
      drawRoulette();
      requestAnimationFrame(frame);
    } else {
      // 회전 종료
      rotation = (startRotation + spinAngle) % (2 * Math.PI);
      drawRoulette();
      
      // 결과 계산 - 최상단(12시 방향)에 위치한 메뉴 선택
      const sliceAngle = (2 * Math.PI) / menuItems.length;
      
      // 상단은 -90도(-PI/2)에 해당하는 위치
      // 회전 방향과 좌표계를 고려하여 정확한 슬라이스 계산
      let topPosition = (1.5 * Math.PI - rotation) % (2 * Math.PI);
      if (topPosition < 0) topPosition += 2 * Math.PI;
      
      const selectedIndex = Math.floor(topPosition / sliceAngle) % menuItems.length;
      
      console.log("최종 회전 각도:", rotation);
      console.log("상단 포인터 위치:", topPosition);
      console.log("선택된 인덱스:", selectedIndex);
      
      // 결과 효과음 재생
      resultSound.play().catch(e => console.log("효과음 재생 실패:", e));
      
      // 결과 표시
      selectedItem = menuItems[selectedIndex];
      
      setTimeout(() => {
        showResultModal(selectedItem);
        
        // 버튼 다시 활성화
        spinButton.disabled = false;
        spinButton.classList.remove('disabled');
        isSpinning = false;
      }, 500);
    }
  }
  
  requestAnimationFrame(frame);
}

// 룰렛 그리기 함수도 수정
function drawRoulette() {
  const rect = canvas.getBoundingClientRect();
  ctx.clearRect(0, 0, rect.width, rect.height);
  
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;
  const radius = Math.min(centerX, centerY) - 20;
  
  const sliceAngle = (2 * Math.PI) / menuItems.length;
  
  // 외부 테두리 그리기
  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius + 10, 0, Math.PI * 2);
  ctx.fillStyle = "#333333";
  ctx.fill();
  ctx.restore();
  
  // 최상단 위치 계산 (12시 방향)
  let topPosition = (1.5 * Math.PI - rotation) % (2 * Math.PI);
  if (topPosition < 0) topPosition += 2 * Math.PI;
  const topSliceIndex = Math.floor(topPosition / sliceAngle) % menuItems.length;
  
  for (let i = 0; i < menuItems.length; i++) {
    const startAngle = i * sliceAngle + rotation;
    const endAngle = (i + 1) * sliceAngle + rotation;
    
    // 조각 그리기
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.closePath();
    
    // 조각 색상 채우기
    let fillColor = colors[i % colors.length];
    
    // 최상단 슬라이스는 강조 표시
    if (i === topSliceIndex) {
      // 색상 약간 밝게 (선택된 슬라이스 강조)
      fillColor = adjustBrightness(fillColor, 20);
    }
    
    ctx.fillStyle = fillColor;
    ctx.fill();
    
    // 선 그리기
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#ffffff";
    ctx.stroke();
    
    // 텍스트 그리기
    ctx.save();
    ctx.translate(centerX, centerY);
    const textAngle = startAngle + (sliceAngle / 2);
    ctx.rotate(textAngle);
    
    const text = menuItems[i];
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#333333";
    ctx.font = "bold 14px 'Noto Sans KR'";
    
    // 그림자 효과
    ctx.shadowColor = "rgba(0,0,0,0.3)";
    ctx.shadowBlur = 2;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    
    // 텍스트를 조각 중앙에 위치시키기
    const textDistance = radius * 0.75;
    ctx.fillText(text, textDistance, 0);
    
    ctx.restore();
  }
  
  // 중앙 원 그리기
  ctx.beginPath();
  ctx.arc(centerX, centerY, 25, 0, Math.PI * 2); // 반지름 좀 더 크게
  ctx.fillStyle = "#FF5A5F"; // 빨간색으로 변경 (식욕 증진)
  ctx.fill();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 3;
  ctx.stroke();
  
  // 중앙에 텍스트 추가
  ctx.font = "bold 16px 'Jua'";
  ctx.fillStyle = "#ffffff"; // 흰색 텍스트
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("", centerX, centerY); // 텍스트 변경
  
  // 중앙 원 주변에 작은 원 추가 (음식 입자 느낌)
  const dotCount = 8;
  const dotRadius = 5;
  const dotDistance = 35;
  

}

// 색상 밝기 조절 함수
function adjustBrightness(hex, percent) {
  // hex to rgb
  let r = parseInt(hex.substring(1, 3), 16);
  let g = parseInt(hex.substring(3, 5), 16);
  let b = parseInt(hex.substring(5, 7), 16);
  
  // 밝기 조정
  r = Math.min(255, Math.floor(r + (percent/100) * r));
  g = Math.min(255, Math.floor(g + (percent/100) * g));
  b = Math.min(255, Math.floor(b + (percent/100) * b));
  
  // rgb to hex
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// 결과 모달 표시
function showResultModal(item) {
  // 기존 모달 제거
  const existingModal = document.querySelector('.result-modal');
  if (existingModal) {
    existingModal.remove();
  }
  
  // 새 모달 생성
  const modal = document.createElement('div');
  modal.className = 'result-modal';
  
  modal.innerHTML = `
    <div class="result-modal-content">
      <div class="result-icon"><i class="fas fa-utensils"></i></div>
      <h2>오늘의 추천 메뉴</h2>
      <div class="result-food">${item}</div>
      <p>맛있게 드세요!</p>
      <button class="close-modal">확인</button>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // 잠시 후 표시 클래스 추가
  setTimeout(() => {
    modal.classList.add('show');
  }, 10);
  
  // 닫기 버튼 이벤트
  modal.querySelector('.close-modal').addEventListener('click', function() {
    modal.classList.remove('show');
    setTimeout(() => {
      modal.remove();
    }, 300);
  });
}