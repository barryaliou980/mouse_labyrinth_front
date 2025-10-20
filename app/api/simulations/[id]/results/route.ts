import { NextRequest, NextResponse } from "next/server";
import { getSimulation } from "@/lib/simulation";
export async function GET(req: NextRequest, { params }: { params: { id: string }}) {
  const sim = getSimulation(params.id);
  if (!sim) return NextResponse.json({ error: "not found" }, { status: 404 });
  const summary = { id: sim.id, ruleset: sim.ruleset, turns: sim.turn, finished: sim.finished, cheesesRemaining: sim.cheeses.length,
    perMouse: sim.mice.map(m=>({ name: m.name, eaten: m.eaten, finalHealth: m.health, finalMood: m.mood })) };
  return NextResponse.json({ summary, history: sim.history });
}
