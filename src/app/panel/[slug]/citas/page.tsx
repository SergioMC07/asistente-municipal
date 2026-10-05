// Agenda del negocio dentro del panel: la misma pantalla del enlace de
// gestión, pero con la sesión del panel en lugar del token.

import { GestionApp } from '@/components/GestionApp';
import { Cabecera, Vacio } from '@/components/panel/Piezas';
import { datosAgenda } from '@/lib/citas/vista';
import { negocioDeSesion, tokenCalendario } from '@/lib/panel/sesion';

export const dynamic = 'force-dynamic';

export default async function Citas({ params }: { params: { slug: string } }) {
  const acceso = await negocioDeSesion(params.slug);
  if (!acceso) return null;
  const datos = await datosAgenda(acceso.negocio);

  if (datos.estado !== 'real') {
    return (
      <>
        <Cabecera titulo="Citas" />
        <Vacio titulo={datos.estado === 'demo' ? 'Agenda en modo demostración' : 'Sin agenda de citas'}>
          {datos.estado === 'demo'
            ? 'Ahora mismo las citas se simulan. Cuando se active la agenda real, aquí verás cada reserva y podrás apuntar, cancelar y bloquear huecos.'
            : 'Tu asistente no reserva citas. Si quieres que lo haga, pídenoslo y lo activamos.'}
        </Vacio>
      </>
    );
  }

  return (
    <>
      <Cabecera
        titulo="Citas"
        texto={`${datos.citas.length} ${datos.citas.length === 1 ? 'próxima' : 'próximas'}. Tus clientes las reservan con el asistente; también puedes apuntarlas tú.`}
        excel={`/api/panel/${params.slug}/excel?tipo=citas`}
      />
      <GestionApp
        api={`/api/gestion/${params.slug}`}
        feed={`/api/gestion/${params.slug}/calendario?t=${tokenCalendario(params.slug)}`}
        datos={datos}
        className=""
      />
    </>
  );
}
