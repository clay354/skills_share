export interface Hook {
  id: string;
  name: string;
  description: string;
  category: string;
  event: 'PreToolUse' | 'PostToolUse' | 'Notification' | 'Stop';
  matcher?: string;
  command: string;
  timeout?: number;
  examples: { input: string; description: string }[];
  createdAt: string;
  updatedAt?: string;
  updatedBy?: string;
}
