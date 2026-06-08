const VECTOR_DIM = 256;

function normalize(text: string): string {
  return text
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function trigrams(text: string): string[] {
  const padded = ` ${text} `;
  const result: string[] = [];
  for (let i = 0; i <= padded.length - 3; i++) {
    result.push(padded.slice(i, i + 3));
  }
  return result;
}

function hashTrigram(tri: string): number {
  let h = 0;
  for (let i = 0; i < tri.length; i++) {
    h = (h * 31 + tri.charCodeAt(i)) & 0x7fffffff;
  }
  return h % VECTOR_DIM;
}

export function toTrigramVector(text: string): Float32Array {
  const vec = new Float32Array(VECTOR_DIM);
  const norm = normalize(text);
  if (norm.length === 0) return vec;

  for (const tri of trigrams(norm)) {
    vec[hashTrigram(tri)] += 1;
  }

  let mag = 0;
  for (let i = 0; i < VECTOR_DIM; i++) {
    mag += vec[i] * vec[i];
  }
  mag = Math.sqrt(mag);
  if (mag > 0) {
    for (let i = 0; i < VECTOR_DIM; i++) {
      vec[i] /= mag;
    }
  }

  return vec;
}

export const EMBEDDING_DIM = VECTOR_DIM;
