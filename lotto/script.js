// 색상 배열 (로또 번호 색상)
const ballColors = {
    "1-10": "#fbc400",   // 노랑
    "11-20": "#69c8f2",  // 파랑
    "21-30": "#ff7272",  // 빨강
    "31-40": "#aaa",     // 회색
    "41-45": "#b0d840"   // 초록
};

// 전역 변수 선언
let balls = [];
let isAnimating = false;
let drawingInProgress = false;
let animationFrameId = null;
let machineElements = {};
let speedMode = 1; // 1: 일반 속도, 4: 4X 속도, 8: 8X 속도
let savedNumbers = [];  // 저장된 번호 배열
let skipDrawing = false; // 스킵 상태 관리를 위한 플래그 추가

// 사운드 관련 변수
let soundEnabled = true;
let machineSound, ballDropSound, resultSound, startSound;

// 당첨 번호 관련 전역 변수
let winningNumbers = {
    numbers: [],
    bonus: null,
    date: null
};

// DOM 요소 참조 캐싱
function cacheElements() {
    machineElements = {
        lotteryMachine: document.getElementById('lotteryMachine'),
        resultContainer: document.getElementById('resultContainer'),
        startBtn: document.getElementById('startBtn'),
        resetBtn: document.getElementById('resetBtn'),
        soundControl: document.getElementById('soundControl'),
        soundIcon: document.getElementById('soundIcon'),
        speedToggleBtn: document.getElementById('speedToggleBtn'), // 속도 토글 버튼 추가
        skipBtn: document.getElementById('skipBtn') // 스킵 버튼 추가
    };

    // 오디오 요소 캐싱
    machineSound = document.getElementById('machineSound');
    ballDropSound = document.getElementById('ballDropSound');
    resultSound = document.getElementById('resultSound');
    startSound = document.getElementById('startSound');

    // 볼륨 조정
    machineSound.volume = 0.3;
    ballDropSound.volume = 0.5;
    resultSound.volume = 0.5;
    startSound.volume = 0.3;
}

// 볼 색상 가져오기
function getBallColor(number) {
    for (const range in ballColors) {
        const [min, max] = range.split('-').map(Number);
        if (number >= min && number <= max) {
            return ballColors[range];
        }
    }
    return "#ffffff";
}

// 추첨기 초기화
function initMachine() {
    const {lotteryMachine} = machineElements;
    if (!lotteryMachine) return;

    // 이전 애니메이션 정리
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }

    // 사운드 중지
    machineSound.pause();
    machineSound.currentTime = 0;
    ballDropSound.pause();
    ballDropSound.currentTime = 0;
    resultSound.pause();
    resultSound.currentTime = 0;
    startSound.pause();
    startSound.currentTime = 0;

    // 기존 내용 초기화
    lotteryMachine.innerHTML = '';
    balls = [];

    // 사운드 컨트롤 다시 추가
    const soundControl = document.createElement('div');
    soundControl.className = 'sound-control';
    soundControl.id = 'soundControl';

    const soundIcon = document.createElement('div');
    soundIcon.className = soundEnabled ? 'sound-icon' : 'sound-icon muted';
    soundIcon.id = 'soundIcon';

    soundControl.appendChild(soundIcon);
    lotteryMachine.appendChild(soundControl);

    // 기계 구성요소 생성 (최적화: 단일 함수로 묶음)
    createMachineComponents(lotteryMachine);

    // 애니메이션 시작
    isAnimating = true;
    drawingInProgress = false;
    animateBalls();

    // 이벤트 리스너 재설정
    cacheElements();
    setupEventListeners();
}

// 기계 구성요소 생성 함수 수정
function createMachineComponents(lotteryMachine) {
    // DocumentFragment 사용으로 렌더링 최적화
    const fragment = document.createDocumentFragment();

    // 추첨기 본체 생성
    const machineBody = document.createElement('div');
    machineBody.className = 'machine-body';

    // 팬 추가
    const fan = document.createElement('div');
    fan.className = 'fan';
    machineBody.appendChild(fan);

    // 볼 컨테이너를 machineBody 안에 생성
    const ballContainer = document.createElement('div');
    ballContainer.className = 'ball-container';
    ballContainer.id = 'ballContainer';
    
    // 공기 효과 추가
    const airEffect = document.createElement('div');
    airEffect.className = 'air-effect';
    airEffect.id = 'airEffect';
    ballContainer.appendChild(airEffect);
    
    // 볼 컨테이너를 machineBody 안에 추가
    machineBody.appendChild(ballContainer);
    
    // 모든 공 생성 및 ballContainer에 추가
    createBalls(ballContainer);
    
    // machineBody를 fragment에 추가
    fragment.appendChild(machineBody);

    // 출구 구멍 추가
    const exitHole = document.createElement('div');
    exitHole.className = 'exit-hole';
    fragment.appendChild(exitHole);

    // 튜브 상단 추가
    const tubeTop = document.createElement('div');
    tubeTop.className = 'tube-top';
    fragment.appendChild(tubeTop);

    // 튜브 패스 추가 (공이 떨어지는 경로)
    const tubePath = document.createElement('div');
    tubePath.className = 'tube-path';
    tubePath.id = 'tubePath';
    fragment.appendChild(tubePath);

    // 튜브 추가
    const tube = document.createElement('div');
    tube.className = 'tube';

    // 튜브 빛 효과 추가
    const tubeLight = document.createElement('div');
    tubeLight.className = 'tube-light';
    tube.appendChild(tubeLight);

    fragment.appendChild(tube);

    // 유리 효과 추가 (맨 위에 배치)
    const machineGlass = document.createElement('div');
    machineGlass.className = 'machine-glass';
    fragment.appendChild(machineGlass);

    // 받침대 추가
    const machineBase = document.createElement('div');
    machineBase.className = 'machine-base';
    fragment.appendChild(machineBase);

    // 한 번에 DOM에 추가
    lotteryMachine.appendChild(fragment);
}

// 로또 공 생성 함수 개선 - 전체 공간에 고르게 분포
function createBalls(ballContainer) {
const containerWidth = 400;
const containerHeight = 400;
const ballSize = 40;

// 공간 분할을 위한 격자 생성 (볼 간 간격을 확보하기 위함)
const gridSize = Math.ceil(ballSize * 1.5); // 볼 크기보다 여유있게
const rows = Math.floor(containerHeight / gridSize);
const cols = Math.floor(containerWidth / gridSize);

// 격자 위치 생성 (균등한 분포 위해)
const positions = [];

// 컨테이너 전체에 격자점 생성
for (let row = 0; row < rows; row++) {
   for (let col = 0; col < cols; col++) {
       // 격자 위치에 약간의 랜덤성 추가
       const x = col * gridSize + gridSize/2 + (Math.random() - 0.5) * gridSize/2;
       const y = row * gridSize + gridSize/2 + (Math.random() - 0.5) * gridSize/2;
       
       // 컨테이너 내에 있는지 확인 (원형 영역으로 제한)
       const centerX = containerWidth / 2;
       const centerY = containerHeight / 2;
       const maxRadius = Math.min(containerWidth, containerHeight) / 2 * 0.85;
       
       const distFromCenter = Math.sqrt(
           Math.pow(x - centerX, 2) + 
           Math.pow(y - centerY, 2)
       );
       
       // 유효 영역 내에 있는 위치만 저장
       if (distFromCenter < maxRadius - ballSize/2) {
           positions.push({x, y});
       }
   }
}

// 위치 충분히 있는지 확인
if (positions.length < 45) {
   console.warn(`사용 가능한 위치가 부족합니다. 필요: 45, 사용 가능: ${positions.length}`);
   // 위치가 부족하면 추가 생성
   while (positions.length < 45) {
       // 임의 위치 생성
       const angle = Math.random() * Math.PI * 2;
       const radius = Math.random() * (Math.min(containerWidth, containerHeight) / 2 * 0.8 - ballSize/2);
       const x = containerWidth/2 + radius * Math.cos(angle);
       const y = containerHeight/2 + radius * Math.sin(angle);
       positions.push({x, y});
   }
}

// 위치 랜덤하게 섞기
for (let i = positions.length - 1; i > 0; i--) {
   const j = Math.floor(Math.random() * (i + 1));
   [positions[i], positions[j]] = [positions[j], positions[i]];
}

// 45개만 사용
const usablePositions = positions.slice(0, 45);

// 볼 생성
for (let i = 1; i <= 45; i++) {
   const ballElement = document.createElement('div');
   ballElement.className = 'ball' + (Math.random() > 0.5 ? ' ball-rotate' : ' ball-reverse');
   ballElement.style.backgroundColor = getBallColor(i);
   ballElement.textContent = i;
   
   const pos = usablePositions[i-1];
   ballElement.style.left = (pos.x - ballSize/2) + 'px';
   ballElement.style.top = (pos.y - ballSize/2) + 'px';
   
   ballContainer.appendChild(ballElement);
   
   // 볼 객체 정보
   balls.push({
       number: i,
       element: ballElement,
       posX: pos.x,
       posY: pos.y,
       velocityX: (Math.random() - 0.5) * 1.0, // 초기 속도 낮게 설정
       velocityY: (Math.random() - 0.5) * 1.0,
       settled: false // 추첨 후 정착 상태
   });
}
}

// 볼 애니메이션 함수 수정
function animateBalls() {
if (!isAnimating) return;

const ballContainer = document.querySelector('.ball-container');
if (!ballContainer) return;

const containerWidth = ballContainer.offsetWidth;
const containerHeight = ballContainer.offsetHeight;
const centerX = containerWidth / 2;
const centerY = containerHeight / 2;
const maxRadius = Math.min(containerWidth, containerHeight) / 2 * 0.85;

// 추첨이 끝났는지 확인
const drawingFinished = !drawingInProgress && balls.some(ball => ball.selected);

// 공통 물리 계수
const damping = 0.97; // 에너지 손실

// 추첨 종료 후 중력
const gravity = drawingFinished ? 0.3 : 0; 
const floorY = containerHeight - 20; // 바닥 위치 (약간 여유)
const friction = 0.95; // 바닥 마찰

balls.forEach(ball => {
   const element = ball.element;
   if (!element || !element.parentNode || ball.selected) return;
   
   // 볼 크기
   const ballRadius = element.offsetWidth / 2;
   
   // 추첨 중 또는 일반 상태
   if (!drawingFinished) {
       // 속도 적용
       ball.posX += ball.velocityX * speedMode;
       ball.posY += ball.velocityY * speedMode;
       
       // 벽 충돌 감지 (원형 경계)
       const distFromCenter = Math.sqrt(
           Math.pow(ball.posX - centerX, 2) + 
           Math.pow(ball.posY - centerY, 2)
       );
       
       if (distFromCenter + ballRadius > maxRadius) {
           // 충돌 후 반사 각도 계산
           const angle = Math.atan2(ball.posY - centerY, ball.posX - centerX);
           ball.posX = centerX + (maxRadius - ballRadius) * Math.cos(angle);
           ball.posY = centerY + (maxRadius - ballRadius) * Math.sin(angle);
           
           // 속도 반사
           const normalX = (ball.posX - centerX) / distFromCenter;
           const normalY = (ball.posY - centerY) / distFromCenter;
           const dotProduct = ball.velocityX * normalX + ball.velocityY * normalY;
           
           ball.velocityX = (ball.velocityX - 2 * dotProduct * normalX) * damping;
           ball.velocityY = (ball.velocityY - 2 * dotProduct * normalY) * damping;
           
           // 추첨 중에는 약간 활발하게 움직이도록 추가 속도
           if (drawingInProgress && Math.random() < 0.3) {
               ball.velocityX += (Math.random() - 0.5) * 0.5;
               ball.velocityY += (Math.random() - 0.5) * 0.5;
           }
       }
       
       // 추첨 중 지속적인 움직임을 위한 최소 속도 유지
       if (drawingInProgress) {
           const speed = Math.sqrt(ball.velocityX * ball.velocityX + ball.velocityY * ball.velocityY);
           if (speed < 0.5) {
               const angle = Math.random() * Math.PI * 2;
               const boost = 0.5 + Math.random() * 0.5;
               ball.velocityX += Math.cos(angle) * boost * 0.1;
               ball.velocityY += Math.sin(angle) * boost * 0.1;
           }
       }
   } 
   // 추첨 종료 후 물리
   else {
       if (!ball.settled) {
           // 중력 적용
           ball.velocityY += gravity;
           
           // 속도 적용
           ball.posX += ball.velocityX;
           ball.posY += ball.velocityY;
           
           // 바닥 충돌
           if (ball.posY + ballRadius > floorY) {
               ball.posY = floorY - ballRadius;
               
               // 바닥 반발력 (점점 약해지도록)
               if (Math.abs(ball.velocityY) > 0.2) {
                   ball.velocityY = -ball.velocityY * 0.6; // 강한 감쇠
               } else {
                   ball.velocityY = 0; // 충분히 작으면 정지
                   ball.settled = true;  // 정착 상태로 설정
               }
               
               // X축 마찰
               ball.velocityX *= friction;
           }
           
           // 좌우 벽 충돌 (원형 컨테이너 가장자리)
           const distFromCenter = Math.sqrt(
               Math.pow(ball.posX - centerX, 2) + 
               Math.pow(ball.posY - centerY, 2)
           );
           
           if (distFromCenter + ballRadius > maxRadius) {
               // X방향으로만 반사 (바닥에 가라앉도록)
               const angle = Math.atan2(ball.posY - centerY, ball.posX - centerX);
               ball.posX = centerX + (maxRadius - ballRadius) * Math.cos(angle);
               
               // X 속도만 반사하고 감쇠
               ball.velocityX = -ball.velocityX * 0.7;
           }
       } else {
           // 이미 정착된 상태면 움직임 없음
           ball.velocityX = 0;
           ball.velocityY = 0;
       }
   }
   
   // 볼 간 충돌 검사 및 처리
   balls.forEach(otherBall => {
       if (ball === otherBall || !otherBall.element || otherBall.selected) return;
       
       const dx = ball.posX - otherBall.posX;
       const dy = ball.posY - otherBall.posY;
       const distance = Math.sqrt(dx * dx + dy * dy);
       const minDistance = ballRadius * 2; // 두 볼 반지름 합
       
       if (distance < minDistance) {
           // 충돌 발생 - 볼 분리
           const overlap = minDistance - distance;
           
           // 충돌 방향 벡터
           let normalX = dx;
           let normalY = dy;
           
           // 0으로 나누기 방지
           if (distance > 0) {
               normalX /= distance;
               normalY /= distance;
           } else {
               // 정확히 같은 위치면 랜덤 방향으로 밀어냄
               const randomAngle = Math.random() * Math.PI * 2;
               normalX = Math.cos(randomAngle);
               normalY = Math.sin(randomAngle);
           }
           
           // 볼 위치 조정 (겹침 해결)
           const pushX = normalX * overlap * 0.5;
           const pushY = normalY * overlap * 0.5;
           
           ball.posX += pushX;
           ball.posY += pushY;
           otherBall.posX -= pushX;
           otherBall.posY -= pushY;
           
           // 속도 변화 계산 (충돌 시 운동량 교환)
           if (!ball.settled && !otherBall.settled) {
               const dotProduct = 
                   (ball.velocityX - otherBall.velocityX) * normalX + 
                   (ball.velocityY - otherBall.velocityY) * normalY;
               
               // 충돌 후 속도 계산
               const impulseFactor = dotProduct;
               
               ball.velocityX -= normalX * impulseFactor;
               ball.velocityY -= normalY * impulseFactor;
               otherBall.velocityX += normalX * impulseFactor;
               otherBall.velocityY += normalY * impulseFactor;
               
               // 에너지 손실
               ball.velocityX *= damping;
               ball.velocityY *= damping;
               otherBall.velocityX *= damping;
               otherBall.velocityY *= damping;
           }
       }
   });
   
   // 위치 적용
   element.style.left = (ball.posX - ballRadius) + 'px';
   element.style.top = (ball.posY - ballRadius) + 'px';
});

animationFrameId = requestAnimationFrame(animateBalls);
}

// 로또 번호 뽑기 (6개)
function generateLottoNumbers() {
    // 선택된 조합 유형 가져오기
    const selectedType = document.querySelector('input[name="numberCount"]:checked').value;
    
    // 단일 세트 생성 함수
    function generateSingleSet() {
        const numbers = [];
        while (numbers.length < 6) {
            const randomNumber = Math.floor(Math.random() * 45) + 1;
            if (!numbers.includes(randomNumber)) {
                numbers.push(randomNumber);
            }
        }
        return numbers.sort((a, b) => a - b);
    }
    
    // 조합 유형에 따라 결과 반환
    if (selectedType === "single") {
        return generateSingleSet();
    } else {
        // 5세트 생성
        const sets = [];
        for (let i = 0; i < 5; i++) {
            sets.push(generateSingleSet());
        }
        return sets;
    }
}

// 추첨 애니메이션 강화 (사운드 추가)
function enhancedAnimation() {
   // 추첨기 흔들기
   const machineBody = document.querySelector('.machine-body');
   if (machineBody) machineBody.classList.add('shake-hard');

   // 사용자 상호작용 후에 소리 재생 시도
   if (soundEnabled) {
       // 시작 소리 재생
       playSound(startSound);

       // 약간 지연 후 기계 소리 재생 (두 소리가 겹치지 않도록)
       setTimeout(() => {
           playSound(machineSound);
       }, 100);
   }

   // 에어 효과 강화
   const airEffect = document.getElementById('airEffect');
   if (airEffect) {
       airEffect.classList.add('air-strong');
       airEffect.style.animationDuration = (0.3 / speedMode) + 's';
   }

   // 팬 속도 대폭 증가
   const fan = document.querySelector('.fan');
   if (fan) fan.style.animationDuration = (0.05 / speedMode) + 's';

   // 볼에 임의의 힘 가하기 - 활발하게 움직임
   balls.forEach(ball => {
       if (ball.selected) return;
       
       // 강력한 임의의 방향으로 힘 가하기
       const angle = Math.random() * Math.PI * 2;
       const force = 1.5 + Math.random() * 1.5;
       
       ball.velocityX += Math.cos(angle) * force;
       ball.velocityY += Math.sin(angle) * force;
       
       // 볼 회전 효과 추가
       const rotationClass = Math.random() > 0.5 ? 'ball-rotate' : 'ball-reverse';
       const speedClass = Math.random() > 0.3 ? ' ball-fast' : '';
       
       ball.element.className = 'ball ' + rotationClass + speedClass;
   });

   // 일정 시간 후 상태 복구 (속도모드에 따라 조정)
   const resetDelay = 3000 / speedMode;
   setTimeout(() => {
       // 애니메이션 관련 코드는 유지...
       if (machineBody) machineBody.classList.remove('shake-hard');
       if (airEffect) {
           airEffect.classList.remove('air-strong');
           airEffect.style.animationDuration = (1 / speedMode) + 's';
       }
       if (fan) fan.style.animationDuration = (0.5 / speedMode) + 's';
   }, resetDelay);
}

// 공 선택하고 떨어뜨리기 (사운드 추가)
function selectBall(number) {
    return new Promise((resolve) => {
        // 해당 번호의 공 찾기
        const selectedBall = balls.find(ball => ball.number === number);
        if (!selectedBall) {
            resolve();
            return;
        }

        // 속도 모드에 따른 시간 설정
        const moveTime = 0.5 / speedMode + 's';
        const exitDelay = 700 / speedMode;
        const fallDelay = 300 / speedMode;
        const fallTime = 1.2 / speedMode + 's';
        
        // 선택 상태로 표시
        selectedBall.selected = true;
        selectedBall.element.classList.add('selected-ball');
        selectedBall.element.classList.remove('ball-rotate', 'ball-fast', 'ball-reverse', 'ball-bounce');

        // 출구로 이동
        selectedBall.element.style.transition = `left ${moveTime}, top ${moveTime}, transform ${moveTime}`;
        selectedBall.element.style.left = '180px';
        selectedBall.element.style.top = '330px';
        selectedBall.element.style.transform = 'scale(1.5)';

        // 출구에 도달 후 처리
        setTimeout(() => {
            // 원래 볼 제거
            if (selectedBall.element && selectedBall.element.parentNode) {
                selectedBall.element.style.opacity = '0';
                setTimeout(() => {
                    if (selectedBall.element.parentNode) {
                        selectedBall.element.parentNode.removeChild(selectedBall.element);
                    }
                }, fallDelay);
            }

            // 튜브로 떨어지는 애니메이션
            setTimeout(() => {
                // 볼 떨어지는 소리 재생
                playSound(ballDropSound);

                // 튜브 패스로 공이 떨어지는 효과
                const ballClone = document.createElement('div');
                ballClone.className = 'ball selected-ball';
                ballClone.textContent = selectedBall.number;
                ballClone.style.backgroundColor = getBallColor(selectedBall.number);

                const tubePath = document.getElementById('tubePath');

                if (tubePath) {
                    tubePath.appendChild(ballClone);
                    ballClone.style.position = 'absolute';
                    ballClone.style.left = '10px';  // 튜브 중앙
                    ballClone.style.top = '0';
                    ballClone.style.animation = `fallDown ${fallTime} forwards`;

                    // 볼이 튜브를 완전히 통과한 후 결과 표시
                    const totalFallTime = parseFloat(fallTime) * 1000;
                    setTimeout(resolve, totalFallTime);
                } else {
                    resolve();
                }
            }, fallDelay);
        }, exitDelay);
    });
}

// 결과 표시 (사운드 추가)
function showResult(number, container) {
    if (!container) return;

    // 새 결과 공 생성
    const resultBall = document.createElement('div');
    resultBall.className = 'result-ball';
    resultBall.textContent = number;
    resultBall.style.backgroundColor = getBallColor(number);
    container.appendChild(resultBall);

    // 나타나는 애니메이션
    setTimeout(() => {
        resultBall.style.transform = 'scale(1)';
    }, 50);

    // 이 세트의 마지막 공인지 확인
    const selectedType = document.querySelector('input[name="numberCount"]:checked').value;
    const isSingleSet = selectedType === "single";
    const numbersInSet = container.querySelectorAll('.result-ball').length;
    
    // 단일 세트이고 6개의 공이 모두 나왔거나, 
    // 5세트이고 각 세트의 6개 공이 모두 나왔을 때 저장 버튼 추가
    if ((isSingleSet && numbersInSet === 6) || 
        (!isSingleSet && numbersInSet === 6 && !container.querySelector('.save-numbers-btn'))) {
        
        // 저장 버튼 추가
        const saveBtn = document.createElement('button');
        saveBtn.className = 'save-numbers-btn';
        saveBtn.textContent = '저장';
        saveBtn.onclick = function() {
            // 현재 세트의 번호 추출
            const numbers = Array.from(container.querySelectorAll('.result-ball'))
                .map(ball => parseInt(ball.textContent))
                .sort((a, b) => a - b);
            
            // 번호 저장
            saveNumbers(numbers);
            
            // 버튼 비활성화
            this.disabled = true;
            this.textContent = '저장됨';
        };
        
        container.appendChild(saveBtn);
    }
}

// 로또 추첨 함수 수정 (스킵 기능 개선)
async function drawLottery() {
    if (drawingInProgress) return;

    const {startBtn} = machineElements;

    drawingInProgress = true;
    startBtn.disabled = true;
    skipDrawing = false; // 스킵 상태 초기화

    // 스킵 버튼 표시
    const skipBtn = createSkipButton();
    skipBtn.style.display = 'inline-block';

    // 기존 결과 초기화
    machineElements.resultContainer.innerHTML = '';

    // 선택된 조합 유형 가져오기
    const selectedType = document.querySelector('input[name="numberCount"]:checked').value;
    const lottoNumbers = generateLottoNumbers();

    // 강화된 애니메이션 시작 (스킵 상태가 아닌 경우)
    if (!skipDrawing) {
        enhancedAnimation();
    }

    // 스킵 상태 확인 및 지연 처리
    if (!skipDrawing) {
        const animationDelay = 3000 / speedMode;
        await new Promise(resolve => {
            const timeout = setTimeout(resolve, animationDelay);
            
            // 스킵 상태 확인을 위한 인터벌
            const interval = setInterval(() => {
                if (skipDrawing) {
                    clearTimeout(timeout);
                    clearInterval(interval);
                    resolve();
                }
            }, 100);
        });
    }

    // 이미 스킵 상태이거나 스킵이 중간에 트리거 된 경우
    if (skipDrawing) {
        // 중간에 스킵이 트리거된 경우 진행 중인 애니메이션 중단
        machineSound.pause();
        
        if (selectedType === "single") {
            // 단일 세트 스킵 처리
            const setContainer = document.createElement('div');
            setContainer.className = 'result-set';
            machineElements.resultContainer.appendChild(setContainer);
            
            // 모든 번호를 한번에 표시
            for (let i = 0; i < lottoNumbers.length; i++) {
                showResult(lottoNumbers[i], setContainer);
            }
        } else {
            // 5세트 스킵 처리 - 모든 세트를 한번에 표시
            for (let setIndex = 0; setIndex < lottoNumbers.length; setIndex++) {
                const set = lottoNumbers[setIndex];
                
                // 세트 컨테이너 생성
                const setContainer = document.createElement('div');
                setContainer.className = 'result-set';
                
                // 세트 번호 표시
                const setNumber = document.createElement('div');
                setNumber.className = 'set-number';
                setNumber.textContent = setIndex + 1;
                setContainer.appendChild(setNumber);
                
                machineElements.resultContainer.appendChild(setContainer);
                
                // 세트의 모든 번호를 한번에 표시
                for (let i = 0; i < set.length; i++) {
                    showResult(set[i], setContainer);
                }
            }
        }
        
        // 추첨 완료 처리
        finishDrawing();
    } else {
        // 일반 모드 - 순차적 추첨 진행
        if (selectedType === "single") {
            // 단일 세트 처리
            const setContainer = document.createElement('div');
            setContainer.className = 'result-set';
            machineElements.resultContainer.appendChild(setContainer);
            
            // 각 번호별 순차 처리
            for (let i = 0; i < lottoNumbers.length; i++) {
                const number = lottoNumbers[i];

                // 각 번호 사이의 대기 시간
                if (i > 0) {
                    // 스킵 상태 확인하며 대기
                    await new Promise(resolve => {
                        const ballDelay = 500 / speedMode;
                        const timeout = setTimeout(resolve, ballDelay);
                        
                        // 스킵 확인 인터벌
                        const interval = setInterval(() => {
                            if (skipDrawing) {
                                clearTimeout(timeout);
                                clearInterval(interval);
                                resolve();
                            }
                        }, 50);
                    });
                    
                    // 스킵 모드로 전환됐을 때 남은 모든 번호 즉시 표시
                    if (skipDrawing) {
                        for (let j = i; j < lottoNumbers.length; j++) {
                            showResult(lottoNumbers[j], setContainer);
                        }
                        machineSound.pause();
                        finishDrawing();
                        break;
                    }
                }

                // 공 애니메이션 진행
                await selectBall(number);
                showResult(number, setContainer);

                // 마지막 번호일 경우 추첨 완료 처리
                if (i === lottoNumbers.length - 1) {
                    machineSound.pause();
                    finishDrawing();
                }
            }
        } else {
            // 5세트 처리 - 순차적 진행
            for (let setIndex = 0; setIndex < lottoNumbers.length; setIndex++) {
                // 스킵 모드 확인
                if (skipDrawing) {
                    // 스킵 모드로 전환됐을 때 남은 모든 세트 즉시 표시
                    for (let j = setIndex; j < lottoNumbers.length; j++) {
                        const set = lottoNumbers[j];
                        
                        // 세트 컨테이너 생성
                        const setContainer = document.createElement('div');
                        setContainer.className = 'result-set';
                        
                        // 세트 번호 표시
                        const setNumber = document.createElement('div');
                        setNumber.className = 'set-number';
                        setNumber.textContent = j + 1;
                        setContainer.appendChild(setNumber);
                        
                        machineElements.resultContainer.appendChild(setContainer);
                        
                        // 모든 번호를 한번에 표시
                        for (let i = 0; i < set.length; i++) {
                            showResult(set[i], setContainer);
                        }
                    }
                    
                    machineSound.pause();
                    finishDrawing();
                    break;
                }
                
                const set = lottoNumbers[setIndex];
                
                // 세트 컨테이너 생성
                const setContainer = document.createElement('div');
                setContainer.className = 'result-set';
                
                // 세트 번호 표시
                const setNumber = document.createElement('div');
                setNumber.className = 'set-number';
                setNumber.textContent = setIndex + 1;
                setContainer.appendChild(setNumber);
                
                machineElements.resultContainer.appendChild(setContainer);
                
                // 각 번호 순차적으로 추첨
                for (let i = 0; i < set.length; i++) {
                    // 스킵 모드 확인
                    if (skipDrawing) {
                        // 현재 세트의 남은 번호 즉시 표시
                        for (let j = i; j < set.length; j++) {
                            showResult(set[j], setContainer);
                        }
                        break;
                    }
                    
                    const number = set[i];

                    // 첫 공 이후에는 속도모드에 따른 간격
                    if (i > 0) {
                        // 스킵 상태 확인하며 대기
                        await new Promise(resolve => {
                            const ballDelay = 300 / speedMode;
                            const timeout = setTimeout(resolve, ballDelay);
                            
                            // 스킵 확인 인터벌
                            const interval = setInterval(() => {
                                if (skipDrawing) {
                                    clearTimeout(timeout);
                                    clearInterval(interval);
                                    resolve();
                                }
                            }, 50);
                        });
                    }

                    // 공 선택하고 빠져나가는 애니메이션
                    await selectBall(number);
                    showResult(number, setContainer);

                    // 마지막 세트의 마지막 번호일 경우
                    if (setIndex === lottoNumbers.length - 1 && i === set.length - 1) {
                        machineSound.pause();
                        finishDrawing();
                    }
                }
                
                // 스킵 모드로 전환된 경우 반복 종료
                if (skipDrawing) {
                    // 남은 세트들 처리를 위한 추가 확인
                    if (setIndex < lottoNumbers.length - 1) {
                        for (let j = setIndex + 1; j < lottoNumbers.length; j++) {
                            const remainingSet = lottoNumbers[j];
                            
                            // 세트 컨테이너 생성
                            const nextSetContainer = document.createElement('div');
                            nextSetContainer.className = 'result-set';
                            
                            // 세트 번호 표시
                            const nextSetNumber = document.createElement('div');
                            nextSetNumber.className = 'set-number';
                            nextSetNumber.textContent = j + 1;
                            nextSetContainer.appendChild(nextSetNumber);
                            
                            machineElements.resultContainer.appendChild(nextSetContainer);
                            
                            // 모든 번호를 한번에 표시
                            for (let i = 0; i < remainingSet.length; i++) {
                                showResult(remainingSet[i], nextSetContainer);
                            }
                        }
                        
                        machineSound.pause();
                        finishDrawing();
                    }
                    break;
                }
                
                // 세트 사이에 약간의 딜레이
                if (setIndex < lottoNumbers.length - 1) {
                    // 스킵 상태 확인하며 대기
                    await new Promise(resolve => {
                        const setDelay = 1000 / speedMode;
                        const timeout = setTimeout(resolve, setDelay);
                        
                        // 스킵 확인 인터벌
                        const interval = setInterval(() => {
                            if (skipDrawing) {
                                clearTimeout(timeout);
                                clearInterval(interval);
                                resolve();
                            }
                        }, 50);
                    });
                    
                    // 추첨기 초기화
                    balls.forEach(ball => {
                        if (ball.selected) {
                            ball.selected = false;
                        }
                    });
                }
            }
        }
    }

    // 스킵 버튼 숨김
    if (skipBtn) skipBtn.style.display = 'none';

    // 추첨 완료 후 버튼 활성화
    startBtn.disabled = false;
    drawingInProgress = false;
    skipDrawing = false; // 스킵 상태 초기화
}

// 사운드 토글 기능 개선
function toggleSound() {
    soundEnabled = !soundEnabled;

    if (soundEnabled) {
        machineElements.soundIcon.classList.remove('muted');
        // 현재 추첨 중이라면 소리 재생
        if (drawingInProgress) {
            // 다시 재생 시도
            setTimeout(() => {
                machineSound.play().catch(err => console.log('사용자 상호작용 후 재생 시도:', err));
            }, 100);
        }
    } else {
        machineElements.soundIcon.classList.add('muted');
        // 모든 소리 중지
        pauseAllSounds();
    }
}

// 모든 소리 중지 함수 추가
function pauseAllSounds() {
    const sounds = [machineSound, ballDropSound, resultSound, startSound];
    sounds.forEach(sound => {
        if (sound && !sound.paused) {
            sound.pause();
        }
    });
}

// 사운드 재생 함수 개선
function playSound(audioElement) {
    if (!soundEnabled || !audioElement) return;

    // 오디오 요소 체크
    if (audioElement.readyState === 0) {
        console.log('오디오가 로드되지 않았습니다. 로드 중...');
        audioElement.load();
    }

    // 안전하게 시간 초기화
    try {
        audioElement.currentTime = 0;
    } catch (e) {
        console.log('오디오 시간 초기화 오류:', e);
    }

    // 오디오 재생 시도
    try {
        const playPromise = audioElement.play();

        if (playPromise !== undefined) {
            playPromise.then(() => {
                console.log('오디오 재생 성공');
            }).catch(error => {
                console.log('오디오 재생 실패:', error);

                // 자동 재생 정책 우회 시도
                if (error.name === 'NotAllowedError') {
                    console.log('자동 재생 정책 우회 시도...');

                    // 보조 오디오 생성 (내장 오실레이터 사용)
                    createFallbackAudio(audioElement.id);
                }
            });
        }
    } catch (e) {
        console.log('오디오 재생 중 오류 발생:', e);
        createFallbackAudio(audioElement.id);
    }
}

// 웹 오디오 API를 사용한 대체 소리 생성 (브라우저 내장 사운드)
function createFallbackAudio(type) {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        // 소리 유형에 따라 다른 효과 적용
        switch(type) {
            case 'machineSound':
                oscillator.type = 'sawtooth';
                oscillator.frequency.value = 100;
                gainNode.gain.value = 0.1;
                break;
            case 'ballDropSound':
                oscillator.type = 'sine';
                oscillator.frequency.value = 440;
                gainNode.gain.value = 0.2;
                setTimeout(() => gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5), 100);
                break;
            case 'resultSound':
                oscillator.type = 'square';
                oscillator.frequency.value = 880;
                gainNode.gain.value = 0.2;
                oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.5);
                setTimeout(() => gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1), 500);
                break;
            case 'startSound':
                oscillator.type = 'triangle';
                oscillator.frequency.value = 220;
                gainNode.gain.value = 0.3;
                setTimeout(() => {
                    oscillator.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 1);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.5);
                }, 100);
                break;
        }

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.start();
        setTimeout(() => {
            oscillator.stop();
        }, type === 'machineSound' ? 10000 : 2000);

        console.log('대체 오디오 재생 중');
    } catch (e) {
        console.log('대체 오디오 생성 실패:', e);
    }
}

// 오디오 세팅 강화
function setupAudio() {
    // 오디오 요소 캐싱
    machineSound = document.getElementById('machineSound');
    ballDropSound = document.getElementById('ballDropSound');
    resultSound = document.getElementById('resultSound');
    startSound = document.getElementById('startSound');

    // 오디오 요소 존재 확인
    if (!machineSound || !ballDropSound || !resultSound || !startSound) {
        console.error('오디오 요소가 없습니다. 오디오 기능이 제한됩니다.');
        return;
    }

    // 오디오 이벤트 리스너 추가
    const sounds = [machineSound, ballDropSound, resultSound, startSound];

    sounds.forEach(sound => {
        // 로딩 중 이벤트
        sound.addEventListener('loadstart', () => {
            console.log(`${sound.id} 로딩 시작`);
        });

        // 로딩 완료 이벤트
        sound.addEventListener('canplaythrough', () => {
            console.log(`${sound.id} 로딩 완료, 재생 가능`);
            sound.dataset.loaded = 'true';
        });

        // 오류 이벤트
        sound.addEventListener('error', (e) => {
            console.error(`${sound.id} 로드 오류:`, e);
            sound.dataset.error = 'true';
        });

        // 볼륨 조정
        sound.volume = 0.3;

        // 강제 로드
        sound.load();
    });

    // 개별 볼륨 조절
    if (ballDropSound) ballDropSound.volume = 0.6;
    if (resultSound) resultSound.volume = 0.6;
}

// 오디오 사용 가능 여부 확인 함수 추가
function checkAudioAvailability() {
    return new Promise((resolve) => {
        // AudioContext 지원 확인
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) {
            console.warn('Web Audio API가 지원되지 않습니다. 대체 사운드를 사용합니다.');
            resolve(false);
            return;
        }

        // 오디오 컨텍스트 생성 테스트
        try {
            const testContext = new AudioContext();
            testContext.close().then(() => {
                console.log('오디오 시스템 사용 가능');
                resolve(true);
            }).catch(() => {
                console.warn('오디오 시스템 닫기 실패');
                resolve(false);
            });
        } catch (e) {
            console.warn('오디오 시스템 초기화 실패:', e);
            resolve(false);
        }
    });
}

// 속도 토글 함수 추가
function toggleSpeed() {
    // 속도 모드 순환: 1 -> 4 -> 8 -> 1
    if (speedMode === 1) {
        speedMode = 4;
    } else if (speedMode === 4) {
        speedMode = 8;
    } else {
        speedMode = 1;
    }
    
    const {speedToggleBtn} = machineElements;
    if (speedToggleBtn) {
        if (speedMode === 1) {
            speedToggleBtn.textContent = "일반 속도";
            speedToggleBtn.classList.remove('active', 'ultra');
        } else if (speedMode === 4) {
            speedToggleBtn.textContent = "4X 속도";
            speedToggleBtn.classList.add('active');
            speedToggleBtn.classList.remove('ultra');
        } else {
            speedToggleBtn.textContent = "8X 속도";
            speedToggleBtn.classList.add('active', 'ultra');
        }
    }
}

// 새 함수: 초기화 후 추첨 시작을 순차적으로 수행
async function startDrawing() {
    if (drawingInProgress) return;
    
    // 먼저 초기화 수행
    initMachine();
    
    // 초기화 후 잠시 대기 (애니메이션이 원활하게 시작하도록)
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // 추첨 시작
    drawLottery();
}

// 이벤트 리스너 등록
function setupEventListeners() {
    const {startBtn, soundControl, speedToggleBtn} = machineElements;
    const showSavedBtn = document.getElementById('showSavedBtn');
    const checkWinningBtn = document.getElementById('checkWinningBtn');
    const savedModal = document.getElementById('savedNumbersModal');
    const winningModal = document.getElementById('winningNumbersModal');
    const closeSavedBtn = document.querySelector('#savedNumbersModal .close');
    const closeWinningBtn = document.querySelector('#winningNumbersModal .close');

    // 시작 버튼 
    if (startBtn) startBtn.addEventListener('click', startDrawing);
    
    // 사운드 컨트롤
    if (soundControl) soundControl.addEventListener('click', toggleSound);
    
    // 속도 토글 버튼
    if (speedToggleBtn) {
        speedToggleBtn.addEventListener('click', toggleSpeed);
    }
    
    // 저장된 번호 보기 버튼
    if (showSavedBtn) {
        showSavedBtn.addEventListener('click', showSavedNumbers);
    }
    
    // 당첨번호 확인 버튼
    if (checkWinningBtn) {
        checkWinningBtn.addEventListener('click', () => {
            winningModal.style.display = 'block';
            checkSavedNumbersAgainstWinning();
        });
    }
    
    // 모달 닫기 버튼들
    if (closeSavedBtn) {
        closeSavedBtn.addEventListener('click', () => {
            savedModal.style.display = 'none';
        });
    }
    
    if (closeWinningBtn) {
        closeWinningBtn.addEventListener('click', () => {
            winningModal.style.display = 'none';
        });
    }
    
    // 모달 외부 클릭 시 닫기
    window.addEventListener('click', (event) => {
        if (event.target === savedModal) {
            savedModal.style.display = 'none';
        }
        if (event.target === winningModal) {
            winningModal.style.display = 'none';
        }
    });
    
    // 조합 유형 변경 이벤트
    const radios = document.querySelectorAll('input[name="numberCount"]');
    radios.forEach(radio => {
        radio.addEventListener('change', () => {
            if (!drawingInProgress) {
                initMachine();
            }
        });
    });
}

// 추첨 완료 함수 개선 - 일괄 저장 버튼 추가
function finishDrawing() {
drawingInProgress = false;
document.getElementById('startBtn').disabled = false;

// 스킵 버튼 숨김
const skipBtn = document.getElementById('skipBtn');
if (skipBtn) skipBtn.style.display = 'none';

// 추첨이 끝나면 공기 효과 제거
const airEffect = document.getElementById('airEffect');
if (airEffect) {
   airEffect.classList.remove('air-strong');
   airEffect.style.display = 'none'; // 완전히 숨김
}

// 팬 효과 감소
const fan = document.querySelector('.fan');
if (fan) {
   fan.style.animationDuration = '3s'; // 매우 느리게
   fan.style.opacity = '0.2'; // 거의 안 보이게
}

// 진동 효과 제거
const machineBody = document.querySelector('.machine-body');
if (machineBody) machineBody.classList.remove('shake-hard');

// 사운드 처리
if (soundEnabled) {
   machineSound.pause();
   machineSound.currentTime = 0;
   playSound(resultSound);
}

// 모든 볼의 상태 재설정 (바닥으로 떨어지게)
balls.forEach(ball => {
   if (!ball.selected) {
       // 정착 상태 초기화하여 새로운 중력 적용 시작
       ball.settled = false;
       
       // 약간의 초기 속도 추가 (더 자연스러운 낙하)
       ball.velocityX *= 0.3; // 현재 속도 감소
       ball.velocityY = 0;    // Y속도는 중력에 맡김
   }
});

// 추첨 결과 일괄 저장 버튼 추가
const resultContainer = document.getElementById('resultContainer');

// 이미 일괄 저장 버튼이 있다면 제거
const existingBatchSaveBtn = document.querySelector('.batch-save-btn');
if (existingBatchSaveBtn) {
   existingBatchSaveBtn.remove();
}

// 결과 세트들이 있는지 확인
const resultSets = resultContainer.querySelectorAll('.result-set');
if (resultSets.length > 0) {
   // 일괄 저장 버튼 생성
   const batchSaveBtn = document.createElement('button');
   batchSaveBtn.className = 'batch-save-btn';
   batchSaveBtn.textContent = '모든 번호 일괄 저장';
   batchSaveBtn.onclick = saveAllNumbers;
   
   // 결과 컨테이너에 버튼 추가 (가장 마지막에 추가)
   resultContainer.appendChild(batchSaveBtn);
}

console.log('추첨 종료: 볼들이 바닥으로 가라앉습니다');
}

// 모든 추첨 결과 일괄 저장 함수
function saveAllNumbers() {
const resultSets = document.querySelectorAll('.result-set');
let savedCount = 0;

resultSets.forEach(setContainer => {
   // 이미 저장된 세트는 건너뛰기
   const existingSaveBtn = setContainer.querySelector('.save-numbers-btn');
   if (existingSaveBtn && existingSaveBtn.disabled) {
       return;
   }
   
   // 번호 추출
   const numbers = Array.from(setContainer.querySelectorAll('.result-ball'))
       .map(ball => parseInt(ball.textContent))
       .sort((a, b) => a - b);
   
   // 유효한 번호 세트인지 확인 (6개 번호가 모두 있는지)
   if (numbers.length === 6) {
       // 번호 저장
       saveNumbers(numbers);
       savedCount++;
       
       // 저장 버튼이 있으면 비활성화
       if (existingSaveBtn) {
           existingSaveBtn.disabled = true;
           existingSaveBtn.textContent = '저장됨';
       }
   }
});

// 일괄 저장 버튼 비활성화
const batchSaveBtn = document.querySelector('.batch-save-btn');
if (batchSaveBtn) {
   batchSaveBtn.disabled = true;
   batchSaveBtn.textContent = `${savedCount}개 세트 저장됨`;
   
   // 2초 후 버튼 텍스트 원복
   setTimeout(() => {
       if (batchSaveBtn && document.body.contains(batchSaveBtn)) {
           batchSaveBtn.textContent = '모든 번호 일괄 저장';
       }
   }, 2000);
}
}

// 번호 저장 함수
function saveNumbers(numbers) {
    // 현재 날짜 생성
    const now = new Date();
    const dateString = now.toLocaleDateString('ko-KR', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit', 
        minute: '2-digit'
    });
    
    // 저장할 항목 객체 생성
    const savedItem = {
        id: Date.now(),  // 고유 ID
        date: dateString,
        numbers: numbers
    };
    
    // 로컬 저장소에서 기존 데이터 로드
    loadSavedNumbers();
    
    // 새 항목 추가
    savedNumbers.push(savedItem);
    
    // 로컬 저장소에 저장
    localStorage.setItem('lottoSavedNumbers', JSON.stringify(savedNumbers));
    
}

// 저장된 번호 로드
function loadSavedNumbers() {
    const saved = localStorage.getItem('lottoSavedNumbers');
    savedNumbers = saved ? JSON.parse(saved) : [];
    return savedNumbers;
}

// 저장된 번호 삭제
function deleteSavedNumber(id) {
    // ID로 항목 찾아 제거
    savedNumbers = savedNumbers.filter(item => item.id !== id);
    
    // 로컬 저장소 업데이트
    localStorage.setItem('lottoSavedNumbers', JSON.stringify(savedNumbers));
    
    // 저장된 번호 목록 다시 표시
    showSavedNumbers();
}

// 저장된 번호 표시 함수 - 일괄 삭제 버튼 추가
function showSavedNumbers() {
   // 모달 요소 가져오기
   const modal = document.getElementById('savedNumbersModal');
   const modalBody = document.getElementById('savedNumbersList');
   
   // 저장된 번호 로드
   loadSavedNumbers();
   
   // 모달 내용 초기화
   modalBody.innerHTML = '';
   
   // 저장된 번호가 없는 경우
   if (savedNumbers.length === 0) {
       modalBody.innerHTML = '<p style="text-align: center; color: #aaa;">저장된 번호가 없습니다.</p>';
       modal.style.display = 'block';
       return;
   }
   
   // 일괄 삭제 버튼 추가
   const batchDeleteContainer = document.createElement('div');
   batchDeleteContainer.className = 'batch-action-container';
   batchDeleteContainer.style.marginBottom = '20px';
   batchDeleteContainer.style.textAlign = 'right';
   
   const batchDeleteBtn = document.createElement('button');
   batchDeleteBtn.className = 'batch-delete-btn';
   batchDeleteBtn.textContent = '모든 번호 일괄 삭제';
   batchDeleteBtn.onclick = function() {
       if (confirm('저장된 모든 번호를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) {
           deleteAllSavedNumbers();
       }
   };
   
   batchDeleteContainer.appendChild(batchDeleteBtn);
   modalBody.appendChild(batchDeleteContainer);
   
   // 각 저장된 항목 표시
   savedNumbers.forEach(item => {
       const itemElement = document.createElement('div');
       itemElement.className = 'saved-number-item';
       
       // 날짜 표시
       const dateElement = document.createElement('div');
       dateElement.className = 'saved-date';
       dateElement.textContent = item.date;
       
       // 번호 표시 컨테이너
       const ballsContainer = document.createElement('div');
       ballsContainer.className = 'saved-balls-container';
       
       // 각 번호 표시
       item.numbers.forEach(number => {
           const ball = document.createElement('div');
           ball.className = 'saved-ball';
           ball.textContent = number;
           ball.style.backgroundColor = getBallColor(number);
           ballsContainer.appendChild(ball);
       });
       
       // 삭제 버튼
       const deleteBtn = document.createElement('button');
       deleteBtn.className = 'delete-btn';
       deleteBtn.textContent = '삭제';
       deleteBtn.onclick = function() {
           if (confirm('이 번호를 삭제하시겠습니까?')) {
               deleteSavedNumber(item.id);
           }
       };
       
       // 항목에 요소 추가
       itemElement.appendChild(dateElement);
       itemElement.appendChild(ballsContainer);
       itemElement.appendChild(deleteBtn);
       
       // 목록에 항목 추가
       modalBody.appendChild(itemElement);
   });
   
   // 모달 표시
   modal.style.display = 'block';
}

// 모든 저장된 번호 삭제 함수 추가
function deleteAllSavedNumbers() {
   // 저장된 번호 배열 초기화
   savedNumbers = [];
   
   // 로컬 스토리지에서 삭제
   localStorage.removeItem('lottoSavedNumbers');
   
   // 모달 다시 표시
   showSavedNumbers();
}

// 당첨번호 입력 모달 초기화
function initWinningNumbersModal() {
    const modal = document.getElementById('winningNumbersModal');
    const checkWinningBtn = document.getElementById('checkWinningBtn');
    const closeBtn = document.getElementById('closeWinningModal');
    const saveWinningBtn = document.getElementById('saveWinningBtn');
    const inputs = document.querySelectorAll('.winning-number-input');
    const bonusInput = document.getElementById('bonusNumberInput');
    
// 버튼 컨테이너 생성
let buttonContainer = document.getElementById('fetchButtonsContainer');
if (!buttonContainer) {
   buttonContainer = document.createElement('div');
   buttonContainer.id = 'fetchButtonsContainer';
   buttonContainer.className = 'fetch-buttons-container';
   buttonContainer.style.display = 'flex';
   buttonContainer.style.flexWrap = 'wrap';
   buttonContainer.style.gap = '10px';
   buttonContainer.style.marginBottom = '15px';
   
   // CORS 정보 추가
   const corsInfo = document.createElement('div');
   corsInfo.className = 'cors-info';
   corsInfo.innerHTML = `<small style="display:block;margin:8px 0;padding:8px;background:#f8f9fa;border:1px solid #ddd;border-radius:4px;color:#666;">
       * CORS 오류 발생 시 여러 프록시 서버를 자동으로 시도합니다.<br>
       * 외부 사이트에서 사용 시 <a href="https://cors-anywhere.herokuapp.com/corsdemo" target="_blank" style="color:blue;text-decoration:underline">여기를 클릭하여 CORS 프록시 사용 권한을 활성화</a>하면 조회 확률이 높아집니다.
   </small>`;
   
   // 최신 당첨번호 가져오기 버튼
   const fetchLatestBtn = document.createElement('button');
   fetchLatestBtn.id = 'fetchLatestBtn';
   fetchLatestBtn.className = 'fetch-latest-btn';
   fetchLatestBtn.textContent = '최신 당첨번호 가져오기';
   
   // 특정 회차 검색 입력창과 버튼
   const roundInputContainer = document.createElement('div');
   roundInputContainer.style.display = 'flex';
   
   const roundInput = document.createElement('input');
   roundInput.type = 'number';
   roundInput.id = 'roundInput';
   roundInput.min = '1';
   roundInput.placeholder = '회차 입력';
   roundInput.style.width = '100px';
   roundInput.style.marginRight = '5px';
   roundInput.style.padding = '0 10px';
   
   const fetchRoundBtn = document.createElement('button');
   fetchRoundBtn.id = 'fetchRoundBtn';
   fetchRoundBtn.className = 'fetch-latest-btn';
   fetchRoundBtn.style.backgroundColor = '#3F51B5';
   fetchRoundBtn.textContent = '회차 조회';
   
   roundInputContainer.appendChild(roundInput);
   roundInputContainer.appendChild(fetchRoundBtn);
   
   // 버튼 추가
   buttonContainer.appendChild(fetchLatestBtn);
   buttonContainer.appendChild(roundInputContainer);
   buttonContainer.appendChild(corsInfo);
   
   // 버튼 컨테이너를 저장 버튼 앞에 삽입
   const saveWinningBtn = document.getElementById('saveWinningBtn');
   if (saveWinningBtn && saveWinningBtn.parentNode) {
       saveWinningBtn.parentNode.insertBefore(buttonContainer, saveWinningBtn);
   }
}
    
    // 최신 당첨번호 가져오기 버튼 이벤트
    document.getElementById('fetchLatestBtn').addEventListener('click', async () => {
        const fetchBtn = document.getElementById('fetchLatestBtn');
        fetchBtn.disabled = true;
        fetchBtn.textContent = '가져오는 중...';
        
        const result = await fetchLatestWinningNumbers();
        
        fetchBtn.disabled = false;
        fetchBtn.textContent = '최신 당첨번호 가져오기';
        
        if (result.success) {
            alert(`${result.drawNo}회 당첨번호를 성공적으로 가져왔습니다!`);
        }
    });
    
    // 특정 회차 조회 버튼 이벤트
    document.getElementById('fetchRoundBtn').addEventListener('click', async () => {
        const roundInput = document.getElementById('roundInput');
        const round = parseInt(roundInput.value);
        
        if (!round || round < 1) {
            alert('유효한 회차 번호를 입력해주세요.');
            return;
        }
        
        const fetchBtn = document.getElementById('fetchRoundBtn');
        fetchBtn.disabled = true;
        fetchBtn.textContent = '조회 중...';
        
        const result = await fetchLottoNumberByRound(round);
        
        fetchBtn.disabled = false;
        fetchBtn.textContent = '회차 조회';
        
        if (result.success) {
            // 입력 필드에 번호 채우기
            const inputs = document.querySelectorAll('.winning-number-input');
            inputs.forEach((input, index) => {
                input.value = result.numbers[index];
            });
            
            // 보너스 번호 입력
            document.getElementById('bonusNumberInput').value = result.bonus;
            
            // 당첨 날짜 형식 변환
            const drawDate = new Date(result.date);
            const formattedDate = drawDate.toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
            
            // 당첨번호 저장
            saveWinningNumbers(result.numbers, result.bonus, `${result.round}회 (${formattedDate})`);
            
            // UI 업데이트
            displayCurrentWinningNumbers();
            
            // 저장된 번호와 비교
            checkSavedNumbersAgainstWinning();
            
            alert(`${result.round}회 당첨번호를 성공적으로 가져왔습니다!`);
        } else {
            alert(`당첨번호 가져오기 실패: ${result.error}`);
        }
    });
    
    // 저장된 당첨 번호 로드
    loadWinningNumbers();
    displayCurrentWinningNumbers();
    
    // 당첨확인 버튼 클릭 시 모달 표시
    checkWinningBtn.addEventListener('click', () => {
        modal.style.display = 'block';
        checkSavedNumbersAgainstWinning();
    });
    
    // 모달 닫기
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    // 외부 클릭시 모달 닫기
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    // 당첨번호 저장 버튼
    saveWinningBtn.addEventListener('click', () => {
        // 입력값 수집
        const numbers = Array.from(inputs).map(input => parseInt(input.value)).filter(num => !isNaN(num));
        const bonus = parseInt(bonusInput.value);
        
        // 유효성 검증
        if (numbers.length !== 6) {
            alert('6개의 당첨번호를 모두 입력해주세요.');
            return;
        }
        
        if (isNaN(bonus)) {
            alert('보너스 번호를 입력해주세요.');
            return;
        }
        
        // 숫자 범위 검증 (1-45)
        if ([...numbers, bonus].some(num => num < 1 || num > 45)) {
            alert('모든 번호는 1부터 45 사이어야 합니다.');
            return;
        }
        
        // 중복 번호 검증
        if (new Set(numbers).size !== 6 || numbers.includes(bonus)) {
            alert('중복된 번호가 있습니다. 모든 번호는 서로 달라야 합니다.');
            return;
        }
        
        // 당첨번호 저장
        saveWinningNumbers(numbers.sort((a, b) => a - b), bonus);
        
        // UI 업데이트
        displayCurrentWinningNumbers();
        
        // 저장된 번호와 비교
        checkSavedNumbersAgainstWinning();
        
        alert('당첨번호가 저장되었습니다!');
    });
    
    // 숫자 입력필드 포커스 이벤트 (자동으로 다음 필드로 이동)
    inputs.forEach((input, index) => {
        input.addEventListener('input', () => {
            if (input.value.length >= 2) {
                if (index < inputs.length - 1) {
                    inputs[index + 1].focus();
                } else {
                    bonusInput.focus();
                }
            }
        });
    });
}

// 당첨번호 저장
function saveWinningNumbers(numbers, bonus, dateStr = null) {
    winningNumbers = {
        numbers: numbers,
        bonus: bonus,
        date: dateStr || new Date().toLocaleDateString('ko-KR', { 
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit' 
        })
    };
    
    localStorage.setItem('lottoWinningNumbers', JSON.stringify(winningNumbers));
}

// 저장된 당첨 번호 로드
function loadWinningNumbers() {
    const saved = localStorage.getItem('lottoWinningNumbers');
    if (saved) {
        winningNumbers = JSON.parse(saved);
    }
    return winningNumbers;
}

// 현재 당첨번호 표시
function displayCurrentWinningNumbers() {
    const container = document.getElementById('currentWinningNumbers');
    
    if (!winningNumbers.numbers || winningNumbers.numbers.length === 0) {
        container.innerHTML = '<p class="no-data">저장된 당첨번호가 없습니다.</p>';
        return;
    }
    
    let html = `<h3>현재 저장된 당첨번호 (${winningNumbers.date})</h3>`;
    html += '<div class="winning-number-display">';
    
    // 당첨번호 표시
    winningNumbers.numbers.forEach(number => {
        html += `<div class="winning-ball" style="background-color: ${getBallColor(number)}">${number}</div>`;
    });
    
    // 보너스 번호 표시
    html += `<div class="winning-ball bonus-ball" style="background-color: ${getBallColor(winningNumbers.bonus)}">${winningNumbers.bonus}</div>`;
    
    html += '</div>';
    container.innerHTML = html;
}

// 로또 등수 확인 함수
function checkLottoRank(userNumbers, winningNumbers, bonusNumber) {
    const matches = userNumbers.filter(num => winningNumbers.includes(num)).length;
    
    if (matches === 6) return 1; // 1등: 6개 모두 일치
    if (matches === 5 && userNumbers.includes(bonusNumber)) return 2; // 2등: 5개 일치 + 보너스
    if (matches === 5) return 3; // 3등: 5개 일치
    if (matches === 4) return 4; // 4등: 4개 일치
    if (matches === 3) return 5; // 5등: 3개 일치
    return 0; // 낙첨
}

// 등수별 결과 텍스트 반환
function getRankText(rank) {
    switch(rank) {
        case 1: return '1등';
        case 2: return '2등';
        case 3: return '3등';
        case 4: return '4등';
        case 5: return '5등';
        default: return '낙첨';
    }
}

// 등수별 클래스 반환
function getRankClass(rank) {
    switch(rank) {
        case 1: return 'result-1st';
        case 2: return 'result-2nd';
        case 3: return 'result-3rd';
        case 4: return 'result-4th';
        case 5: return 'result-5th';
        default: return 'result-none';
    }
}

// 저장된 번호와 당첨번호 비교
function checkSavedNumbersAgainstWinning() {
    // 당첨번호가 설정되지 않은 경우
    if (!winningNumbers.numbers || winningNumbers.numbers.length !== 6 || !winningNumbers.bonus) {
        document.getElementById('winningResults').innerHTML = 
            '<p class="no-data">먼저 당첨번호를 설정해주세요.</p>';
        return;
    }
    
    // 저장된 번호 로드
    const savedNumbers = loadSavedNumbers();
    const resultsContainer = document.getElementById('winningResults');
    
    // 저장된 번호가 없는 경우
    if (savedNumbers.length === 0) {
        resultsContainer.innerHTML = '<p class="no-data">저장된 번호가 없습니다.</p>';
        return;
    }
    
    // 결과 헤더
    let html = `<div class="result-header">당첨 결과 (${winningNumbers.date})</div>`;
    
    // 각 저장된 번호에 대한 결과
    savedNumbers.forEach(item => {
        const rank = checkLottoRank(item.numbers, winningNumbers.numbers, winningNumbers.bonus);
        
        html += `
        <div class="match-item">
            <div class="match-info">
                <div class="match-date">${item.date}</div>
                <div class="match-balls">
        `;
        
        // 번호 표시
        item.numbers.forEach(number => {
            const isMatch = winningNumbers.numbers.includes(number);
            const isBonus = number === winningNumbers.bonus;
            const matchClass = isMatch ? 'match' : (isBonus ? 'bonus-match' : '');
            
            html += `<div class="match-ball ${matchClass}" 
                    style="background-color:${getBallColor(number)}">${number}</div>`;
        });
        
        html += `
                </div>
            </div>
            <div class="match-result ${getRankClass(rank)}">${getRankText(rank)}</div>
        </div>`;
    });
    
    resultsContainer.innerHTML = html;
}

// 동행복권 최신 당첨번호를 가져오는 함수 (CORS 문제 해결)
async function fetchLatestWinningNumbers() {
   try {
       // 로딩 표시 추가
       const container = document.getElementById('currentWinningNumbers');
       container.innerHTML = '<div class="loading">최신 당첨번호를 가져오는 중입니다...</div>';
       
       // 여러 CORS 프록시 중 하나 선택
       const proxyOptions = [
           'https://cors-anywhere.herokuapp.com/',
           'https://api.allorigins.win/raw?url=',
           'https://corsproxy.io/?'
       ];
       
       // 현재 날짜 기준 추정 회차 계산
       const firstDrawDate = new Date('2002-12-07');
       const today = new Date();
       const diffTime = Math.abs(today - firstDrawDate);
       const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
       const diffWeeks = Math.floor(diffDays / 7);
       const estimatedCurrentRound = diffWeeks + 1;
       
       console.log("추정 현재 회차:", estimatedCurrentRound);
       
       // 최근 5개 회차를 시도
       let latestData = null;
       let latestRound = 0;
       let successfulProxy = null;
       let lastError = null;
       
       // 각 프록시 서버를 순차적으로 시도
       for (const proxyUrl of proxyOptions) {
           if (latestData) break; // 이미 성공했으면 중단
           
           const targetUrl = 'https://www.dhlottery.co.kr/common.do?method=getLottoNumber';
           
           // 최근 5개 회차 시도
           for (let i = 0; i < 5; i++) {
               const round = estimatedCurrentRound - i;
               try {
                   console.log(`[${proxyUrl}] ${round}회차 조회 시도 중...`);
                   
                   // 프록시 서버에 따라 다른 요청 방식 사용
                   let response;
                   if (proxyUrl.includes('allorigins')) {
                       // allorigins는 인코딩된 URL 필요
                       const encodedUrl = encodeURIComponent(`${targetUrl}&drwNo=${round}`);
                       response = await fetch(`${proxyUrl}${encodedUrl}`);
                   } else {
                       // 다른 프록시는 표준 방식
                       response = await fetch(`${proxyUrl}${targetUrl}&drwNo=${round}`, {
                           headers: {
                               'X-Requested-With': 'XMLHttpRequest'
                           }
                       });
                   }
                   
                   if (!response.ok) {
                       throw new Error(`HTTP error! Status: ${response.status}`);
                   }
                   
                   const data = await response.json();
                   console.log(`${round}회차 응답:`, data);
                   
                   if (data && data.returnValue === 'success') {
                       latestData = data;
                       latestRound = round;
                       successfulProxy = proxyUrl;
                       console.log(`${proxyUrl}로 성공적으로 데이터 가져옴`);
                       break;
                   }
               } catch (e) {
                   console.error(`${round}회차 조회 실패 [${proxyUrl}]:`, e);
                   lastError = e;
               }
           }
       }
       
       if (!latestData) {
           throw new Error(`모든 프록시 서버 시도 실패: ${lastError?.message || '알 수 없는 오류'}`);
       }
       
       // 당첨번호 추출
       const winningNumbers = [
           latestData.drwtNo1,
           latestData.drwtNo2,
           latestData.drwtNo3,
           latestData.drwtNo4,
           latestData.drwtNo5,
           latestData.drwtNo6
       ].sort((a, b) => a - b);  // 정렬 적용
       
       const bonusNumber = latestData.bnusNo;
       
       // 추첨일자 형식 변환
       const drawDate = new Date(latestData.drwNoDate);
       const formattedDate = drawDate.toLocaleDateString('ko-KR', {
           year: 'numeric',
           month: '2-digit',
           day: '2-digit'
       });
       
       console.log("API에서 가져온 번호:", winningNumbers, "보너스:", bonusNumber);
       
       // 번호가 정상적으로 추출되었는지 확인
       if (winningNumbers.length === 6 && bonusNumber) {
           // 입력 필드에 번호 채우기
           const inputs = document.querySelectorAll('.winning-number-input');
           inputs.forEach((input, index) => {
               input.value = winningNumbers[index];
           });
           
           // 보너스 번호 입력
           document.getElementById('bonusNumberInput').value = bonusNumber;
           
           // 당첨번호 저장
           saveWinningNumbers(winningNumbers, bonusNumber, `${latestRound}회 (${formattedDate})`);
           
           // UI 업데이트
           displayCurrentWinningNumbers();
           
           // 저장된 번호와 비교
           checkSavedNumbersAgainstWinning();
           
           return {
               success: true,
               numbers: winningNumbers,
               bonus: bonusNumber,
               drawNo: latestRound,
               drawDate: formattedDate,
               proxy: successfulProxy
           };
       } else {
           throw new Error('당첨번호 구조에 오류가 있습니다');
       }
   } catch (error) {
       console.error('당첨번호 가져오기 실패:', error);
       
       // 에러 메시지 표시
       const container = document.getElementById('currentWinningNumbers');
       container.innerHTML = `<div class="error">당첨번호를 가져오는 중 오류가 발생했습니다.<br>
           네트워크 연결을 확인하거나 수동으로 입력해 주세요.<br>
           오류: ${error.message}</div>`;
       
       return { success: false, error: error.message };
   }
}

// 특정 회차의 당첨번호를 가져오는 함수 (CORS 문제 해결)
async function fetchLottoNumberByRound(round) {
try {
   // 로딩 표시 추가
   const container = document.getElementById('currentWinningNumbers');
   container.innerHTML = '<div class="loading">당첨번호를 가져오는 중입니다...</div>';
   
   // 여러 CORS 프록시 중 하나 선택
   const proxyOptions = [
       'https://cors-anywhere.herokuapp.com/',
       'https://api.allorigins.win/raw?url=',
       'https://corsproxy.io/?'
   ];
   
   const targetUrl = 'https://www.dhlottery.co.kr/common.do?method=getLottoNumber';
   let response = null;
   let data = null;
   let successfulProxy = null;
   let lastError = null;
   
   // 각 프록시 서버를 순차적으로 시도
   for (const proxyUrl of proxyOptions) {
       try {
           console.log(`[${proxyUrl}] ${round}회차 조회 시도 중...`);
           
           // 프록시 서버에 따라 다른 요청 방식 사용
           if (proxyUrl.includes('allorigins')) {
               // allorigins는 인코딩된 URL 필요
               const encodedUrl = encodeURIComponent(`${targetUrl}&drwNo=${round}`);
               response = await fetch(`${proxyUrl}${encodedUrl}`);
           } else {
               // 다른 프록시는 표준 방식
               response = await fetch(`${proxyUrl}${targetUrl}&drwNo=${round}`, {
                   headers: {
                       'X-Requested-With': 'XMLHttpRequest'
                   }
               });
           }
           
           if (!response.ok) {
               throw new Error(`HTTP error! Status: ${response.status}`);
           }
           
           data = await response.json();
           console.log(`${round}회차 응답:`, data);
           
           if (data && data.returnValue === 'success') {
               successfulProxy = proxyUrl;
               console.log(`${proxyUrl}로 성공적으로 데이터 가져옴`);
               break;
           }
       } catch (e) {
           console.error(`${round}회차 조회 실패 [${proxyUrl}]:`, e);
           lastError = e;
       }
   }
   
   if (!data || data.returnValue !== 'success') {
       throw new Error(`${round}회차 당첨번호를 찾을 수 없습니다. ${lastError?.message || ''}`);
   }
   
   return {
       success: true,
       round: data.drwNo,
       date: data.drwNoDate,
       numbers: [
           data.drwtNo1,
           data.drwtNo2,
           data.drwtNo3,
           data.drwtNo4,
           data.drwtNo5,
           data.drwtNo6
       ].sort((a, b) => a - b),  // 정렬 적용
       bonus: data.bnusNo,
       proxy: successfulProxy
   };
} catch (error) {
   console.error(`${round}회차 당첨번호 가져오기 실패:`, error);
   
   // 에러 메시지 표시
   const container = document.getElementById('currentWinningNumbers');
   container.innerHTML = `<div class="error">당첨번호를 가져오는 중 오류가 발생했습니다.<br>
       네트워크 연결을 확인하거나 수동으로 입력해 주세요.<br>
       오류: ${error.message}</div>`;
       
   return { success: false, error: error.message };
}
}

// 스킵 버튼 생성 함수
function createSkipButton() {
    // 기존 버튼이 있으면 제거
    const existingBtn = document.getElementById('skipBtn');
    if (existingBtn) existingBtn.remove();
    
    // 스킵 버튼 생성
    const skipBtn = document.createElement('button');
    skipBtn.id = 'skipBtn';
    skipBtn.className = 'skip-btn';
    skipBtn.textContent = '결과 바로보기';
    skipBtn.style.display = 'none'; // 초기에는 숨김 상태
    skipBtn.onclick = skipDrawingProcess;
    
    // 시작 버튼 옆에 추가
    const startBtn = document.getElementById('startBtn');
    if (startBtn && startBtn.parentNode) {
        startBtn.parentNode.insertBefore(skipBtn, startBtn.nextSibling);
    } else {
        // 시작 버튼이 없는 경우 결과 컨테이너 앞에 추가
        const resultContainer = document.getElementById('resultContainer');
        if (resultContainer) {
            resultContainer.parentNode.insertBefore(skipBtn, resultContainer);
        }
    }
    
    return skipBtn;
}

// 스킵 처리 함수
function skipDrawingProcess() {
    if (!drawingInProgress) return;
    
    // 스킵 상태로 설정
    skipDrawing = true;
    
    // 스킵 버튼 비활성화 및 텍스트 변경
    const skipBtn = document.getElementById('skipBtn');
    if (skipBtn) {
        skipBtn.disabled = true;
        skipBtn.textContent = '건너뛰는 중...';
    }
    
    console.log('추첨 과정을 건너뛰고 결과를 바로 표시합니다.');
}

// 이벤트 리스너 등록
document.addEventListener('DOMContentLoaded', async function() {
    // 오디오 시스템 확인
    const audioAvailable = await checkAudioAvailability();

    // DOM 요소 캐싱
    cacheElements();

    // 오디오 설정
    setupAudio();

    // 이벤트 리스너 설정
    setupEventListeners();

    // 초기화
    initMachine();

    // 오디오 시스템 상태 알림
    if (!audioAvailable) {
        console.log('오디오 시스템이 제한되어 있습니다. 내장 사운드 생성기를 사용합니다.');
    }

    // 사용자에게 상호작용 필요성 알림
    console.log('소리를 재생하려면 화면을 클릭하세요.');
    document.body.addEventListener('click', function bodyClick() {
        // 무음 오디오 재생으로 오디오 활성화
        const silentAudio = new Audio("data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA");
        silentAudio.play().then(() => {
            console.log('오디오 활성화 성공');
            document.body.removeEventListener('click', bodyClick);
        }).catch(err => {
            console.log('오디오 활성화 실패:', err);
        });
    });

    // 저장된 번호 로드
    loadSavedNumbers();

    // 당첨번호 모달 초기화
    initWinningNumbersModal();
});
