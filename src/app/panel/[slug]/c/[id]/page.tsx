// Una conversación completa, tal como la vio el cliente, con sus tarjetas
// de cita y de solicitud. Solo lectura (responder a mano llegará con WhatsApp).

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Phone } from '@phosphor-icons/react/dist/ssr';
import { RichText } from '@/components/RichText';
import { CitaCard } from '@/components/chat/CitaCard';
import { Escudo } from '@/components/chat/Escudo';
import { IncidenciaCard } from '@/components/chat/IncidenciaCard';
import { Senal, SinPanel } from '@/components/panel/Piezas';
import { textos } from '@/lib/entidad';
import { splitIncidencias } from '@/lib/incidencia';
import { almacen } from '@/lib/panel/acceso';
import { cuando, hace30, horaMadrid } from '@/lib/panel/formato';
import { negocioDeSesion } from '@/lib/panel/sesion';

export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ConversacionPage({ params }: { params: { slug: string; id: string } }) {
  const acceso = await negocioDeSesion(params.slug);
  if (!acceso) return null;
  const store = almacen(acceso);
  if (!store) return <SinPanel />;
  if (!UUID.test(params.id)) notFound();
  const datos = await store.conversacion(params.slug, params.id);
  if (!datos) notFound();

  const { negocio } = acceso;
  const t = textos(negocio);
  const { conversacion: c, mensajes } = datos;
  const contacto = (await store.registros(params.slug, hace30())).find(
    (r) => r.conversacion_id === c.id && r.telefono
  );

  return (
    <>
      <Link
        href={`/panel/${params.slug}`}
        className="press -ml-1 inline-flex items-center gap-1.5 rounded-full px-1 py-1 text-sm font-medium text-cobalt-text"
      >
        <ArrowLeft size={16} weight="bold" aria-hidden />
        Conversaciones
      </Link>

      <div className="mb-4 mt-2 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[1.375rem] font-semibold tracking-[-0.03em]">
            {c.nombre ?? (c.canal === 'whatsapp' ? c.cliente : 'Visitante de la web')}
          </h1>
          <p className="mt-0.5 text-sm text-muted">
            {c.canal === 'whatsapp' ? 'WhatsApp' : 'Web'} · empezó {cuando(c.creada).replace(/^Ayer/, 'ayer')}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {c.tiene_cita && <Senal tipo="cita" />}
            {c.tiene_registro && <Senal tipo="registro" texto={t.clase === 'solicitud' ? 'Solicitud' : 'Incidencia'} />}
            {c.sin_respuesta && <Senal tipo="sin" />}
          </div>
        </div>
        {contacto?.telefono && (
          <a
            href={`tel:${contacto.telefono.replace(/\s/g, '')}`}
            className="press inline-flex items-center gap-1.5 rounded-full bg-cobalt px-4 py-2.5 font-semibold text-cobalt-on shadow-btn"
          >
            <Phone size={17} weight="bold" aria-hidden />
            Llamar{contacto.nombre ? ` a ${contacto.nombre.split(' ')[0]}` : ''}
          </a>
        )}
      </div>

      <div className="space-y-4 rounded-[22px] border-[1.5px] border-line-strong bg-canvas px-4 py-5 shadow-soft">
        {mensajes.map((m, i) =>
          m.rol === 'user' ? (
            <div key={i} className="flex justify-end">
              <div className="max-w-[82%] rounded-2xl rounded-br-md border border-cobalt-strong bg-cobalt px-4 py-2.5 text-cobalt-on">
                <p className="whitespace-pre-wrap break-words">{m.contenido}</p>
                <p className="mt-1 text-right font-mono text-[11px] tabular-nums opacity-75">{horaMadrid(m.creado)}</p>
              </div>
            </div>
          ) : (
            <div key={i} className="flex items-end gap-2">
              <Escudo nombre={negocio.nombre} url={negocio.escudoUrl} size="sm" />
              <div className="min-w-0 max-w-[85%] rounded-2xl rounded-bl-md border border-line-strong bg-surface px-4 py-2.5 shadow-soft">
                {m.rol === 'humano' && <p className="mb-1 text-xs font-semibold text-cobalt-text">Respondido por ti</p>}
                <div className="space-y-2.5 leading-relaxed">
                  {splitIncidencias(m.contenido).map((s, j) =>
                    s.kind === 'text' ? (
                      <RichText key={j} text={s.text} />
                    ) : s.kind === 'cita' ? (
                      <CitaCard key={j} data={s.data} negocio={negocio.nombre} />
                    ) : (
                      <IncidenciaCard key={j} data={s.data} real />
                    )
                  )}
                </div>
                <p className="mt-1 font-mono text-[11px] tabular-nums text-muted">{horaMadrid(m.creado)}</p>
              </div>
            </div>
          )
        )}
      </div>
    </>
  );
}
