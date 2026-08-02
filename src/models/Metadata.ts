import type { Timestamp } from "./defineType.js";

export interface Metadata {
  isRunning: boolean;

  resumePage: number;

  processedUntilUpdatedAt: Timestamp;

  resumeUpdatedAt: Timestamp;

  firstDiscoveredPostUpdatedAt: Timestamp;
}
