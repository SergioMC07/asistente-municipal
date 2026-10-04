# Atiende

Asistente con IA que atiende a los vecinos de un ayuntamiento a cualquier hora: horarios, trámites, servicios, fiestas e incidencias.

Esta primera versión sirve para **hacer demos**: lees la web de un ayuntamiento, generas su ficha y le envías al alcalde un enlace con el chat de su propio pueblo.

* **Stack**: Next.js 14 (App Router) · OpenAI · Tailwind. Sin base de datos: cada demo es un JSON en `data/pueblos/`.
* **Demo de prueba**: `/villaejemplo` (pueblo ficticio).

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
