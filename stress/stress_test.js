// 스트레스 지수 테스트
const stressTest = {
  title: "스트레스 지수 테스트",
  description: "당신의 스트레스 수준을 확인하세요",
  icon: "🧘",
  questions: [
    {
      question: "최근 한 달간 예상치 못한 일로 속상하거나 화가 난 적이 있나요?",
      options: [
        { text: "전혀 없다", score: 0 },
        { text: "가끔 있다", score: 1 },
        { text: "종종 있다", score: 2 },
        { text: "자주 있다", score: 3 },
        { text: "매우 자주 있다", score: 4 }
      ]
    },
    {
      question: "중요한 일들을 통제할 수 없다고 느낀 적이 있나요?",
      options: [
        { text: "전혀 없다", score: 0 },
        { text: "가끔 있다", score: 1 },
        { text: "종종 있다", score: 2 },
        { text: "자주 있다", score: 3 },
        { text: "매우 자주 있다", score: 4 }
      ]
    },
    {
      question: "신경이 예민해지거나 스트레스를 받은 적이 있나요?",
      options: [
        { text: "전혀 없다", score: 0 },
        { text: "가끔 있다", score: 1 },
        { text: "종종 있다", score: 2 },
        { text: "자주 있다", score: 3 },
        { text: "매우 자주 있다", score: 4 }
      ]
    },
    {
      question: "개인적인 문제를 해결할 능력에 자신감을 느끼셨나요?",
      options: [
        { text: "매우 자주 있다", score: 0 },
        { text: "자주 있다", score: 1 },
        { text: "종종 있다", score: 2 },
        { text: "가끔 있다", score: 3 },
        { text: "전혀 없다", score: 4 }
      ]
    },
    {
      question: "일이 뜻대로 진행된다고 느끼셨나요?",
      options: [
        { text: "매우 자주 있다", score: 0 },
        { text: "자주 있다", score: 1 },
        { text: "종종 있다", score: 2 },
        { text: "가끔 있다", score: 3 },
        { text: "전혀 없다", score: 4 }
      ]
    },
    {
      question: "처리해야 할 일이 너무 많아 감당하기 힘들다고 느낀 적이 있나요?",
      options: [
        { text: "전혀 없다", score: 0 },
        { text: "가끔 있다", score: 1 },
        { text: "종종 있다", score: 2 },
        { text: "자주 있다", score: 3 },
        { text: "매우 자주 있다", score: 4 }
      ]
    },
    {
      question: "짜증나는 일들을 잘 조절할 수 있었나요?",
      options: [
        { text: "매우 자주 있다", score: 0 },
        { text: "자주 있다", score: 1 },
        { text: "종종 있다", score: 2 },
        { text: "가끔 있다", score: 3 },
        { text: "전혀 없다", score: 4 }
      ]
    },
    {
      question: "모든 일이 잘 풀린다고 느끼셨나요?",
      options: [
        { text: "매우 자주 있다", score: 0 },
        { text: "자주 있다", score: 1 },
        { text: "종종 있다", score: 2 },
        { text: "가끔 있다", score: 3 },
        { text: "전혀 없다", score: 4 }
      ]
    },
    {
      question: "화가 나서 통제할 수 없다고 느낀 적이 있나요?",
      options: [
        { text: "전혀 없다", score: 0 },
        { text: "가끔 있다", score: 1 },
        { text: "종종 있다", score: 2 },
        { text: "자주 있다", score: 3 },
        { text: "매우 자주 있다", score: 4 }
      ]
    },
    {
      question: "극복할 수 없는 어려움이 쌓여간다고 느낀 적이 있나요?",
      options: [
        { text: "전혀 없다", score: 0 },
        { text: "가끔 있다", score: 1 },
        { text: "종종 있다", score: 2 },
        { text: "자주 있다", score: 3 },
        { text: "매우 자주 있다", score: 4 }
      ]
    }
  ],
  results: [
    {
      range: [0, 13],
      title: "매우 낮은 스트레스",
      description: "현재 스트레스 수준이 매우 낮습니다. 건강한 정신 상태를 유지하고 계시네요. 현재의 생활 방식을 유지하세요."
    },
    {
      range: [14, 19],
      title: "낮은 스트레스",
      description: "스트레스 수준이 낮은 편입니다. 대체로 상황을 잘 통제하고 있지만, 가끔 스트레스를 받는 상황이 있을 수 있습니다. 규칙적인 휴식을 취하세요."
    },
    {
      range: [20, 25],
      title: "보통 스트레스",
      description: "보통 수준의 스트레스를 경험하고 있습니다. 일상적인 스트레스 관리가 필요할 수 있습니다. 명상, 운동, 취미 활동 등을 통해 스트레스를 해소해보세요."
    },
    {
      range: [26, 31],
      title: "높은 스트레스",
      description: "스트레스 수준이 높습니다. 일상생활에 영향을 미칠 수 있는 수준입니다. 스트레스 관리 기법을 적극적으로 활용하고, 필요하다면 전문가의 도움을 고려해보세요."
    },
    {
      range: [32, 40],
      title: "매우 높은 스트레스",
      description: "스트레스 수준이 매우 높습니다. 건강에 영향을 미칠 수 있는 수준입니다. 생활 패턴을 점검하고, 전문가의 도움을 받아보는 것이 좋겠습니다."
    }
  ]
};
