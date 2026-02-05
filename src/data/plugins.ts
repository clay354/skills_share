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
  updatedAt?: string;
  updatedBy?: string;
}

export interface Marketplace {
  id: string;
  name: string;
  description: string;
  source: string;
  installCommand: string;
}
