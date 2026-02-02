export interface Command {
  id: string;
  name: string;
  description: string;
  category: string;
  content: string;
  installPath: string;
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
  }
];
