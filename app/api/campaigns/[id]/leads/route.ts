import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { fail, ok } from "@/lib/response";
import { requireUser } from "@/lib/requireUser";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireUser(req);
  if (auth instanceof Response) return auth;
  const campaignId = Number((await params).id);
  if (Number.isNaN(campaignId)) return fail("Invalid campaign id", 400);

  const page = Number(req.nextUrl.searchParams.get("page") || "1");
  const limit = Number(req.nextUrl.searchParams.get("limit") || "20");
  const email = req.nextUrl.searchParams.get("email") || "";
  const skip = (Math.max(page, 1) - 1) * Math.max(limit, 1);

  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, userId: auth.userId },
    select: { id: true }
  });
  if (!campaign) return fail("Campaign not found", 404);

  const where = {
    campaignId,
    ...(email ? { email: { contains: email, mode: "insensitive" as const } } : {})
  };

  const [items, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" }
    }),
    prisma.lead.count({ where })
  ]);

  return ok({ items, total, page, limit });
}
