import { clientAddress, releaseSlot, takeSlot } from "@/lib/guard";
import { research, type ResearchEvent } from "@/lib/research";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Send a JSON body with a query." }, { status: 400 });
  }

  const query =
    typeof body === "object" && body !== null && "query" in body && typeof body.query === "string"
      ? body.query.trim()
      : "";

  if (query.length < 8 || query.length > 400) {
    return Response.json(
      { error: "Ask a question between 8 and 400 characters." },
      { status: 400 },
    );
  }

  const address = clientAddress(request);
  const slot = takeSlot(address);
  if (!slot.ok) {
    return Response.json(
      { error: "This desk allows 6 questions every 10 minutes. Wait a little, then try again." },
      { status: 429 },
    );
  }

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (event: ResearchEvent) => {
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      };
      try {
        await research(query, send, { openai: slot.openai, serp: slot.serp });
      } catch {
        send({
          type: "error",
          message: "The research run stopped before a report was ready. Try the question again.",
        });
      } finally {
        releaseSlot(address);
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
