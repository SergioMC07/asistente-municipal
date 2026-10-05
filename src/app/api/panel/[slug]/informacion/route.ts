// «Mi información»: el negocio cambia lo que sabe su asistente.

import { z } from 'zod';
import { leerEnlace } from '@/lib/panel/enlaces';
import { informacionStore, MAX_ENLACES, MAX_FICHA, olvidarCache, type Cambios } from '@/lib/panel/informacion';
import { negocioDeSesion } from '@/lib/panel/sesion';
import { getPuebloBase } from '@/lib/pueblo';
import { createRateLimiter } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// Leer un enlace cuesta una llamada a la IA: como mucho 20 por hora y negocio.
const permitirLectura = createRateLimiter(20, 60 * 60 * 1000);

const corto = (max: number) => z.string().trim().max(max).nullable();

const accionSchema = z.discriminatedUnion('accion', [
  z.object({
    accion: z.literal('guardar'),
    ficha: z.string().max(MAX_FICHA),
    telefono: corto(60),
    email: corto(120),
    horario: corto(300),
  }),
  z.object({ accion: z.literal('enlace'), url: z.string().min(4).max(500) }),
  z.object({ accion: z.literal('releer'), url: z.string().max(500) }),
  z.object({ accion: z.literal('quitar'), url: z.string().max(500) }),
  z.object({ accion: z.literal('deshacer') }),
]);

export async function POST(req: Request, { params }: { params: { slug: string } }) {
  const acceso = await negocioDeSesion(params.slug);
  if (!acceso) return Response.json({ error: 'Sin acceso.' }, { status: 403 });
  if (acceso.demo) {
    return Response.json({ error: 'Es una demostración: los cambios no se guardan.' }, { status: 409 });
  }
  const store = informacionStore();
  const base = await getPuebloBase(params.slug);
  if (!store || !base) return Response.json({ error: 'Panel no activado.' }, { status: 409 });

  const parsed = accionSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: 'Datos no válidos.' }, { status: 400 });
  const a = parsed.data;
  const actual = await store.leer(params.slug);
  const enlaces = actual?.enlaces ?? [];
  let cambios: Cambios;

  try {
    if (a.accion === 'guardar') {
      const ficha = a.ficha.trim();
      if (ficha.length < 20) return Response.json({ error: 'La información está casi vacía.' }, { status: 400 });
      // Vacío o igual que el original = sin cambios (se usa el dato de Atentia).
      const propio = (v: string | null, original?: string) => (v && v !== original ? v : null);
      cambios = {
        ficha: ficha === base.ficha.trim() ? null : ficha,
        telefono: propio(a.telefono, base.telefono),
        email: propio(a.email, base.email),
        horario: propio(a.horario, base.horario),
      };
    } else if (a.accion === 'deshacer') {
      if (!actual || (actual.anterior === null && actual.ficha === null)) {
        return Response.json({ error: 'No hay cambios que deshacer.' }, { status: 400 });
      }
      cambios = { ficha: actual.anterior };
    } else if (a.accion === 'quitar') {
      cambios = { enlaces: enlaces.filter((e) => e.url !== a.url) };
    } else {
      if (a.accion === 'enlace' && enlaces.length >= MAX_ENLACES) {
        return Response.json({ error: `Como mucho ${MAX_ENLACES} enlaces. Quita alguno antes.` }, { status: 400 });
      }
      if (!permitirLectura(params.slug)) {
        return Response.json({ error: 'Has leído muchos enlaces seguidos. Prueba dentro de un rato.' }, { status: 429 });
      }
      const enlace = await leerEnlace(a.url, base.nombre);
      const otros = enlaces.filter((e) => e.url !== enlace.url && e.url !== a.url);
      cambios = { enlaces: a.accion === 'releer' ? enlaces.map((e) => (e.url === a.url ? enlace : e)) : [...otros, enlace] };
    }
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'No se ha podido leer.' }, { status: 400 });
  }

  const info = await store.guardar(params.slug, cambios, acceso.email);
  olvidarCache(params.slug);
  return Response.json({ ok: true, info });
}
