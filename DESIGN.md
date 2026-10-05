# Diseño de Atentia

Institucional y cercano. El mundo visual sale del **azulejo de las placas de calle españolas** (cobalto sobre blanco) y el detalle propio es el **sello de «registro de entrada»** en las incidencias.

## Color

Tokens en `src/app/globals.css` (OKLCH), siempre en modo claro (`color-scheme: light`), aunque el dispositivo esté en modo oscuro. Tailwind los expone como `canvas`, `surface`, `sunken`, `ink`, `muted`, `line`, `cobalt` (`strong`, `text`, `soft`, `on`), `danger` y `ok`.

* **Un solo acento:** cobalto. Botones principales, mensajes del vecino, enlaces y sello.
* **Neutros fríos**, tintados hacia el cobalto. Nada de crema ni de negro puro.
* **Color con trabajo:** la banda de cierre de la landing es cobalto entero; el resto es neutro.
* **Color de marca por demo:** si la ficha trae `color` (hex con contraste AA sobre blanco), `src/lib/marca.ts` redefine las variables `--cobalt*` y `--fondo` en el contenedor de la demo. El negocio ve su color en burbujas, botones, sello, panel, vista previa del enlace y vídeo. Sin `color`, se queda el cobalto.
* **La banda de «Demostración para…» es de Atentia**, en `ink`, para no confundirse con la marca del negocio.
* `ok` solo para el punto de «asistente disponible» y el botón «Hecho» del panel; `danger` solo para errores.

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
* **Chat (`/<municipio>` o `/<negocio>`, operar):** cabecera con escudo o logo, hilo, campo de texto y panel lateral. En ordenador, ficha lateral con teléfono, horario, web y «Prueba a preguntar», y el chat como tarjeta elevada sobre `--fondo`; en móvil, el chat a pantalla completa. Trato de tú.
* **Panel del negocio (`/panel`, revisar):** cabecera fija con logo, email y «Salir», y pestañas con subrayado del color de marca (Conversaciones, Citas, Solicitudes o Incidencias, Resumen). Bandeja en una sola tarjeta con filas; señales en píldoras (*Cita* en color, *Solicitud* suave, *Sin respuesta* neutra). Cifras en Geist Mono. Pensado primero para el móvil; «Descargar en Excel» en cada lista.
* **Panel con contador:** cada incidencia o solicitud suma en el botón «Panel» (`.badge-pop`, 260 ms) y el botón se resalta hasta que se abre.

## Prohibido

Etiquetas pequeñas encima de los títulos, tarjetas iguales en fila, texto con degradado, rayas largas en el texto, emojis o caracteres como iconos (se usa Phosphor), capturas falsas hechas con cajas y estadísticas o testimonios inventados.
