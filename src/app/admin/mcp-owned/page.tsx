"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface MCPServer {
  id: string;
  name: string;
  isOwned?: boolean;
}

export default function MCPOwnedPage() {
  const [mcpServers, setMcpServers] = useState<MCPServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/mcp")
      .then((res) => res.json())
      .then((data) => {
        setMcpServers(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const toggleOwned = async (mcpId: string, currentOwned: boolean) => {
    setUpdating(mcpId);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/set-mcp-owned", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mcpId, isOwned: !currentOwned }),
      });

      const data = await res.json();

      if (res.ok) {
        setMcpServers((prev) =>
          prev.map((m) =>
            m.id === mcpId ? { ...m, isOwned: !currentOwned } : m
          )
        );
        setMessage(`${mcpId}: isOwned = ${!currentOwned}`);
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (err) {
      setMessage(`Error: ${err}`);
    }

    setUpdating(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-neutral-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <Link href="/" className="inline-block text-sm text-neutral-500 hover:text-black mb-8">
          ← Back
        </Link>

        <h1 className="text-2xl font-semibold text-black mb-2">MCP isOwned 설정</h1>
        <p className="text-neutral-600 mb-8">isOwned: true인 MCP만 버전 관리가 적용됩니다.</p>

        {message && (
          <div className="mb-6 p-3 bg-blue-50 text-blue-700 rounded-lg text-sm">
            {message}
          </div>
        )}

        <div className="space-y-3">
          {mcpServers.map((mcp) => (
            <div
              key={mcp.id}
              className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl"
            >
              <div>
                <p className="font-medium text-black">{mcp.name}</p>
                <p className="text-xs text-neutral-500">{mcp.id}</p>
              </div>
              <button
                onClick={() => toggleOwned(mcp.id, !!mcp.isOwned)}
                disabled={updating === mcp.id}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  mcp.isOwned
                    ? "bg-green-100 text-green-700 hover:bg-green-200"
                    : "bg-neutral-200 text-neutral-600 hover:bg-neutral-300"
                } disabled:opacity-50`}
              >
                {updating === mcp.id
                  ? "..."
                  : mcp.isOwned
                  ? "isOwned: true"
                  : "isOwned: false"}
              </button>
            </div>
          ))}

          {mcpServers.length === 0 && (
            <p className="text-neutral-400 text-center py-8">MCP 서버가 없습니다.</p>
          )}
        </div>
      </div>
    </div>
  );
}
