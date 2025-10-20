import { NextRequest } from "next/server";
import { getSimulation } from "@/lib/simulation";
export async function GET(req: NextRequest, { params }: { params: { id: string }}) {
  const sim = getSimulation(params.id);
  if (!sim) return new Response("not found", { status: 404 });
  const lines = ["turn,mouseId,x,y,health,mood,eaten"];
  for (const f of sim.history) {
    for (const m of f.mice) lines.push([f.turn, m.id, m.x, m.y, m.health, m.mood, m.eaten].join(","));
  }
  const csv = lines.join("\n");
  return new Response(csv, { headers: { "Content-Type":"text/csv", "Content-Disposition": `attachment; filename="simulation_${params.id}.csv"` } });
}
