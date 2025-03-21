if (typeof $ === "undefined") { window.$ = window.jQuery; }
//중간글자에는 자음, 모음 둘다 제한이 있음 - cho_filter / jung_filter 변수에 있는 것만 가능


//--------------------------------------------변수--------------------------------------------

var cho_original = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ']; //첫글자 마자막글자에 사용하는 초성(전체)
var cho_filter = ['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅅ', 'ㅇ', 'ㅈ', 'ㅎ']; //중간글자에 허용되는 초성
var cho_filter_idx = [0, 2, 3, 5, 6, 7, 9, 11, 12, 18]; //필터했을때 인덱스
var cho_strong = ['ㄲ', 'ㄸ', 'ㅃ', 'ㅆ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ'] //초성 중 센소리
var cho_strong_idx = [1, 4, 8, 10, 13, 14, 15, 16, 17] //그 인덱스

var jung_original = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ']; //모음 전체
var jung_major = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅗ', 'ㅛ', 'ㅜ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ']; //주요 모음 체크시 사용되는 모음
var jung_major_idx = [0, 1, 2, 4, 5, 6, 8, 12, 13, 17, 18, 19, 20]; //그 인덱스
var jung_filter = ['ㅏ', 'ㅐ', 'ㅓ', 'ㅔ', 'ㅗ', 'ㅜ', 'ㅡ', 'ㅣ']; //중간글자에 허용되는 모음
var jung_filter_idx = [0, 1, 4, 5, 8, 13, 18, 20]; //그 인덱스

var jong_ = ['', 'ㄱ', 'ㄴ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅅ', 'ㅇ'];
var jong = [0, 1, 4, 8, 16, 17, 19, 21];

var sel_length = 0;



//--------------------------------------------함수--------------------------------------------


window.addEventListener('load', function () {
  //모바일인지 확인
  if (isMobile()) {
    document.querySelector("body").style.width = "100%"
  }

  //길이선택 라디오 선택상태로
  $('#rd_length').prop('checked', true);

  //길이는 2로 초기선택
  sel_length = 2;
  $('#btn2').css('background-color', 'dodgerblue');


  //자음 라디오 클릭 - 자음선택 초기화 + 숫자 초기화
  $("#rd_jaum").click(function () {
    $('#ip_jaum').val("");

    $('.btn_number').css('background-color', 'white');
    sel_length = "";
  });

  //길이 라디오 클릭 - 동일
  $("#rd_length").click(function () {
    $('#ip_jaum').val("");

    $('.btn_number').css('background-color', 'white');
    sel_length = "";
  });

})



//로그 클릭
function logo_click() {
  window.location.href = "http://ramiteacher.github.io";
}

//자음 버튼 눌렀을때 - 텍스트상자에 추가해줌
function ja_push(self) {
  $('#ip_jaum').val($('#ip_jaum').val() + self.innerText);
}

//숫자 눌렀을때
function number_push(self) {
  //선택값만 색상 칠해주기
  if (sel_length != self.innerText) {
    $('.btn_number').css('background-color', 'white');
    $(self).css('background-color', 'dodgerblue');
    sel_length = self.innerText;
  }

  //두번 클릭이면 색상제거
  else {
    $(self).css('background-color', 'white');
    sel_length = "";
  }
}


//단어 생성하기
function btn_create() {

  var cho_strong_used = false; //초성 센소리가 맨 앞글자에 들어갔으면 더이상 센소리는 사용 못하게 함
  var jung_strong_used = false;


  //입력값 검사
  if (document.querySelector('#rd_jaum').checked && $('#ip_jaum').val() == "") {
    alert("자음선택을 체크하셨습니다. 자음을 선택하세요.");
    return;
  }
  if (document.querySelector('#rd_length').checked && sel_length == "") {
    alert("길이 선택을 체크하셨습니다. 길이를 입력하세요.");
    return;
  }


  var result = "" //결과 저장할 변수
  var jaum = "";
  var length = "";


  //라디오에 따라 jaum변수 채우기
  if ($('#rd_jaum').is(':checked') == true) {
    jaum = $('#ip_jaum').val();
  }
  //길이 선택이면 길이만큼 공백으로 jaum변수 채움
  else if ($('#rd_length').is(':checked') == true) {
    for (var k = 0; k < sel_length; k++) {
      jaum = jaum + " ";
    }
  }




  //for문 돌면서 생성하기
  for (i in jaum) {
    //초 중 종성 담을 변수
    var cho_num = 0;
    var jung_num = 0;
    var jong_num = 0;



    //---------------------초성--------------------

    //1. 초성 선택한 경우 - jaum변수의 해당 인덱스가 공백이 아닌 경우
    if (jaum[i] != " ") {
      cho_num = cho_original.indexOf(jaum[i]);
    }

    //2. 초성 선택 안한 경우 - jaum변수의 해당 인덱스가 공백인 경우
    else {

      //2-1. 주요 자음에 체크된 경우 - 초성은 cho_filter_idx중에서 선택함
      if (document.querySelector("#cb_jaum").checked == true) {
        var tmp = Math.floor(Math.random() * cho_filter_idx.length);
        cho_num = cho_filter_idx[tmp];
      }

      //2-2. 맨앞인 경우 or (맨뒤이고 + 센소리 맨앞에서 안쓴 경우) -> 전체 초성 중 선택
      else if (Number(i) == 0 || (Number(i) == jaum.length - 1 && cho_strong_used == false)) {
        var cho_num = Math.floor(Math.random() * cho_original.length);
      }
      //2-3. 중간글자인 경우 - 주요 자음만 사용
      else {
        var tmp = Math.floor(Math.random() * cho_filter_idx.length);
        cho_num = cho_filter_idx[tmp];
      }

      //맨앞글자에서 초성 센소리 쓴 경우 체크
      if (Number(i) == 0 && cho_strong_idx.includes(cho_num)) {
        cho_strong_used = true;
      }
    }


    //---------------------중성--------------------

    //1. 주요 자음모음에 체크된 경우
    if (document.querySelector("#cb_moum").checked == true) {
      var tmp = Math.floor(Math.random() * jung_filter_idx.length);
      jung_num = jung_filter_idx[tmp];
    }

    //2. 맨앞이거나 or (맨뒤 + 맨앞 미사용)인 경우
    else if (Number(i) == 0 || (Number(i) == jaum.length - 1 && jung_strong_used == false)) {

      //2-1. 초성이 센소리면 filter만
      if (cho_strong_idx.includes(cho_num)) {
        var tmp = Math.floor(Math.random() * jung_filter_idx.length);
        jung_num = jung_filter_idx[tmp];
      }

      //2-2. 아니면 전체 목록에서
      else {
        jung_num = Math.floor(Math.random() * jung_original.length);
      }
    }

    //3. 중간이면 filter만
    else {
      var tmp = Math.floor(Math.random() * jung_filter_idx.length);
      jung_num = jung_filter_idx[tmp];
    }



    //---------------------종성--------------------
    var jong_tmp = Math.floor(Math.random() * jong.length);
    jong_num = jong[jong_tmp];



    //---------------------결과 생성--------------------

    //종성 미사용 체크시
    if (document.querySelector('#cb_no_jong').checked == true) {
      var re = String.fromCharCode(44032 + (cho_num * 588) + (jung_num * 28));
      result = result + re;
    }
    //종성 사용
    else {
      var re = String.fromCharCode(44032 + (cho_num * 588) + (jung_num * 28) + jong_num);
      result = result + re;
    }
  }



  //동적으로 생성해서 키워주는 방법-트랜지션이 안먹힘
  let prt = document.querySelector(".container_result");
  prt.innerText = result
  let maxFontSize = findFontMaxSize(prt, result, 1, 100)

  let start = null;
  let unit = 'px'
  let easeOutFactor = 2

  function step(timestamp) {
    if (!start) start = timestamp;  // 애니메이션 시작 시간 초기화
    const rawProgress = (timestamp - start) / 300;  // 원본 진행률
    const progress = 1 - Math.pow(1 - rawProgress, easeOutFactor);  // 이징 적용

    const currentFontSize = 1 + progress * (maxFontSize - 1);

    prt.style.fontSize = `${currentFontSize}${unit}`;  // 현재 폰트 크기 설정

    if (rawProgress < 1) {
      window.requestAnimationFrame(step);  // 애니메이션 계속 진행
    } else {
      prt.style.fontSize = `${maxFontSize}${unit}`;  // 최종 폰트 크기로 설정
    }
  }

  window.requestAnimationFrame(step);
}

//복사하기
function btn_copy() {
  let text = document.querySelector('.container_result').innerText;

  // 클립보드에 텍스트를 복사합니다.
  navigator.clipboard.writeText(text)
    .then(() => {
      const toast = document.getElementById('toast');

      // 애니메이션을 강제로 다시 적용하기 위해 설정 초기화
      toast.style.animation = "none";
      void toast.offsetWidth; // 리플로우 강제 실행
      toast.style.animation = "";

      // show 클래스 추가
      toast.classList.add('show');

      // 일정 시간이 지나면 show 클래스 제거
      setTimeout(() => {
        toast.classList.remove('show');
      }, 3000); // fadeout 포함 총 3초 유지
    })
    .catch(err => console.error('클립보드 복사 실패:', err));
}




//글씨 크기 태그에 맞추기 - 인수는 태그 아이디, 태그내용, 최소 글씨 px, 최대 글씨 px
function findFontMaxSize(tag, text, minSize, maxSize) {

  const textLength = text.length
  const tagWidth = tag.offsetWidth;

  // Canvas를 사용하여 텍스트의 픽셀 너비 측정
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  let fontSize = maxSize; // 최대 글자 크기에서 시작
  context.font = `${fontSize}px Arial`; // 초기 폰트 스타일 설정

  let textWidth;
  do {
    context.font = `${fontSize}px Arial`; // 폰트 스타일 업데이트
    textWidth = context.measureText('M'.repeat(textLength)).width; // 가상 텍스트 너비 측정
    fontSize--; // 글자 크기 줄이기
  } while ((textWidth > tagWidth || fontSize > maxSize) && fontSize > minSize);

  // 최소 글자 크기 확인
  fontSize = Math.max(fontSize, minSize);

  return fontSize;
}


//모바일 확인 함수
function isMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}