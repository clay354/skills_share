# Skills Share MCP Server

Claude Code에서 커맨드, MCP 서버, 플러그인을 쉽게 설치할 수 있게 해주는 MCP 서버입니다.

**데이터는 Vercel에서 실시간으로 가져옵니다.** 웹사이트에 새로운 skill/command/mcp가 추가되면 자동으로 반영됩니다.

## 설치

### Claude Code 설정에 추가

`~/.claude/settings.json` 또는 프로젝트의 `.claude/settings.json`에 추가:

```json
{
  "mcpServers": {
    "skills-share": {
      "command": "npx",
      "args": ["-y", "skills-share-mcp"]
    }
  }
}
```

## 사용 가능한 도구

| 도구 | 설명 |
|------|------|
| `list_commands` | 사용 가능한 커맨드 목록 조회 |
| `list_mcp_servers` | 사용 가능한 MCP 서버 목록 조회 |
| `list_plugins` | 사용 가능한 플러그인 목록 조회 |
| `get_command_detail` | 커맨드 상세 정보 조회 |
| `get_mcp_detail` | MCP 서버 상세 정보 조회 |
| `install_command` | 커맨드 설치 (~/.claude/commands/에 저장) |
| `install_mcp` | MCP 서버 설정 가이드 출력 |
| `search` | 키워드로 검색 |

## 사용 예시

Claude Code에서:

```
사용 가능한 커맨드 뭐 있어?
→ list_commands 도구 호출

figma-export 커맨드 설치해줘
→ install_command(id: "figma-export") 호출

디자인 관련 MCP 뭐 있어?
→ list_mcp_servers(category: "Design") 호출

clone 검색해줘
→ search(query: "clone") 호출
```

## 포함된 리소스

### Commands
- **clone-site**: 웹사이트 클론
- **figma-export**: Figma 요소 추출
- **spec-recorder**: 기획서 자동 기록

### MCP Servers
- **figma**: Figma 파일 분석
- **context7**: 라이브러리 문서 조회
- **serena**: 시맨틱 코딩 도구
- **playwright**: 브라우저 자동화

### Plugins
- **development**: 개발 종합 플러그인
- **data-science**: 데이터 분석 플러그인

## 개발

```bash
cd mcp-server
npm install
npm run build
npm start
```
