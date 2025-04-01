const sheetId = new URLSearchParams(location.search).get("sheetId");
const email = localStorage.getItem("userEmail");
let rows = [];

window.onload = async () => {
  if (!sheetId || !email) {
    alert("접근 오류: 로그인 또는 시트 ID 누락");
    location.href = "index.html";
    return;
  }

  const accessToken = await getAccessToken();
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/입출고기록!A2:F1000`,
    {
      headers: { Authorization: "Bearer " + accessToken },
    }
  );

  const data = await res.json();
  rows = data.values || [];
  if (rows.length === 0) {
    document.getElementById("summary").innerText = "기록이 없습니다.";
    return;
  }

  let summary = { 입고: 0, 출고: 0, 하자: 0, 반품: 0 };
  let byMonth = {};
  let byUser = {};
  let recentList = [];

  for (let row of rows) {
    const [timestamp, code, name, qty, user, action] = row;
    const date = new Date(timestamp);
    const key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}`;

    summary[action] = (summary[action] || 0) + parseInt(qty);
    byMonth[key] = byMonth[key] || { 입고: 0, 출고: 0, 하자: 0, 반품: 0 };
    byMonth[key][action] += parseInt(qty);

    byUser[user] = (byUser[user] || 0) + 1;
    recentList.push(`${timestamp} | ${code} | ${name} | ${qty} | ${user} | ${action}`);
  }

  document.getElementById("summary").innerText =
    `📦 총 입고: ${summary["입고"] || 0} | 출고: ${summary["출고"] || 0} | 하자: ${summary["하자"] || 0} | 반품: ${summary["반품"] || 0}`;

  const months = Object.keys(byMonth).sort();
  const types = ["입고", "출고", "하자", "반품"];
  const datasets = types.map((type) => ({
    label: type,
    data: months.map(m => byMonth[m][type] || 0),
  }));

  new Chart(document.getElementById("monthlyChart"), {
    type: "bar",
    data: {
      labels: months,
      datasets: datasets
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'top' } }
    }
  });

  const users = Object.keys(byUser);
  new Chart(document.getElementById("userChart"), {
    type: "pie",
    data: {
      labels: users,
      datasets: [{
        label: "담당자별 작업 수",
        data: users.map(u => byUser[u])
      }]
    }
  });

  document.getElementById("recent").innerHTML = "<h3>📄 최근 기록 (최대 10개)</h3><pre>" +
    recentList.slice(-10).reverse().join("\n") + "</pre>";

  // 📤 CSV 버튼 추가
  const btn = document.createElement("button");
  btn.innerText = "📤 CSV 다운로드";
  btn.onclick = () => downloadCSV(rows);
  document.body.insertBefore(btn, document.getElementById("monthlyChart"));
};

function downloadCSV(data) {
  let csv = "타임스탬프,상품코드,상품명,수량,담당자,유형\n";
  for (let row of data) {
    csv += row.map(x => `"${x}"`).join(",") + "\n";
  }

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "입출고기록.csv";
  a.click();
  URL.revokeObjectURL(url);
}

async function getAccessToken() {
  return new Promise((resolve) => {
    const cached = localStorage.getItem("accessToken");
    if (cached) {
      // 캐시된 토큰이 있으면 검증 후 사용
      fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?fields=properties.title`, {
        headers: { Authorization: "Bearer " + cached }
      })
      .then(res => {
        if (res.ok) return resolve(cached);
        localStorage.removeItem("accessToken");
        requestNewToken();
      })
      .catch(() => {
        localStorage.removeItem("accessToken");
        requestNewToken();
      });
    } else {
      requestNewToken();
    }
    
    function requestNewToken() {
      google.accounts.oauth2.initTokenClient({
        client_id: "192783618509-d0ev6sp714cr4d43cfumfaum005g485t.apps.googleusercontent.com",
        scope: "https://www.googleapis.com/auth/spreadsheets", // 전체 권한으로 변경
        callback: (res) => {
          if (res && res.access_token) {
            localStorage.setItem("accessToken", res.access_token);
            resolve(res.access_token);
          } else {
            resolve(null);
          }
        }
      }).requestAccessToken({prompt: ''}); // 이전에 동의했다면 무음 모드로 요청
    }
  });
}