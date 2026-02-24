"use client";

import { useState } from "react";

export default function SeedVersionsPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [result, setResult] = useState<string>("");

  const handleSeed = async () => {
    setStatus("loading");
    try {
      const res = await fetch("/api/admin/seed-versions", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setStatus("success");
        setResult(JSON.stringify(data, null, 2));
      } else {
        setStatus("error");
        setResult(data.error || "Unknown error");
      }
    } catch (err) {
      setStatus("error");
      setResult(String(err));
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="max-w-md w-full p-8">
        <h1 className="text-2xl font-bold mb-4">Seed Version History</h1>
        <p className="text-neutral-600 mb-6">
          clone-website 커맨드에 예시 버전 히스토리(v1, v2, v3)를 추가합니다.
        </p>

        <button
          onClick={handleSeed}
          disabled={status === "loading"}
          className="w-full py-3 px-4 bg-black text-white rounded-lg hover:bg-neutral-800 disabled:bg-neutral-400"
        >
          {status === "loading" ? "처리 중..." : "버전 히스토리 추가"}
        </button>

        {status === "success" && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700 font-medium mb-2">성공!</p>
            <pre className="text-xs text-green-600 overflow-auto max-h-40">{result}</pre>
            <a
              href="/commands/clone-website"
              className="inline-block mt-3 text-sm text-green-700 underline"
            >
              clone-website 페이지에서 확인 →
            </a>
          </div>
        )}

        {status === "error" && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 font-medium mb-2">에러 발생</p>
            <pre className="text-xs text-red-600">{result}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
