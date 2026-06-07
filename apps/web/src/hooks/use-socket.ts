"use client";

import { useEffect } from "react";
import { socket } from "@/socket/client";
import { useDocumentStore } from "@/store/documents";
import type { Change } from "@propagate/contracts";

export function useSocket() {
  const applyChange = useDocumentStore((s) => s.applyChange);

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

    return () => {
      socket.off("edit:broadcast");
      socket.off("propagate:broadcast");
      socket.disconnect();
    };
  }, [applyChange]);
}
