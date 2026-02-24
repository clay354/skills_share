# Skills Share 프로젝트

Claude Code에서 커맨드, MCP 서버, 플러그인, 훅을 공유하는 플랫폼.

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프론트엔드 | Next.js 16, React 19, Tailwind CSS 4 |
| 데이터베이스 | Upstash Redis (Vercel KV) |
| 배포 (웹) | Vercel (자동 배포) |
| 배포 (MCP) | npm (GitHub Actions 자동 배포) |
| 언어 | TypeScript |

## 배포 구조

### 웹 (Vercel)
- main 브랜치에 푸시 → 자동 배포
- URL: skills-share.vercel.app (예시)

### MCP Server (npm)
- **GitHub Actions가 자동으로 npm publish 함** (`.github/workflows/publish-mcp.yml`)
- 트리거: main 브랜치 푸시 + `mcp-server/**` 경로 변경 시
- **로컬에서 직접 `npm publish` 하지 말 것** (버전 충돌 발생)
- 버전 올릴 때: `mcp-server/package.json` + `mcp-server/src/index.ts` 둘 다 수정
- npm 패키지명: `skills-share-mcp`

## 데이터베이스

### Upstash Redis (Vercel KV)
- 환경변수: `KV_REST_API_URL`, `KV_REST_API_TOKEN`
- 클라이언트: `src/lib/redis.ts`

### Redis Keys
```typescript
REDIS_KEYS = {
  commands: 'commands',      // Command[]
  plugins: 'plugins',        // Plugin[]
  mcpServers: 'mcpServers',  // MCPServer[]
  hooks: 'hooks',            // Hook[]
}
```

### 데이터 구조
- 각 키에 배열 형태로 저장 (JSON)
- 업데이트 시 전체 배열 읽기 → 수정 → 덮어쓰기

## 카테고리별 특성

| 카테고리 | 버전관리 | 파일저장 위치 | 용도 |
|----------|----------|---------------|------|
| Command | O (`versions[]`) | `~/.claude/commands/*.md` | 슬래시 커맨드 |
| MCP | O (`isOwned`일때만) | 설정만 | MCP 서버 설정 |
| Plugin | X | 설정만 | 플러그인 설정 |
| Hook | X | `~/.claude/hooks/*` | 이벤트 훅 스크립트 |

## 데이터 타입 정의

### Command (`src/data/commands.ts`)
```typescript
interface CommandVersion {
  version: number;
  content: string;
  updatedAt: string;
  updatedBy: string;
  changelog?: string;
}

interface Command {
  id: string;
  name: string;
  description: string;
  category: string;
  content: string;           // 최신 버전 (하위 호환)
  installPath: string;       // ~/.claude/commands/{id}.md
  examples: { input: string; description: string }[];
  updatedAt?: string;
  updatedBy?: string;
  currentVersion?: number;
  versions?: CommandVersion[];
}
```

### MCPServer (`src/data/mcp.ts`)
```typescript
interface MCPServer {
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
  updatedAt?: string;
  updatedBy?: string;
  isOwned?: boolean;          // true면 버전 관리 적용
  currentVersion?: number;
  versions?: MCPVersion[];
}
```

### Plugin (`src/data/plugins.ts`)
```typescript
interface Plugin {
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
  updatedAt?: string;
  updatedBy?: string;
}
```

### Hook (`src/data/hooks.ts`)
```typescript
interface Hook {
  id: string;
  name: string;
  description: string;
  category: string;
  event: 'PreToolUse' | 'PostToolUse' | 'Notification' | 'Stop';
  matcher?: string;
  command: string;           // 실행 명령어
  scriptContent?: string;    // 스크립트 파일 내용
  scriptPath?: string;       // 설치 경로 (~/.claude/hooks/...)
  timeout?: number;
  examples: { input: string; description: string }[];
  createdAt: string;
  updatedAt?: string;
  updatedBy?: string;
}
```

## 프로젝트 구조

```
skills_share/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── commands/route.ts    # GET, POST, PUT
│   │   │   ├── mcp/route.ts
│   │   │   ├── plugins/route.ts
│   │   │   ├── hook/route.ts
│   │   │   └── admin/               # 관리자 API
│   │   ├── commands/[id]/page.tsx   # 상세 페이지
│   │   ├── mcp/[id]/page.tsx
│   │   ├── plugins/[id]/page.tsx
│   │   ├── hooks/[id]/page.tsx
│   │   └── page.tsx                 # 메인 페이지
│   ├── components/
│   │   ├── CopyButton.tsx
│   │   └── QuickInstall.tsx
│   ├── data/                        # 타입 정의
│   │   ├── commands.ts
│   │   ├── mcp.ts
│   │   ├── plugins.ts
│   │   └── hooks.ts
│   └── lib/
│       ├── redis.ts                 # Redis 클라이언트
│       ├── installPrompts.ts        # 설치 프롬프트 생성
│       └── utils.ts                 # getKoreanTimeISO() 등
├── mcp-server/                      # npm 패키지
│   ├── src/index.ts                 # MCP 서버 구현
│   ├── package.json
│   └── tsconfig.json
├── .github/workflows/
│   └── publish-mcp.yml              # npm 자동 배포
└── CLAUDE.md                        # 이 파일
```

## API 엔드포인트

### Commands
- `GET /api/commands` - 목록 (category 필터 가능)
- `GET /api/commands?id={id}` - 상세 (version 파라미터로 특정 버전)
- `POST /api/commands` - 새 커맨드 생성
- `PUT /api/commands` - 업데이트 (content 변경 시 새 버전 생성)

### MCP
- `GET /api/mcp` - 목록
- `GET /api/mcp?id={id}` - 상세
- `POST /api/mcp` - 새 MCP 생성
- `PUT /api/mcp` - 업데이트

### Plugins
- `GET /api/plugins` - 목록
- `GET /api/plugins?id={id}` - 상세
- `POST /api/plugins` - 새 플러그인 생성
- `PUT /api/plugins` - 업데이트

### Hooks
- `GET /api/hook` - 목록 (category, event 필터 가능)
- `GET /api/hook?id={id}` - 상세
- `POST /api/hook` - 새 훅 생성
- `PUT /api/hook` - 업데이트

## MCP 서버 도구

| 도구 | 설명 |
|------|------|
| `list_commands` | 커맨드 목록 |
| `list_mcp_servers` | MCP 서버 목록 |
| `list_plugins` | 플러그인 목록 |
| `list_hooks` | 훅 목록 |
| `get_command_detail` | 커맨드 상세 |
| `get_mcp_detail` | MCP 상세 |
| `get_hook_detail` | 훅 상세 |
| `install_command` | 커맨드 설치 (파일 생성) |
| `install_mcp` | MCP 설정 안내 |
| `install_hook` | 훅 설치 (스크립트 파일 생성 + 설정 안내) |
| `upload_command` | 커맨드 업로드 (file_path로 파일 읽기) |
| `upload_mcp` | MCP 업로드 |
| `upload_hook` | 훅 업로드 (file_path로 스크립트 포함 가능) |
| `update_command` | 커맨드 업데이트 |
| `update_mcp` | MCP 업데이트 |
| `update_hook` | 훅 업데이트 |
| `search` | 전체 검색 |

## 디자인 시스템

- 전체 배경: `bg-amber-50`
- Command: 파란색 계열 (`blue-50`, `blue-600`)
- MCP: 보라색 네오브루탈리즘 (`purple-700`, 두꺼운 테두리 + 그림자)
- Plugin: 녹색 계열 (`green-50`, `green-600`)
- Hook: 검정 네오브루탈리즘 (`neutral-800`, 두꺼운 테두리 + 그림자)

## 시간대
- 모든 시간은 한국시간(KST)으로 저장
- `src/lib/utils.ts`의 `getKoreanTimeISO()` 사용

## 주의사항

1. **npm publish 직접 하지 말 것** - GitHub Actions가 자동 배포
2. **버전 올릴 때 두 곳 수정** - `package.json` + `index.ts`
3. **Redis는 배열 통째로 저장** - 개별 항목 수정 시 전체 읽고 덮어쓰기
4. **force-dynamic 필수** - 모든 페이지에 `export const dynamic = "force-dynamic"`
5. **Hook의 scriptContent** - 스크립트 내용 저장하면 install 시 자동 파일 생성
