let email = localStorage.getItem("userEmail") || "";

function decodeJWT(token) {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
  return JSON.parse(atob(padded));
}

// 토큰 유효성 검사 함수 추가
async function validateToken(token) {
  if (!token) return false;
  
  try {
    const response = await fetch("https://www.googleapis.com/drive/v3/about?fields=user", {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.ok;
  } catch (error) {
    console.error("토큰 검증 오류:", error);
    return false;
  }
}

function handleCredentialResponse(response) {
  const payload = decodeJWT(response.credential);
  email = payload.email;
  localStorage.setItem("userEmail", email);
  sessionStorage.setItem("userEmail", email);
  document.getElementById("loginSection").style.display = "none";
  document.getElementById("sheetSetup").style.display = "block";
  document.getElementById("userInfo").innerText = `${email}님 환영합니다!`;

  // UI 업데이트
  updateLoginUI({ email: email });

  // 자동으로 권한 요청
  requestFullPermissions();
}

function getAccessToken() {
  return sessionStorage.getItem("accessToken") || localStorage.getItem("accessToken");
}

function requestFullPermissions() {
  const tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: "192783618509-d0ev6sp714cr4d43cfumfaum005g485t.apps.googleusercontent.com",
    scope: "https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file",
    prompt: "",
    callback: (tokenResponse) => {
      if (tokenResponse.access_token) {
        localStorage.setItem("accessToken", tokenResponse.access_token);
        sessionStorage.setItem("accessToken", tokenResponse.access_token);
        console.log("✅ 토큰 발급 성공");
        listCompatibleSheets();
      } else {
        console.error("❌ 토큰 발급 실패", tokenResponse);
      }
    }
  });

  tokenClient.requestAccessToken();
}

async function listCompatibleSheets() {
  const token = getAccessToken();
  if (!token) return;

  const select = document.getElementById("sheetSelect");
  const loading = document.getElementById("sheetLoading");
  select.innerHTML = "";
  loading.innerHTML = "⏳ 시트 목록 불러오는 중...";

  const res = await fetch("https://www.googleapis.com/drive/v3/files?q=mimeType='application/vnd.google-apps.spreadsheet' and trashed=false", {
    headers: { Authorization: "Bearer " + token }
  });
  const data = await res.json();

  for (const file of data.files || []) {
    const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${file.id}?fields=sheets.properties.title`, {
      headers: { Authorization: "Bearer " + token }
    });
    const meta = await metaRes.json();
    const hasTemplate = meta.sheets?.some(s => s.properties.title === "상품재고");
    if (hasTemplate) {
      const option = document.createElement("option");
      option.value = file.id;
      option.text = file.name;
      select.appendChild(option);
    }
  }

  loading.innerText = "✅ 시트 목록 불러오기 완료!";
}

function goToSelectedSheet() {
  const sheetId = document.getElementById("sheetSelect").value;
  if (!sheetId) return alert("시트를 선택해주세요!");
  sessionStorage.setItem("sheetId", sheetId);
  location.href = `qr.html?sheetId=${sheetId}`;
}

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("createBtn");
  if (btn) {
    btn.addEventListener("click", () => alert("시트 생성중입니다!"));
  }
});

async function createSheet() {
  const sheetName = document.getElementById("sheetName").value.trim();
  if (!sheetName) return alert("시트 이름을 입력하세요");

  const accessToken = getAccessToken();
  if (!accessToken) return alert("로그인이 필요합니다");

  const res = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + accessToken,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      properties: { title: sheetName },
      sheets: [
        { properties: { title: "상품재고" } },
        { properties: { title: "입출고기록" } }
      ]
    }),
  });

  const result = await res.json();
  const sheetId = result.spreadsheetId;

  // 헤더 삽입
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values:batchUpdate`, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + accessToken,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      data: [
        {
          range: "상품재고!A1:D1",
          values: [["상품코드", "상품명", "재고수량", "하자수량"]],
        },
        {
          range: "입출고기록!A1:F1",
          values: [["타임스탬프", "상품코드", "상품명", "수량", "담당자", "유형"]],
        }
      ],
      valueInputOption: "USER_ENTERED"
    }),
  });

  alert("✅ 시트가 생성되었습니다!");
  sessionStorage.setItem("sheetId", sheetId);
  window.location.href = `qr.html?sheetId=${sheetId}`;
}

// 기존 DOMContentLoaded 이벤트 리스너를 모두 통합하고 자동 로그인 처리
document.addEventListener("DOMContentLoaded", async () => {
  console.log("🔄 페이지 로드됨");
  
  // UI 요소들 초기화
  const loginBtn = document.getElementById("loginButton");
  const createBtn = document.getElementById("createBtn");
  const logoutButton = document.getElementById("logoutButton");
  
  // 버튼 이벤트 리스너 등록
  if (loginBtn) {
    loginBtn.addEventListener("click", requestFullPermissions);
  }
  
  if (createBtn) {
    createBtn.addEventListener("click", createSheet);
  }
  
  if (logoutButton) {
    logoutButton.addEventListener("click", handleLogout);
  }
  
  // 저장된 사용자 이메일로 UI 초기 업데이트
  const storedEmail = localStorage.getItem('userEmail');
  if (storedEmail) {
    updateLoginUI({ email: storedEmail });
  }
  
  // 토큰 유효성 검사 및 자동 로그인
  const accessToken = getAccessToken();
  const isTokenValid = await validateToken(accessToken);
  
  if (isTokenValid) {
    // 유효한 토큰이 있으면 바로 시트 목록 불러오기
    console.log("✅ 유효한 토큰 확인됨 → 시트 목록 불러오기");
    document.getElementById("loginSection").style.display = "none";
    document.getElementById("sheetSetup").style.display = "block";
    const email = localStorage.getItem("userEmail");
    if (email) {
      document.getElementById("userInfo").innerText = `${email}님 환영합니다!`;
    }
    listCompatibleSheets();
  } else {
    // 토큰이 유효하지 않으면
    console.log("⚠️ 유효한 토큰 없음");
    // 저장된 토큰 제거
    localStorage.removeItem("accessToken");
    sessionStorage.removeItem("accessToken");
    
    if (storedEmail) {
      // 사용자 이메일은 있으므로 자동으로 재인증 시도
      console.log("🔄 이메일 정보 있음 → 자동 재인증 시도");
      requestFullPermissions();
    } else {
      // 이메일도 없으면 로그인 화면 표시
      console.log("🔄 로그인 필요 → 로그인 프롬프트 표시");
      google.accounts.id.prompt();
    }
  }
});

// DOM 요소
const userInfoDisplay = document.getElementById('userInfoDisplay');
const userEmail = document.getElementById('userEmail');
const loginButton = document.getElementById('loginButton');
const logoutButton = document.getElementById('logoutButton');

// 로그인 상태 확인 및 UI 업데이트 함수
function updateLoginUI(user) {
  if (user && user.email) {
    // 로그인 상태
    loginButton.style.display = 'none';
    userInfoDisplay.style.display = 'block';
    userEmail.textContent = user.email;
    
    // sheetSetup div도 표시
    document.getElementById('sheetSetup').style.display = 'block';
  } else {
    // 로그아웃 상태
    loginButton.style.display = 'block';
    userInfoDisplay.style.display = 'none';
    document.getElementById('sheetSetup').style.display = 'none';
  }
}

// 로그아웃 함수
function handleLogout() {
  console.log("로그아웃 시작");
  
  // Google Identity API를 사용하여 로그아웃
  google.accounts.id.disableAutoSelect();
  
  // 로컬 스토리지 및 세션 스토리지에서 모든 인증 정보 제거
  localStorage.removeItem('accessToken');
  sessionStorage.removeItem('accessToken');
  localStorage.removeItem('userEmail');
  sessionStorage.removeItem('userEmail');
  
  // UI 업데이트
  updateLoginUI(null);
  
  console.log("✅ 로그아웃 완료");
  // 페이지 새로고침
  location.reload();
}

// 로그인 성공 후 호출되는 함수에 UI 업데이트 추가
// 아래는 기존 로그인 성공 핸들러가 있는 위치에 추가해야 합니다
// 예시: handleAuthSuccess 함수 내부 또는 로그인 완료 후에 호출되는 위치
function handleAuthSuccess(response) {
  // 기존 코드...
  
  // 사용자 정보 가져오기
  const user = {
    email: response.email || localStorage.getItem('userEmail')
  };
  
  // 로컬 스토리지에 사용자 이메일 저장
  localStorage.setItem('userEmail', user.email);
  
  // UI 업데이트
  updateLoginUI(user);
}

// 페이지 로드 시 로그인 상태 확인
document.addEventListener('DOMContentLoaded', () => {
  // 로컬 스토리지에서 이메일 정보 확인
  const storedEmail = localStorage.getItem('userEmail');
  if (storedEmail) {
    updateLoginUI({ email: storedEmail });
  }
  
  // 로그아웃 버튼 이벤트 리스너
  logoutButton.addEventListener('click', handleLogout);
});
