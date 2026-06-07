"use client";

import { useEffect } from "react";
import { socket } from "@/socket/client";
import { useDocumentStore } from "@/store/documents";

export function useSocket() {
  const applyChange = useDocumentStore((s) => s.applyChange);

  useEffect(() => {
    socket.connect();

    socket.on("edit:broadcast", (change) => {
      applyChange(change);
    });

    return () => {
      socket.off("edit:broadcast");
      socket.disconnect();
    };
  }, [applyChange]);
}
