"use client";

import { useAgentStore } from "@/store/agent";

export function AgentStatusBadge() {
  const available = useAgentStore((s) => s.available);

  if (available === null) return null;

  return (
    <div className="flex items-center gap-2 text-xs text-zinc-400">
      <span
        className={`inline-block h-2 w-2 rounded-full ${
          available ? "bg-emerald-500" : "bg-zinc-600"
        }`}
      />
      <span>{available ? "Agent online" : "Agent offline"}</span>
    </div>
  );
}
