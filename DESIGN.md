# Diseño de Atiende

Institucional y cercano. El mundo visual sale del **azulejo de las placas de calle españolas** (cobalto sobre blanco) y el detalle propio es el **sello de «registro de entrada»** en las incidencias.

## Color

Tokens en `src/app/globals.css` (OKLCH), siempre en modo claro (`color-scheme: light`), aunque el dispositivo esté en modo oscuro. Tailwind los expone como `canvas`, `surface`, `sunken`, `ink`, `muted`, `line`, `cobalt` (`strong`, `text`, `soft`, `on`), `danger` y `ok`.

* **Un solo acento:** cobalto. Botones principales, mensajes del vecino, enlaces y sello.
* **Neutros fríos**, tintados hacia el cobalto. Nada de crema ni de negro puro.
* **Color con trabajo:** la banda de cierre de la landing y la banda de demostración del chat son cobalto entero; el resto es neutro.
* `ok` solo para el punto de «asistente disponible»; `danger` solo para errores.

## Tipografía

Geist Sans para todo y Geist Mono para horas, números de registro y cifras (`tabular-nums`). Titulares en 600 con tracking negativo (-0.03 a -0.035em); texto a 16-18 px, 45-65 caracteres por línea.

## Forma

* Botones y campos: píldora.
* Bloques (chat, panel, tarjetas de incidencia): 12-22 px de radio.
* Sombra suave y tintada (`shadow-soft`) solo en superficies que flotan: el chat de la landing, las burbujas del asistente y el panel.

## Movimiento

Curvas propias (`--ease-out`, `--ease-drawer`), siempre por debajo de 300 ms:

* `.press`: escala 0.97 al pulsar.
* `.msg-in`: los mensajes nuevos suben 6 px y aparecen.
* `.drawer-in`: el panel entra desde la derecha.
* Con `prefers-reduced-motion` se quedan solo los fundidos.

## Superficies

* **Landing (`/`, persuadir):** primera pantalla con el chat de ejemplo funcionando. Secciones con estructuras distintas: lista de tres verbos, panel real con datos de ejemplo, garantías en cuadrícula de dos columnas y banda de cierre cobalto. Una sola llamada a la acción: «Pedir mi demo».
* **Chat (`/<municipio>`, operar):** cabecera con escudo, hilo, campo de texto y panel lateral. Trato de tú.

## Prohibido

Etiquetas pequeñas encima de los títulos, tarjetas iguales en fila, texto con degradado, rayas largas en el texto, emojis o caracteres como iconos (se usa Phosphor), capturas falsas hechas con cajas y estadísticas o testimonios inventados.
