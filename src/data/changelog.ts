export interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  changes: {
    type: "feature" | "fix" | "improvement" | "breaking";
    description: string;
  }[];
}

export const changelog: ChangelogEntry[] = [
  {
    version: "1.2.0",
    date: "2026-02-05",
    title: "Redis 마이그레이션 및 작성자 추적",
    changes: [
      { type: "breaking", description: "Edge Config에서 Upstash Redis로 데이터 저장소 마이그레이션" },
      { type: "feature", description: "업로드/업데이트 시 authorName 필수 입력으로 작성자 추적" },
      { type: "feature", description: "웹페이지에 업데이트 날짜 및 작성자 표시" },
      { type: "feature", description: "MCP 도구에 authorName 파라미터 추가 (upload/update)" },
      { type: "improvement", description: "정적 데이터 제거, 모든 데이터를 Redis에서 관리" },
      { type: "improvement", description: "MCP 상세 페이지에 Tools 섹션 추가" },
    ]
  },
  {
    version: "1.1.0",
    date: "2026-02-05",
    title: "업데이트 기능 및 도구 설명 추가",
    changes: [
      { type: "feature", description: "업로드한 커맨드/MCP/플러그인 업데이트 기능 추가 (PUT API)" },
      { type: "feature", description: "MCP 서버에 update_command, update_mcp, update_plugin 도구 추가" },
      { type: "feature", description: "MCP 서버 데이터에 tools 필드 추가 (도구 목록 및 설명)" },
      { type: "improvement", description: "모든 MCP 서버에 제공 도구 목록 추가" },
    ]
  },
  {
    version: "1.0.1",
    date: "2026-02-05",
    title: "Edge Config 업로드 기능",
    changes: [
      { type: "feature", description: "로컬 커맨드를 웹사이트에 업로드하는 기능 추가" },
      { type: "feature", description: "MCP 서버 설정 업로드 기능 추가" },
      { type: "feature", description: "플러그인 정보 업로드 기능 추가" },
      { type: "feature", description: "upload_command, upload_mcp, upload_plugin 도구 추가" },
      { type: "improvement", description: "Vercel Edge Config를 저장소로 사용" },
    ]
  },
  {
    version: "1.0.0",
    date: "2026-02-04",
    title: "MCP 서버 공개",
    changes: [
      { type: "feature", description: "Skills Share MCP 서버 npm 패키지 배포" },
      { type: "feature", description: "웹사이트에서 MCP 서버 빠른 설치 기능 추가" },
      { type: "feature", description: "list_commands, list_mcp_servers, list_plugins 도구" },
      { type: "feature", description: "install_command, install_mcp 도구로 바로 설치" },
      { type: "feature", description: "search 도구로 키워드 검색" },
    ]
  },
  {
    version: "0.3.0",
    date: "2026-02-04",
    title: "Spec Recorder 커맨드 개선",
    changes: [
      { type: "feature", description: "기획서 자동 기록 모드에 Hook 자동 등록 기능 추가" },
      { type: "fix", description: "PostToolUse Hook 스키마 수정 (matcher 필드 사용)" },
      { type: "improvement", description: "파일 수정 시 SPEC.md 업데이트 리마인더 표시" },
    ]
  },
  {
    version: "0.2.0",
    date: "2026-02-03",
    title: "API 엔드포인트 추가",
    changes: [
      { type: "feature", description: "Commands API 엔드포인트 (/api/commands)" },
      { type: "feature", description: "MCP API 엔드포인트 (/api/mcp)" },
      { type: "feature", description: "Plugins API 엔드포인트 (/api/plugins)" },
      { type: "improvement", description: "GitHub Actions로 자동 npm 배포 설정" },
    ]
  },
  {
    version: "0.1.0",
    date: "2026-02-02",
    title: "초기 릴리스",
    changes: [
      { type: "feature", description: "Skills Share 웹사이트 런칭" },
      { type: "feature", description: "PR Description 커맨드 추가" },
      { type: "feature", description: "Convention Sync 커맨드 추가" },
      { type: "feature", description: "Spec Recorder 커맨드 추가" },
      { type: "feature", description: "Development Plugin, Data Science Plugin 추가" },
      { type: "feature", description: "Figma, Context7, Serena, Playwright MCP 서버 정보 추가" },
    ]
  }
];
