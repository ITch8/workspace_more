import { NextRequest } from "next/server";
import { fail } from "./response";
import { getBearerToken, verifyToken } from "./auth";

export function requireUser(req: NextRequest): { userId: number } | Response {
  const token = getBearerToken(req);
  if (!token) return fail("Unauthorized", 401);
  try {
    return verifyToken(token);
  } catch {
    return fail("Invalid token", 401);
  }
}
