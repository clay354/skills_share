"use client";

import { useState } from "react";

interface CopyButtonProps {
  text: string;
  label?: string;
  className?: string;
}

export function CopyButton({ text, label = "Copy", className = "" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`px-3 py-1.5 text-sm border rounded transition-all ${
        copied
          ? "border-green-500 text-green-600 bg-green-50"
          : "border-neutral-300 text-neutral-600 hover:text-black hover:border-neutral-400"
      } ${className}`}
    >
      {copied ? "Copied" : label}
    </button>
  );
}
