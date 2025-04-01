document.addEventListener('DOMContentLoaded', function() {
  // URL에서 sheetId 파라미터 가져오기
  const urlParams = new URLSearchParams(window.location.search);
  const sheetId = urlParams.get('sheetId');
  
  if (!sheetId) {
    showError("시트 ID가 없습니다. 메인 페이지로 돌아갑니다.");
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 3000);
    return;
  }
  
  // QR 스캐너 초기화
  initQrScanner();
});

// 오류 메시지 표시 함수
function showError(message) {
  console.log("오류 메시지:", message);
  // qr-fixed.js에서 실제 구현을 사용합니다
}

// QR 스캐너 초기화 함수
function initQrScanner() {
  console.log("QR 스캐너는 qr-fixed.js에서 처리됩니다");
  // qr-fixed.js에서 실제 구현을 사용합니다
}

// QR 코드 스캔 결과 처리 함수
function handleScanResult(content) {
  console.log("QR 코드 스캔 결과:", content);
  // qr-fixed.js에서 실제 구현을 사용합니다
}
