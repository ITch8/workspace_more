import { NextResponse } from "next/server";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ error: false, data }, { status });
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ error: true, message }, { status });
}
