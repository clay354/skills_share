export interface MCPServer {
  id: string;
  name: string;
  description: string;
  category: string;
  type: "http" | "stdio" | "sse";
  config: Record<string, unknown>;
  installLocation: "global" | "project";
  setupSteps?: string[];
  examples: { input: string; description: string }[];
}

export const mcpServers: MCPServer[] = [
  {
    id: "figma",
    name: "Figma MCP",
    description: "Figma 파일을 직접 읽고 분석할 수 있게 해주는 MCP 서버. 디자인 시스템 분석, 컴포넌트 추출 등에 유용합니다.",
    category: "Design",
    type: "http",
    config: {
      type: "http",
      url: "https://mcp.figma.com/mcp"
    },
    installLocation: "project",
    setupSteps: [
      "Figma에서 개인 액세스 토큰 발급 (Settings → Security → Personal access tokens)",
      "Claude Code에서 프로젝트 설정에 MCP 추가",
      "처음 사용 시 토큰 인증 필요"
    ],
    examples: [
      { input: "이 Figma 파일의 컴포넌트 구조 분석해줘", description: "디자인 시스템 구조 파악" },
      { input: "Figma에서 버튼 컴포넌트 스타일 가져와", description: "디자인 토큰 추출" },
      { input: "이 화면의 레이아웃을 코드로 변환해줘", description: "Figma → HTML/CSS 변환" },
    ]
  },
  {
    id: "context7",
    name: "Context7 MCP",
    description: "라이브러리 문서를 실시간으로 조회할 수 있는 MCP 서버. 최신 문서와 코드 예제를 가져옵니다.",
    category: "Documentation",
    type: "stdio",
    config: {
      command: "npx",
      args: ["-y", "@context7/mcp"]
    },
    installLocation: "global",
    setupSteps: [
      "npx가 설치되어 있어야 함 (Node.js 포함)",
      "자동으로 최신 버전 사용"
    ],
    examples: [
      { input: "React 19의 새로운 훅 사용법 알려줘", description: "최신 React 문서 조회" },
      { input: "Tailwind CSS에서 그리드 레이아웃 어떻게 해?", description: "Tailwind 문서 검색" },
      { input: "Next.js App Router에서 데이터 페칭 방법", description: "Next.js 최신 문서 참조" },
    ]
  },
  {
    id: "serena",
    name: "Serena MCP",
    description: "시맨틱 코딩 도구를 제공하는 MCP 서버. 심볼 기반 코드 탐색과 편집을 지원합니다.",
    category: "Development",
    type: "stdio",
    config: {
      command: "uvx",
      args: ["serena-mcp"]
    },
    installLocation: "global",
    setupSteps: [
      "uv 패키지 매니저 설치 필요",
      "Python 환경 필요"
    ],
    examples: [
      { input: "UserService 클래스의 모든 메서드 보여줘", description: "심볼 기반 코드 탐색" },
      { input: "이 함수를 참조하는 모든 코드 찾아줘", description: "참조 검색" },
      { input: "calculateTotal 함수 시그니처 변경해줘", description: "안전한 리팩토링" },
    ]
  },
  {
    id: "playwright",
    name: "Playwright MCP",
    description: "브라우저 자동화를 위한 MCP 서버. 웹 테스트, 스크린샷, 페이지 조작이 가능합니다.",
    category: "Testing",
    type: "stdio",
    config: {
      command: "npx",
      args: ["-y", "@anthropic/playwright-mcp"]
    },
    installLocation: "global",
    setupSteps: [
      "npx가 설치되어 있어야 함",
      "Chromium 브라우저 자동 설치됨"
    ],
    examples: [
      { input: "localhost:3000 열고 스크린샷 찍어줘", description: "페이지 스크린샷 캡처" },
      { input: "로그인 폼 테스트해줘", description: "E2E 테스트 실행" },
      { input: "이 버튼 클릭하면 뭐가 나와?", description: "인터랙션 테스트" },
      { input: "모바일 뷰포트로 확인해줘", description: "반응형 테스트" },
    ]
  }
];
