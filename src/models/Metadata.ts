import type { Timestamp } from "./defineType.js";

export interface Metadata {
  isRunning: boolean;

  currentPage: number;

  lastProcessedPost: Timestamp;

  lastUpdatedPost: Timestamp;

  tempFirstUpdatedPost: Timestamp;
}
