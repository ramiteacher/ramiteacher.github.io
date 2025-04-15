// 전역 변수
let maze = [];
let player = { x: 0, y: 0 };
let startTime;
let moveCount = 0;
let gameActive = false;
let gameMode = 'normal';
let mazeSize = { width: 10, height: 10 }; // 기본 미디엄 사이즈로 변경
let dailyStreak = 0;
let isMobile = false;

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', () => {
    // 모바일 기기 감지
    checkMobile();
    
    // 현재 페이지 확인 - 폴더 구조 변경 반영
    const pathname = window.location.pathname;
    const pathParts = pathname.split('/');
    const currentPage = pathParts[pathParts.length - 1];
    const currentFolder = pathParts[pathParts.length - 2];
    
    // 페이지에 따라 초기화
    if (currentPage === 'index.html' || currentPage === '') {
        // 현재 폴더가 하위 폴더인지 확인
        if (currentFolder === 'medium') {
            mazeSize = { width: 10, height: 10 };
            initMazePage();
        } else if (currentFolder === 'mighty') {
            mazeSize = { width: 15, height: 15 };
            initMazePage();
        } else if (currentFolder === 'mega') {
            mazeSize = { width: 20, height: 20 };
            initMazePage();
        } else {
            // 메인 페이지
            initHomePage();
        }
    }
    
    // 로컬 스토리지에서 스트릭(연속 성공) 데이터 로드
    loadStreakData();
    
    // 윈도우 리사이즈 이벤트 리스너 추가
    window.addEventListener('resize', checkMobile);
});

// 모바일 기기 체크
function checkMobile() {
    isMobile = window.innerWidth <= 768;
    
    // 이미 게임이 초기화된 경우 컨트롤러 표시 업데이트
    if (document.querySelector('.controls')) {
        updateMobileControls();
    }
}

// 모바일 컨트롤러 업데이트
function updateMobileControls() {
    const controls = document.querySelector('.controls');
    if (isMobile) {
        controls.style.display = 'flex';
    } else {
        controls.style.display = 'none';
    }
}

// 홈페이지 초기화
function initHomePage() {
    console.log('홈 페이지 초기화');
}

// 미로 페이지 초기화
function initMazePage() {
    gameMode = 'normal';
    setupGameUI();
    generateMaze();
    setupEventListeners();
}

// 게임 UI 설정
function setupGameUI() {
    // 이전 요소 제거
    if (document.querySelector('.game-container')) {
        document.body.removeChild(document.querySelector('.game-container'));
    }
    
    // 페이지 타이틀 설정
    let pageTitle;
    if (mazeSize.width === 10) pageTitle = '스몰 미로';
    else if (mazeSize.width === 15) pageTitle = '빅 미로';
    else if (mazeSize.width === 20) pageTitle = '메가 미로';
    
    // 게임 컨테이너 생성
    const gameContainer = document.createElement('div');
    gameContainer.className = 'game-container';
    gameContainer.innerHTML = `
        <div class="game-header">
            <h2 class="game-title">${pageTitle}</h2>
            <div class="game-info">
                <div class="info-item">
                    <span class="info-label">시간</span>
                    <span class="info-value" id="timer">00:00</span>
                </div>
                <div class="info-item">
                    <span class="info-label">이동</span>
                    <span class="info-value" id="moves">0</span>
                </div>
                <div class="info-item">
                    <span class="info-label">연승</span>
                    <span class="info-value" id="streak">0</span>
                </div>
                
            </div>
        </div>
        
        <div class="maze-container"></div>
        
        <div class="controls">
            <div class="control-row">
                <button class="control-btn" data-direction="up">↑</button>
            </div>
            <div class="control-row">
                <button class="control-btn" data-direction="left">←</button>
                <button class="control-btn" data-direction="down">↓</button>
                <button class="control-btn" data-direction="right">→</button>
            </div>
            <div class="control-row" style="margin-top: 20px;">
                <button class="btn btn-secondary" id="reset-maze">다시 시작</button>
                <a href="../" class="btn btn-secondary">홈으로</a>
            </div>
        </div>
    `;
    
    document.body.appendChild(gameContainer);
    
    // 미로 다시 시작 버튼
    document.getElementById('reset-maze').addEventListener('click', resetGame);
    
    // 스트릭 표시
    document.getElementById('streak').textContent = dailyStreak;
    
    // 모바일 컨트롤러 업데이트
    updateMobileControls();
}

// 이벤트 리스너 설정
function setupEventListeners() {
    // 키보드 이벤트 리스너
    document.addEventListener('keydown', handleKeyPress);
    
    // 버튼 클릭 이벤트 리스너
    document.querySelectorAll('.control-btn').forEach(button => {
        button.addEventListener('click', function() {
            const direction = this.getAttribute('data-direction');
            movePlayer(direction);
        });
    });
    
    // 터치 이벤트 리스너 추가
    if (isMobile) {
        setupTouchEvents();
    }
}

// 터치 이벤트 설정
function setupTouchEvents() {
    const mazeContainer = document.querySelector('.maze-container');
    let touchStartX = 0;
    let touchStartY = 0;
    
    mazeContainer.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }, false);
    
    mazeContainer.addEventListener('touchmove', (e) => {
        e.preventDefault(); // 스크롤 방지
    }, false);
    
    mazeContainer.addEventListener('touchend', (e) => {
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        
        const diffX = touchEndX - touchStartX;
        const diffY = touchEndY - touchStartY;
        
        // 수직 또는 수평 방향 이동 감지
        if (Math.abs(diffX) > Math.abs(diffY)) {
            // 수평 방향
            if (diffX > 20) {
                movePlayer('right');
            } else if (diffX < -20) {
                movePlayer('left');
            }
        } else {
            // 수직 방향
            if (diffY > 20) {
                movePlayer('down');
            } else if (diffY < -20) {
                movePlayer('up');
            }
        }
    }, false);
}

// 키보드 입력 처리
function handleKeyPress(e) {
    if (!gameActive) return;
    
    switch(e.key) {
        case 'ArrowUp':
            movePlayer('up');
            break;
        case 'ArrowDown':
            movePlayer('down');
            break;
        case 'ArrowLeft':
            movePlayer('left');
            break;
        case 'ArrowRight':
            movePlayer('right');
            break;
    }
}

// 미로 생성
function generateMaze() {
    const width = mazeSize.width;
    const height = mazeSize.height;
    
    let isValidMaze = false;
    
    // 유효한 미로가 생성될 때까지 반복
    while (!isValidMaze) {
        // 미로 데이터 초기화 (모든 셀을 벽으로 설정)
        maze = Array(height).fill().map(() => Array(width).fill(1));
        
        // DFS 알고리즘을 사용해 미로 생성
        const stack = [];
        const start = { x: 1, y: 1 };
        maze[start.y][start.x] = 0; // 시작 위치는 경로
        stack.push(start);
        
        while (stack.length > 0) {
            const current = stack[stack.length - 1];
            
            // 현재 셀에서 이동할 수 있는 이웃 셀 찾기
            const neighbors = [];
            
            // 이웃 셀 확인 (상하좌우)
            const directions = [
                { dx: 0, dy: -2 }, // 상
                { dx: 0, dy: 2 },  // 하
                { dx: -2, dy: 0 }, // 좌
                { dx: 2, dy: 0 }   // 우
            ];
            
            for (const dir of directions) {
                const nx = current.x + dir.dx;
                const ny = current.y + dir.dy;
                
                if (nx > 0 && nx < width - 1 && ny > 0 && ny < height - 1 && maze[ny][nx] === 1) {
                    neighbors.push({ x: nx, y: ny, dx: dir.dx / 2, dy: dir.dy / 2 });
                }
            }
            
            if (neighbors.length > 0) {
                // 랜덤하게 이웃 선택
                const nextIdx = Math.floor(Math.random() * neighbors.length);
                const next = neighbors[nextIdx];
                
                // 벽 제거
                maze[current.y + next.dy][current.x + next.dx] = 0;
                maze[next.y][next.x] = 0;
                
                stack.push(next);
            } else {
                // 더 이상 이동할 곳이 없으면 스택에서 제거
                stack.pop();
            }
        }
        
        // 시작 지점 설정
        const startPos = { x: 1, y: 1 };
        maze[startPos.y][startPos.x] = 2; // 2는 시작 지점
        player = { x: startPos.x, y: startPos.y };
        
        // 도달 가능한 끝 지점 찾기
        const endPos = findValidEndPoint(startPos);
        
        if (endPos) {
            maze[endPos.y][endPos.x] = 3; // 3은 끝 지점
            isValidMaze = true;
        } else {
            // 유효한 끝 지점을 찾지 못한 경우 미로를 다시 생성
            console.log("유효한 끝 지점을 찾지 못했습니다. 미로를 다시 생성합니다.");
        }
    }
    
    // 미로 그리기
    renderMaze();
    
    // 게임 상태 초기화
    moveCount = 0;
    document.getElementById('moves').textContent = moveCount;
    startTime = Date.now();
    gameActive = true;
    
    // 타이머 시작
    updateGameTimer();
}

// 유효한 끝 지점 찾기
function findValidEndPoint(startPos) {
    const width = mazeSize.width;
    const height = mazeSize.height;
    
    // 시작점에서 도달 가능한 모든 경로 찾기
    const visited = Array(height).fill().map(() => Array(width).fill(false));
    const distances = Array(height).fill().map(() => Array(width).fill(-1));
    
    // BFS를 사용하여 시작점에서 모든 셀까지의 거리 계산
    const queue = [{ x: startPos.x, y: startPos.y }];
    visited[startPos.y][startPos.x] = true;
    distances[startPos.y][startPos.x] = 0;
    
    while (queue.length > 0) {
        const current = queue.shift();
        
        // 인접한 경로 확인
        const directions = [
            { dx: 0, dy: -1 }, // 상
            { dx: 0, dy: 1 },  // 하
            { dx: -1, dy: 0 }, // 좌
            { dx: 1, dy: 0 }   // 우
        ];
        
        for (const dir of directions) {
            const nx = current.x + dir.dx;
            const ny = current.y + dir.dy;
            
            if (nx >= 0 && nx < width && ny >= 0 && ny < height && 
                maze[ny][nx] !== 1 && !visited[ny][nx]) {
                visited[ny][nx] = true;
                distances[ny][nx] = distances[current.y][current.x] + 1;
                queue.push({ x: nx, y: ny });
            }
        }
    }
    
    // 가장 먼 거리에 있는 도달 가능한 셀 찾기
    let maxDist = -1;
    let farthestCells = [];
    
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            // 도달 가능하고 시작점으로부터 일정 거리 이상 떨어진 셀만 고려
            if (distances[y][x] > maxDist && maze[y][x] === 0) {
                maxDist = distances[y][x];
                farthestCells = [{ x, y }];
            } else if (distances[y][x] === maxDist && maze[y][x] === 0) {
                farthestCells.push({ x, y });
            }
        }
    }
    
    // 가장 먼 셀들 중에서 가장자리에 가까운 셀 우선적으로 선택
    let edgeCells = farthestCells.filter(cell => 
        cell.x === 1 || cell.y === 1 || 
        cell.x === width - 2 || cell.y === height - 2
    );
    
    if (edgeCells.length > 0) {
        // 가장자리에 있는 셀 중에서 랜덤 선택
        return edgeCells[Math.floor(Math.random() * edgeCells.length)];
    } else if (farthestCells.length > 0) {
        // 가장자리가 없으면 그냥 가장 먼 셀 중에서 랜덤 선택
        return farthestCells[Math.floor(Math.random() * farthestCells.length)];
    }
    
    // 만약 유효한 셀을 찾지 못했다면 (이런 경우는 거의 없음)
    console.log("유효한 끝 지점을 찾지 못했습니다.");
    return null;
}

// 미로 렌더링
function renderMaze() {
    const mazeContainer = document.querySelector('.maze-container');
    mazeContainer.innerHTML = '';
    
    const mazeElement = document.createElement('div');
    mazeElement.className = 'maze';
    mazeElement.style.gridTemplateColumns = `repeat(${mazeSize.width}, 1fr)`;
    
    for (let y = 0; y < mazeSize.height; y++) {
        for (let x = 0; x < mazeSize.width; x++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            
            if (maze[y][x] === 1) {
                cell.classList.add('wall');
            } else if (maze[y][x] === 2) {
                cell.classList.add('start');
                // 플레이어 요소 추가
                const playerElement = document.createElement('div');
                playerElement.className = 'player';
                cell.appendChild(playerElement);
            } else if (maze[y][x] === 3) {
                cell.classList.add('end');
            } else {
                cell.classList.add('path');
            }
            
            mazeElement.appendChild(cell);
        }
    }
    
    mazeContainer.appendChild(mazeElement);
}

// 플레이어 이동
function movePlayer(direction) {
    if (!gameActive) return;
    
    let dx = 0, dy = 0;
    
    switch(direction) {
        case 'up':
            dy = -1;
            break;
        case 'down':
            dy = 1;
            break;
        case 'left':
            dx = -1;
            break;
        case 'right':
            dx = 1;
            break;
    }
    
    const newX = player.x + dx;
    const newY = player.y + dy;
    
    // 이동 가능 여부 확인
    if (newX >= 0 && newX < mazeSize.width &&
        newY >= 0 && newY < mazeSize.height &&
        maze[newY][newX] !== 1) {
        
        // 이동 횟수 증가
        moveCount++;
        document.getElementById('moves').textContent = moveCount;
        
        // 플레이어 위치 업데이트
        maze[player.y][player.x] = 0; // 이전 위치는 경로로
        player = { x: newX, y: newY };
        
        // 도착 지점에 도달했는지 확인
        if (maze[newY][newX] === 3) {
            completeGame();
        } else {
            maze[newY][newX] = 2; // 새 위치에 플레이어
            renderMaze();
        }
    }
}

// 메시지 표시
function showMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.className = 'message';
    messageElement.textContent = message;
    
    document.body.appendChild(messageElement);
    
    setTimeout(() => {
        document.body.removeChild(messageElement);
    }, 2000);
}

// 게임 완료
function completeGame() {
    gameActive = false;
    const endTime = Date.now();
    const timeInSeconds = Math.floor((endTime - startTime) / 1000);
    
    // 스트릭 증가
    dailyStreak++;
    saveStreakData();
    
    // 결과 모달 표시
    showCompletionModal(timeInSeconds);
}

// 완료 모달 표시
function showCompletionModal(timeInSeconds) {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    
    modal.innerHTML = `
        <div class="modal-content">
            <h3 class="modal-title">미로 완료!</h3>
            <div class="modal-body">
                <p>축하합니다! 미로를 성공적으로 완료했습니다.</p>
                <div class="modal-stats">
                    <div class="stat-item">
                        <div class="stat-value">${timeString}</div>
                        <div class="stat-label">소요 시간</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${moveCount}</div>
                        <div class="stat-label">이동 횟수</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${dailyStreak}</div>
                        <div class="stat-label">연속 성공</div>
                    </div>
                </div>
            </div>
            <div class="modal-actions">
                <button class="btn btn-primary" id="new-maze">새 미로</button>
                <button class="btn btn-secondary" id="back-to-home">홈으로</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    document.getElementById('new-maze').addEventListener('click', () => {
        document.body.removeChild(modal);
        resetGame();
    });
    
    document.getElementById('back-to-home').addEventListener('click', () => {
        window.location.href = '../';
    });
}

// 게임 타이머 업데이트
function updateGameTimer() {
    if (!gameActive) return;
    
    const currentTime = Date.now();
    const elapsedSeconds = Math.floor((currentTime - startTime) / 1000);
    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = elapsedSeconds % 60;
    
    document.getElementById('timer').textContent = 
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    requestAnimationFrame(updateGameTimer);
}

// 게임 재설정
function resetGame() {
    generateMaze();
}

// 스트릭 데이터 불러오기
function loadStreakData() {
    const streakData = localStorage.getItem('mazeStreak');
    if (streakData) {
        const data = JSON.parse(streakData);
        const today = new Date().toDateString();
        
        if (data.date === today) {
            dailyStreak = data.streak;
        } else {
            dailyStreak = 0;
        }
    }
    
    // 화면에 표시
    if (document.getElementById('streak')) {
        document.getElementById('streak').textContent = dailyStreak;
    }
}

// 스트릭 데이터 저장
function saveStreakData() {
    const today = new Date().toDateString();
    localStorage.setItem('mazeStreak', JSON.stringify({
        date: today,
        streak: dailyStreak
    }));
}