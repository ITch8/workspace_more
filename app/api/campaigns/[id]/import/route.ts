import { NextRequest } from "next/server";
import { getCsvImportQueue } from "@/lib/queue";
import { fail, ok } from "@/lib/response";
import { requireUser } from "@/lib/requireUser";
import { prisma } from "@/lib/prisma";
import { log } from "@/lib/logger";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireUser(req);
  if (auth instanceof Response) return auth;
  const campaignId = Number((await params).id);
  if (Number.isNaN(campaignId)) return fail("Invalid campaign id", 400);

  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, userId: auth.userId },
    select: { id: true }
  });
  if (!campaign) return fail("Campaign not found", 404);

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) return fail("File is required", 400);
  if (!file.name.endsWith(".csv")) return fail("Only CSV is allowed", 400);

  const content = await file.text();
  const firstLine = content.split(/\r?\n/)[0]?.toLowerCase() || "";
  if (!firstLine.includes("email") || !firstLine.includes("name")) {
    return fail("CSV must include email and name columns", 400);
  }

  const job = await getCsvImportQueue().add("import-leads", {
    campaignId,
    userId: auth.userId,
    content
  });

  log("info", "csv_import_queued", { campaignId, userId: auth.userId, jobId: job.id });
  return ok({ jobId: String(job.id), status: "queued" }, 202);
}

export async function GET(req: NextRequest) {
  const auth = requireUser(req);
  if (auth instanceof Response) return auth;

  const jobId = req.nextUrl.searchParams.get("jobId");
  if (!jobId) return fail("jobId is required", 400);

  const job = await getCsvImportQueue().getJob(jobId);
  if (!job) return fail("Job not found", 404);

  const state = await job.getState();
  return ok({ status: state, jobId });
}
