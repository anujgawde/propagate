"use client";

import { useEffect } from "react";
import { socket } from "@/socket/client";
import { useDocumentStore } from "@/store/documents";
import { useAgentStore } from "@/store/agent";
import type { Change, AgentSuggestionsPayload, AgentMatchConfirmPayload } from "@propagate/contracts";

const ENGINE_URL = process.env.NEXT_PUBLIC_ENGINE_URL ?? "http://localhost:3001";

export function useSocket() {
  const applyChange = useDocumentStore((s) => s.applyChange);
  const setAvailable = useAgentStore((s) => s.setAvailable);
  const setSuggestions = useAgentStore((s) => s.setSuggestions);
  const setConfirmations = useAgentStore((s) => s.setConfirmations);

  useEffect(() => {
    socket.connect();

    socket.on("edit:broadcast", (change: Change) => {
      applyChange(change);
    });

    socket.on("propagate:broadcast", (changes: Change[]) => {
      for (const change of changes) {
        applyChange(change);
      }
    });

    socket.on("agent:status", (payload: { available: boolean }) => {
      setAvailable(payload.available);
    });

    socket.on("agent:suggestions", (payload: AgentSuggestionsPayload) => {
      setSuggestions(payload.suggestions);
    });

    socket.on("agent:match-confirmations", (payload: AgentMatchConfirmPayload) => {
      setConfirmations(payload.confirmations);
    });

    fetch(`${ENGINE_URL}/api/agent/health`)
      .then((r) => r.json())
      .then((data) => setAvailable(data.available))
      .catch(() => setAvailable(false));

    return () => {
      socket.off("edit:broadcast");
      socket.off("propagate:broadcast");
      socket.off("agent:status");
      socket.off("agent:suggestions");
      socket.off("agent:match-confirmations");
      socket.disconnect();
    };
  }, [applyChange, setAvailable, setSuggestions, setConfirmations]);
}
