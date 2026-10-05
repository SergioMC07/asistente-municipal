# Atentia

Asistente con IA que atiende a los vecinos de un ayuntamiento a cualquier hora: horarios, trámites, servicios, fiestas e incidencias.

Esta primera versión sirve para **hacer demos**: lees la web de un ayuntamiento, generas su ficha y le envías al alcalde un enlace con el chat de su propio pueblo.

* **Stack**: Next.js 14 (App Router) · OpenAI · Tailwind. Sin base de datos: cada demo es un JSON en `data/pueblos/`.
* **Demos de prueba**: `/villaejemplo` (pueblo ficticio) y `/autoescuela-ejemplo` (negocio ficticio).
* **Dos líneas de venta**: ayuntamientos (landing en `/`) y autoescuelas y academias (landing en `/empresas`).

## Puesta en marcha

```bash
npm install
cp .env.example .env.local   # y rellena OPENAI_API_KEY
npm run dev                  # http://localhost:3000/villaejemplo
```

## Crear la demo de un pueblo

```bash
npm run demo -- https://www.mipueblo.es
# opcional: --slug mipueblo --paginas 30
```

El script:

1. Lee la portada y las páginas más útiles de la web (horarios, trámites, residuos, tasas, servicios, fiestas…).
2. Genera con IA una **ficha del pueblo** solo con datos que aparecen en la web.
3. La guarda en `data/pueblos/<slug>.json` y te muestra el enlace de la demo.

**Antes de enviar la demo, revisa la ficha**: es lo único que el asistente sabe. Corrige o completa lo que haga falta directamente en el JSON, haz commit y despliega.

## Vídeo para el correo

Con la demo publicada (o con `npm run dev` en marcha):

```bash
npx playwright install chromium   # solo la primera vez
npm run video -- chinchon --url https://tu-proyecto.vercel.app
```

Graba la demo en un móvil simulado con las respuestas reales del asistente:

1. Dos preguntas sugeridas de la ficha.
2. Una pregunta que no está en la ficha, para enseñar que no se inventa nada.
3. Una incidencia.
4. El panel.

Deja en `prospectos/ayuntamientos/<slug>/video/` o `prospectos/empresas/<slug>/video/` (no se sube a GitHub):

* `atentia-<slug>.mp4`: el vídeo, de algo más de un minuto, con rótulos, portada y cierre con tu WhatsApp.
* `miniatura.gif`: 7 segundos animados para poner en el correo.
* `portada.png`: imagen con botón de reproducir.

Opciones:

* `--desconocida "..."`: pregunta que no está en la ficha. Por defecto, la recogida de muebles.
* `--incidencia "..."`: aviso con qué pasa y dónde.
* `--marca "..."`: etiqueta fija, por ejemplo «Borrador».

Para grabar todos los pueblos de una vez:

```bash
npm run videos -- --url https://tu-proyecto.vercel.app
```

Cada ficha puede llevar un bloque `demo` con la incidencia del vídeo (`"demo": { "incidencia": "La farola de la Plaza Real, junto al número 3, no se enciende" }`), para usar una calle real del pueblo.

**Míralo entero antes de enviarlo**: las respuestas son las reales y pueden variar. Súbelo a Loom (*Upload*) o a Google Drive y enlázalo desde la portada en el correo. La grabación no dispara los avisos de ntfy.

## Modo negocio

Una ficha con `"tipo": "negocio"` convierte la demo en el asistente de un negocio:

* Cabecera, banda y panel con el nombre del negocio, sin «Ayuntamiento de» ni el 112.
* Las instrucciones de la IA hablan a clientes y alumnos, y en vez de incidencias recogen **solicitudes** (`[[SOLICITUD: qué | cuándo | detalle]]`) para que el centro llame.
* Campos propios: `sector` (p. ej. `"autoescuela"`), `ciudad` y `saludo` (primer mensaje del chat).

Ejemplo: `data/pueblos/autoescuela-ejemplo.json`.

## Citas

Si la ficha tiene un bloque `citas`, el asistente **ofrece huecos libres y reserva**. La IA usa dos herramientas (`ver_huecos` y `reservar_cita`) y nunca inventa horas: el servidor calcula los huecos y vuelve a comprobar que siguen libres antes de reservar.

```json
"citas": {
  "tipos": ["Información y matrícula"],
  "duracion": 15,
  "horario": { "1": ["10:00-14:00", "17:00-20:00"], "5": ["10:00-14:00"] },
  "capacidad": 1,
  "antelacion": 120,
  "dias": 14,
  "cerrado": ["2026-10-12"],
  "lugar": "la autoescuela, C/ Mayor, 1",
  "modo": "demo",
  "avisoEmail": "negocio@ejemplo.es"
}
```

* `horario`: por día de la semana (1 = lunes … 7 = domingo), tramos en hora de España.
* Los huecos se calculan al momento: se quitan los pasados, los que no respetan la `antelacion` (minutos), los días `cerrado`, los bloqueados y los llenos (`capacidad`). Cada día que pasa entra uno nuevo al final de la ventana de `dias`.
* **`modo: "demo"`**: la reserva se simula (no se guarda ni avisa). Es lo que tienen todas las demos.
* **`modo: "real"`**: se guarda en Supabase, el negocio recibe un email con la cita y un `.ics`, y la gestiona en su página.

### Activar citas reales para un cliente

1. **Supabase** (una sola vez): crea un proyecto en una región de la UE, abre *SQL Editor* y ejecuta [`supabase/citas.sql`](supabase/citas.sql). En *Settings → API* copia la *Project URL* y la clave *service_role* y ponlas en Vercel como `SUPABASE_URL` y `SUPABASE_SERVICE_KEY`. La clave es secreta: nunca en el chat, en el código ni en variables `NEXT_PUBLIC_`.
2. **Resend** (una sola vez): crea la cuenta, verifica tu dominio y crea una API key. En Vercel: `RESEND_API_KEY` y `AVISOS_FROM` (por ejemplo `Atentia <avisos@tudominio.es>`).
3. En la ficha del cliente: revisa `horario` y `cerrado`, pon `"modo": "real"` y su `avisoEmail`.
4. Crea su enlace de gestión: `npm run gestion -- <slug>`. Sube la ficha (commit y push) y pasa el enlace **solo al negocio**.
5. Vuelve a desplegar en Vercel si has cambiado variables.

### Página de gestión del negocio

`/gestion/<slug>?t=<token>` (el enlace de `npm run gestion`). Desde el móvil, el negocio:

* ve las próximas citas por día, con el teléfono para llamar, y las cancela;
* apunta las citas que le piden por teléfono, para que el asistente no ofrezca ese hueco;
* bloquea horas o días (festivos, vacaciones, reuniones);
* copia su **enlace de calendario** (`.ics`) para verlas en Google Calendar, Outlook o el iPhone.

Generar otro enlace con `npm run gestion` invalida el anterior. Las citas y los bloqueos se borran solos 30 días después (tarea nocturna de `citas.sql`).

## Panel del negocio

`/panel`: lo que ha pasado con el asistente de un cliente real, desde el móvil y sin contraseñas. El negocio escribe su email, recibe un enlace (15 minutos) y queda dentro 30 días.

* **Conversaciones:** cada conversación con lo que preguntó el cliente y cómo acabó (*Cita*, *Solicitud* o *Sin respuesta*), con filtros. Al abrirla se ve entera, con un botón para llamar si dejó teléfono.
* **Citas:** la misma agenda de `/gestion` (apuntar, cancelar, bloquear, calendario), con la sesión del panel.
* **Solicitudes** (o **Incidencias** en un ayuntamiento): la lista de llamadas pendientes con nombre y teléfono, y el botón *Marcar hecho*.
* **Resumen (30 días):** conversaciones, cuántas fuera de horario, citas, solicitudes, de qué preguntan y **lo que no supo responder**, para añadirlo a la ficha.
* Cada lista se descarga **en Excel** (CSV con `;`, que Excel en español abre directamente).

Solo se guardan las conversaciones de las fichas con `panel`; las demos nunca. Con panel, el chat no lleva la banda de demostración ni el botón *Panel*, avisa de que la conversación se guarda 30 días y, para una solicitud, pide nombre y teléfono. Todo se borra solo a los 30 días (tarea nocturna de `citas.sql`).

### Mi información

Pestaña del panel donde el negocio cambia lo que sabe su asistente, sin pasar por ti:

* **Contacto:** teléfono, email y horario (salen junto al chat).
* **Lo que sabe tu asistente:** la ficha, por apartados (Precios, Horarios…), editable y con «Añadir apartado».
* **Enlaces:** pega páginas de su web; el servidor las lee, la IA resume lo útil (precios, cursos, horarios…) y el asistente lo usa. «Volver a leer» si la página cambia. Hasta 10 enlaces, solo páginas web públicas (no PDF).
* **Volver a la versión anterior** si se equivoca.

Los cambios se guardan en Supabase (tabla `informacion`) y se aplican encima de la ficha de `data/pueblos`, que no se toca. El asistente los usa en menos de un minuto, sin desplegar.

### Panel de demostración

`/panel/demo/<slug>` abre el panel de cualquier demo con **datos de ejemplo**: conversaciones, solicitudes, citas en huecos reales de su agenda y el resumen, con su nombre y su color. Sirve para enseñárselo a un negocio antes de contratar. No pide email, una banda avisa de que es una demostración y los cambios (marcar hecho, apuntar o cancelar citas) no se guardan. Desde el chat de la demo se llega con «Ver el panel completo» en el botón *Panel*. Las fichas con `panel` (clientes reales) no tienen demostración.

### Comprobar la configuración

`/api/estado` dice si Supabase, el email, `PANEL_SECRET` y OpenAI están configurados, sin mostrar claves ni datos.

### Dar acceso a un cliente

1. Supabase y Resend configurados (ver *Activar citas reales*) y, en Vercel, `PANEL_SECRET`: una cadena aleatoria de 32 caracteres o más (por ejemplo, `openssl rand -base64 48`). Si cambia, se cierran todas las sesiones.
2. En su ficha, los emails que pueden entrar:

   ```json
   "panel": { "emails": ["direccion@autoescuela.es"] }
   ```

3. Commit, push y que entre en `https://<tu-dominio>/panel`. Quitar un email de la ficha le quita el acceso al momento.

En local, sin Resend, el enlace sale en la pantalla y en la terminal.

## Prospectos

En [`prospectos/`](prospectos/README.md) hay dos listas: [`ayuntamientos/`](prospectos/ayuntamientos/README.md) (11 pueblos de Madrid) y [`empresas/`](prospectos/empresas/README.md) (5 autoescuelas y academias de Valencia). Cada carpeta tiene los datos de contacto, cómo abordarlo, el mensaje listo para pegar y su vídeo. Cada lista tiene su `GUION.md`.

## Diseño

* Sistema visual en [`DESIGN.md`](DESIGN.md) y contexto de producto en [`PRODUCT.md`](PRODUCT.md).
* La landing (`/`) enseña el chat de Villaejemplo funcionando en la primera pantalla.
* Siempre en modo claro, aunque el dispositivo esté en modo oscuro.
* Skills de diseño instaladas en `.claude/skills/`: `emil-design-eng` (Emil Kowalski, MIT), `taste-skill` (Leonxlnx, MIT) e `impeccable` (Paul Bakaus, Apache 2.0).

## Qué ve el alcalde

* **Banda superior** con «Demostración para el Ayuntamiento de X» y el botón **Ponerlo en marcha** (abre tu WhatsApp o tu email).
* **Chat** con respuestas con formato (negritas, listas, enlaces), hora de cada mensaje, indicador de «escribiendo», preguntas sugeridas y botón de reintentar si algo falla. La conversación se mantiene al recargar.
* **Incidencias**: cuando el vecino dice qué pasa y dónde, aparece una tarjeta con número, tipo, lugar y estado, marcada como demostración.
* **Panel**: «Vista del ayuntamiento» con las consultas y las incidencias de esa conversación (datos reales, nada inventado) y lo que incluiría el servicio real.
* **Vista previa del enlace** con el nombre del pueblo al compartirlo por WhatsApp o email (`/<slug>/opengraph-image`).
* **Probar en WhatsApp**: botón que aparece si configuras un número de demo.

El encargo de diseño de esta demo está en [`docs/BRIEF-DEMO.md`](docs/BRIEF-DEMO.md).

## Desplegar en Vercel

1. Importa el repositorio en Vercel.
2. Variables de entorno:

| Variable | Uso |
|----------|-----|
| `OPENAI_API_KEY` | Obligatoria: chat y generación de fichas |
| `NEXT_PUBLIC_APP_URL` | URL pública (para imprimir el enlace de cada demo) |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Email comercial: botón «Ponerlo en marcha» y respuesta si preguntan por el servicio |
| `NEXT_PUBLIC_CONTACT_WHATSAPP` | WhatsApp comercial con prefijo (p. ej. `34600111222`); tiene prioridad sobre el email |
| `NEXT_PUBLIC_WHATSAPP_DEMO_NUMBER` | Número del asistente de demo en WhatsApp (botón «Probar en WhatsApp») |
| `OPENAI_CHAT_MODEL`, `OPENAI_FICHA_MODEL` | Opcionales (por defecto `gpt-4.1-mini`) |
| `NOTIFY_URL` | Opcional: tema de [ntfy](https://ntfy.sh) para recibir en el móvil un aviso cuando alguien abre una demo o escribe su primer mensaje |
| `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` | Opcional: base de datos de las citas reales (ver «Citas») |
| `RESEND_API_KEY`, `AVISOS_FROM` | Opcional: email al negocio con cada cita nueva |
| `NEXT_PUBLIC_TITULAR_NOMBRE`, `NEXT_PUBLIC_TITULAR_NIF`, `NEXT_PUBLIC_TITULAR_DOMICILIO` | Datos del titular para el aviso legal (`/aviso-legal`) |

El WhatsApp comercial por defecto es el `34638798445` (en `src/lib/contact.ts`); `NEXT_PUBLIC_CONTACT_WHATSAPP` lo sustituye si se define.

### Avisos al móvil con ntfy

1. Instala la app **ntfy** (Android o iOS).
2. Suscríbete a un tema difícil de adivinar, por ejemplo `atentia-k7p2x9`.
3. En Vercel, añade `NOTIFY_URL=https://ntfy.sh/atentia-k7p2x9` y vuelve a desplegar.

Recibirás «Alguien ha abierto la demo de Chinchón» y el primer mensaje que escriba. Las vistas previas de WhatsApp o del correo no cuentan como visita.

3. Cada demo nueva se publica al hacer commit del JSON.

Las páginas no se indexan en buscadores (`robots.txt` y `noindex`): las demos se comparten por enlace.

## Cómo responde el asistente

Las instrucciones están en `src/lib/prompt.ts`:

* Solo usa la ficha; si no sabe algo, deriva al teléfono, email u horario del ayuntamiento.
* No da asesoramiento jurídico ni pide datos personales.
* Emergencias: remite al 112.
* Incidencias: pide qué pasa y dónde, y en la demo explica que en el servicio real se avisaría a la brigada.

Límites de la demo: 30 mensajes cada 10 minutos por IP y mensajes de hasta 1.000 caracteres.

## Comandos

```bash
npm run dev        # desarrollo
npm run build      # build de producción
npm run typecheck  # tsc --noEmit
npm run lint       # next lint
npm run test       # vitest
npm run preflight  # typecheck + lint + test
npm run demo -- <url>
npm run gestion -- <slug>   # enlace de gestión de la agenda
```

## Próximos pasos

* WhatsApp con número propio del ayuntamiento (API oficial de Meta).
* Registro de incidencias con foto y aviso a la brigada.
* Panel para el ayuntamiento: conversaciones, incidencias, edición de la ficha e informe mensual.
* Base de datos (Supabase, región UE) cuando haya clientes reales.
