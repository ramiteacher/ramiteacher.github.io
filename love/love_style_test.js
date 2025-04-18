// 연애 성향 테스트
const loveStyleTest = {
  title: "연애 성향 테스트",
  description: "당신의 연애 스타일 알아보기",
  icon: "💘",
  questions: [
    {
      question: "연인과의 데이트에서 당신이 선호하는 활동은?",
      options: [
        { text: "로맨틱한 분위기의 레스토랑에서 식사", score: "낭만형" },
        { text: "함께 영화 보기나 집에서 휴식", score: "현실형" },
        { text: "각자 취미 활동 후 만나서 대화하기", score: "독립형" },
        { text: "상대방이 좋아하는 활동 함께하기", score: "의존형" },
        { text: "새롭고 스릴 있는 활동 도전하기", score: "열정형" },
        { text: "편안하게 산책하거나 카페에서 대화하기", score: "안정형" }
      ]
    },
    {
      question: "연인과 다툼이 생겼을 때 당신의 대처 방식은?",
      options: [
        { text: "감정을 솔직하게 표현하고 화해를 위해 노력한다", score: "낭만형" },
        { text: "문제의 원인을 분석하고 해결책을 찾는다", score: "현실형" },
        { text: "혼자 생각할 시간을 갖고 정리한 후 대화한다", score: "독립형" },
        { text: "상대방의 의견에 맞추려고 노력한다", score: "의존형" },
        { text: "감정적으로 대응하지만 빠르게 화해한다", score: "열정형" },
        { text: "차분하게 대화하며 타협점을 찾는다", score: "안정형" }
      ]
    },
    {
      question: "연인에게 가장 바라는 것은?",
      options: [
        { text: "로맨틱한 표현과 깊은 정서적 교감", score: "낭만형" },
        { text: "신뢰와 책임감 있는 관계", score: "현실형" },
        { text: "개인 공간과 자유를 존중해주는 것", score: "독립형" },
        { text: "항상 곁에서 지지해주고 함께하는 것", score: "의존형" },
        { text: "흥미롭고 자극적인 관계 유지", score: "열정형" },
        { text: "안정적이고 편안한 관계", score: "안정형" }
      ]
    },
    {
      question: "연애 관계에서 당신의 가장 큰 장점은?",
      options: [
        { text: "감정을 풍부하게 표현하고 로맨틱한 분위기를 만든다", score: "낭만형" },
        { text: "현실적이고 안정적인 관계를 유지한다", score: "현실형" },
        { text: "상대방의 독립성과 개성을 존중한다", score: "독립형" },
        { text: "헌신적이고 상대방을 최우선으로 생각한다", score: "의존형" },
        { text: "관계에 열정과 활력을 불어넣는다", score: "열정형" },
        { text: "신뢰할 수 있고 일관된 태도를 보인다", score: "안정형" }
      ]
    },
    {
      question: "미래 계획에 대한 당신의 태도는?",
      options: [
        { text: "감정과 직관에 따라 자연스럽게 흘러가길 원한다", score: "낭만형" },
        { text: "구체적인 계획과 목표를 세우고 함께 노력한다", score: "현실형" },
        { text: "각자의 목표를 존중하며 서로 지지한다", score: "독립형" },
        { text: "상대방의 계획에 맞추어 함께하길 원한다", score: "의존형" },
        { text: "즉흥적이고 모험적인 미래를 꿈꾼다", score: "열정형" },
        { text: "안정적이고 예측 가능한 미래를 원한다", score: "안정형" }
      ]
    },
    {
      question: "연인과 떨어져 있을 때 당신의 느낌은?",
      options: [
        { text: "그리움과 로맨틱한 상상으로 시간을 보낸다", score: "낭만형" },
        { text: "일상에 집중하며 연락을 주고받는다", score: "현실형" },
        { text: "개인 시간을 즐기며 자신의 활동에 집중한다", score: "독립형" },
        { text: "불안하고 외로워 자주 연락하게 된다", score: "의존형" },
        { text: "재회할 때를 기대하며 설렌다", score: "열정형" },
        { text: "그립지만 안정적인 마음으로 기다린다", score: "안정형" }
      ]
    },
    {
      question: "연인에게 선물을 고를 때 당신은?",
      options: [
        { text: "감동을 줄 수 있는 의미 있는 선물을 고른다", score: "낭만형" },
        { text: "실용적이면서도 상대방이 필요로 하는 것을 선택한다", score: "현실형" },
        { text: "상대의 취향을 존중하되 부담스럽지 않은 선물을 고른다", score: "독립형" },
        { text: "상대방이 언급했던 것이나 원하는 것을 기억해 선물한다", score: "의존형" },
        { text: "독특하고 인상적인 선물로 놀라게 한다", score: "열정형" },
        { text: "안전하고 무난하지만 품질 좋은 선물을 고른다", score: "안정형" }
      ]
    }
  ],
  calculateResult: function(answers) {
    const scores = {
      "낭만형": 0,
      "현실형": 0,
      "독립형": 0,
      "의존형": 0,
      "열정형": 0,
      "안정형": 0
    };
    
    answers.forEach(answer => {
      scores[answer]++;
    });
    
    let maxScore = 0;
    let result = "";
    
    for (const type in scores) {
      if (scores[type] > maxScore) {
        maxScore = scores[type];
        result = type;
      }
    }
    
    return result;
  },
  results: {
    "낭만형": {
      title: "낭만적인 연애가",
      description: "당신은 감정이 풍부하고 로맨틱한 연애를 추구합니다. 깊은 정서적 교감과 낭만적인 순간을 중요시하며, 사랑을 표현하는 데 주저함이 없습니다. 영화 속 주인공처럼 운명적인 사랑을 믿고, 감정에 충실한 연애를 합니다. 때로는 현실과 이상 사이에서 갈등할 수 있지만, 당신의 따뜻한 마음과 풍부한 감성은 연인에게 특별한 경험을 선사합니다."
    },
    "현실형": {
      title: "현실적인 연애가",
      description: "당신은 안정적이고 실용적인 연애를 추구합니다. 감정보다는 이성을 중시하며, 관계에서 신뢰와 책임감을 중요하게 생각합니다. 현실적인 문제 해결 능력이 뛰어나고, 장기적인 관계를 위한 계획을 세우는 것을 좋아합니다. 화려한 이벤트보다는 일상에서의 작은 행복을 중시하며, 상대방에게 믿음직한 파트너가 됩니다."
    },
    "독립형": {
      title: "독립적인 연애가",
      description: "당신은 자유롭고 독립적인 연애를 추구합니다. 연인과의 관계에서도 개인의 공간과 자유를 중요시하며, 상대방의 독립성도 존중합니다. 자신의 정체성과 목표를 유지하면서 건강한 관계를 만들어갑니다. 의존적인 관계보다는 서로 성장할 수 있는 관계를 원하며, 상대방을 구속하지 않는 열린 마음을 가지고 있습니다."
    },
    "의존형": {
      title: "헌신적인 연애가",
      description: "당신은 깊은 유대감과 밀접한 관계를 추구합니다. 연인에게 헌신적이며, 함께하는 시간을 매우 중요하게 생각합니다. 상대방의 필요와 감정에 민감하게 반응하고, 관계를 위해 자신을 희생할 준비가 되어 있습니다. 때로는 지나치게 의존적이 될 수 있지만, 당신의 깊은 애정과 헌신은 연인에게 큰 안정감을 줍니다."
    },
    "열정형": {
      title: "열정적인 연애가",
      description: "당신은 흥미롭고 자극적인 연애를 추구합니다. 새로운 경험과 모험을 통해 관계에 활력을 불어넣으며, 감정을 강렬하게 표현합니다. 즉흥적이고 창의적인 데이트를 좋아하며, 연인과의 관계에서 지루함을 느끼는 것을 두려워합니다. 때로는 감정의 기복이 있을 수 있지만, 당신의 열정과 에너지는 관계를 항상 신선하고 흥미롭게 만듭니다."
    },
    "안정형": {
      title: "안정적인 연애가",
      description: "당신은 편안하고 안정적인 연애를 추구합니다. 갑작스러운 변화보다는 일관된 관계를 선호하며, 신뢰와 안정감을 중요시합니다. 차분하고 인내심 있게 관계를 발전시키며, 갈등 상황에서도 균형 잡힌 태도를 유지합니다. 화려하지 않지만 깊이 있는 사랑을 추구하며, 연인에게 든든한 지원자가 됩니다."
    }
  }
};
