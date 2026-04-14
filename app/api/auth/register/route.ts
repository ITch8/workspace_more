import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { fail, ok } from "@/lib/response";
import { hashPassword } from "@/lib/auth";
import { log } from "@/lib/logger";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1).optional()
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return fail("Invalid payload", 400);

    const exists = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (exists) return fail("Email already exists", 409);

    const passwordHash = await hashPassword(parsed.data.password);
    const user = await prisma.user.create({
      data: {
        email: parsed.data.email,
        name: parsed.data.name ?? null,
        passwordHash
      }
    });

    log("info", "user_registered", { userId: user.id, email: user.email });
    return ok({ id: user.id, email: user.email }, 201);
  } catch (error) {
    log("error", "register_failed", { error: String(error) });
    return fail("Internal server error", 500);
  }
}
