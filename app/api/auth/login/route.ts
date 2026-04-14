import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { fail, ok } from "@/lib/response";
import { comparePassword, signToken } from "@/lib/auth";
import { log } from "@/lib/logger";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return fail("Invalid payload", 400);

    const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (!user) return fail("Invalid credentials", 401);

    const passOk = await comparePassword(parsed.data.password, user.passwordHash);
    if (!passOk) return fail("Invalid credentials", 401);

    const token = signToken(user.id);
    log("info", "user_login", { userId: user.id });
    return ok({ token });
  } catch (error) {
    log("error", "login_failed", { error: String(error) });
    return fail("Internal server error", 500);
  }
}
