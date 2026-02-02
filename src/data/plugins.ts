export interface Plugin {
  id: string;
  name: string;
  description: string;
  category: string;
  marketplace: string;
  installCommand: string;
  features: string[];
  agents?: string[];
  skills?: string[];
  examples: { input: string; description: string }[];
}

export const plugins: Plugin[] = [
  {
    id: "development",
    name: "Development Plugin",
    description: "소프트웨어 개발을 위한 종합 플러그인. 프론트엔드/백엔드 개발, UI/UX 디자인, 코드 디버깅, 문서화, 테스트를 위한 전문 에이전트와 스킬을 제공합니다.",
    category: "Development",
    marketplace: "coding-basic-plugins",
    installCommand: "/install-plugin development@coding-basic-plugins",
    features: [
      "전문 개발 에이전트 (프론트엔드, 백엔드, UI/UX 등)",
      "Git 브랜치 관리 자동화",
      "프로젝트 메모리 뱅크 (컨텍스트 유지)",
      "MCP 서버 빌드 가이드",
      "태스크 플래닝"
    ],
    agents: [
      "technical-documentation-writer",
      "code-debugger",
      "task-router",
      "web-app-tester",
      "backend-api-developer",
      "frontend-ui-developer",
      "ui-ux-designer"
    ],
    skills: [
      "branch-manager",
      "memory-bank-updater",
      "mcp-builder",
      "task-planner",
      "project-reviewer"
    ],
    examples: [
      { input: "/task-planner 사용자 인증 기능 구현", description: "인증 기능 구현을 위한 상세 태스크 플랜 생성" },
      { input: "/branch-manager feature/auth", description: "feature/auth 브랜치 생성 및 관리" },
      { input: "/memory-bank-updater", description: "현재 작업 내용을 프로젝트 메모리에 저장" },
      { input: "API 응답이 느려요 (code-debugger 자동 활성화)", description: "성능 이슈 분석 및 해결책 제시" },
    ]
  },
  {
    id: "data-science",
    name: "Data Science Plugin",
    description: "데이터 분석 및 머신러닝을 위한 전문 플러그인. EDA, 데이터 전처리, 모델링, 시각화를 위한 에이전트와 스킬을 제공합니다.",
    category: "Data Science",
    marketplace: "coding-basic-plugins",
    installCommand: "/install-plugin data-science@coding-basic-plugins",
    features: [
      "탐색적 데이터 분석 (EDA) 자동화",
      "데이터 정제 및 전처리",
      "머신러닝 모델링",
      "데이터 시각화",
      "특성 공학"
    ],
    agents: [
      "ml-modeling-specialist",
      "data-visualization-specialist",
      "data-scientist",
      "data-cleaning-specialist",
      "model-evaluation-specialist",
      "feature-engineering-specialist"
    ],
    skills: [
      "EDA",
      "Data-cleansing"
    ],
    examples: [
      { input: "/EDA sales_data.csv", description: "판매 데이터 탐색적 분석 수행" },
      { input: "/Data-cleansing customer_data.csv", description: "고객 데이터 정제 (결측치, 이상치 처리)" },
      { input: "이 데이터로 이탈 예측 모델 만들어줘 (ml-modeling-specialist 활성화)", description: "분류 모델 학습 및 평가" },
      { input: "매출 추이 시각화해줘 (data-visualization-specialist 활성화)", description: "시계열 차트 생성" },
    ]
  }
];

export const marketplaces = [
  {
    id: "coding-basic-plugins",
    name: "Coding Basic Plugins",
    description: "개발 및 데이터 사이언스를 위한 기본 플러그인 마켓플레이스",
    source: "https://github.com/anthropics/coding-basic-plugins",
    installCommand: "/install-marketplace https://github.com/anthropics/coding-basic-plugins"
  }
];
