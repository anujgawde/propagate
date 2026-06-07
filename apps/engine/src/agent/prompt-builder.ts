import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import type { Mismatch, DocumentEnvelope } from "@propagate/contracts";
import type { OllamaChatMessage } from "./ollama.client.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROMPTS_DIR = join(__dirname, "prompts");

function loadPrompt(name: string): string {
  return readFileSync(join(PROMPTS_DIR, `${name}.txt`), "utf-8");
}

const MAX_MISMATCHES_PER_REQUEST = 10;

export function buildFixSuggestionPrompt(
  mismatches: Mismatch[],
  documents: DocumentEnvelope[],
): OllamaChatMessage[] {
  const docTypeMap = new Map(documents.map((d) => [d.id, d.type]));

  const truncated = mismatches.slice(0, MAX_MISMATCHES_PER_REQUEST);

  const mismatchDescriptions = truncated.map((m) => ({
    mismatchId: m.id,
    type: m.type,
    severity: m.severity,
    source: {
      docId: m.source.docId,
      docType: docTypeMap.get(m.source.docId) ?? "unknown",
      elementPath: m.source.elementPath,
      value: m.source.value,
    },
    target: {
      docId: m.target.docId,
      docType: docTypeMap.get(m.target.docId) ?? "unknown",
      elementPath: m.target.elementPath,
      value: m.target.value,
    },
    message: m.message,
  }));

  return [
    { role: "system", content: loadPrompt("fix-suggestion") },
    {
      role: "user",
      content: `Analyze these ${truncated.length} mismatches and propose fixes:\n\n${JSON.stringify(mismatchDescriptions, null, 2)}`,
    },
  ];
}
