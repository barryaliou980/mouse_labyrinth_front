import { NextRequest } from "next/server";
import { getSimulation } from "@/lib/simulation";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest, { params }: { params: { id: string }}) {
  const sim = getSimulation(params.id);
  if (!sim) return new Response("Not found", { status: 404 });
  const stream = new ReadableStream({
    start(controller) {
      const enc = new TextEncoder();
      const interval = setInterval(()=>{
        controller.enqueue(enc.encode(`data: ${JSON.stringify(sim)}\n\n`));
        if (sim.finished) { clearInterval(interval); controller.close(); }
      }, 250);
    }
  });
  return new Response(stream, { headers: { "Content-Type":"text/event-stream", "Cache-Control":"no-cache", "Connection":"keep-alive" } });
}
