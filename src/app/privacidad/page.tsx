import type { Metadata } from 'next';
import { LegalPage } from '@/components/LegalPage';
import { titular } from '@/lib/legal';

export const metadata: Metadata = { title: 'Privacidad · Atiende' };

export default function Privacidad() {
  const t = titular();
  const contacto = [t.email, `WhatsApp ${t.telefono}`].filter(Boolean).join(' o ');

  return (
    <LegalPage title="Privacidad">
      <p>
        Esta página explica qué datos se tratan cuando usa esta web y las demostraciones del asistente.
        Le recomendamos no escribir datos personales (DNI, salud, datos bancarios) en las demostraciones.
      </p>

      <h2>Responsable</h2>
      <p>
        {t.nombre ? <strong>{t.nombre}</strong> : 'El titular de esta web'}
        {t.nif ? `, NIF ${t.nif}` : ''}. Contacto: {contacto}.
      </p>

      <h2>Qué datos se tratan y para qué</h2>
      <ul>
        <li>
          <strong>Mensajes de las demostraciones.</strong> Lo que escribe en el chat se envía a OpenAI
          (OpenAI, L.L.C., Estados Unidos) solo para generar la respuesta. No guardamos las conversaciones en
          ninguna base de datos.
        </li>
        <li>
          <strong>Su navegador.</strong> La conversación se guarda en el propio navegador para que no se pierda
          al recargar, y se borra al cerrar la pestaña.
        </li>
        <li>
          <strong>Avisos al titular.</strong> Cuando alguien abre una demostración o escribe su primer
          mensaje, el titular puede recibir un aviso con el nombre del municipio y ese primer mensaje, para
          atender a quien la está probando.
        </li>
        <li>
          <strong>Datos técnicos.</strong> El proveedor de alojamiento (Vercel) registra datos técnicos como la
          dirección IP, que se usan para la seguridad y para limitar el número de mensajes.
        </li>
        <li>
          <strong>Contacto.</strong> Si nos escribe por WhatsApp o por correo, usaremos sus datos solo para
          responderle.
        </li>
      </ul>

      <h2>Base legal y conservación</h2>
      <p>
        El interés legítimo en mostrar y mejorar el servicio, y su consentimiento cuando nos contacta. Los
        datos de contacto se conservan mientras dure la conversación comercial y se borran cuando lo pida.
      </p>

      <h2>Sus derechos</h2>
      <p>
        Puede pedir acceso, rectificación, supresión, oposición, limitación o portabilidad escribiendo a{' '}
        {contacto}. Si cree que no hemos atendido bien su petición, puede reclamar ante la{' '}
        <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer">
          Agencia Española de Protección de Datos
        </a>
        .
      </p>
    </LegalPage>
  );
}
