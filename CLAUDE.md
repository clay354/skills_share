# Skills Share 프로젝트 컨텍스트

## 배포 구조

### 웹 (Vercel)
- main 브랜치에 푸시하면 자동 배포

### MCP Server (npm)
- **GitHub Actions가 자동으로 npm publish 함**
- 로컬에서 직접 `npm publish` 하지 말 것 (버전 충돌 발생)
- 버전 올릴 때: `mcp-server/package.json` + `mcp-server/src/index.ts` 둘 다 수정

## 카테고리 구조

| 카테고리 | 버전관리 | 파일저장 | 비고 |
|----------|----------|----------|------|
| Command | O (versions[]) | ~/.claude/commands/*.md | 슬래시 커맨드 |
| MCP | O (isOwned일때만) | 설정만 | MCP 서버 설정 |
| Plugin | X | 설정만 | 플러그인 설정 |
| Hook | X | ~/.claude/hooks/* | 이벤트 훅 스크립트 |

## Hook 특이사항
- `scriptContent`: 스크립트 파일 내용 저장
- `scriptPath`: 설치 경로 (예: ~/.claude/hooks/my-hook.js)
- install_hook 시 MCP가 파일 자동 생성

## 주요 파일 위치
- 타입 정의: `src/data/`
- API: `src/app/api/`
- 페이지: `src/app/[category]/[id]/page.tsx`
- MCP 서버: `mcp-server/src/index.ts`
- 설치 프롬프트: `src/lib/installPrompts.ts`
