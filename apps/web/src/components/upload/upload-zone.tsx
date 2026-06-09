"use client";

import { useRef, useState } from "react";
import { useDocumentStore } from "@/store/documents";

const ENGINE_URL = process.env.NEXT_PUBLIC_ENGINE_URL ?? "http://localhost:3001";

export function UploadZone() {
  const inputRef = useRef<HTMLInputElement>(null);
  const addDocument = useDocumentStore((s) => s.addDocument);
  const setGraphState = useDocumentStore((s) => s.setGraphState);
  const documents = useDocumentStore((s) => s.documents);
  const clearAll = useDocumentStore((s) => s.clearAll);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);

    try {
      for (const file of Array.from(files)) {
        const form = new FormData();
        form.append("file", file);

        const res = await fetch(`${ENGINE_URL}/api/upload`, {
          method: "POST",
          body: form,
        });

        if (!res.ok) {
          throw new Error(`Upload failed: ${res.statusText}`);
        }

        const { envelope, graph } = await res.json();
        addDocument(envelope);
        if (graph) {
          setGraphState(graph.crossRefs, graph.mismatches);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleReset() {
    try {
      await fetch(`${ENGINE_URL}/api/reset`, { method: "POST" });
      clearAll();
    } catch {
      setError("Failed to reset");
    }
  }

  return (
    <div className="flex items-center gap-3">
      {error && <span className="text-sm text-red-500">{error}</span>}
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".ifc,.xlsx,.xls,.pdf"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      {documents.length > 0 && (
        <button
          onClick={handleReset}
          className="rounded-md px-3 py-1.5 text-sm text-ink-faint transition-colors hover:text-red-500"
        >
          Clear
        </button>
      )}
      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="rounded-md border border-edge px-4 py-1.5 text-sm text-ink-secondary transition-colors hover:border-ink-faint hover:text-ink disabled:opacity-50"
      >
        {uploading ? "Uploading..." : "Upload documents"}
      </button>
    </div>
  );
}
