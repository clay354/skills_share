"use client";

import { CopyButton } from "./CopyButton";

interface CodeBlockProps {
  code: string;
  language?: string;
  showCopy?: boolean;
}

export function CodeBlock({ code, language = "markdown", showCopy = true }: CodeBlockProps) {
  return (
    <div className="relative group">
      <pre className="bg-gray-900 rounded-lg p-4 overflow-x-auto text-sm">
        <code className={`language-${language} text-gray-100`}>
          {code}
        </code>
      </pre>
      {showCopy && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <CopyButton text={code} label="복사" className="text-xs px-2 py-1" />
        </div>
      )}
    </div>
  );
}
