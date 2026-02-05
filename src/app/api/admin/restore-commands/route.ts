import { NextResponse } from "next/server";
import redis, { REDIS_KEYS } from "@/lib/redis";
import { Command } from "@/data/commands";
import { getKoreanTimeISO } from "@/lib/utils";

export const dynamic = "force-dynamic";

const NOW = getKoreanTimeISO();

const originalCommands: Command[] = [
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

1. **URL 파싱**: 인자에서 URL을 추출하세요.
2. **저장 폴더 생성**: cloned-sites/{도메인명}/ 폴더 생성
3. **HTML 다운로드**: WebFetch로 메인 HTML 가져오기
4. **CSS/이미지 다운로드**: 관련 리소스 저장
5. **JS 제거**: script 태그 제거
6. **로컬 서버 안내**: python3 -m http.server 8080`,
    updatedAt: NOW,
    updatedBy: "clay",
    currentVersion: 3,
    versions: [
      {
        version: 1,
        content: "# Clone Website\n\nBasic website cloning.",
        updatedAt: "2026-01-15T09:00:00.000Z",
        updatedBy: "clay",
        changelog: "초기 버전"
      },
      {
        version: 2,
        content: "# Clone Website\n\nDownload HTML, CSS, images.",
        updatedAt: "2026-01-25T14:30:00.000Z",
        updatedBy: "clay",
        changelog: "에셋 다운로드 추가"
      },
      {
        version: 3,
        content: `# Clone Website for Testing

주어진 URL의 웹사이트를 클론하여 로컬에서 테스트/수정할 수 있게 합니다.

## 인자
$ARGUMENTS

## 작업 지시

1. **URL 파싱**: 인자에서 URL을 추출하세요.
2. **저장 폴더 생성**: cloned-sites/{도메인명}/ 폴더 생성
3. **HTML 다운로드**: WebFetch로 메인 HTML 가져오기
4. **CSS/이미지 다운로드**: 관련 리소스 저장
5. **JS 제거**: script 태그 제거
6. **로컬 서버 안내**: python3 -m http.server 8080`,
        updatedAt: NOW,
        updatedBy: "clay",
        changelog: "프롬프트 개선"
      }
    ]
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
    ],
    content: `# Figma Export

Figma 페이지/프레임의 개별 요소들을 각각 PNG/SVG로 저장합니다.

## 인자
$ARGUMENTS

## 토큰 위치
- 환경 변수: FIGMA_TOKEN
- 또는 파일: ~/.config/figma/token

## 작업 지시
1. 토큰 확인
2. Figma URL 파싱 (FILE_KEY, node-id)
3. API로 노드 정보 가져오기
4. 이미지 Export 요청
5. 파일 저장`,
    updatedAt: NOW,
    updatedBy: "clay"
  },
  {
    id: "spec-recorder",
    name: "기획서 자동 기록",
    description: "프로젝트 기획서(SPEC.md)를 자동으로 작성하고 업데이트합니다.",
    category: "Documentation",
    installPath: "~/.claude/commands/spec-recorder.md",
    examples: [
      { input: "/spec-recorder", description: "기획서 자동 기록 모드 시작" },
      { input: "/spec-recorder ./docs/SPEC.md", description: "특정 경로에 기획서 저장" },
    ],
    content: `# 기획서 자동 기록 모드

프로젝트 기획서를 자동으로 작성/업데이트합니다.

## 초기 설정
SPEC.md 파일이 없으면 질문:
1. 프로젝트명
2. 프로젝트 목적
3. 주요 파일

## 활성화 후
파일 수정 시마다:
1. 변경 이력 업데이트
2. 섹션별 스펙 업데이트
3. 페이지 구조 업데이트`,
    updatedAt: NOW,
    updatedBy: "clay"
  }
];

export async function POST() {
  try {
    await redis.set(REDIS_KEYS.commands, originalCommands);

    return NextResponse.json({
      success: true,
      message: "Commands restored!",
      count: originalCommands.length,
      commands: originalCommands.map(c => ({ id: c.id, name: c.name }))
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
