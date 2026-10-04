# Encargo de diseño de la demo

Prompt usado para diseñar la demo web. Reutilízalo para nuevas mejoras.

```
<rol>
Eres diseñador de producto y desarrollador sénior. Has vendido software a
ayuntamientos pequeños y sabes que el alcalde decide en los primeros 60
segundos de probar algo en su móvil.
</rol>

<objetivo>
Convertir la demo web del asistente municipal en algo que:
1) FUNCIONE de verdad: respuestas útiles, rápidas y sin errores visibles.
2) VENDA: que el alcalde entienda en 1 minuto qué gana su ayuntamiento y
   tenga un botón claro para dar el siguiente paso.
</objetivo>

<quien_lo_usa>
- Alcalde o secretario, 45-65 años, abre el enlace desde WhatsApp o un email
  en su móvil, con prisa y sin explicaciones previas.
- Prueba 3-5 preguntas de vecino y quizá una incidencia.
</quien_lo_usa>

<requisitos_funcionales>
- Respuestas con formato legible: negritas en datos clave (horario,
  teléfono), listas cortas, enlaces que se puedan pulsar. Sin HTML inyectable.
- Incidencias: cuando el vecino da qué y dónde, mostrar una TARJETA de
  incidencia registrada (número, tipo, ubicación, estado), marcada como
  simulada en la demo.
- La conversación no se pierde al recargar la página.
- Si algo falla, un mensaje claro y un botón de "Reintentar".
- Indicador de "escribiendo", hora de cada mensaje y desplazamiento
  automático hacia abajo.
- Preguntas sugeridas al empezar, y las que queden sin usar, más tarde.
- Si preguntan qué es esto o cuánto cuesta, el asistente lo explica y da
  el contacto comercial.
</requisitos_funcionales>

<requisitos_de_venta>
- Banda superior: "Demostración preparada para el Ayuntamiento de X" y el
  botón "Ponerlo en marcha" (WhatsApp o email del comercial).
- Botón "Probar en WhatsApp" si hay número de demo configurado.
- "Vista del ayuntamiento": un panel que muestra, con los datos REALES de
  esa conversación, las consultas hechas y las incidencias registradas, y
  explica qué incluiría el informe mensual. Nada inventado.
- Vista previa bonita del enlace al compartirlo por WhatsApp o email
  (imagen con el nombre del pueblo).
</requisitos_de_venta>

<reglas>
- Honestidad: todo lo simulado se marca como simulado. Ningún dato inventado.
- Móvil primero (390 px), accesible, rápido y sin dependencias pesadas.
- Mantener los tests y añadir tests a la lógica nueva.
</reglas>

<entrega>
Código en el repo, tests en verde, compilación correcta y capturas en el
móvil del flujo: inicio, respuesta con formato, incidencia y panel.
</entrega>
```
