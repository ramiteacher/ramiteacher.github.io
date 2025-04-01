let scannedCodes = new Set();
let selectedAction = null;
const sheetId = new URLSearchParams(location.search).get("sheetId");
const email = localStorage.getItem("userEmail");

// 페이지 로드 시 사전 로드할 오디오
let newItemSound = null;
// QR 스캐너 인스턴스 저장 변수
let qrScanner = null;
// 마지막 성공 스캔 시간 기록
let lastSuccessfulScan = 0;
// 스캔 성능 설정
const scanConfig = {
  fps: 15,
  qrbox: { width: 250, height: 250 },
  aspectRatio: 1.0,
  formatsToSupport: [
    Html5QrcodeSupportedFormats.QR_CODE,
    Html5QrcodeSupportedFormats.EAN_13,
    Html5QrcodeSupportedFormats.CODE_39,
    Html5QrcodeSupportedFormats.CODE_128
  ],
  rememberLastUsedCamera: true
};

function setAction(action) {
  selectedAction = action;
  document.querySelectorAll(".action").forEach(b => {
    b.style.backgroundColor = "";
    b.style.color = "#00f0ff";
  });
  document.querySelector(`.action.${action}`).style.backgroundColor = "#00f0ff";
  document.querySelector(`.action.${action}`).style.color = "#000";
}

// 캐시된 권한을 사용하여 앱 바로가기 생성 안내
function recommendAppShortcut() {
  const appInstalled = localStorage.getItem('appInstalled') === 'true';
  const lastPrompt = parseInt(localStorage.getItem('lastAppPrompt') || '0');
  const now = Date.now();
  
  // 일주일에 한 번만 설치 안내 표시
  if (!appInstalled && (now - lastPrompt > 7 * 24 * 60 * 60 * 1000 || isNaN(lastPrompt))) {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isAndroid = /Android/.test(navigator.userAgent);
    const isStandalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;
    
    if (!isStandalone) {
      const notice = document.createElement('div');
      notice.style.padding = '10px';
      notice.style.margin = '10px 0';
      notice.style.backgroundColor = '#ffffcc';
      notice.style.border = '1px solid #e6e600';
      notice.style.borderRadius = '5px';
      
      if (isIOS) {
        notice.innerHTML = `
          <p><strong>🚀 빠른 실행 및 권한 유지를 위해:</strong> <br>하단의 "공유" 버튼을 누르고 "홈 화면에 추가"를 선택하세요. 설치 후에는 카메라 권한을 한 번만 허용하면 됩니다.</p>
          <button id="closeNotice" style="padding: 5px 10px; margin-top: 5px; background: #00f0ff; border: none; border-radius: 3px; color: #000;">알겠습니다</button>
        `;
      } else if (isAndroid) {
        notice.innerHTML = `
          <p><strong>🚀 빠른 실행 및 권한 유지를 위해:</strong> <br>메뉴에서 "앱 설치" 또는 "홈 화면에 추가"를 선택하세요. 설치 후 더 빠르게 스캔할 수 있습니다.</p>
          <button id="closeNotice" style="padding: 5px 10px; margin-top: 5px; background: #00f0ff; border: none; border-radius: 3px; color: #000;">알겠습니다</button>
        `;
      } else {
        notice.innerHTML = `
          <p><strong>🚀 빠른 실행 및 권한 유지를 위해:</strong> <br>주소창 우측의 "설치" 버튼을 클릭하여 바로가기를 만드세요. 접근 권한이 자동으로 유지됩니다.</p>
          <button id="closeNotice" style="padding: 5px 10px; margin-top: 5px; background: #00f0ff; border: none; border-radius: 3px; color: #000;">알겠습니다</button>
        `;
      }
      
      document.body.insertBefore(notice, document.body.firstChild);
      
      document.getElementById('closeNotice').addEventListener('click', function() {
        notice.style.display = 'none';
        localStorage.setItem('lastAppPrompt', now.toString());
      });
    }
  }
  
  // PWA 설치 감지
  window.addEventListener('appinstalled', () => {
    localStorage.setItem('appInstalled', 'true');
    showMessage("앱이 설치되었습니다! 이제 더 빠르게 사용할 수 있습니다.");
  });
}

// 페이지 로드 시 QR 스캐너 상태 확인 및 초기화
window.onload = () => {
  // 스캔 전에 new.mp3 미리 로드
  newItemSound = new Audio("sounds/new.mp3");
  newItemSound.load();  // 미리 로드
  
  // 앱 바로가기 추천
  recommendAppShortcut();

  if (!sheetId) {
    alert("시트 ID가 없습니다.");
    document.getElementById("status").innerText = "❌ 시트 ID가 없습니다. URL에 ?sheetId=구글시트ID를 추가하세요.";
    return;
  }
  
  if (!email) {
    alert("로그인 정보가 없습니다.");
    document.getElementById("status").innerText = "❌ 로그인 정보가 없습니다. 먼저 로그인하세요.";
    // 로그인 안 된 경우 인덱스로 리디렉션
    setTimeout(() => location.href = "index.html", 1000);
    return;
  }

  // 초기 사용자 이름 설정
  document.getElementById("user").value = email;
  
  // 화면 회전 및 크기 변경 감지하여 QR 스캐너 최적화
  window.addEventListener('resize', debounce(() => {
    if (qrScanner) {
      adjustScannerSettings();
    }
  }, 300)); // 300ms로 단축하여 더 빠르게 반응
  
  // 초기 로드 시 화면 크기에 맞게 설정 최적화
  setTimeout(adjustScannerSettings, 500);
  
  // Html5Qrcode 라이브러리 로드 확인
  if (typeof Html5Qrcode !== 'function') {
    document.getElementById("status").innerText = "⏳ QR 스캐너 라이브러리 로드 중...";
    
    // 라이브러리 스크립트 동적 로드 시도
    const script = document.createElement('script');
    script.src = "https://unpkg.com/html5-qrcode";
    script.onload = () => {
      // 라이브러리 로드 성공 후 QR 인식 시작
      document.getElementById("status").innerText = "✅ 라이브러리 로드 완료";
      setTimeout(startQrScanner, 500);
    };
    script.onerror = () => {
      document.getElementById("status").innerText = "❌ QR 스캐너 라이브러리 로드 실패";
    };
    document.head.appendChild(script);
  } else {
    // QR 인식 시작
    startQrScanner();
  }
};

// 화면 크기에 따라 QR 스캐너 설정 최적화
function adjustScannerSettings() {
  const viewportWidth = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
  const viewportHeight = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
  
  // 화면 크기에 맞게 QR 박스 크기 조정
  let dimension;
  
  // 가로 모드인지 확인
  const isLandscape = viewportWidth > viewportHeight;
  
  if (isLandscape) {
    // 가로 모드에서는 화면 높이의 60%로 QR 박스 설정
    dimension = Math.min(viewportWidth * 0.4, viewportHeight * 0.6);
  } else {
    // 세로 모드에서는 화면 너비의 70%로 QR 박스 설정
    dimension = viewportWidth * 0.7;
  }
  
  // QR 스캐너 영역 크기 조정
  const readerElement = document.getElementById('reader');
  if (readerElement) {
    // 모바일 기기 감지
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile && !isLandscape) {
      // 모바일 세로 모드에서는 화면 높이의 35%에서 50%로 증가
      readerElement.style.maxHeight = '50vh';
    } else if (isMobile && isLandscape) {
      // 모바일 가로 모드에서는 화면 높이의 60%에서 75%로 증가
      readerElement.style.maxHeight = '75vh';
    } else {
      // 데스크톱에서는 높이 제한 완화
      readerElement.style.maxHeight = '55vh';
    }
    
    // 아이폰 전용 스타일 추가
    if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
      // 아이폰에서는 스캐너 크기를 더 키움
      readerElement.style.maxHeight = '65vh';
      readerElement.style.width = '95%';
      readerElement.style.margin = '0 auto';
    }
  }
  
  if (qrScanner && qrScanner.isScanning) {
    try {
      qrScanner.pause();
      
      // 화면 크기에 따라 스캔 설정 조정
      // 아이폰에서는 더 큰 스캔 영역 사용
      const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
      if (isIOS) {
        // iOS에서는 스캔 영역을 더 크게 설정
        dimension = Math.max(dimension, viewportWidth * 0.85);
      }
      
      scanConfig.qrbox = { width: dimension, height: dimension };
      
      // 가로 세로 비율 최적화
      if (isLandscape) {
        scanConfig.aspectRatio = 4/3; // 가로 모드
      } else {
        scanConfig.aspectRatio = 3/4; // 세로 모드
      }
      
      // iOS 최적화 설정
      if (isIOS) {
        // iOS에서는 속도보다 정확도 우선
        scanConfig.fps = 10;
        // iOS에서는 바코드 디텍터 사용 시도
        scanConfig.experimentalFeatures = {
          useBarCodeDetectorIfSupported: true
        };
      }
      
      setTimeout(() => {
        if (qrScanner && qrScanner.isScanning) {
          qrScanner.resume();
          
          // iOS에서 카메라 설정 추가 최적화
          if (isIOS) {
            try {
              const videoElement = qrScanner.getVideoElement();
              if (videoElement) {
                // iOS에서 비디오 품질 향상
                videoElement.style.width = '100%';
                videoElement.style.height = '100%';
                videoElement.style.objectFit = 'cover';
              }
            } catch (e) {
              console.warn("iOS 비디오 설정 최적화 실패", e);
            }
          }
        }
      }, 300);
    } catch (error) {
      console.warn("스캐너 설정 조정 중 오류:", error);
    }
  }
}

// 고급 QR 스캐너 초기화 및 시작
function startQrScanner() {
  try {
    // 이미 실행 중인 스캐너가 있다면 중지
    if (qrScanner) {
      try {
        if (qrScanner.isScanning) {
          qrScanner.stop();
        }
      } catch (e) {
        console.warn("기존 스캐너 중지 중 오류:", e);
      }
      qrScanner = null;
    }

    // HTML5QrCode 라이브러리 로드 확인
    if (typeof Html5Qrcode !== 'function') {
      document.getElementById("status").innerText = "❌ QR 스캐너 라이브러리를 찾을 수 없습니다.";
      console.error("Html5Qrcode 라이브러리가 로드되지 않았습니다.");
      return;
    }

    // reader div 요소 확인
    const readerElement = document.getElementById("reader");
    if (!readerElement) {
      document.getElementById("status").innerText = "❌ QR 스캐너 요소를 찾을 수 없습니다.";
      console.error("id가 'reader'인 요소를 찾을 수 없습니다.");
      return;
    }

    // 아이폰 바코드 인식을 위한 스캐너 설정 최적화
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) && !window.MSStream;
    
    // 아이폰을 위한 스캔 설정 조정
    if (isIOS) {
      scanConfig.fps = 10; // iOS에서는 프레임 속도를 낮추어 안정성 향상
      // 아이폰에서 바코드 인식을 위한 추가 설정
      scanConfig.experimentalFeatures = {
        useBarCodeDetectorIfSupported: true
      };
      // iOS에서 특정 코드 유형에 집중
      scanConfig.formatsToSupport = [
        Html5QrcodeSupportedFormats.QR_CODE,
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.CODE_128
      ];
    }
    
    // QR 스캐너 초기화
    qrScanner = new Html5Qrcode("reader");
    
    // 화면 크기에 맞게 스캐너 설정 조정
    adjustScannerSettings();
    
    // 상태 업데이트
    document.getElementById("status").innerText = "📷 카메라 권한 요청 중...";
    
    // 확장된 스캔 옵션으로 스캐너 시작
    qrScanner.start(
      { facingMode: "environment" }, // 기본 카메라 설정
      scanConfig,
      async (code) => {
        // 연속 스캔 방지 (200ms 내 재스캔 무시)
        const now = Date.now();
        if (now - lastSuccessfulScan < 200) return;
        lastSuccessfulScan = now;
        
        if (!selectedAction) {
          document.getElementById("status").innerText = "❗ 먼저 입고/출고/하자/반품 중 하나를 선택하세요";
          setAction('입고'); // 자동으로 입고 선택
          return;
        }

        if (scannedCodes.has(code)) return;
        scannedCodes.add(code);

        document.getElementById("status").innerText = "📦 상품코드: " + code;
        document.getElementById("code").value = code;
        
        // 스캔 성공 표시 (바운딩 박스)
        showScanSuccess();
        
        // 스캔음은 기본으로 재생하지만, 신규 상품 확인 후 오버라이드됨
        playBeepSound();
        
        // 즉시 메시지 표시 (처리 중임을 알림)
        const actionText = {
          "입고": "입고 중...",
          "출고": "출고 중...",
          "하자": "하자 등록 중...",
          "반품": "반품 처리 중..."
        }[selectedAction] || "처리 중...";
        
        showMessage(actionText);

        try {
          const accessToken = await getAccessToken();
          
          if (!accessToken) {
            throw new Error("인증 토큰을 가져올 수 없습니다. 로그인을 다시 시도하세요.");
          }
          
          const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/상품재고!A2:D1000`, {
            headers: { Authorization: "Bearer " + accessToken }
          });
          
          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(`시트 데이터 조회 실패: ${errorData.error?.message || res.statusText}`);
          }
          
          const data = await res.json();
          const rows = data.values || [];
          const found = rows.find(row => row[0] === code);
          let stock = 0, defect = 0;
          let isNewItem = false;

          if (found) {
            document.getElementById("name").value = found[1];
            document.getElementById("name").readOnly = true;
            stock = parseInt(found[2]) || 0;
            defect = parseInt(found[3]) || 0;
            // 기존 상품이므로 스캔음만 이미 재생됨
          } else {
            isNewItem = true;
            // 신규 상품인 경우 비프음 취소 (소리가 겹치지 않게)
            if (window.currentAudio) {
              window.currentAudio.pause();
              window.currentAudio.currentTime = 0;
            }
            
            // 대화상자 표시 전 new.mp3 먼저 재생하기 위해 커스텀 알림창 사용
            showCustomPrompt(code);
            return; // 여기서 처리 중단, 커스텀 프롬프트에서 계속 처리
          }

          document.getElementById("summary").innerText = `📊 현재 재고: ${stock} / 하자: ${defect}`;
          
          // 액션 제출 및 결과 반환
          const result = await submitAction(code);
          
          if (result.success) {
            // 처리가 성공했을 때 액션에 따른 사운드 재생 (신규 상품 여부와 상관없이)
            playFeedbackSound(selectedAction);
            
            // UI 업데이트와 메시지 표시
            document.getElementById("status").innerText = `✅ ${selectedAction} 완료!`;
            
            // 성공 시 알림
            const name = document.getElementById("name").value;
            const qty = parseInt(document.getElementById("quantity").value) || 1;
            let message = "";
            
            switch(selectedAction) {
              case "입고":
                message = `${name} ${qty}개 입고 완료`;
                break;
              case "출고":
                message = `${name} ${qty}개 출고 완료`;
                break;
              case "하자":
                message = `${name} 하자 등록 완료`;
                break;
              case "반품":
                message = `${name} ${qty}개 반품 완료`;
                break;
              default:
                message = `${selectedAction} 완료`;
            }
            
            showMessage(message);
          } else {
            document.getElementById("status").innerText = `❌ 오류: ${result.error}`;
            showMessage("처리 중 오류가 발생했습니다.");
            playErrorSound();
          }
          
          setTimeout(() => scannedCodes.delete(code), 1500);
        } catch (error) {
          console.error("처리 중 오류 발생:", error);
          document.getElementById("status").innerText = `❌ 오류: ${error.message}`;
          showMessage("오류: " + error.message);
          playErrorSound();
          scannedCodes.delete(code);
        }
      },
      (err) => {
        // iOS에서 바코드 인식 오류를 최소화하기 위한 처리
        if (isIOS && err.includes("Failed to decode")) {
          // iOS에서 바코드 디코딩 오류는 무시 (일시적인 현상일 수 있음)
          return;
        }
        
        // 심각한 오류만 로그로 남김 (일반적인 스캔 실패는 무시)
        if (err.indexOf("User denied camera permission") === 0) {
          document.getElementById("status").innerText = "❌ 카메라 권한을 허용해주세요";
          // 권한 거부 시 재시도 버튼 표시
          showRetryButton();
        } else if (err.indexOf("Camera access is only supported in secure context") === 0) {
          document.getElementById("status").innerText = "❌ HTTPS 연결이 필요합니다";
        }
      }
    ).catch(err => {
      console.error("QR 스캐너 초기화 오류:", err);
      
      // 오류 메시지 세분화
      let errorMessage = "❌ 카메라 초기화 실패";
      
      if (err.toString().includes("NotFoundError") || err.toString().includes("no camera")) {
        errorMessage += ": 카메라를 찾을 수 없습니다";
      } else if (err.toString().includes("NotAllowedError") || err.toString().includes("Permission denied")) {
        errorMessage += ": 카메라 접근 권한이 거부되었습니다";
        // 권한 거부 시 재시도 버튼 표시
        showRetryButton();
      } else if (err.toString().includes("NotReadableError") || err.toString().includes("could not be started")) {
        errorMessage += ": 카메라가 다른 앱에서 사용 중입니다";
      } else if (err.toString().includes("OverconstrainedError")) {
        errorMessage += ": 요청한 카메라 설정이 지원되지 않습니다";
      } else {
        errorMessage += ": " + err.toString().substring(0, 50);
      }
      
      document.getElementById("status").innerText = errorMessage;
    });
    
    // iOS에서 바코드 인식을 위한 추가 최적화
    if (isIOS) {
      setTimeout(() => {
        // iOS 카메라 안정화를 위한 딜레이 후 포커스 자동 조정 시도
        if (qrScanner && qrScanner.isScanning) {
          const videoElement = qrScanner.getVideoElement();
          if (videoElement) {
            // iOS에서 비디오 설정 최적화
            videoElement.setAttribute('playsinline', true);
            videoElement.setAttribute('autoplay', true);
            
            // iOS에서 바코드 인식을 위한 비디오 품질 향상 시도
            const track = videoElement.srcObject?.getVideoTracks()[0];
            if (track) {
              try {
                const capabilities = track.getCapabilities();
                if (capabilities.focusMode && capabilities.focusMode.includes('continuous')) {
                  track.applyConstraints({
                    advanced: [{ focusMode: 'continuous' }]
                  }).catch(e => console.warn('iOS 포커스 설정 실패:', e));
                }
              } catch (e) {
                console.warn('iOS 카메라 설정 최적화 실패:', e);
              }
            }
          }
        }
      }, 1000);
    }
  } catch (error) {
    console.error("QR 스캐너 시작 오류:", error);
    document.getElementById("status").innerText = "❌ QR 스캐너 시작 실패: " + error.message;
    // 일반적인 오류 시 재시도 버튼 표시
    showRetryButton();
  }
}

// 카메라 접근 재시도 버튼 표시
function showRetryButton() {
  // 기존 버튼이 있으면 제거
  const existingButton = document.getElementById("retryCamera");
  if (existingButton) {
    existingButton.remove();
  }
  
  // 재시도 버튼 생성
  const retryButton = document.createElement("button");
  retryButton.id = "retryCamera";
  retryButton.innerText = "카메라 접근 재시도";
  retryButton.style.backgroundColor = "#00f0ff";
  retryButton.style.color = "#000";
  retryButton.style.padding = "10px 15px";
  retryButton.style.border = "none";
  retryButton.style.borderRadius = "5px";
  retryButton.style.margin = "10px 0";
  retryButton.style.fontWeight = "bold";
  retryButton.style.cursor = "pointer";
  
  // 재시도 버튼 클릭 이벤트
  retryButton.addEventListener("click", () => {
    // 기존 스캐너가 있으면 중지
    if (qrScanner && qrScanner.isScanning) {
      qrScanner.stop().then(() => {
        qrScanner = null;
        startQrScanner();
      }).catch(err => {
        qrScanner = null;
        startQrScanner();
      });
    } else {
      qrScanner = null;
      startQrScanner();
    }
    
    // 버튼 제거
    retryButton.remove();
  });
  
  // 상태 메시지 아래에 버튼 추가
  const statusElement = document.getElementById("status");
  statusElement.parentNode.insertBefore(retryButton, statusElement.nextSibling);
}

// 스캔 성공 시 시각적 피드백 제공
function showScanSuccess() {
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.right = '0';
  overlay.style.bottom = '0';
  overlay.style.backgroundColor = 'rgba(0, 240, 255, 0.2)';
  overlay.style.pointerEvents = 'none';
  overlay.style.zIndex = '999';
  overlay.style.animation = 'scan-flash 0.5s';
  
  // 애니메이션 정의
  const style = document.createElement('style');
  style.textContent = `
    @keyframes scan-flash {
      0% { background-color: rgba(0, 240, 255, 0.5); }
      100% { background-color: rgba(0, 240, 255, 0); }
    }
  `;
  document.head.appendChild(style);
  
  document.body.appendChild(overlay);
  
  // 0.5초 후 오버레이 제거
  setTimeout(() => {
    document.body.removeChild(overlay);
  }, 500);
}

// 함수 호출 횟수 제한 (리사이즈와 같은 빈번한 이벤트에 사용)
function debounce(func, wait) {
  let timeout;
  return function() {
    const context = this;
    const args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(context, args);
    }, wait);
  };
}

// 추가 코드: 보다 빠르고 정확한 스캔을 위한 설정
function optimizeScanPerformance() {
  // 카메라가 시작되었다면
  if (qrScanner && qrScanner.isScanning) {
    // 현재 카메라 ID 가져오기
    const currentCameraId = qrScanner.getState()?.currentCamera;
    
    // 카메라가 있으면 고급 설정 적용
    if (currentCameraId) {
      try {
        // 자동 초점 및 밝기 조정 적용
        const track = qrScanner.getVideoElement().srcObject.getVideoTracks()[0];
        if (track) {
          const capabilities = track.getCapabilities();
          const settings = {};
          
          // 자동 초점 기능이 있으면 설정
          if (capabilities.focusMode && capabilities.focusMode.includes('continuous')) {
            settings.focusMode = 'continuous';
          }
          
          // 자동 노출 기능이 있으면 설정
          if (capabilities.exposureMode && capabilities.exposureMode.includes('continuous')) {
            settings.exposureMode = 'continuous';
          }
          
          // 설정이 있는 경우에만 적용
          if (Object.keys(settings).length > 0) {
            track.applyConstraints({ advanced: [settings] })
              .catch(e => console.warn('카메라 고급 설정 적용 실패:', e));
          }
        }
      } catch (e) {
        console.warn('카메라 최적화 시도 중 오류:', e);
      }
    }
  }
}

// 바코드 스캔 정확도 향상을 위한 서비스 워커 등록
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js').then(registration => {
      console.log('서비스 워커 등록 성공:', registration.scope);
    }).catch(error => {
      console.warn('서비스 워커 등록 실패:', error);
    });
  });
}

async function submitAction(code) {
  // 기존 submitAction 함수 코드...
  try {
    const name = document.getElementById("name").value.trim();
    const qty = parseInt(document.getElementById("quantity").value) || 1;
    const user = document.getElementById("user").value || email;
    const now = new Date().toISOString();

    if (!code || !name || !sheetId || !selectedAction) {
      return { success: false, error: "필수 정보가 누락되었습니다." };
    }

    const accessToken = await getAccessToken();
    
    if (!accessToken) {
      return { success: false, error: "인증 토큰을 가져올 수 없습니다." };
    }

    // 1. 입출고기록 시트에 기록
    const recordRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/입출고기록!A1:append?valueInputOption=USER_ENTERED`,
      {
        method: "POST",
        headers: {
          Authorization: "Bearer " + accessToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ values: [[now, code, name, qty, user, selectedAction]] })
      }
    );

    if (!recordRes.ok) {
      const errorData = await recordRes.json();
      return { 
        success: false, 
        error: `입출고기록 쓰기 실패: ${errorData.error?.message || recordRes.statusText}` 
      };
    }

    // 2. 재고 정보 가져오기
    const dataRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/상품재고!A2:D1000`, {
      headers: { Authorization: "Bearer " + accessToken }
    });

    if (!dataRes.ok) {
      const errorData = await dataRes.json();
      return { 
        success: false, 
        error: `재고정보 조회 실패: ${errorData.error?.message || dataRes.statusText}` 
      };
    }

    const data = await dataRes.json();
    const rows = data.values || [];
    const idx = rows.findIndex(r => r[0] === code);
    let updated = false;

    // 3. 기존 상품 재고 업데이트
    if (idx >= 0) {
      const current = rows[idx];
      let stock = parseInt(current[2]) || 0;
      let defect = parseInt(current[3]) || 0;
      if (selectedAction === "입고") stock += qty;
      if (selectedAction === "출고" || selectedAction === "반품") stock -= qty;
      if (selectedAction === "하자") { stock -= 1; defect += 1; }

      const rowNum = idx + 2;
      const updateRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/상품재고!C${rowNum}:D${rowNum}?valueInputOption=USER_ENTERED`, 
        {
          method: "PUT",
          headers: {
            Authorization: "Bearer " + accessToken,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ values: [[stock, defect]] })
        }
      );

      if (!updateRes.ok) {
        const errorData = await updateRes.json();
        return { 
          success: false, 
          error: `재고 업데이트 실패: ${errorData.error?.message || updateRes.statusText}` 
        };
      }
      
      updated = true;
    }

    // 4. 신규 상품인 경우 추가
    if (!updated) {
      const stock = (selectedAction === "입고") ? qty : (selectedAction === "하자" ? 0 : -qty);
      const defect = (selectedAction === "하자") ? 1 : 0;
      
      const newItemRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/상품재고!A1:append?valueInputOption=USER_ENTERED`, 
        {
          method: "POST",
          headers: {
            Authorization: "Bearer " + accessToken,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ values: [[code, name, stock, defect]] })
        }
      );

      if (!newItemRes.ok) {
        const errorData = await newItemRes.json();
        return { 
          success: false, 
          error: `신규상품 추가 실패: ${errorData.error?.message || newItemRes.statusText}` 
        };
      }
    }

    return { success: true };
  } catch (error) {
    console.error("제출 처리 중 오류:", error);
    return { success: false, error: error.message };
  }
}

// 토큰 가져오기 함수 개선 - PWA용 인증 유지를 위한 수정
async function getAccessToken() {
  try {
    // 캐시된 토큰이 있는지 확인
    const cached = localStorage.getItem("accessToken");
    if (cached) {
      // 토큰 만료 여부 확인 (선택적)
      try {
        // 간단한 API 호출로 토큰 유효성 테스트
        const testRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?fields=properties.title`, {
          headers: { Authorization: "Bearer " + cached }
        });
        
        if (testRes.ok) {
          // 세션 스토리지에도 복제하여 PWA에서도 사용 가능하게 함
          sessionStorage.setItem("accessToken", cached);
          return cached; // 토큰이 유효함
        }
        
        // 토큰이 유효하지 않으면 제거
        localStorage.removeItem("accessToken");
        sessionStorage.removeItem("accessToken");
        console.warn("토큰이 만료되었습니다. 새로운 토큰을 요청합니다.");
      } catch (e) {
        localStorage.removeItem("accessToken");
        sessionStorage.removeItem("accessToken");
        console.warn("토큰 검증 중 오류, 새로운 토큰 요청:", e);
      }
    } else {
      // 세션 스토리지에서 토큰 확인 (웹앱 새로고침 시 사용)
      const sessionToken = sessionStorage.getItem("accessToken");
      if (sessionToken) {
        try {
          const testRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?fields=properties.title`, {
            headers: { Authorization: "Bearer " + sessionToken }
          });
          
          if (testRes.ok) {
            // 유효한 경우 로컬 스토리지에도 저장
            localStorage.setItem("accessToken", sessionToken);
            return sessionToken;
          }
          
          // 유효하지 않으면 제거
          sessionStorage.removeItem("accessToken");
        } catch (e) {
          sessionStorage.removeItem("accessToken");
          console.warn("세션 토큰 검증 실패:", e);
        }
      }
    }
    
    // 새 토큰 요청 - COOP 오류 방지를 위한 수정
    return new Promise((resolve) => {
      const tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: "192783618509-d0ev6sp714cr4d43cfumfaum005g485t.apps.googleusercontent.com",
        scope: "https://www.googleapis.com/auth/spreadsheets",
        callback: (res) => {
          if (res && res.access_token) {
            // 로컬 스토리지와 세션 스토리지 모두에 저장
            localStorage.setItem("accessToken", res.access_token);
            sessionStorage.setItem("accessToken", res.access_token);
            
            // PWA에서 인증 유지를 위한 추가 조치
            // 만료 시간을 현재 시간 + 1시간으로 저장 (Google OAuth 토큰 기본 만료 시간)
            const expiryTime = Date.now() + 3600000; // 1시간
            localStorage.setItem("tokenExpiry", expiryTime.toString());
            sessionStorage.setItem("tokenExpiry", expiryTime.toString());
            
            resolve(res.access_token);
          } else {
            console.error("토큰 획득 실패:", res);
            resolve(null);
          }
        },
        error_callback: (err) => {
          console.error("토큰 요청 오류:", err);
          resolve(null);
        }
      });
      
      // 사용자에게 권한을 이미 요청했다면 조용히 요청, 아니면 동의 화면 표시
      // 이전에 동의한 경우 창이 표시되지 않고 바로 토큰이 발급됨
      tokenClient.requestAccessToken({prompt: ''});
    });
  } catch (error) {
    console.error("토큰 획득 중 오류:", error);
    return null;
  }
}

// 메시지 표시 함수 최적화 - 빠른 응답 위해 딜레이 축소
function showMessage(text) {
  const messageElement = document.getElementById("voiceMessage") || createMessageElement();
  messageElement.textContent = text;
  messageElement.style.opacity = "1";
  
  // 메시지 표시 시간 조정 (3초에서 1.5초로 축소)
  setTimeout(() => {
    messageElement.style.opacity = "0";
  }, 1500);
}

// 화면에 메시지를 표시할 요소 생성
function createMessageElement() {
  const element = document.createElement("div");
  element.id = "voiceMessage";
  element.style.position = "fixed";
  element.style.bottom = "70px";
  element.style.left = "0";
  element.style.right = "0";
  element.style.backgroundColor = "rgba(0, 240, 255, 0.9)";
  element.style.color = "black";
  element.style.padding = "12px";
  element.style.textAlign = "center";
  element.style.fontWeight = "bold";
  element.style.borderRadius = "5px";
  element.style.margin = "0 10px";
  element.style.boxShadow = "0 0 10px rgba(0,0,0,0.2)";
  element.style.transition = "opacity 0.5s ease";
  element.style.zIndex = "1000";
  document.body.appendChild(element);
  return element;
}

// 오디오 컨텍스트 초기화 (iOS 및 모바일 브라우저용)
function initAudioContext() {
  if (!window.audioContext) {
    try {
      window.AudioContext = window.AudioContext || window.webkitAudioContext;
      window.audioContext = new AudioContext();
      
      // iOS 및 Android에서 첫 사용자 상호작용에서 오디오 활성화
      document.addEventListener('touchstart', function initAudio() {
        const silentSound = window.audioContext.createBuffer(1, 1, 22050);
        const source = window.audioContext.createBufferSource();
        source.buffer = silentSound;
        source.connect(window.audioContext.destination);
        source.start();
        document.removeEventListener('touchstart', initAudio);
      }, { once: true });
      
      // 데스크톱용 초기화
      document.addEventListener('click', function initAudio() {
        const silentSound = window.audioContext.createBuffer(1, 1, 22050);
        const source = window.audioContext.createBufferSource();
        source.buffer = silentSound;
        source.connect(window.audioContext.destination);
        source.start();
        document.removeEventListener('click', initAudio);
      }, { once: true });
    } catch (e) {
      console.warn('AudioContext 초기화 실패:', e);
    }
  }
  return window.audioContext;
}

// QR 스캔 시 비프음
function playBeepSound() {
  try {
    const ctx = initAudioContext() || new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.type = "square";
    oscillator.frequency.setValueAtTime(1800, ctx.currentTime);
    oscillator.frequency.setValueAtTime(1200, ctx.currentTime + 0.05);
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.15);
  } catch (e) {
    console.warn("비프음 재생 실패:", e);
  }
}

// 에러 소리 재생
function playErrorSound() {
  try {
    const ctx = initAudioContext() || new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(400, ctx.currentTime);
    oscillator.frequency.setValueAtTime(200, ctx.currentTime + 0.1);
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.3);
  } catch (e) {
    console.warn("오류 소리 재생 실패:", e);
  }
}

// 작업 완료 시 오디오 피드백 - 즉시 재생 보장
function playFeedbackSound(action) {
  // 기존 오디오 요소 중지 (여러 소리 중첩 방지)
  if (window.currentAudio) {
    window.currentAudio.pause();
    window.currentAudio.currentTime = 0;
  }
  
  // iOS/Android 오디오 컨텍스트 초기화
  initAudioContext();
  
  let soundFile;
  
  switch(action) {
    case "입고":
      soundFile = "sounds/in.mp3";
      break;
    case "출고":
      soundFile = "sounds/out.mp3";
      break;
    case "하자":
      soundFile = "sounds/defect.mp3";
      break;
    case "반품":
      soundFile = "sounds/return.mp3";
      break;
    default:
      soundFile = "sounds/beep.mp3";
  }
  
  // 오디오 파일 준비 및 즉시 재생 시도
  try {
    window.currentAudio = new Audio(soundFile);
    
    // 오디오 로드 즉시 재생 시도
    window.currentAudio.addEventListener('canplaythrough', () => {
      window.currentAudio.play().catch(e => {
        console.warn('재생 실패, 대체 소리 사용:', e);
        playSuccessTone(action);
      });
    }, { once: true });
    
    // 오류 발생 시 대체 효과음 재생
    window.currentAudio.addEventListener('error', () => {
      console.warn('오디오 파일 로드 실패, 대체 소리 재생');
      playSuccessTone(action);
    });
    
    // 즉시 재생 시도 (파일이 이미 캐시되어 있을 경우)
    window.currentAudio.play().catch(error => {
      // canplaythrough 이벤트에서 다시 시도할 것이므로 여기서는 로그만 남김
      console.warn('즉시 재생 실패, 로드 후 재시도 예정:', error);
    });
  } catch (e) {
    console.warn('오디오 초기화 실패, 대체 소리 사용:', e);
    playSuccessTone(action);
  }
}

// 특수 효과음 재생 (오디오 파일 대신 사용)
function playSuccessTone(action) {
  try {
    const ctx = initAudioContext() || new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    // 각 액션별로 다른 소리 패턴
    switch(action) {
      case "입고":
        // 상승 음계(밝은 소리)
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(440, ctx.currentTime);
        oscillator.frequency.linearRampToValueAtTime(880, ctx.currentTime + 0.2);
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.3);
        break;
        
      case "출고":
        // 하강 음계
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(880, ctx.currentTime);
        oscillator.frequency.linearRampToValueAtTime(440, ctx.currentTime + 0.2);
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.3);
        break;
        
      case "하자":
        // 짧은 경고음
        oscillator.type = "square";
        oscillator.frequency.setValueAtTime(330, ctx.currentTime);
        oscillator.frequency.setValueAtTime(220, ctx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.2);
        break;
        
      case "반품":
        // 2단계 음계
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(660, ctx.currentTime);
        oscillator.frequency.setValueAtTime(440, ctx.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(220, ctx.currentTime + 0.2);
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.3);
        break;
        
      default:
        // 기본 성공음
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(1200, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + 0.2);
        gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.3);
    }
  } catch (e) {
    console.warn("오디오 재생 오류:", e);
  }
}

// 신규 상품 사운드 재생 함수
function playNewItemSound() {
  // 기존 오디오 요소 중지
  if (window.currentAudio) {
    window.currentAudio.pause();
    window.currentAudio.currentTime = 0;
  }
  
  // iOS/Android 오디오 컨텍스트 초기화
  initAudioContext();
  
  // 신규 상품 소리 파일
  const soundFile = "sounds/new.mp3";
  
  try {
    window.currentAudio = new Audio(soundFile);
    
    // 오디오 로드 즉시 재생 시도
    window.currentAudio.addEventListener('canplaythrough', () => {
      window.currentAudio.play().catch(e => {
        console.warn('재생 실패, 대체 소리 사용:', e);
        playNewItemTone();
      });
    }, { once: true });
    
    // 오류 발생 시 대체 효과음 재생
    window.currentAudio.addEventListener('error', () => {
      console.warn('오디오 파일 로드 실패, 대체 소리 재생');
      playNewItemTone();
    });
    
    // 즉시 재생 시도 (파일이 이미 캐시되어 있을 경우)
    window.currentAudio.play().catch(error => {
      // canplaythrough 이벤트에서 다시 시도할 것이므로 여기서는 로그만 남김
      console.warn('즉시 재생 실패, 로드 후 재시도 예정:', error);
    });
  } catch (e) {
    console.warn('오디오 초기화 실패, 대체 소리 사용:', e);
    playNewItemTone();
  }
}

// 신규 상품 효과음 (new.mp3 파일 없을 경우 대체음)
function playNewItemTone() {
  try {
    const ctx = initAudioContext() || new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    // 주의를 끄는 독특한 패턴의 소리
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, ctx.currentTime);
    oscillator.frequency.setValueAtTime(1320, ctx.currentTime + 0.1);
    oscillator.frequency.setValueAtTime(880, ctx.currentTime + 0.2);
    oscillator.frequency.setValueAtTime(1320, ctx.currentTime + 0.3);
    
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.4);
  } catch (e) {
    console.warn("신규 상품 소리 재생 오류:", e);
  }
}

// 커스텀 프롬프트를 표시하고 new.mp3 재생 (대화상자 전에 소리 재생 보장)
function showCustomPrompt(code) {
  // 기존 알림창이 있으면 제거
  const existingPrompt = document.getElementById('customPrompt');
  if (existingPrompt) {
    document.body.removeChild(existingPrompt);
  }
  
  // 먼저 new.mp3 재생 시작
  if (newItemSound) {
    newItemSound.currentTime = 0;
    const playPromise = newItemSound.play();
    if (playPromise) {
      playPromise.catch(err => {
        console.warn('미리 로드된 new.mp3 재생 실패:', err);
        playNewItemTone();  // 대체 소리 사용
      });
    }
  } else {
    // 미리 로드된 소리가 없으면 즉시 소리 생성 재생
    playNewItemTone();
  }
  
  // 소리 재생 후 약간 지연 시킨 후 실제 프롬프트 표시
  setTimeout(() => {
    const name = prompt("🆕 신규 상품입니다. 상품명을 입력하세요:");
    if (name) {
      document.getElementById("name").value = name;
      document.getElementById("name").readOnly = false;
      
      // 이제 원래 프로세스 계속 진행
      continueProcessingNewItem(code);
    } else {
      alert("상품명을 입력해야 처리할 수 있습니다.");
      scannedCodes.delete(code);
    }
  }, 100);  // 100ms 지연으로 소리가 먼저 시작되도록 함
}

// 신규 상품 처리 계속 진행 (이름 입력 후)
async function continueProcessingNewItem(code) {
  try {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      throw new Error("인증 토큰을 가져올 수 없습니다.");
    }
    
    const dataRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/상품재고!A2:D1000`, {
      headers: { Authorization: "Bearer " + accessToken }
    });
    
    if (!dataRes.ok) {
      const errorData = await dataRes.json();
      throw new Error(`시트 데이터 조회 실패: ${errorData.error?.message || dataRes.statusText}`);
    }
    
    const data = await dataRes.json();
    const rows = data.values || [];
    
    document.getElementById("summary").innerText = `📊 신규 상품`;
    
    // 액션 제출 및 결과 반환
    const result = await submitAction(code);
    
    if (result.success) {
      // 처리가 성공했을 때 액션에 따른 사운드 재생
      playFeedbackSound(selectedAction);
      
      // UI 업데이트와 메시지 표시
      document.getElementById("status").innerText = `✅ ${selectedAction} 완료!`;
      
      // 성공 시 알림
      const name = document.getElementById("name").value;
      const qty = parseInt(document.getElementById("quantity").value) || 1;
      let message = "";
      
      switch(selectedAction) {
        case "입고":
          message = `${name} ${qty}개 입고 완료`;
          break;
        case "출고":
          message = `${name} ${qty}개 출고 완료`;
          break;
        case "하자":
          message = `${name} 하자 등록 완료`;
          break;
        case "반품":
          message = `${name} ${qty}개 반품 완료`;
          break;
        default:
          message = `${selectedAction} 완료`;
      }
      
      showMessage(message);
    } else {
      document.getElementById("status").innerText = `❌ 오류: ${result.error}`;
      showMessage("처리 중 오류가 발생했습니다.");
      playErrorSound();
    }
    
    setTimeout(() => scannedCodes.delete(code), 1500);
  } catch (error) {
    console.error("처리 중 오류 발생:", error);
    document.getElementById("status").innerText = `❌ 오류: ${error.message}`;
    showMessage("오류: " + error.message);
    playErrorSound();
    scannedCodes.delete(code);
  }
}
