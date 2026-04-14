import { Queue } from "bullmq";
import { getRedis } from "./redis";

let queue: Queue | null = null;

export function getCsvImportQueue() {
  if (!queue) {
    queue = new Queue("csv-import", {
      connection: getRedis()
    });
  }
  return queue;
}
