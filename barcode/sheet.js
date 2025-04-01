
let email = localStorage.getItem("userEmail") || "";

function decodeJWT(token) {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
  return JSON.parse(atob(padded));
}

function handleCredentialResponse(response) {
  const payload = decodeJWT(response.credential);
  email = payload.email;
  localStorage.setItem("userEmail", email);
  sessionStorage.setItem("userEmail", email);
  document.getElementById("loginSection").style.display = "none";
  document.getElementById("sheetSetup").style.display = "block";
  document.getElementById("userInfo").innerText = `${email}님 환영합니다!`;

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

document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.getElementById("loginButton");
  if (loginBtn) {
    loginBtn.addEventListener("click", () => {
      const token = getAccessToken();
      if (token) {
        console.log("✅ 이미 로그인됨, 시트 불러오기 실행");
        document.getElementById("loginSection").style.display = "none";
        document.getElementById("sheetSetup").style.display = "block";
        listCompatibleSheets();
      } else {
        requestFullPermissions();
      }
    });
  }

  const createBtn = document.getElementById("createBtn");
  if (createBtn) {
    createBtn.addEventListener("click", createSheet);
  }
});



document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("accessToken");
  if (!token) {
    console.log("🔄 accessToken 없음 → 로그인 prompt 실행");
    google.accounts.id.prompt();
  } else {
    console.log("✅ accessToken 있음 → 시트 목록 불러오기");
    listCompatibleSheets();
    document.getElementById("loginSection").style.display = "none";
    document.getElementById("sheetSetup").style.display = "block";
    const email = localStorage.getItem("userEmail");
    if (email) {
      document.getElementById("userInfo").innerText = `${email}님 환영합니다!`;
    }
  }
});
