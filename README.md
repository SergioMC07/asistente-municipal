# Atiende

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

* `atiende-<slug>.mp4`: el vídeo, de algo más de un minuto, con rótulos, portada y cierre con tu WhatsApp.
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

## Prospectos

En [`prospectos/`](prospectos/README.md) hay dos listas: [`ayuntamientos/`](prospectos/ayuntamientos/README.md) (11 pueblos de Madrid) y [`empresas/`](prospectos/empresas/README.md) (5 autoescuelas y academias de Valencia). Cada carpeta tiene los datos de contacto, cómo abordarlo, el mensaje listo para pegar y su vídeo. Cada lista tiene su `GUION.md`.

## Diseño

* Sistema visual en [`DESIGN.md`](DESIGN.md) y contexto de producto en [`PRODUCT.md`](PRODUCT.md).
* La landing (`/`) enseña el chat de Villaejemplo funcionando en la primera pantalla.
* Modo oscuro automático según el ajuste del dispositivo.
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
| `NEXT_PUBLIC_TITULAR_NOMBRE`, `NEXT_PUBLIC_TITULAR_NIF`, `NEXT_PUBLIC_TITULAR_DOMICILIO` | Datos del titular para el aviso legal (`/aviso-legal`) |

El WhatsApp comercial por defecto es el `34638798445` (en `src/lib/contact.ts`); `NEXT_PUBLIC_CONTACT_WHATSAPP` lo sustituye si se define.

### Avisos al móvil con ntfy

1. Instala la app **ntfy** (Android o iOS).
2. Suscríbete a un tema difícil de adivinar, por ejemplo `atiende-k7p2x9`.
3. En Vercel, añade `NOTIFY_URL=https://ntfy.sh/atiende-k7p2x9` y vuelve a desplegar.

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
```

## Próximos pasos

* WhatsApp con número propio del ayuntamiento (API oficial de Meta).
* Registro de incidencias con foto y aviso a la brigada.
* Panel para el ayuntamiento: conversaciones, incidencias, edición de la ficha e informe mensual.
* Base de datos (Supabase, región UE) cuando haya clientes reales.
