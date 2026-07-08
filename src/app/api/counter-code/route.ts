import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { counterCode, secondsUntilRotate } from "@/lib/counter-code";

// Public endpoint that returns the counter's CURRENT rotating code — this is exactly
// what is displayed on the physical counter screen. A member reads it and types it to
// redeem, proving presence. It rotates every 30s so a screenshot goes stale.
export async function GET() {
  const counter = await prisma.counter.findFirst();
  if (!counter) {
    return NextResponse.json({ error: "No counter configured." }, { status: 404 });
  }
  return NextResponse.json({
    counter: counter.name,
    code: counterCode(counter.secret, 0),
    secondsLeft: secondsUntilRotate(),
  });
}
