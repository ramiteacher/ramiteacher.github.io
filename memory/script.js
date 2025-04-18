/**
 * 메모리 토이즈 - 메인 JavaScript 파일
 * 모든 게임 로직 및 상태 처리를 담당합니다.
 */

// 전역 변수 및 상수
const STORAGE_KEY = 'memory_toys_data';
const FRUITS = ['🍎', '🍌', '🍇', '🍊', '🍓', '🍑', '🍍', '🥝', '🥭', '🍒', '🍐', '🥥', '🍉', '🍋', '🍈', '🍏', '🫐', '🍅'];

let gameData = {
    classic: {
        easy: { completed: false, bestTime: null, accuracy: 0, achievements: [] },
        mid: { completed: false, bestTime: null, accuracy: 0, achievements: [] },
        hard: { completed: false, bestTime: null, accuracy: 0, achievements: [] }
    },
    flash: {
        easy: { completed: false, bestLevel: 0, achievements: [] },
        mid: { completed: false, bestLevel: 0, achievements: [] },
        hard: { completed: false, bestLevel: 0, achievements: [] }
    },
    maze: {
        easy: { completed: false, bestTime: null, fruits: 0, achievements: [] },
        mid: { completed: false, bestTime: null, fruits: 0, achievements: [] },
        hard: { completed: false, bestTime: null, fruits: 0, achievements: [] }
    },
    monkey: {
        easy: { bestLevel: 0, bestTime: null, achievements: [] },
        mid: { bestLevel: 0, bestTime: null, achievements: [] },
        hard: { bestLevel: 0, bestTime: null, achievements: [] }
    }
};

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    // 로컬 스토리지에서 데이터 로드
    loadGameData();
    
    // 현재 페이지 확인 및 초기화
    const currentPage = getCurrentPage();
    
    // 토스트 메시지 컨테이너 생성
    createToastContainer();
    
    // 페이지별 초기화 함수 호출
    switch (currentPage) {
        case 'index':
            initIndexPage();
            break;
        case 'classic':
            initClassicGame();
            break;
        case 'flash':
            initFlashGame();
            break;
        case 'maze':
            initMazeGame();
            break;
        case 'monkey':
            initMonkeyGame();
            break;
        case 'faq':
            initFaqPage();
            break;
    }
});

/**
 * 토스트 메시지 컨테이너를 생성합니다.
 */
function createToastContainer() {
    const toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    document.body.appendChild(toastContainer);
}

/**
 * 토스트 메시지를 표시합니다.
 * @param {string} message 표시할 메시지
 * @param {number} duration 표시 시간 (밀리초)
 */
function showToast(message, duration = 2000) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // 애니메이션을 위한 지연
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // 지정된 시간 후 토스트 제거
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, duration);
}

/**
 * 현재 페이지 이름을 반환합니다.
 * @returns {string} 현재 페이지 이름
 */
function getCurrentPage() {
    const path = window.location.pathname;
    if (path.includes('classic')) return 'classic';
    if (path.includes('flash')) return 'flash';
    if (path.includes('maze')) return 'maze';
    if (path.includes('monkey')) return 'monkey';
    if (path.includes('faq')) return 'faq';
    return 'index';
}

/**
 * URL에서 난이도 파라미터를 가져옵니다.
 * @returns {string} 난이도 (easy, mid, hard)
 */
function getDifficulty() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('difficulty') || 'easy';
}

/**
 * 로컬 스토리지에서 게임 데이터를 로드합니다.
 */
function loadGameData() {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
        try {
            const parsedData = JSON.parse(savedData);
            gameData = { ...gameData, ...parsedData };
        } catch (e) {
            console.error('로컬 스토리지 데이터 파싱 오류:', e);
        }
    }
}

/**
 * 게임 데이터를 로컬 스토리지에 저장합니다.
 */
function saveGameData() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(gameData));
    } catch (e) {
        console.error('로컬 스토리지 저장 오류:', e);
    }
}

/**
 * 메인 페이지 초기화 함수
 */
function initIndexPage() {
    // 각 게임 모드의 진행 상황 표시
    updateProgressDisplay();
}

/**
 * 메인 페이지의 진행 상황을 업데이트합니다.
 */
function updateProgressDisplay() {
    // 각 게임 모드와 난이도별 진행 상황 업데이트
    for (const game in gameData) {
        for (const difficulty in gameData[game]) {
            const data = gameData[game][difficulty];
            const achievements = data.achievements || [];
            const totalAchievements = getMaxAchievements(game, difficulty);
            const progress = Math.round((achievements.length / totalAchievements) * 100);
            
            // 해당 요소 찾기 및 업데이트
            const detailsElement = document.querySelector(`[data-game="${game}"][data-difficulty="${difficulty}"]`);
            if (detailsElement) {
                const summaryElement = detailsElement.querySelector('summary');
                if (summaryElement) {
                    summaryElement.textContent = `${getDifficultyText(difficulty)} [${progress}%]`;
                }
            }
        }
    }
}

/**
 * 게임과 난이도에 따른 최대 도전 과제 수를 반환합니다.
 * @param {string} game 게임 이름
 * @param {string} difficulty 난이도
 * @returns {number} 최대 도전 과제 수
 */
function getMaxAchievements(game, difficulty) {
    const achievementCounts = {
        classic: { easy: 6, mid: 6, hard: 6 },
        flash: { easy: 6, mid: 6, hard: 6 },
        maze: { easy: 6, mid: 6, hard: 6 },
        monkey: { easy: 6, mid: 6, hard: 6 }
    };
    
    return achievementCounts[game]?.[difficulty] || 6;
}

/**
 * 난이도 코드를 한글 텍스트로 변환합니다.
 * @param {string} difficulty 난이도 코드
 * @returns {string} 한글 난이도 텍스트
 */
function getDifficultyText(difficulty) {
    switch (difficulty) {
        case 'easy': return '쉬움';
        case 'mid': return '중간';
        case 'hard': return '어려움';
        default: return '쉬움';
    }
}

/**
 * 클래식 메모리 게임 초기화 함수
 */
function initClassicGame() {
    const difficulty = getDifficulty();
    const difficultyText = getDifficultyText(difficulty);
    
    // 난이도에 따른 그리드 크기 설정
    let gridSize;
    switch (difficulty) {
        case 'easy': gridSize = { rows: 4, cols: 4 }; break; // 4x4
        case 'mid': gridSize = { rows: 5, cols: 6 }; break;  // 5x6
        case 'hard': gridSize = { rows: 6, cols: 6 }; break; // 6x6
        default: gridSize = { rows: 4, cols: 4 };
    }
    
    // 페이지 제목 및 난이도 표시 업데이트
    document.querySelector('.current-difficulty').textContent = difficultyText;
    document.querySelector('h1').textContent = `${difficultyText} 클래식 메모리`;
    
    // 게임 보드 생성
    createClassicBoard(gridSize);
    
    // 게임 상태 초기화
    const gameState = {
        cards: [],
        flippedCards: [],
        matchedPairs: 0,
        totalPairs: (gridSize.rows * gridSize.cols) / 2,
        attempts: 0,
        startTime: null,
        gameOver: false
    };
    
    // 카드 클릭 이벤트 설정
    setupClassicCardEvents(gameState);
    
    // 게임 컨트롤 버튼 이벤트 설정
    document.getElementById('restart-btn').addEventListener('click', () => {
        resetClassicGame(gridSize, gameState);
    });
    
    document.getElementById('home-btn').addEventListener('click', () => {
        window.location.href = '/memory/';
    });
}

/**
 * 클래식 메모리 게임 보드를 생성합니다.
 * @param {Object} gridSize 그리드 크기 (rows, cols)
 */
function createClassicBoard(gridSize) {
    const board = document.querySelector('.classic-board');
    board.innerHTML = '';
    
    // 그리드 스타일 설정
    board.style.gridTemplateColumns = `repeat(${gridSize.cols}, 1fr)`;
    board.style.gridTemplateRows = `repeat(${gridSize.rows}, 1fr)`;
    
    // 카드 쌍 생성
    const totalCards = gridSize.rows * gridSize.cols;
    const totalPairs = totalCards / 2;
    
    // 과일 아이콘 선택
    const selectedFruits = [];
    const shuffledFruits = [...FRUITS].sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < totalPairs; i++) {
        selectedFruits.push(shuffledFruits[i % shuffledFruits.length]);
    }
    
    // 카드 값 생성 (각 과일 2개씩)
    const cardValues = [];
    for (let i = 0; i < totalPairs; i++) {
        cardValues.push(selectedFruits[i], selectedFruits[i]);
    }
    
    // 카드 값 섞기
    shuffleArray(cardValues);
    
    // 카드 요소 생성 및 추가
    for (let i = 0; i < totalCards; i++) {
        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.cardValue = cardValues[i];
        card.dataset.index = i;
        
        // 과일 아이콘 요소 추가
        const fruitIcon = document.createElement('span');
        fruitIcon.className = 'fruit-icon';
        fruitIcon.textContent = cardValues[i];
        card.appendChild(fruitIcon);
        
        board.appendChild(card);
    }
}

/**
 * 클래식 메모리 게임의 카드 클릭 이벤트를 설정합니다.
 * @param {Object} gameState 게임 상태 객체
 */
function setupClassicCardEvents(gameState) {
    const cards = document.querySelectorAll('.card');
    gameState.cards = Array.from(cards);
    
    cards.forEach(card => {
        card.addEventListener('click', () => {
            // 게임이 끝났거나 이미 뒤집힌 카드는 무시
            if (gameState.gameOver || card.classList.contains('flipped') || card.classList.contains('matched')) {
                return;
            }
            
            // 게임 시작 시간 기록
            if (gameState.startTime === null) {
                gameState.startTime = Date.now();
                startClassicTimer(gameState);
            }
            
            // 카드 뒤집기
            flipCard(card, gameState);
        });
    });
}

/**
 * 클래식 메모리 게임에서 카드를 뒤집습니다.
 * @param {Element} card 뒤집을 카드 요소
 * @param {Object} gameState 게임 상태 객체
 */
function flipCard(card, gameState) {
    // 이미 2장이 뒤집혀 있으면 무시
    if (gameState.flippedCards.length >= 2) return;
    
    // 카드 뒤집기 애니메이션
    card.classList.add('flipped');
    
    // 뒤집힌 카드 배열에 추가
    gameState.flippedCards.push(card);
    
    // 2장이 뒤집혔으면 일치 여부 확인
    if (gameState.flippedCards.length === 2) {
        gameState.attempts++;
        document.getElementById('attempts').textContent = gameState.attempts;
        
        // 정확도 업데이트
        updateClassicAccuracy(gameState);
        
        // 카드 일치 여부 확인
        checkForMatch(gameState);
    }
}

/**
 * 클래식 메모리 게임에서 뒤집힌 두 카드의 일치 여부를 확인합니다.
 * @param {Object} gameState 게임 상태 객체
 */
function checkForMatch(gameState) {
    const [card1, card2] = gameState.flippedCards;
    
    if (card1.dataset.cardValue === card2.dataset.cardValue) {
        // 일치하는 경우
        card1.classList.add('matched');
        card2.classList.add('matched');
        gameState.matchedPairs++;
        
        // 정답 토스트 메시지 표시
        showToast('정답!', 1500);
        
        // 모든 쌍을 찾았는지 확인
        if (gameState.matchedPairs === gameState.totalPairs) {
            endClassicGame(gameState);
        }
    } else {
        // 일치하지 않는 경우, 잠시 후 다시 뒤집기
        setTimeout(() => {
            card1.classList.remove('flipped');
            card2.classList.remove('flipped');
        }, 1000);
    }
    
    // 뒤집힌 카드 배열 초기화
    setTimeout(() => {
        gameState.flippedCards = [];
    }, 1000);
}

/**
 * 클래식 메모리 게임의 정확도를 업데이트합니다.
 * @param {Object} gameState 게임 상태 객체
 */
function updateClassicAccuracy(gameState) {
    const minAttempts = gameState.totalPairs;
    const currentAttempts = gameState.attempts;
    const correctPairs = gameState.matchedPairs;
    
    // 정확도 계산 수정: (맞춘 쌍 / 시도 횟수) * 100
    const accuracy = Math.min(100, Math.round((correctPairs / currentAttempts) * 100));
    document.getElementById('accuracy').textContent = `${accuracy}%`;
}

/**
 * 클래식 메모리 게임의 타이머를 시작합니다.
 * @param {Object} gameState 게임 상태 객체
 */
function startClassicTimer(gameState) {
    const timerElement = document.getElementById('time');
    
    const updateTimer = () => {
        if (gameState.gameOver) return;
        
        const currentTime = Date.now();
        const elapsedSeconds = Math.floor((currentTime - gameState.startTime) / 1000);
        timerElement.textContent = elapsedSeconds;
        
        requestAnimationFrame(updateTimer);
    };
    
    updateTimer();
}

/**
 * 클래식 메모리 게임을 종료합니다.
 * @param {Object} gameState 게임 상태 객체
 */
function endClassicGame(gameState) {
    gameState.gameOver = true;
    const endTime = Date.now();
    const totalTime = Math.floor((endTime - gameState.startTime) / 1000);
    
    // 결과 모달 업데이트
    document.getElementById('result-time').textContent = totalTime;
    document.getElementById('result-attempts').textContent = gameState.attempts;
    
    // 정확도 계산 수정
    const accuracy = Math.min(100, Math.round((gameState.matchedPairs / gameState.attempts) * 100));
    document.getElementById('result-accuracy').textContent = `${accuracy}%`;
    
    // 도전 과제 확인 및 업데이트
    const achievements = checkClassicAchievements(gameState, totalTime, accuracy);
    
    // 도전 과제 목록 표시
    const achievementsList = document.getElementById('achievements-list');
    achievementsList.innerHTML = '';
    
    achievements.forEach(achievement => {
        const li = document.createElement('li');
        li.textContent = achievement;
        achievementsList.appendChild(li);
    });
    
    // 게임 데이터 저장
    saveClassicGameData(totalTime, accuracy, achievements);
    
    // 모달 표시
    const modal = document.getElementById('result-modal');
    modal.style.display = 'flex';
    
    // 모달 버튼 이벤트 설정
    document.getElementById('play-again-btn').addEventListener('click', () => {
        modal.style.display = 'none';
        const gridSize = getGridSizeFromDifficulty(getDifficulty());
        resetClassicGame(gridSize, gameState);
    });
    
    document.getElementById('modal-home-btn').addEventListener('click', () => {
        window.location.href = '/memory/';
    });
}

/**
 * 난이도에 따른 그리드 크기를 반환합니다.
 * @param {string} difficulty 난이도
 * @returns {Object} 그리드 크기 (rows, cols)
 */
function getGridSizeFromDifficulty(difficulty) {
    switch (difficulty) {
        case 'easy': return { rows: 4, cols: 4 };
        case 'mid': return { rows: 5, cols: 6 };
        case 'hard': return { rows: 6, cols: 6 };
        default: return { rows: 4, cols: 4 };
    }
}

/**
 * 클래식 메모리 게임의 도전 과제를 확인합니다.
 * @param {Object} gameState 게임 상태 객체
 * @param {number} totalTime 총 게임 시간 (초)
 * @param {number} accuracy 정확도 (%)
 * @returns {Array} 달성한 도전 과제 목록
 */
function checkClassicAchievements(gameState, totalTime, accuracy) {
    const achievements = [];
    const difficulty = getDifficulty();
    
    // 기본 완료 도전 과제
    achievements.push('게임 완료');
    
    // 정확도 도전 과제
    if (accuracy >= 80) achievements.push('80% 정확도');
    if (accuracy >= 90) achievements.push('90% 정확도');
    if (accuracy >= 100) achievements.push('100% 정확도');
    
    // 완벽 이상 도전 과제 (첫 시도에 모든 카드 맞춤)
    if (gameState.attempts === gameState.totalPairs) {
        achievements.push('완벽 이상');
    }
    
    // 시간 도전 과제
    const timeThresholds = {
        easy: 20,
        mid: 40,
        hard: 70
    };
    
    if (totalTime < timeThresholds[difficulty]) {
        achievements.push(`${timeThresholds[difficulty]}초 이내 완료`);
    }
    
    return achievements;
}

/**
 * 클래식 메모리 게임 데이터를 저장합니다.
 * @param {number} time 게임 시간 (초)
 * @param {number} accuracy 정확도 (%)
 * @param {Array} achievements 달성한 도전 과제 목록
 */
function saveClassicGameData(time, accuracy, achievements) {
    const difficulty = getDifficulty();
    const currentData = gameData.classic[difficulty];
    
    // 최고 기록 업데이트
    if (!currentData.bestTime || time < currentData.bestTime) {
        currentData.bestTime = time;
    }
    
    // 최고 정확도 업데이트
    if (accuracy > currentData.accuracy) {
        currentData.accuracy = accuracy;
    }
    
    // 완료 상태 업데이트
    currentData.completed = true;
    
    // 도전 과제 업데이트 (중복 제거)
    const uniqueAchievements = new Set([...currentData.achievements, ...achievements]);
    currentData.achievements = Array.from(uniqueAchievements);
    
    // 데이터 저장
    saveGameData();
}

/**
 * 클래식 메모리 게임을 재설정합니다.
 * @param {Object} gridSize 그리드 크기 (rows, cols)
 * @param {Object} gameState 게임 상태 객체
 */
function resetClassicGame(gridSize, gameState) {
    // 게임 보드 재생성
    createClassicBoard(gridSize);
    
    // 게임 상태 초기화
    gameState.cards = Array.from(document.querySelectorAll('.card'));
    gameState.flippedCards = [];
    gameState.matchedPairs = 0;
    gameState.totalPairs = (gridSize.rows * gridSize.cols) / 2;
    gameState.attempts = 0;
    gameState.startTime = null;
    gameState.gameOver = false;
    
    // 통계 초기화
    document.getElementById('time').textContent = '0';
    document.getElementById('attempts').textContent = '0';
    document.getElementById('accuracy').textContent = '100%';
    
    // 카드 클릭 이벤트 재설정
    setupClassicCardEvents(gameState);
}

/**
 * 플래시 메모리 게임 초기화 함수
 */
function initFlashGame() {
    const difficulty = getDifficulty();
    const difficultyText = getDifficultyText(difficulty);
    
    // 페이지 제목 및 난이도 표시 업데이트
    document.querySelector('.current-difficulty').textContent = difficultyText;
    document.querySelector('h1').textContent = `${difficultyText} 플래시 챌린지`;
    
    // 게임 상태 초기화
    const gameState = {
        level: 1,
        currentNumber: '',
        userInput: '',
        lives: 3,
        backspaceCount: 0,
        reverseMode: false,
        startTime: null,
        gameOver: false
    };
    
    // 난이도에 따른 설정
    const difficultySettings = {
        easy: { startLength: 3, flashTime: 1000 },
        mid: { startLength: 4, flashTime: 800 },
        hard: { startLength: 5, flashTime: 600 }
    };
    
    gameState.settings = difficultySettings[difficulty];
    
    // 게임 UI 초기화
    updateFlashLives(gameState);
    updateFlashLevel(gameState);
    
    // 입력 필드 이벤트 설정
    const inputField = document.getElementById('number-input');
    inputField.addEventListener('keydown', (e) => {
        // 백스페이스 키 카운트
        if (e.key === 'Backspace') {
            gameState.backspaceCount++;
            document.getElementById('backspace-count').textContent = gameState.backspaceCount;
        }
    });
    
    inputField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            checkFlashInput(gameState);
        }
    });
    
    // 게임 컨트롤 버튼 이벤트 설정
    document.getElementById('restart-btn').addEventListener('click', () => {
        resetFlashGame(gameState);
    });
    
    document.getElementById('home-btn').addEventListener('click', () => {
        window.location.href = '/memory/';
    });
    
    // 게임 시작
    startFlashGame(gameState);
}

/**
 * 플래시 메모리 게임을 시작합니다.
 * @param {Object} gameState 게임 상태 객체
 */
function startFlashGame(gameState) {
    // 게임 시작 시간 기록
    if (gameState.startTime === null) {
        gameState.startTime = Date.now();
        startFlashTimer(gameState);
    }
    
    // 현재 레벨에 맞는 숫자 생성
    generateFlashNumber(gameState);
    
    // 숫자 표시
    const flashDisplay = document.querySelector('.flash-number');
    flashDisplay.textContent = gameState.currentNumber;
    
    // 일정 시간 후 숫자 숨기기
    setTimeout(() => {
        flashDisplay.textContent = '';
        
        // 입력 필드 활성화
        const inputField = document.getElementById('number-input');
        inputField.disabled = false;
        inputField.focus();
    }, gameState.settings.flashTime);
}

/**
 * 플래시 메모리 게임의 숫자를 생성합니다.
 * @param {Object} gameState 게임 상태 객체
 */
function generateFlashNumber(gameState) {
    const length = gameState.settings.startLength + gameState.level - 1;
    let number = '';
    
    for (let i = 0; i < length; i++) {
        number += Math.floor(Math.random() * 10);
    }
    
    gameState.currentNumber = number;
    
    // 입력 필드 초기화 및 비활성화
    const inputField = document.getElementById('number-input');
    inputField.value = '';
    inputField.disabled = true;
}

/**
 * 플래시 메모리 게임의 사용자 입력을 확인합니다.
 * @param {Object} gameState 게임 상태 객체
 */
function checkFlashInput(gameState) {
    const inputField = document.getElementById('number-input');
    const userInput = inputField.value.trim();
    
    // 역순 모드인 경우 입력을 뒤집어서 비교
    let targetNumber = gameState.currentNumber;
    if (gameState.reverseMode) {
        targetNumber = targetNumber.split('').reverse().join('');
    }
    
    if (userInput === targetNumber) {
        // 정답인 경우
        showToast('정답!', 1500);
        gameState.level++;
        updateFlashLevel(gameState);
        
        // 다음 레벨 시작
        startFlashGame(gameState);
    } else {
        // 오답인 경우
        gameState.lives--;
        updateFlashLives(gameState);
        
        // 목숨이 남아있으면 같은 레벨 재시도
        if (gameState.lives > 0) {
            startFlashGame(gameState);
        } else {
            // 게임 오버
            endFlashGame(gameState);
        }
    }
}

/**
 * 플래시 메모리 게임의 목숨을 업데이트합니다.
 * @param {Object} gameState 게임 상태 객체
 */
function updateFlashLives(gameState) {
    const heartsContainer = document.querySelector('.lives-hearts');
    heartsContainer.innerHTML = '';
    
    for (let i = 0; i < gameState.lives; i++) {
        const heart = document.createElement('div');
        heart.className = 'heart';
        heartsContainer.appendChild(heart);
    }
}

/**
 * 플래시 메모리 게임의 레벨을 업데이트합니다.
 * @param {Object} gameState 게임 상태 객체
 */
function updateFlashLevel(gameState) {
    document.querySelector('.level-value').textContent = gameState.level;
    document.getElementById('level').textContent = gameState.level;
}

/**
 * 플래시 메모리 게임의 타이머를 시작합니다.
 * @param {Object} gameState 게임 상태 객체
 */
function startFlashTimer(gameState) {
    const timerElement = document.getElementById('time');
    
    const updateTimer = () => {
        if (gameState.gameOver) return;
        
        const currentTime = Date.now();
        const elapsedSeconds = Math.floor((currentTime - gameState.startTime) / 1000);
        timerElement.textContent = elapsedSeconds;
        
        requestAnimationFrame(updateTimer);
    };
    
    updateTimer();
}

/**
 * 플래시 메모리 게임을 종료합니다.
 * @param {Object} gameState 게임 상태 객체
 */
function endFlashGame(gameState) {
    gameState.gameOver = true;
    const endTime = Date.now();
    const totalTime = Math.floor((endTime - gameState.startTime) / 1000);
    
    // 결과 모달 업데이트
    document.getElementById('result-time').textContent = totalTime;
    document.getElementById('result-level').textContent = gameState.level - 1;
    document.getElementById('result-backspace').textContent = gameState.backspaceCount;
    
    // 도전 과제 확인 및 업데이트
    const achievements = checkFlashAchievements(gameState, totalTime);
    
    // 도전 과제 목록 표시
    const achievementsList = document.getElementById('achievements-list');
    achievementsList.innerHTML = '';
    
    achievements.forEach(achievement => {
        const li = document.createElement('li');
        li.textContent = achievement;
        achievementsList.appendChild(li);
    });
    
    // 게임 데이터 저장
    saveFlashGameData(gameState.level - 1, totalTime, achievements);
    
    // 모달 표시
    const modal = document.getElementById('result-modal');
    modal.style.display = 'flex';
    
    // 모달 버튼 이벤트 설정
    document.getElementById('play-again-btn').addEventListener('click', () => {
        modal.style.display = 'none';
        resetFlashGame(gameState);
    });
    
    document.getElementById('modal-home-btn').addEventListener('click', () => {
        window.location.href = '/memory/';
    });
}

/**
 * 플래시 메모리 게임의 도전 과제를 확인합니다.
 * @param {Object} gameState 게임 상태 객체
 * @param {number} totalTime 총 게임 시간 (초)
 * @returns {Array} 달성한 도전 과제 목록
 */
function checkFlashAchievements(gameState, totalTime) {
    const achievements = [];
    const difficulty = getDifficulty();
    const maxLevel = gameState.level - 1;
    
    // 기본 완료 도전 과제 (레벨 5 이상 달성)
    if (maxLevel >= 5) {
        achievements.push('게임 완료');
        
        // 목숨 손실 없음 도전 과제
        if (gameState.lives === 3) {
            achievements.push('완료 + 목숨 손실 없음');
        }
        
        // 역순 입력 도전 과제
        if (gameState.reverseMode) {
            achievements.push('완료 + 모든 숫자 역순 입력');
        }
        
        // 백스페이스 사용 안함 도전 과제
        if (gameState.backspaceCount === 0) {
            achievements.push('완료 + 백스페이스 사용 안함');
        }
        
        // 시간 도전 과제
        const timeThresholds = {
            easy: { normal: 45, fast: 30 },
            mid: { normal: 45, fast: 30 },
            hard: { normal: 45, fast: 30 }
        };
        
        if (totalTime < timeThresholds[difficulty].normal) {
            achievements.push(`${timeThresholds[difficulty].normal}초 이내 완료`);
        }
        
        if (totalTime < timeThresholds[difficulty].fast) {
            achievements.push(`${timeThresholds[difficulty].fast}초 이내 완료`);
        }
    }
    
    return achievements;
}

/**
 * 플래시 메모리 게임 데이터를 저장합니다.
 * @param {number} level 달성한 최고 레벨
 * @param {number} time 게임 시간 (초)
 * @param {Array} achievements 달성한 도전 과제 목록
 */
function saveFlashGameData(level, time, achievements) {
    const difficulty = getDifficulty();
    const currentData = gameData.flash[difficulty];
    
    // 최고 레벨 업데이트
    if (level > currentData.bestLevel) {
        currentData.bestLevel = level;
    }
    
    // 완료 상태 업데이트 (레벨 5 이상 달성)
    if (level >= 5) {
        currentData.completed = true;
    }
    
    // 도전 과제 업데이트 (중복 제거)
    const uniqueAchievements = new Set([...currentData.achievements, ...achievements]);
    currentData.achievements = Array.from(uniqueAchievements);
    
    // 데이터 저장
    saveGameData();
}

/**
 * 플래시 메모리 게임을 재설정합니다.
 * @param {Object} gameState 게임 상태 객체
 */
function resetFlashGame(gameState) {
    // 게임 상태 초기화
    gameState.level = 1;
    gameState.currentNumber = '';
    gameState.userInput = '';
    gameState.lives = 3;
    gameState.backspaceCount = 0;
    gameState.startTime = null;
    gameState.gameOver = false;
    
    // UI 업데이트
    updateFlashLives(gameState);
    updateFlashLevel(gameState);
    
    // 통계 초기화
    document.getElementById('time').textContent = '0';
    document.getElementById('backspace-count').textContent = '0';
    
    // 게임 시작
    startFlashGame(gameState);
}

/**
 * 메모리 미로 게임 초기화 함수
 */
function initMazeGame() {
    const difficulty = getDifficulty();
    const difficultyText = getDifficultyText(difficulty);
    
    // 페이지 제목 및 난이도 표시 업데이트
    document.querySelector('.current-difficulty').textContent = difficultyText;
    document.querySelector('h1').textContent = `${difficultyText} 메모리 미로`;
    
    // 난이도에 따른 미로 크기 설정
    let mazeSize;
    switch (difficulty) {
        case 'easy': mazeSize = { rows: 7, cols: 7 }; break;
        case 'mid': mazeSize = { rows: 9, cols: 9 }; break;
        case 'hard': mazeSize = { rows: 11, cols: 11 }; break;
        default: mazeSize = { rows: 7, cols: 7 };
    }
    
    // 게임 상태 초기화
    const gameState = {
        maze: [],
        path: [],
        currentPosition: { row: 0, col: 0 },
        endPosition: { row: 0, col: 0 },
        fruits: [],
        collectedFruits: 0,
        totalFruits: 5,
        lives: 3,
        level: 1,
        totalLevels: 5,
        showingPath: true,
        startTime: null,
        gameOver: false
    };
    
    // 미로 생성
    createMaze(mazeSize, gameState);
    
    // 게임 UI 초기화
    updateMazeLives(gameState);
    updateMazeLevel(gameState);
    updateMazeFruits(gameState);
    
    // 게임 컨트롤 버튼 이벤트 설정
    document.getElementById('restart-btn').addEventListener('click', () => {
        resetMazeGame(mazeSize, gameState);
    });
    
    document.getElementById('home-btn').addEventListener('click', () => {
        window.location.href = '/memory/';
    });
    
    // 경로 표시 후 숨기기
    showMazePath(gameState);
    
    // 키보드 이벤트 설정
    setupMazeKeyboardControls(gameState, mazeSize);
}

/**
 * 메모리 미로를 생성합니다.
 * @param {Object} mazeSize 미로 크기 (rows, cols)
 * @param {Object} gameState 게임 상태 객체
 */
function createMaze(mazeSize, gameState) {
    const mazeGrid = document.querySelector('.maze-grid');
    mazeGrid.innerHTML = '';
    
    // 그리드 스타일 설정
    mazeGrid.style.gridTemplateColumns = `repeat(${mazeSize.cols}, 1fr)`;
    mazeGrid.style.gridTemplateRows = `repeat(${mazeSize.rows}, 1fr)`;
    
    // 미로 배열 초기화
    gameState.maze = Array(mazeSize.rows).fill().map(() => Array(mazeSize.cols).fill('empty'));
    
    // 시작 위치 (문) 설정
    const startRow = Math.floor(Math.random() * mazeSize.rows);
    const startCol = 0;
    gameState.currentPosition = { row: startRow, col: startCol };
    gameState.maze[startRow][startCol] = 'door';
    
    // 끝 위치 (깃발) 설정
    const endRow = Math.floor(Math.random() * mazeSize.rows);
    const endCol = mazeSize.cols - 1;
    gameState.endPosition = { row: endRow, col: endCol };
    gameState.maze[endRow][endCol] = 'flag';
    
    // 경로 생성
    generateMazePath(gameState, mazeSize);
    
    // 과일 배치
    placeMazeFruits(gameState, mazeSize);
    
    // 벽 배치
    placeMazeWalls(gameState, mazeSize);
    
    // 미로 그리드 생성
    for (let row = 0; row < mazeSize.rows; row++) {
        for (let col = 0; col < mazeSize.cols; col++) {
            const cell = document.createElement('div');
            cell.className = 'maze-cell';
            cell.dataset.row = row;
            cell.dataset.col = col;
            
            // 셀 타입에 따른 클래스 추가
            if (gameState.maze[row][col] !== 'empty') {
                cell.classList.add(gameState.maze[row][col]);
            }
            
            mazeGrid.appendChild(cell);
        }
    }
}

/**
 * 미로의 경로를 생성합니다.
 * @param {Object} gameState 게임 상태 객체
 * @param {Object} mazeSize 미로 크기 (rows, cols)
 */
function generateMazePath(gameState, mazeSize) {
    const { currentPosition, endPosition } = gameState;
    const path = [];
    
    // 시작 위치 추가
    path.push({ ...currentPosition });
    
    // 현재 위치
    let current = { ...currentPosition };
    
    // 끝 위치에 도달할 때까지 경로 생성
    while (current.col < endPosition.col) {
        // 다음 이동 방향 결정 (오른쪽, 위, 아래)
        const directions = [];
        
        // 항상 오른쪽 이동 가능성 추가
        directions.push({ row: current.row, col: current.col + 1 });
        
        // 위로 이동 가능성 추가 (맨 위가 아닌 경우)
        if (current.row > 0) {
            directions.push({ row: current.row - 1, col: current.col });
        }
        
        // 아래로 이동 가능성 추가 (맨 아래가 아닌 경우)
        if (current.row < mazeSize.rows - 1) {
            directions.push({ row: current.row + 1, col: current.col });
        }
        
        // 랜덤하게 다음 위치 선택
        const next = directions[Math.floor(Math.random() * directions.length)];
        
        // 경로에 추가
        path.push({ ...next });
        
        // 현재 위치 업데이트
        current = { ...next };
    }
    
    // 게임 상태에 경로 저장
    gameState.path = path;
}

/**
 * 미로에 과일을 배치합니다.
 * @param {Object} gameState 게임 상태 객체
 * @param {Object} mazeSize 미로 크기 (rows, cols)
 */
function placeMazeFruits(gameState, mazeSize) {
    const { path, totalFruits } = gameState;
    const fruits = [];
    
    // 경로 중에서 랜덤하게 과일 위치 선택 (시작과 끝 제외)
    const pathCopy = [...path.slice(1, -1)];
    shuffleArray(pathCopy);
    
    // 과일 배치
    for (let i = 0; i < Math.min(totalFruits, pathCopy.length); i++) {
        const fruitPos = pathCopy[i];
        gameState.maze[fruitPos.row][fruitPos.col] = 'fruit';
        fruits.push({ ...fruitPos });
    }
    
    // 게임 상태에 과일 위치 저장
    gameState.fruits = fruits;
}

/**
 * 미로에 벽을 배치합니다.
 * @param {Object} gameState 게임 상태 객체
 * @param {Object} mazeSize 미로 크기 (rows, cols)
 */
function placeMazeWalls(gameState, mazeSize) {
    const { maze, path } = gameState;
    
    // 경로에 없는 셀 중 일부를 벽으로 설정
    for (let row = 0; row < mazeSize.rows; row++) {
        for (let col = 0; col < mazeSize.cols; col++) {
            // 이미 다른 요소가 있는 셀은 건너뛰기
            if (maze[row][col] !== 'empty') continue;
            
            // 경로에 있는지 확인
            const isInPath = path.some(pos => pos.row === row && pos.col === col);
            
            // 경로에 없는 셀 중 일부를 벽으로 설정
            if (!isInPath && Math.random() < 0.3) {
                maze[row][col] = 'wall';
            }
        }
    }
}

/**
 * 미로의 경로를 표시합니다.
 * @param {Object} gameState 게임 상태 객체
 */
function showMazePath(gameState) {
    const { path } = gameState;
    
    // 경로 셀에 임시 클래스 추가
    path.forEach(pos => {
        const cell = document.querySelector(`.maze-cell[data-row="${pos.row}"][data-col="${pos.col}"]`);
        if (cell && !cell.classList.contains('door') && !cell.classList.contains('flag') && !cell.classList.contains('fruit')) {
            cell.classList.add('path');
        }
    });
    
    // 일정 시간 후 경로 숨기기
    setTimeout(() => {
        document.querySelectorAll('.maze-cell.path').forEach(cell => {
            cell.classList.remove('path');
        });
        
        // 경로 표시 상태 업데이트
        gameState.showingPath = false;
        
        // 게임 시작 시간 기록
        if (gameState.startTime === null) {
            gameState.startTime = Date.now();
            startMazeTimer(gameState);
        }
    }, 3000);
}

/**
 * 메모리 미로 게임의 키보드 컨트롤을 설정합니다.
 * @param {Object} gameState 게임 상태 객체
 * @param {Object} mazeSize 미로 크기 (rows, cols)
 */
function setupMazeKeyboardControls(gameState, mazeSize) {
    document.addEventListener('keydown', (e) => {
        // 경로 표시 중이거나 게임 오버 상태면 무시
        if (gameState.showingPath || gameState.gameOver) return;
        
        const { currentPosition, maze } = gameState;
        let newRow = currentPosition.row;
        let newCol = currentPosition.col;
        
        // 방향키에 따른 이동
        switch (e.key) {
            case 'ArrowUp':
                newRow--;
                break;
            case 'ArrowDown':
                newRow++;
                break;
            case 'ArrowLeft':
                newCol--;
                break;
            case 'ArrowRight':
                newCol++;
                break;
            default:
                return;
        }
        
        // 미로 범위 체크
        if (newRow < 0 || newRow >= mazeSize.rows || newCol < 0 || newCol >= mazeSize.cols) {
            return;
        }
        
        // 벽 체크
        if (maze[newRow][newCol] === 'wall') {
            return;
        }
        
        // 이전 위치의 플레이어 표시 제거
        const currentCell = document.querySelector(`.maze-cell[data-row="${currentPosition.row}"][data-col="${currentPosition.col}"]`);
        if (currentCell && !currentCell.classList.contains('door')) {
            currentCell.classList.remove('player');
        }
        
        // 새 위치로 이동
        gameState.currentPosition = { row: newRow, col: newCol };
        
        // 새 위치의 셀 가져오기
        const newCell = document.querySelector(`.maze-cell[data-row="${newRow}"][data-col="${newCol}"]`);
        
        // 과일 체크
        if (maze[newRow][newCol] === 'fruit') {
            gameState.collectedFruits++;
            updateMazeFruits(gameState);
            maze[newRow][newCol] = 'empty';
            newCell.classList.remove('fruit');
            showToast('정답!', 1500);
        }
        
        // 깃발(목표) 체크
        if (maze[newRow][newCol] === 'flag') {
            showToast('정답!', 1500);
            
            // 레벨 완료
            if (gameState.level < gameState.totalLevels) {
                // 다음 레벨로 진행
                gameState.level++;
                updateMazeLevel(gameState);
                resetMazeLevel(mazeSize, gameState);
            } else {
                // 게임 완료
                endMazeGame(gameState);
            }
            return;
        }
        
        // 플레이어 표시
        if (!newCell.classList.contains('door') && !newCell.classList.contains('flag')) {
            newCell.classList.add('player');
        }
    });
}

/**
 * 메모리 미로 게임의 목숨을 업데이트합니다.
 * @param {Object} gameState 게임 상태 객체
 */
function updateMazeLives(gameState) {
    const heartsContainer = document.querySelector('.lives-hearts');
    heartsContainer.innerHTML = '';
    
    for (let i = 0; i < gameState.lives; i++) {
        const heart = document.createElement('div');
        heart.className = 'heart';
        heartsContainer.appendChild(heart);
    }
}

/**
 * 메모리 미로 게임의 레벨을 업데이트합니다.
 * @param {Object} gameState 게임 상태 객체
 */
function updateMazeLevel(gameState) {
    document.querySelector('.level-value').textContent = `${gameState.level}/${gameState.totalLevels}`;
    document.getElementById('level').textContent = `${gameState.level}/${gameState.totalLevels}`;
}

/**
 * 메모리 미로 게임의 과일 수를 업데이트합니다.
 * @param {Object} gameState 게임 상태 객체
 */
function updateMazeFruits(gameState) {
    document.getElementById('fruits').textContent = `${gameState.collectedFruits}/${gameState.totalFruits}`;
}

/**
 * 메모리 미로 게임의 타이머를 시작합니다.
 * @param {Object} gameState 게임 상태 객체
 */
function startMazeTimer(gameState) {
    const timerElement = document.getElementById('time');
    
    const updateTimer = () => {
        if (gameState.gameOver) return;
        
        const currentTime = Date.now();
        const elapsedSeconds = Math.floor((currentTime - gameState.startTime) / 1000);
        timerElement.textContent = elapsedSeconds;
        
        requestAnimationFrame(updateTimer);
    };
    
    updateTimer();
}

/**
 * 메모리 미로 게임의 레벨을 재설정합니다.
 * @param {Object} mazeSize 미로 크기 (rows, cols)
 * @param {Object} gameState 게임 상태 객체
 */
function resetMazeLevel(mazeSize, gameState) {
    // 미로 재생성
    createMaze(mazeSize, gameState);
    
    // 경로 표시
    gameState.showingPath = true;
    showMazePath(gameState);
}

/**
 * 메모리 미로 게임을 종료합니다.
 * @param {Object} gameState 게임 상태 객체
 */
function endMazeGame(gameState) {
    gameState.gameOver = true;
    const endTime = Date.now();
    const totalTime = Math.floor((endTime - gameState.startTime) / 1000);
    
    // 결과 모달 업데이트
    document.getElementById('result-time').textContent = totalTime;
    document.getElementById('result-fruits').textContent = `${gameState.collectedFruits}/${gameState.totalFruits}`;
    document.getElementById('result-level').textContent = `${gameState.level}/${gameState.totalLevels}`;
    
    // 도전 과제 확인 및 업데이트
    const achievements = checkMazeAchievements(gameState, totalTime);
    
    // 도전 과제 목록 표시
    const achievementsList = document.getElementById('achievements-list');
    achievementsList.innerHTML = '';
    
    achievements.forEach(achievement => {
        const li = document.createElement('li');
        li.textContent = achievement;
        achievementsList.appendChild(li);
    });
    
    // 게임 데이터 저장
    saveMazeGameData(totalTime, gameState.collectedFruits, achievements);
    
    // 모달 표시
    const modal = document.getElementById('result-modal');
    modal.style.display = 'flex';
    
    // 모달 버튼 이벤트 설정
    document.getElementById('play-again-btn').addEventListener('click', () => {
        modal.style.display = 'none';
        const mazeSize = getMazeSizeFromDifficulty(getDifficulty());
        resetMazeGame(mazeSize, gameState);
    });
    
    document.getElementById('modal-home-btn').addEventListener('click', () => {
        window.location.href = '/memory/';
    });
}

/**
 * 난이도에 따른 미로 크기를 반환합니다.
 * @param {string} difficulty 난이도
 * @returns {Object} 미로 크기 (rows, cols)
 */
function getMazeSizeFromDifficulty(difficulty) {
    switch (difficulty) {
        case 'easy': return { rows: 7, cols: 7 };
        case 'mid': return { rows: 9, cols: 9 };
        case 'hard': return { rows: 11, cols: 11 };
        default: return { rows: 7, cols: 7 };
    }
}

/**
 * 메모리 미로 게임의 도전 과제를 확인합니다.
 * @param {Object} gameState 게임 상태 객체
 * @param {number} totalTime 총 게임 시간 (초)
 * @returns {Array} 달성한 도전 과제 목록
 */
function checkMazeAchievements(gameState, totalTime) {
    const achievements = [];
    const difficulty = getDifficulty();
    
    // 기본 완료 도전 과제
    achievements.push('게임 완료');
    
    // 과일 도전 과제
    if (gameState.collectedFruits >= 3) {
        achievements.push('3/5 과일 + 완료');
    }
    
    if (gameState.collectedFruits === gameState.totalFruits) {
        achievements.push('5/5 과일 + 완료');
    }
    
    // 시간 도전 과제
    const timeThresholds = {
        easy: { normal: 35, fast: 25, allFruits: 30 },
        mid: { normal: 55, fast: 45, allFruits: 50 },
        hard: { normal: 100, fast: 90, allFruits: 105 }
    };
    
    if (totalTime < timeThresholds[difficulty].normal) {
        achievements.push(`${timeThresholds[difficulty].normal}초 이내`);
    }
    
    if (totalTime < timeThresholds[difficulty].fast) {
        achievements.push(`${timeThresholds[difficulty].fast}초 이내`);
    }
    
    if (gameState.collectedFruits === gameState.totalFruits && totalTime < timeThresholds[difficulty].allFruits) {
        achievements.push(`${timeThresholds[difficulty].allFruits}초 이내 + 모든 과일`);
    }
    
    return achievements;
}

/**
 * 메모리 미로 게임 데이터를 저장합니다.
 * @param {number} time 게임 시간 (초)
 * @param {number} fruits 수집한 과일 수
 * @param {Array} achievements 달성한 도전 과제 목록
 */
function saveMazeGameData(time, fruits, achievements) {
    const difficulty = getDifficulty();
    const currentData = gameData.maze[difficulty];
    
    // 최고 기록 업데이트
    if (!currentData.bestTime || time < currentData.bestTime) {
        currentData.bestTime = time;
    }
    
    // 최고 과일 수 업데이트
    if (fruits > currentData.fruits) {
        currentData.fruits = fruits;
    }
    
    // 완료 상태 업데이트
    currentData.completed = true;
    
    // 도전 과제 업데이트 (중복 제거)
    const uniqueAchievements = new Set([...currentData.achievements, ...achievements]);
    currentData.achievements = Array.from(uniqueAchievements);
    
    // 데이터 저장
    saveGameData();
}

/**
 * 메모리 미로 게임을 재설정합니다.
 * @param {Object} mazeSize 미로 크기 (rows, cols)
 * @param {Object} gameState 게임 상태 객체
 */
function resetMazeGame(mazeSize, gameState) {
    // 게임 상태 초기화
    gameState.maze = [];
    gameState.path = [];
    gameState.currentPosition = { row: 0, col: 0 };
    gameState.endPosition = { row: 0, col: 0 };
    gameState.fruits = [];
    gameState.collectedFruits = 0;
    gameState.lives = 3;
    gameState.level = 1;
    gameState.showingPath = true;
    gameState.startTime = null;
    gameState.gameOver = false;
    
    // UI 업데이트
    updateMazeLives(gameState);
    updateMazeLevel(gameState);
    updateMazeFruits(gameState);
    
    // 통계 초기화
    document.getElementById('time').textContent = '0';
    
    // 미로 재생성
    createMaze(mazeSize, gameState);
    
    // 경로 표시
    showMazePath(gameState);
}

/**
 * 몽키 챌린지 게임 초기화 함수
 */
function initMonkeyGame() {
    const difficulty = getDifficulty();
    const difficultyText = getDifficultyText(difficulty);
    
    // 페이지 제목 및 난이도 표시 업데이트
    document.querySelector('.current-difficulty').textContent = difficultyText;
    document.querySelector('h1').textContent = `${difficultyText} 몽키 챌린지`;
    
    // 게임 상태 초기화
    const gameState = {
        level: 1,
        sequence: [],
        userSequence: [],
        lives: 3,
        showingSequence: false,
        startTime: null,
        gameOver: false
    };
    
    // 난이도에 따른 설정
    const difficultySettings = {
        easy: { gridSize: 3, showTime: 1000 },
        mid: { gridSize: 4, showTime: 800 },
        hard: { gridSize: 5, showTime: 600 }
    };
    
    gameState.settings = difficultySettings[difficulty];
    
    // 게임 보드 생성
    createMonkeyBoard(gameState);
    
    // 게임 UI 초기화
    updateMonkeyLives(gameState);
    updateMonkeyLevel(gameState);
    
    // 게임 컨트롤 버튼 이벤트 설정
    document.getElementById('restart-btn').addEventListener('click', () => {
        resetMonkeyGame(gameState);
    });
    
    document.getElementById('home-btn').addEventListener('click', () => {
        window.location.href = '/memory/';
    });
    
    // 게임 시작
    startMonkeyGame(gameState);
}

/**
 * 몽키 챌린지 게임 보드를 생성합니다.
 * @param {Object} gameState 게임 상태 객체
 */
function createMonkeyBoard(gameState) {
    const board = document.querySelector('.monkey-grid');
    board.innerHTML = '';
    board.style.width = '200%'; // ✅ 명시적 고정
    
    // 그리드 스타일 설정
    const gridSize = gameState.settings.gridSize;
    board.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
    board.style.width = '200%'; // ✅ 명시적 고정
    
    // 셀 생성
    const totalCells = gridSize * gridSize;
    
    for (let i = 0; i < totalCells; i++) {
        const cell = document.createElement('div');
        cell.className = 'monkey-cell';
        cell.dataset.index = i;
        board.appendChild(cell);
        
        // 클릭 이벤트 설정
        cell.addEventListener('click', () => {
            // 시퀀스 표시 중이거나 게임 오버 상태면 무시
            if (gameState.showingSequence || gameState.gameOver) return;
            
            // 게임 시작 시간 기록
            if (gameState.startTime === null) {
                gameState.startTime = Date.now();
                startMonkeyTimer(gameState);
            }
            
            // 사용자 시퀀스에 추가
            gameState.userSequence.push(i);
            
            // 클릭 효과
            highlightCell(cell);
            
            // 시퀀스 확인
            checkMonkeySequence(gameState);
        });
    }
}

/**
 * 몽키 챌린지 게임을 시작합니다.
 * @param {Object} gameState 게임 상태 객체
 */
function startMonkeyGame(gameState) {
    // 레벨에 맞는 시퀀스 생성
    generateMonkeySequence(gameState);
    
    // 시퀀스 표시
    showMonkeySequence(gameState);
}

/**
 * 몽키 챌린지 게임의 시퀀스를 생성합니다.
 * @param {Object} gameState 게임 상태 객체
 */
function generateMonkeySequence(gameState) {
    const gridSize = gameState.settings.gridSize;
    const totalCells = gridSize * gridSize;
    
    // 이전 시퀀스 유지하고 새 항목 추가
    if (gameState.level === 1) {
        gameState.sequence = [];
    }
    
    // 레벨만큼의 시퀀스 생성
    for (let i = gameState.sequence.length; i < gameState.level; i++) {
        const randomCell = Math.floor(Math.random() * totalCells);
        gameState.sequence.push(randomCell);
    }
    
    // 사용자 시퀀스 초기화
    gameState.userSequence = [];
}

/**
 * 몽키 챌린지 게임의 시퀀스를 표시합니다.
 * @param {Object} gameState 게임 상태 객체
 */
function showMonkeySequence(gameState) {
    gameState.showingSequence = true;
    
    // 셀에 숫자 표시
    const cells = document.querySelectorAll('.monkey-cell');
    cells.forEach(cell => {
        cell.textContent = '';
    });
    
    // 시퀀스 순서대로 셀 강조 표시
    gameState.sequence.forEach((cellIndex, i) => {
        setTimeout(() => {
            const cell = cells[cellIndex];
            highlightCell(cell, i + 1);
            
            // 마지막 항목 표시 후 시퀀스 표시 종료
            if (i === gameState.sequence.length - 1) {
                setTimeout(() => {
                    // 숫자 숨기기
                    cells.forEach(cell => {
                        cell.textContent = '';
                    });
                    
                    gameState.showingSequence = false;
                    
                    // 사용자 차례 토스트 메시지 표시
                    showToast('너 차례야!', 1500);
                    const toast = document.querySelector('.toast');
                    if (toast) {
                        toast.style.backgroundColor = 'orange';
                        toast.style.color = 'white';
                    }
                }, gameState.settings.showTime);
            }
        }, i * (gameState.settings.showTime + 500));
    });
}

/**
 * 몽키 챌린지 게임의 셀을 강조 표시합니다.
 * @param {Element} cell 강조 표시할 셀 요소
 * @param {number} number 표시할 숫자 (선택 사항)
 */
function highlightCell(cell, number = null) {
    // 강조 효과 클래스 추가
    cell.classList.add('highlight');
    
    // 숫자 표시 (있는 경우)
    if (number !== null) {
        cell.textContent = number;
    }
    
    // 일정 시간 후 강조 효과 제거
    setTimeout(() => {
        cell.classList.remove('highlight');
    }, 500);
}

/**
 * 몽키 챌린지 게임의 사용자 시퀀스를 확인합니다.
 * @param {Object} gameState 게임 상태 객체
 */
function checkMonkeySequence(gameState) {
    const { sequence, userSequence } = gameState;
    const currentIndex = userSequence.length - 1;
    
    // 현재 입력이 올바른지 확인
    if (sequence[currentIndex] !== userSequence[currentIndex]) {
        // 오답인 경우
        gameState.lives--;
        updateMonkeyLives(gameState);
        
        // 목숨이 남아있으면 같은 레벨 재시도
        if (gameState.lives > 0) {
            // 시퀀스 다시 표시 - 보드 크기는 변경하지 않고 시퀀스만 다시 표시
            setTimeout(() => {
                gameState.userSequence = [];
                showMonkeySequence(gameState);
            }, 1000);
        } else {
            // 게임 오버
            endMonkeyGame(gameState);
        }
        
        return;
    }
    
    // 시퀀스를 모두 맞췄는지 확인
    if (userSequence.length === sequence.length) {
        // 정답 토스트 메시지 표시
        showToast('정답!', 1000);
        const toast = document.querySelector('.toast');
        if (toast) {
            toast.style.backgroundColor = 'blue';
            toast.style.color = 'white';
        }
        
        // 다음 레벨로 진행
        gameState.level++;
        updateMonkeyLevel(gameState);
        
        // 다음 레벨 시작 - 보드 크기는 유지한 채로 시퀀스만 업데이트
        setTimeout(() => {
            generateMonkeySequence(gameState);
            showMonkeySequence(gameState);
        }, 1000);
    }
}

/**
 * 몽키 챌린지 게임의 목숨을 업데이트합니다.
 * @param {Object} gameState 게임 상태 객체
 */
function updateMonkeyLives(gameState) {
    const heartsContainer = document.querySelector('.lives-hearts');
    heartsContainer.innerHTML = '';
    
    for (let i = 0; i < gameState.lives; i++) {
        const heart = document.createElement('div');
        heart.className = 'heart';
        heartsContainer.appendChild(heart);
    }
}

/**
 * 몽키 챌린지 게임의 레벨을 업데이트합니다.
 * @param {Object} gameState 게임 상태 객체
 */
function updateMonkeyLevel(gameState) {
    document.querySelector('.level-value').textContent = gameState.level;
    document.getElementById('level').textContent = gameState.level;
}

/**
 * 몽키 챌린지 게임의 타이머를 시작합니다.
 * @param {Object} gameState 게임 상태 객체
 */
function startMonkeyTimer(gameState) {
    const timerElement = document.getElementById('time');
    
    const updateTimer = () => {
        if (gameState.gameOver) return;
        
        const currentTime = Date.now();
        const elapsedSeconds = Math.floor((currentTime - gameState.startTime) / 1000);
        timerElement.textContent = elapsedSeconds;
        
        requestAnimationFrame(updateTimer);
    };
    
    updateTimer();
}

/**
 * 몽키 챌린지 게임을 종료합니다.
 * @param {Object} gameState 게임 상태 객체
 */
function endMonkeyGame(gameState) {
    gameState.gameOver = true;
    const endTime = Date.now();
    const totalTime = Math.floor((endTime - gameState.startTime) / 1000);
    
    // 결과 모달 업데이트
    document.getElementById('result-time').textContent = totalTime;
    document.getElementById('result-level').textContent = gameState.level - 1;
    
    // 도전 과제 확인 및 업데이트
    const achievements = checkMonkeyAchievements(gameState, totalTime);
    
    // 도전 과제 목록 표시
    const achievementsList = document.getElementById('achievements-list');
    achievementsList.innerHTML = '';
    
    achievements.forEach(achievement => {
        const li = document.createElement('li');
        li.textContent = achievement;
        achievementsList.appendChild(li);
    });
    
    // 게임 데이터 저장
    saveMonkeyGameData(gameState.level - 1, totalTime, achievements);
    
    // 모달 표시
    const modal = document.getElementById('result-modal');
    modal.style.display = 'flex';
    
    // 모달 버튼 이벤트 설정
    document.getElementById('play-again-btn').addEventListener('click', () => {
        modal.style.display = 'none';
        resetMonkeyGame(gameState);
    });
    
    document.getElementById('modal-home-btn').addEventListener('click', () => {
        window.location.href = '/memory/';
    });
}

/**
 * 몽키 챌린지 게임의 도전 과제를 확인합니다.
 * @param {Object} gameState 게임 상태 객체
 * @param {number} totalTime 총 게임 시간 (초)
 * @returns {Array} 달성한 도전 과제 목록
 */
function checkMonkeyAchievements(gameState, totalTime) {
    const achievements = [];
    const difficulty = getDifficulty();
    const maxLevel = gameState.level - 1;
    
    // 레벨 도전 과제
    const levelThresholds = {
        easy: [4, 5, 6, 8],
        mid: [5, 7, 9, 11],
        hard: [8, 10, 12, 15]
    };
    
    levelThresholds[difficulty].forEach((threshold, index) => {
        if (maxLevel >= threshold) {
            if (index < 4) {
                achievements.push(`레벨 ${threshold}`);
            }
        }
    });
    
    // 시간 도전 과제
    const timeThresholds = {
        easy: { level5: 30, level9: 80 },
        mid: { level7: 40, level12: 100 },
        hard: { level10: 60, level16: 120 }
    };
    
    const timeAchievements = {
        easy: [
            { level: 5, time: 30 },
            { level: 9, time: 80 }
        ],
        mid: [
            { level: 7, time: 40 },
            { level: 12, time: 100 }
        ],
        hard: [
            { level: 10, time: 60 },
            { level: 16, time: 120 }
        ]
    };
    
    timeAchievements[difficulty].forEach(achievement => {
        if (maxLevel >= achievement.level && totalTime < achievement.time) {
            achievements.push(`레벨 ${achievement.level}을 ${achievement.time}초 이내에`);
        }
    });
    
    return achievements;
}

/**
 * 몽키 챌린지 게임 데이터를 저장합니다.
 * @param {number} level 달성한 최고 레벨
 * @param {number} time 게임 시간 (초)
 * @param {Array} achievements 달성한 도전 과제 목록
 */
function saveMonkeyGameData(level, time, achievements) {
    const difficulty = getDifficulty();
    const currentData = gameData.monkey[difficulty];
    
    // 최고 레벨 업데이트
    if (level > currentData.bestLevel) {
        currentData.bestLevel = level;
    }
    
    // 최고 시간 업데이트 (같은 레벨에서 더 빠른 시간)
    if (!currentData.bestTime || time < currentData.bestTime) {
        currentData.bestTime = time;
    }
    
    // 도전 과제 업데이트 (중복 제거)
    const uniqueAchievements = new Set([...currentData.achievements, ...achievements]);
    currentData.achievements = Array.from(uniqueAchievements);
    
    // 데이터 저장
    saveGameData();
}

/**
 * 몽키 챌린지 게임을 재설정합니다.
 * @param {Object} gameState 게임 상태 객체
 */
function resetMonkeyGame(gameState) {
    // 게임 상태 초기화
    gameState.level = 1;
    gameState.sequence = [];
    gameState.userSequence = [];
    gameState.lives = 3;
    gameState.showingSequence = false;
    gameState.startTime = null;
    gameState.gameOver = false;
    
    // UI 업데이트
    updateMonkeyLives(gameState);
    updateMonkeyLevel(gameState);
    
    // 통계 초기화
    document.getElementById('time').textContent = '0';
    
    // 게임 시작
    startMonkeyGame(gameState);
}

/**
 * FAQ 페이지 초기화 함수
 */
function initFaqPage() {
    // FAQ 페이지는 특별한 초기화가 필요 없음
}

/**
 * 배열을 무작위로 섞습니다.
 * @param {Array} array 섞을 배열
 */
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}
