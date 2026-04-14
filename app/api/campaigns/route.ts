import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { fail, ok } from "@/lib/response";
import { requireUser } from "@/lib/requireUser";
import { log } from "@/lib/logger";

const createSchema = z.object({
  name: z.string().min(1)
});

export async function GET(req: NextRequest) {
  const auth = requireUser(req);
  if (auth instanceof Response) return auth;
  try {
    const campaigns = await prisma.campaign.findMany({
      where: { userId: auth.userId },
      orderBy: { createdAt: "desc" }
    });
    return ok(campaigns);
  } catch (error) {
    log("error", "campaign_list_failed", { error: String(error) });
    return fail("Internal server error", 500);
  }
}

export async function POST(req: NextRequest) {
  const auth = requireUser(req);
  if (auth instanceof Response) return auth;
  try {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return fail("Invalid payload", 400);

    const campaign = await prisma.campaign.create({
      data: {
        userId: auth.userId,
        name: parsed.data.name,
        status: "draft"
      }
    });
    log("info", "campaign_created", { campaignId: campaign.id, userId: auth.userId });
    return ok(campaign, 201);
  } catch (error) {
    log("error", "campaign_create_failed", { error: String(error) });
    return fail("Internal server error", 500);
  }
}
