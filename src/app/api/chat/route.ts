import OpenAI from 'openai';
import { chatRequestSchema, prepareHistory } from '@/lib/chat';
import { contactWhatsapp, formatPhone } from '@/lib/contact';
import { buildSystemPrompt } from '@/lib/prompt';
import { isRealVisitor, notify } from '@/lib/notify';
import { getPueblo } from '@/lib/pueblo';
import { createRateLimiter } from '@/lib/rate-limit';
import { ejecutarHerramienta, herramientasCitas } from '@/lib/citas/herramientas';
import { citasStore } from '@/lib/citas/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CHAT_MODEL = process.env.OPENAI_CHAT_MODEL || 'gpt-4.1-mini';

// 30 mensajes cada 10 minutos por IP: de sobra para un alcalde probando.
const allow = createRateLimiter(30, 10 * 60 * 1000);

function contactoComercial(): string | undefined {
  const parts = [
    `WhatsApp ${formatPhone(contactWhatsapp())}`,
    process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim(),
  ].filter(Boolean);
  return parts.length ? parts.join(' o ') : undefined;
}

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

  // Primer mensaje de una conversación: aviso al comercial (si está configurado).
  const aviso =
    history.filter((m) => m.role === 'user').length === 1 &&
    isRealVisitor(req.headers.get('user-agent'))
      ? notify(`Demo de ${pueblo.nombre}`, `Primer mensaje: ${history[history.length - 1].content}`)
      : Promise.resolve();

  const openai = new OpenAI({ apiKey });
  const ip = clientIp(req);
  const herramientas = pueblo.citas ? herramientasCitas(pueblo) : undefined;
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: buildSystemPrompt(pueblo, {
        contactoComercial: contactoComercial(),
        ahora: new Date(),
        citasReales: pueblo.citas?.modo === 'real' && !!citasStore(),
      }),
    },
    ...history,
  ];

  const pedir = () =>
    openai.chat.completions.create({
      model: CHAT_MODEL,
      temperature: 0.2,
      max_tokens: 500,
      stream: true,
      messages,
      ...(herramientas ? { tools: herramientas, parallel_tool_calls: false } : {}),
    });

  let completion: Awaited<ReturnType<typeof pedir>>;
  try {
    completion = await pedir();
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
      const escribir = (t: string) => controller.enqueue(encoder.encode(t));
      try {
        // Cada vuelta: el modelo responde o pide una herramienta (ver huecos,
        // reservar). Se ejecuta, se le devuelve el resultado y sigue.
        for (let vuelta = 0; vuelta < 4; vuelta++) {
          let texto = '';
          const llamadas: { id: string; nombre: string; args: string }[] = [];
          for await (const chunk of completion) {
            const delta = chunk.choices[0]?.delta;
            if (delta?.content) {
              texto += delta.content;
              escribir(delta.content);
            }
            for (const tc of delta?.tool_calls ?? []) {
              const c = (llamadas[tc.index] ??= { id: '', nombre: '', args: '' });
              if (tc.id) c.id = tc.id;
              if (tc.function?.name) c.nombre += tc.function.name;
              if (tc.function?.arguments) c.args += tc.function.arguments;
            }
          }
          const pendientes = llamadas.filter(Boolean);
          if (pendientes.length === 0) break;

          messages.push({
            role: 'assistant',
            content: texto || null,
            tool_calls: pendientes.map((c) => ({
              id: c.id,
              type: 'function' as const,
              function: { name: c.nombre, arguments: c.args },
            })),
          });
          for (const c of pendientes) {
            const { resultado, marca } = await ejecutarHerramienta(pueblo, c.nombre, c.args, ip);
            if (marca) escribir(`${texto ? '\n' : ''}${marca}\n`);
            messages.push({ role: 'tool', tool_call_id: c.id, content: JSON.stringify(resultado) });
          }
          completion = await pedir();
        }
      } catch (err) {
        console.error('Error durante la respuesta en streaming:', err);
        escribir('\n\n(Se ha cortado la respuesta. Inténtalo de nuevo.)');
      } finally {
        controller.close();
        await aviso;
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
