export interface HookVersion {
  version: number;
  command: string;
  scriptContent?: string;
  matcher?: string;
  timeout?: number;
  updatedAt: string;
  updatedBy: string;
  changelog?: string;
}

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
  currentVersion?: number;
  versions?: HookVersion[];
}
