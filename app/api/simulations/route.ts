import { NextResponse } from "next/server";
import { createSimulation } from "@/lib/simulation";

export async function POST(request: Request) {
  const body = await request.json();
  const sim = createSimulation(body);
  return NextResponse.json({ id: sim.id });
}
