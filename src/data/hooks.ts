export interface Hook {
  id: string;
  name: string;
  description: string;
  category: string;
  event: 'PreToolUse' | 'PostToolUse' | 'Notification' | 'Stop';
  matcher?: string;
  command: string;
  scriptContent?: string;  // 스크립트 파일 내용
  scriptPath?: string;     // 설치 경로 (예: ~/.claude/hooks/my-hook.js)
  timeout?: number;
  examples: { input: string; description: string }[];
  createdAt: string;
  updatedAt?: string;
  updatedBy?: string;
}
