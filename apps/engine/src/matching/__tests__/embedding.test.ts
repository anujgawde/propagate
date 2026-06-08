import { describe, it, expect } from "vitest";
import { toTrigramVector, EMBEDDING_DIM } from "../embedding.js";

function cosine(a: Float32Array, b: Float32Array): number {
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

describe("toTrigramVector", () => {
  it("returns a vector of the correct dimension", () => {
    const vec = toTrigramVector("OPERATORY 1");
    expect(vec).toBeInstanceOf(Float32Array);
    expect(vec.length).toBe(EMBEDDING_DIM);
  });

  it("returns a zero vector for empty string", () => {
    const vec = toTrigramVector("");
    expect(vec.every((v) => v === 0)).toBe(true);
  });

  it("is deterministic", () => {
    const a = toTrigramVector("STERILIZATION");
    const b = toTrigramVector("STERILIZATION");
    expect(Array.from(a)).toEqual(Array.from(b));
  });

  it("is case-insensitive", () => {
    const a = toTrigramVector("Operatory 1");
    const b = toTrigramVector("OPERATORY 1");
    expect(cosine(a, b)).toBeCloseTo(1.0, 5);
  });

  it("normalizes punctuation and whitespace", () => {
    const a = toTrigramVector("X-RAY  ROOM");
    const b = toTrigramVector("XRAY ROOM");
    expect(cosine(a, b)).toBeCloseTo(1.0, 5);
  });

  it("produces L2-normalized vectors", () => {
    const vec = toTrigramVector("CONSULTATION");
    let mag = 0;
    for (let i = 0; i < vec.length; i++) mag += vec[i] * vec[i];
    expect(Math.sqrt(mag)).toBeCloseTo(1.0, 5);
  });

  it("gives high similarity for abbreviations", () => {
    const full = toTrigramVector("OPERATORY 1");
    const abbrev = toTrigramVector("OP 1");
    const sim = cosine(full, abbrev);
    expect(sim).toBeGreaterThan(0.2);
  });

  it("gives high similarity for prefix matches", () => {
    const full = toTrigramVector("STERILIZATION");
    const prefix = toTrigramVector("STERIL RM");
    const sim = cosine(full, prefix);
    expect(sim).toBeGreaterThan(0.4);
  });

  it("gives low similarity for unrelated names", () => {
    const a = toTrigramVector("OPERATORY 1");
    const b = toTrigramVector("MECHANICAL");
    const sim = cosine(a, b);
    expect(sim).toBeLessThan(0.3);
  });

  it("distinguishes numbered rooms", () => {
    const op1 = toTrigramVector("OPERATORY 1");
    const op2 = toTrigramVector("OPERATORY 2");
    const sim = cosine(op1, op2);
    expect(sim).toBeGreaterThan(0.8);
    expect(sim).toBeLessThan(1.0);
  });
});
