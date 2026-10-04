import OpenAI from 'openai';
import { chatRequestSchema, prepareHistory } from '@/lib/chat';
import { buildSystemPrompt } from '@/lib/prompt';
import { getPueblo } from '@/lib/pueblo';
import { createRateLimiter } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CHAT_MODEL = process.env.OPENAI_CHAT_MODEL || 'gpt-4.1-mini';

// 30 mensajes cada 10 minutos por IP: de sobra para un alcalde probando.
const allow = createRateLimiter(30, 10 * 60 * 1000);

function clientIp(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
}

export async function POST(req: Request) {
  if (!allow(clientIp(req))) {
    return Response.json(
      { error: 'Has enviado muchos mensajes seguidos. Espera unos minutos.' },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Petición no válida.' }, { status: 400 });
  }

  const parsed = chatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Petición no válida.' }, { status: 400 });
  }

  const history = prepareHistory(parsed.data.messages);
  if (!history) {
    return Response.json({ error: 'El mensaje es demasiado largo.' }, { status: 400 });
  }

  const pueblo = await getPueblo(parsed.data.slug);
  if (!pueblo) {
    return Response.json({ error: 'Este asistente no existe.' }, { status: 404 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'El asistente no está configurado.' }, { status: 503 });
  }

  const openai = new OpenAI({ apiKey });

  let completion;
  try {
    completion = await openai.chat.completions.create({
      model: CHAT_MODEL,
      temperature: 0.2,
      max_tokens: 500,
      stream: true,
      messages: [{ role: 'system', content: buildSystemPrompt(pueblo) }, ...history],
    });
  } catch (err) {
    console.error('Error al llamar a OpenAI:', err);
    return Response.json(
      { error: 'El asistente no está disponible ahora mismo. Inténtalo de nuevo.' },
      { status: 502 }
    );
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of completion) {
          const text = chunk.choices[0]?.delta?.content;
          if (text) controller.enqueue(encoder.encode(text));
        }
      } catch (err) {
        console.error('Error durante la respuesta en streaming:', err);
        controller.enqueue(encoder.encode('\n\n(Se ha cortado la respuesta. Inténtalo de nuevo.)'));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
