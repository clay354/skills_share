export interface MCPServer {
  id: string;
  name: string;
  description: string;
  category: string;
  type: "http" | "stdio" | "sse";
  config: Record<string, unknown>;
  installLocation: "global" | "project";
  setupSteps?: string[];
  tools?: { name: string; description: string }[];
  examples: { input: string; description: string }[];
}

export const mcpServers: MCPServer[] = [
  {
    id: "skills-share",
    name: "Skills Share MCP",
    description: "이 웹사이트의 커맨드, 플러그인, MCP 설정을 Claude Code에 바로 설치할 수 있게 해주는 메타 MCP 서버입니다.",
    category: "Meta",
    type: "stdio",
    config: {
      command: "npx",
      args: ["-y", "skills-share-mcp"]
    },
    installLocation: "global",
    setupSteps: [
      "Node.js 18+ 설치 필요",
      "설치 후 Claude Code를 재시작하세요"
    ],
    tools: [
      { name: "list_commands", description: "사용 가능한 커맨드 목록 조회 (카테고리 필터링 가능)" },
      { name: "list_mcp_servers", description: "사용 가능한 MCP 서버 목록 조회" },
      { name: "list_plugins", description: "사용 가능한 플러그인 목록 조회" },
      { name: "get_command_detail", description: "특정 커맨드의 상세 정보 조회" },
      { name: "get_mcp_detail", description: "특정 MCP 서버의 상세 정보 조회" },
      { name: "install_command", description: "커맨드를 ~/.claude/commands/에 설치" },
      { name: "install_mcp", description: "MCP 서버 설정 가이드 출력" },
      { name: "search", description: "커맨드, MCP, 플러그인 키워드 검색" },
      { name: "upload_command", description: "로컬 커맨드를 Skills Share에 업로드" },
      { name: "upload_mcp", description: "MCP 서버 설정을 Skills Share에 업로드" },
      { name: "upload_plugin", description: "플러그인 정보를 Skills Share에 업로드" },
      { name: "update_command", description: "기존 업로드한 커맨드 업데이트" },
      { name: "update_mcp", description: "기존 업로드한 MCP 서버 업데이트" },
      { name: "update_plugin", description: "기존 업로드한 플러그인 업데이트" },
    ],
    examples: [
      { input: "skills-share에서 pr-description 커맨드 설치해줘", description: "커맨드 설치" },
      { input: "skills-share에 어떤 플러그인 있어?", description: "플러그인 목록 확인" },
      { input: "Context7 MCP 설치해줘", description: "MCP 서버 설치" },
    ]
  },
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
    tools: [
      { name: "get_file", description: "Figma 파일의 전체 구조 조회" },
      { name: "get_node", description: "특정 노드(컴포넌트, 프레임 등)의 상세 정보 조회" },
      { name: "get_styles", description: "파일의 스타일(색상, 텍스트 등) 추출" },
      { name: "get_components", description: "컴포넌트 목록 및 상세 정보 조회" },
      { name: "get_images", description: "노드를 이미지로 내보내기 (PNG, SVG 등)" },
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
    tools: [
      { name: "resolve-library-id", description: "라이브러리 이름으로 Context7 ID 조회" },
      { name: "get-library-docs", description: "라이브러리 문서와 코드 예제 조회" },
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
    tools: [
      { name: "find_symbol", description: "심볼(클래스, 함수, 변수) 검색" },
      { name: "get_symbol_definition", description: "심볼의 정의 위치와 내용 조회" },
      { name: "find_references", description: "심볼을 참조하는 모든 위치 찾기" },
      { name: "rename_symbol", description: "심볼 이름 안전하게 변경" },
      { name: "get_file_symbols", description: "파일 내 모든 심볼 목록 조회" },
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
    tools: [
      { name: "browser_navigate", description: "URL로 이동" },
      { name: "browser_screenshot", description: "현재 페이지 스크린샷 캡처" },
      { name: "browser_click", description: "요소 클릭" },
      { name: "browser_type", description: "텍스트 입력" },
      { name: "browser_select_option", description: "드롭다운 선택" },
      { name: "browser_wait_for", description: "요소 대기" },
      { name: "browser_get_text", description: "요소 텍스트 추출" },
      { name: "browser_resize", description: "뷰포트 크기 변경" },
    ],
    examples: [
      { input: "localhost:3000 열고 스크린샷 찍어줘", description: "페이지 스크린샷 캡처" },
      { input: "로그인 폼 테스트해줘", description: "E2E 테스트 실행" },
      { input: "이 버튼 클릭하면 뭐가 나와?", description: "인터랙션 테스트" },
      { input: "모바일 뷰포트로 확인해줘", description: "반응형 테스트" },
    ]
  }
];
