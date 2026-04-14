import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { fail, ok } from "@/lib/response";
import { requireUser } from "@/lib/requireUser";

export async function GET(req: NextRequest) {
  const auth = requireUser(req);
  if (auth instanceof Response) return auth;
  const leads = await prisma.lead.findMany({
    where: { userId: auth.userId },
    take: 100,
    orderBy: { createdAt: "desc" }
  });
  return ok(leads);
}

export async function POST() {
  return fail("Use campaign CSV import endpoint", 400);
}
