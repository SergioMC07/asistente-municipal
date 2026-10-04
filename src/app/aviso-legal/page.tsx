import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage } from '@/components/LegalPage';
import { titular } from '@/lib/legal';

export const metadata: Metadata = { title: 'Aviso legal · Atiende' };

export default function AvisoLegal() {
  const t = titular();
  const datos = [
    ['Titular', t.nombre],
    ['NIF', t.nif],
    ['Domicilio', t.domicilio],
    ['Correo', t.email],
    ['Teléfono y WhatsApp', t.telefono],
  ].filter((d): d is [string, string] => Boolean(d[1]));

  return (
    <LegalPage title="Aviso legal">
      <p>Datos del titular de esta web, según la Ley 34/2002 de servicios de la sociedad de la información.</p>
      <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2">
        {datos.map(([k, v]) => (
          <div key={k} className="contents">
            <dt>{k}</dt>
            <dd className="text-ink">{v}</dd>
          </div>
        ))}
      </dl>

      <h2>Uso de la web</h2>
      <p>
        Esta web presenta Atiende, un asistente para ayuntamientos, y ofrece demostraciones. Las respuestas de
        las demostraciones se generan de forma automática a partir de información pública de cada
        ayuntamiento y pueden contener errores. No sustituyen la información oficial ni a los servicios de
        emergencia (112).
      </p>
      <p>
        Las demostraciones preparadas para un municipio no implican ninguna relación con su ayuntamiento
        salvo que se indique lo contrario.
      </p>

      <h2>Privacidad</h2>
      <p>
        Consulte la <Link href="/privacidad">política de privacidad</Link>.
      </p>
    </LegalPage>
  );
}
