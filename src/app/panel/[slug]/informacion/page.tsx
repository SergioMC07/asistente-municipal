// «Mi información»: lo que sabe el asistente, editable por el negocio.

import { EditorInformacion } from '@/components/panel/EditorInformacion';
import { Cabecera } from '@/components/panel/Piezas';
import { informacionStore } from '@/lib/panel/informacion';
import { negocioDeSesion } from '@/lib/panel/sesion';
import { getPuebloBase } from '@/lib/pueblo';

export const dynamic = 'force-dynamic';

export default async function Informacion({ params }: { params: { slug: string } }) {
  const acceso = await negocioDeSesion(params.slug);
  if (!acceso) return null;
  const base = await getPuebloBase(params.slug);
  if (!base) return null;
  // Sin caché: aquí se ve siempre lo último guardado.
  const info = acceso.demo ? null : await informacionStore()?.leer(params.slug);

  return (
    <>
      <Cabecera
        titulo="Mi información"
        texto="Es lo único que sabe tu asistente. Si algo cambia (precios, horarios, ofertas), cámbialo aquí y lo usará en menos de un minuto."
      />
      <EditorInformacion
        api={`/api/panel/${params.slug}/informacion`}
        chat={`/${params.slug}`}
        demo={acceso.demo}
        ficha={info?.ficha ?? base.ficha}
        telefono={info?.telefono ?? base.telefono ?? ''}
        email={info?.email ?? base.email ?? ''}
        horario={info?.horario ?? base.horario ?? ''}
        enlaces={info?.enlaces ?? []}
        puedeDeshacer={!!info && (info.anterior !== null || info.ficha !== null)}
        actualizada={info && info.editada_por ? { cuando: info.actualizada, quien: info.editada_por } : null}
      />
    </>
  );
}
