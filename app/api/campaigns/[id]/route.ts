import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { fail, ok } from "@/lib/response";
import { requireUser } from "@/lib/requireUser";

const patchSchema = z.object({
  status: z.enum(["draft", "running", "paused", "completed", "archived"])
});

function toId(id: string) {
  const parsed = Number(id);
  return Number.isNaN(parsed) ? null : parsed;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireUser(req);
  if (auth instanceof Response) return auth;
  const id = toId((await params).id);
  if (!id) return fail("Invalid id", 400);

  const campaign = await prisma.campaign.findFirst({
    where: { id, userId: auth.userId }
  });
  if (!campaign) return fail("Not found", 404);
  return ok(campaign);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireUser(req);
  if (auth instanceof Response) return auth;
  const id = toId((await params).id);
  if (!id) return fail("Invalid id", 400);

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return fail("Invalid payload", 400);

  const updated = await prisma.campaign.updateMany({
    where: { id, userId: auth.userId },
    data: { status: parsed.data.status }
  });
  if (!updated.count) return fail("Not found", 404);
  const campaign = await prisma.campaign.findUnique({ where: { id } });
  return ok(campaign);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireUser(req);
  if (auth instanceof Response) return auth;
  const id = toId((await params).id);
  if (!id) return fail("Invalid id", 400);

  await prisma.campaign.deleteMany({ where: { id, userId: auth.userId } });
  return ok({ deleted: true });
}
