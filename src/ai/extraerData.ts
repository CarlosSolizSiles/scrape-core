import { performance } from "node:perf_hooks";
import ai from "./Ollama.js";

export type AIresponse = {
  title: string | null;
  originalTitle: string | null;

  description: string | null;

  cover: string | null;

  gallery: string[];

  languages: string[];

  developer: string | null;

  releasedDate: string | null;

  ageRating: string | null;

  tags: string[];

  resources: string[];
};

export const extraerData = async (html: string) => {
  const start = performance.now();

  const response: AIresponse = await ai.extract(html);

  const elapsed = performance.now() - start;

  return {
    response,
    elapsedMs: elapsed,
  };
};
