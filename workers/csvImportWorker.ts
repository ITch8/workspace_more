import { Worker } from "bullmq";
import { parse } from "csv-parse/sync";
import { prisma } from "../lib/prisma";
import { getRedis } from "../lib/redis";
import { log } from "../lib/logger";

type ImportJob = {
  campaignId: number;
  userId: number;
  content: string;
};

new Worker<ImportJob>(
  "csv-import",
  async (job) => {
    const { campaignId, userId, content } = job.data;
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true
    }) as Array<{ email?: string; name?: string }>;

    const rows = records
      .filter((r) => r.email && r.email.includes("@"))
      .map((r) => ({
        campaignId,
        userId,
        email: String(r.email).trim(),
        name: r.name?.trim() || null
      }));

    if (!rows.length) {
      throw new Error("No valid rows in CSV");
    }

    await prisma.lead.createMany({
      data: rows,
      skipDuplicates: true
    });

    log("info", "csv_import_completed", {
      campaignId,
      userId,
      inserted: rows.length,
      jobId: job.id
    });
  },
  { connection: getRedis() }
).on("failed", (job, err) => {
  log("error", "csv_import_failed", {
    jobId: job?.id,
    error: String(err)
  });
});
