export interface Command {
  id: string;
  name: string;
  description: string;
  category: string;
  content: string;
  installPath: string;
  examples: { input: string; description: string }[];
}

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

export const commands: Command[] = [
  {
    id: "clone-site",
    name: "Clone Website",
    description: "주어진 URL의 웹사이트를 클론하여 로컬에서 테스트/수정할 수 있게 합니다. HTML, CSS, 이미지를 다운로드하고 JS는 제거합니다.",
    category: "Web",
    installPath: "~/.claude/commands/clone-site.md",
    examples: [
      { input: "/clone-site https://example.com", description: "example.com 전체 페이지 클론" },
      { input: "/clone-site https://stripe.com/pricing", description: "Stripe 가격 페이지만 클론해서 디자인 참고" },
      { input: "/clone-site https://linear.app --images-only", description: "이미지 에셋만 추출" },
    ],
    content: `# Clone Website for Testing

주어진 URL의 웹사이트를 클론하여 로컬에서 테스트/수정할 수 있게 합니다.

## 인자
$ARGUMENTS

## 작업 지시

1. **URL 파싱**: 인자에서 URL을 추출하세요. URL이 없으면 사용자에게 요청하세요.

2. **저장 폴더 생성**: 현재 작업 디렉토리에 \`cloned-sites/{도메인명}/\` 폴더를 만드세요.

3. **HTML 다운로드**: WebFetch 또는 curl로 메인 HTML을 가져오세요.

4. **CSS 추출 및 다운로드**:
   - HTML에서 \`<link rel="stylesheet">\` 태그의 href 추출
   - 각 CSS 파일을 다운로드하여 저장
   - HTML 내 \`<style>\` 태그 내용도 보존

5. **이미지 다운로드**:
   - \`<img src="">\` 태그에서 이미지 URL 추출
   - 이미지 파일들을 \`images/\` 폴더에 저장
   - HTML에서 경로를 상대 경로로 수정

6. **JS 제거**:
   - \`<script>\` 태그 전부 제거
   - \`.js\` 파일은 다운로드하지 않음

7. **경로 수정**:
   - CSS, 이미지 경로를 로컬 상대 경로로 변경

8. **결과 저장**:
   - \`index.html\` - 수정된 HTML
   - \`css/\` - CSS 파일들
   - \`images/\` - 이미지 파일들

9. **로컬 서버 안내**:
   \`\`\`
   cd cloned-sites/{도메인명}
   python3 -m http.server 8080
   # http://localhost:8080 에서 확인
   \`\`\`

## 주의사항
- 외부 CDN CSS (Google Fonts 등)는 링크 유지
- inline style은 보존
- 상대 경로와 절대 경로 모두 처리
- 에러 발생 시 어떤 리소스가 실패했는지 알려주기
`
  },
  {
    id: "figma-export",
    name: "Figma Export",
    description: "Figma 페이지/프레임의 개별 요소들을 각각 PNG/SVG로 저장합니다. Figma API를 사용합니다.",
    category: "Design",
    installPath: "~/.claude/commands/figma-export.md",
    examples: [
      { input: "/figma-export https://figma.com/design/abc123/MyApp?node-id=100-200", description: "특정 프레임의 모든 요소를 PNG로 추출" },
      { input: "/figma-export https://figma.com/design/abc123/Icons --svg", description: "아이콘을 SVG로 추출" },
      { input: "/figma-export https://figma.com/design/abc123/App --scale 3", description: "3배 해상도로 추출 (레티나용)" },
      { input: "/figma-export https://figma.com/design/abc123/Screens --top", description: "최상위 프레임만 추출 (개별 요소 X)" },
    ],
    content: `# Figma Export

Figma 페이지/프레임의 **개별 요소들**을 각각 PNG/SVG로 저장합니다.

## 인자
$ARGUMENTS

## 토큰 위치
- 환경 변수: \`FIGMA_TOKEN\`
- 또는 파일: \`~/.config/figma/token\`

## 작업 지시

### 1. 토큰 확인
\`\`\`bash
TOKEN=$(cat ~/.config/figma/token 2>/dev/null || echo $FIGMA_TOKEN)
\`\`\`
토큰이 없으면 설정 방법 안내 후 중단.

### 2. 인자 파싱
인자에서 추출:
- **Figma URL**: \`figma.com/file/{FILE_KEY}/...\` 또는 \`figma.com/design/{FILE_KEY}/...\`
- **node-id**: URL의 \`node-id\` 파라미터 (예: \`2010-2693\` → API에서는 \`2010:2693\`)
- **옵션**:
  - \`--png\` : PNG로 저장 (기본값)
  - \`--svg\` : SVG로 저장
  - \`--scale N\` : 해상도 배율 (기본값: 2)
  - \`--all\` : 모든 하위 요소 추출 (기본값)
  - \`--top\` : 최상위 프레임만 추출

### 3. 파일/노드 정보 가져오기
\`\`\`bash
FILE_KEY="추출한_파일_키"
NODE_ID="노드ID (있으면)"

# 특정 노드 또는 전체 파일
if [ -n "$NODE_ID" ]; then
  curl -s -H "X-Figma-Token: $TOKEN" \\
    "https://api.figma.com/v1/files/$FILE_KEY/nodes?ids=$NODE_ID&depth=10"
else
  curl -s -H "X-Figma-Token: $TOKEN" \\
    "https://api.figma.com/v1/files/$FILE_KEY"
fi
\`\`\`

### 4. 개별 요소 추출 (핵심 로직)

Python으로 모든 자식 노드를 재귀적으로 추출:

\`\`\`python
def get_all_nodes(node, depth=0):
    """재귀적으로 모든 노드 추출"""
    results = []
    node_type = node.get('type', '')
    node_name = node.get('name', '')
    node_id = node.get('id', '')

    exportable_types = [
        'TEXT', 'RECTANGLE', 'ELLIPSE', 'VECTOR',
        'INSTANCE', 'COMPONENT', 'FRAME', 'GROUP', 'LINE', 'IMAGE'
    ]

    if node_type in exportable_types:
        results.append({
            'id': node_id,
            'name': node_name,
            'type': node_type,
            'depth': depth
        })

    for child in node.get('children', []):
        results.extend(get_all_nodes(child, depth + 1))

    return results
\`\`\`

### 5. 이미지 Export 요청

\`\`\`bash
curl -s -H "X-Figma-Token: $TOKEN" \\
  "https://api.figma.com/v1/images/$FILE_KEY?ids=$NODE_IDS&format=$FORMAT&scale=$SCALE"
\`\`\`

### 6. 파일명 생성 규칙
- \`{타입}_{이름}.png\`
- 특수문자 제거, 공백은 언더스코어로 변환

### 7. 결과 보고
\`\`\`
✅ Export 완료!
📁 저장 위치: ./figma-exports/{파일명}/
📊 총 {N}개 요소 저장됨
\`\`\`

## 토큰 설정 방법 (최초 1회)
\`\`\`bash
mkdir -p ~/.config/figma
echo "YOUR_TOKEN_HERE" > ~/.config/figma/token
chmod 600 ~/.config/figma/token
\`\`\`

토큰 발급: Figma → Settings → Security → Personal access tokens
`
  },
  {
    id: "spec-recorder",
    name: "기획서 자동 기록",
    description: "프로젝트 기획서(SPEC.md)를 자동으로 작성하고 업데이트합니다. 파일 수정 시마다 변경 이력, 섹션 스펙, 페이지 구조를 자동 갱신합니다.",
    category: "Documentation",
    installPath: "~/.claude/commands/spec-recorder.md",
    examples: [
      { input: "/spec-recorder", description: "기획서 자동 기록 모드 시작 (신규 생성 또는 기존 불러오기)" },
      { input: "/spec-recorder ./docs/SPEC.md", description: "특정 경로에 기획서 저장" },
    ],
    content: `# 기획서 자동 기록 모드 활성화

이 스킬을 실행하면 프로젝트 기획서를 자동으로 작성/업데이트합니다.

## 1. 초기 설정 (최초 실행 시)

프로젝트 루트에 \`SPEC.md\` 파일이 없으면 사용자에게 다음을 질문하세요:

1. **프로젝트명**: "프로젝트 이름이 뭔가요?"
2. **프로젝트 목적**: "이 프로젝트의 목적을 간단히 설명해주세요"
3. **주요 파일**: "메인 HTML/페이지 파일명이 뭔가요?"
4. **기획서 위치**: "기획서를 어디에 저장할까요? (기본: ./SPEC.md)"

답변을 받은 후 아래 템플릿으로 \`SPEC.md\` 생성:

\`\`\`markdown
# [프로젝트명] 기획서

> 최종 수정: YYYY-MM-DD HH:MM
> 버전: v1.0

## 1. 프로젝트 개요

| 항목 | 내용 |
|------|------|
| 프로젝트명 | [프로젝트명] |
| 목적 | [프로젝트 목적] |
| 주요 파일 | [메인 파일명] |
| 작성일 | YYYY-MM-DD |

---

## 2. 전체 페이지 구조

[Header]
├── 로고
├── GNB 메뉴
└── CTA 버튼

[Section 1: Hero]
├── 헤드라인
├── 서브텍스트
└── CTA

[Section 2: ...]
└── ...

[Footer]
└── ...

---

## 3. 섹션별 스펙

### 3.1 Header
| 항목 | 스펙 |
|------|------|
| 높이 | 00px |
| 배경 | #000000 |
| 로고 | 파일명.svg |
| 메뉴 | 메뉴1, 메뉴2, ... |

### 3.2 Hero
| 항목 | 스펙 |
|------|------|
| 헤드라인 | "텍스트" |
| 서브텍스트 | "텍스트" |
| CTA | 버튼 텍스트 |
| 배경 | 이미지/색상 |

(섹션 추가...)

---

## 4. 변경 이력

| 날짜 | 버전 | 변경 내용 | 작업자 |
|------|------|-----------|--------|
| YYYY-MM-DD | v1.0 | 최초 작성 | - |
\`\`\`

## 2. 활성화 후 규칙

**중요: 이 지시는 현재 대화가 끝날 때까지 유효합니다.**

파일 수정할 때마다:

1. **변경 이력 업데이트**
   - 버전 0.1 증가
   - 변경 내용 한 줄 요약 추가
   - 최종 수정 시간 갱신

2. **섹션별 스펙 업데이트**
   - 변경된 섹션의 스펙 테이블 수정
   - 새 섹션 추가 시 구조도와 스펙 테이블 모두 추가

3. **페이지 구조 업데이트**
   - 섹션 순서 변경, 추가, 삭제 시 구조도 수정

## 3. 활성화 메시지

스킬 실행 시:

**SPEC.md 없을 때:**
기획서 자동 기록 모드를 시작합니다.

몇 가지 질문드릴게요:
1. 프로젝트 이름이 뭔가요?

**SPEC.md 있을 때:**
기획서 자동 기록 모드가 활성화되었습니다.
기존 기획서를 불러왔습니다: [파일경로]
현재 버전: vX.X

이제부터 변경사항이 자동으로 기록됩니다.

## 4. Confluence 호환

생성되는 마크다운은 Confluence에 바로 붙여넣기 가능한 형태입니다:
- 테이블 문법 호환
- 코드 블록 호환
- 헤딩 구조 호환
`
  }
];

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
