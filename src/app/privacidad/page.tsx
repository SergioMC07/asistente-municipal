import type { Metadata } from 'next';
import { LegalPage } from '@/components/LegalPage';
import { titular } from '@/lib/legal';

export const metadata: Metadata = { title: 'Privacidad · Atentia' };

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

      <h2>Citas</h2>
      <p>
        En las <strong>demostraciones</strong>, las citas se simulan: no se guardan y puede usar un nombre y un
        teléfono inventados.
      </p>
      <p>
        Cuando un ayuntamiento o un negocio usa el servicio real, al reservar una cita se guardan el nombre, el
        teléfono, el día y la hora, y, si la da, una nota breve. El responsable de esos datos es ese ayuntamiento
        o negocio, que los usa solo para gestionar la cita y avisarle si hay cambios. El titular de esta web
        actúa como encargado del tratamiento: los guarda en servidores de la Unión Europea (Supabase) y los
        envía por correo al responsable (Resend) para avisarle de cada cita. Se conservan hasta 30 días
        después de la cita, salvo que el responsable indique otro plazo. Para ejercer sus derechos sobre una
        cita, diríjase al ayuntamiento o negocio con el que la reservó.
      </p>

      <h2>Conversaciones con un asistente en servicio</h2>
      <p>
        Cuando el asistente ya está en servicio para un ayuntamiento o un negocio (no en las demostraciones), las
        conversaciones se guardan para que ese ayuntamiento o negocio pueda leerlas en su panel, devolver las
        llamadas que le piden y mejorar las respuestas. Se guardan los mensajes, la fecha y, si los da para una
        solicitud o una cita, el nombre y el teléfono. El responsable es ese ayuntamiento o negocio; el titular
        de esta web actúa como encargado del tratamiento y los guarda en servidores de la Unión Europea
        (Supabase). Solo acceden las personas que ese ayuntamiento o negocio autoriza. Las conversaciones y las
        solicitudes se borran solas a los 30 días. Para ejercer sus derechos, diríjase a ese ayuntamiento o
        negocio.
      </p>

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
