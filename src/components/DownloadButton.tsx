"use client";

interface DownloadButtonProps {
  content: string;
  filename: string;
  label?: string;
  className?: string;
}

export function DownloadButton({
  content,
  filename,
  label = "Download",
  className = ""
}: DownloadButtonProps) {
  const handleDownload = () => {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleDownload}
      className={`px-3 py-1.5 text-sm border border-neutral-300 text-neutral-600 hover:text-black hover:border-neutral-400 rounded transition-all ${className}`}
    >
      {label}
    </button>
  );
}
