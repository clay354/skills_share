export interface Command {
  id: string;
  name: string;
  description: string;
  category: string;
  content: string;
  installPath: string;
  examples: { input: string; description: string }[];
  updatedAt?: string;
  updatedBy?: string;
}
