# Ayuntamientos para llamar

Cada carpeta tiene los datos del ayuntamiento, el guion adaptado, el correo listo para pegar y el comando para grabar su vídeo. El guion general está en [GUION.md](GUION.md).

Están ordenados por prioridad: primero los de más turismo y con datos más claros.

| # | Pueblo | Habitantes | Teléfono | Alcalde/sa | Demo |
|---|---|---|---|---|---|
| 1 | [Chinchón](chinchon/README.md) | unos 5.500 | 918 940 004 | Juan Antonio Vega Expósito | [/chinchon](https://asistente-municipal.vercel.app/chinchon) |
| 2 | [Buitrago del Lozoya](buitrago-del-lozoya/README.md) | unos 2.000 | 918 680 056 | Francisco Javier del Valle Morales | [/buitrago-del-lozoya](https://asistente-municipal.vercel.app/buitrago-del-lozoya) |
| 3 | [Rascafría](rascafria/README.md) | unos 2.000 | 918 691 117 | Óscar Luis Canencia Sanz | [/rascafria](https://asistente-municipal.vercel.app/rascafria) |
| 4 | [Torrelaguna](torrelaguna/README.md) | unos 5.000 | 918 430 010 | Víctor José Gutiérrez Sánchez | [/torrelaguna](https://asistente-municipal.vercel.app/torrelaguna) |
| 5 | [Manzanares El Real](manzanares-el-real/README.md) | unos 9.500 | 918 530 009 | Julián Nieva Delgado | [/manzanares-el-real](https://asistente-municipal.vercel.app/manzanares-el-real) |
| 6 | [San Martín de Valdeiglesias](san-martin-de-valdeiglesias/README.md) | unos 9.000 | 918 611 308 | Aránzazu Povedano Fraguela | [/san-martin-de-valdeiglesias](https://asistente-municipal.vercel.app/san-martin-de-valdeiglesias) |
| 7 | [Cercedilla](cercedilla/README.md) | unos 7.300 | 918 525 740 | David José Martín Molpeceres | [/cercedilla](https://asistente-municipal.vercel.app/cercedilla) |
| 8 | [Colmenar de Oreja](colmenar-de-oreja/README.md) | unos 8.500 | 918 943 030 | Miguel Ángel Pulido Cobos | [/colmenar-de-oreja](https://asistente-municipal.vercel.app/colmenar-de-oreja) |
| 9 | [Morata de Tajuña](morata-de-tajuna/README.md) | unos 8.200 | 918 730 380 | Ángel Marcelo Sánchez Sacristán | [/morata-de-tajuna](https://asistente-municipal.vercel.app/morata-de-tajuna) |
| 10 | [Navacerrada](navacerrada/README.md) | unos 3.200 | 918 560 006 | Pablo Luis Jorge Herrero | [/navacerrada](https://asistente-municipal.vercel.app/navacerrada) |
| 11 | [Villarejo de Salvanés](villarejo-de-salvanes/README.md) | unos 7.800 | 918 744 002 | Jesús Díaz Raboso | [/villarejo-de-salvanes](https://asistente-municipal.vercel.app/villarejo-de-salvanes) |

**Villarejo de Salvanés va el último a propósito**: en agosto de 2026 hubo protestas vecinales contra el alcalde. Lee la nota de su carpeta antes de llamar.

## Valencia

Datos de búsquedas del 7 de octubre de 2026. En Valencia hay más competencia: la Diputació ofrece a los pueblos el asistente «ALI» de Alicante y prepara asistentes con Revital-IA, y CivitPhone ya está en 12 municipios. En cada carpeta está cómo plantearlo.

| # | Pueblo | Habitantes | Teléfono | Alcalde/sa | Demo |
|---|---|---|---|---|---|
| 1 | [Simat de la Valldigna](simat-de-la-valldigna/README.md) | unos 3.300 | 962 810 007 | Sebastián Mahiques Morant | [/simat-de-la-valldigna](https://asistente-municipal.vercel.app/simat-de-la-valldigna) |
| 2 | [Bocairent](bocairent/README.md) | unos 4.100 | 962 350 014 | Por confirmar | [/bocairent](https://asistente-municipal.vercel.app/bocairent) |
| 3 | [Moixent](moixent/README.md) | unos 4.400 | 962 295 010 | Guillermo Jorques Lladosa | [/moixent](https://asistente-municipal.vercel.app/moixent) |
| 4 | [Ayora](ayora/README.md) | unos 5.200 | 962 191 025 | José Vicente Anaya Roig | [/ayora](https://asistente-municipal.vercel.app/ayora) |
| 5 | [El Puig de Santa Maria](el-puig/README.md) | unos 9.500 | 961 470 003 | Marc Oriola Pla | [/el-puig](https://asistente-municipal.vercel.app/el-puig) |
| 6 | [Buñol](bunol/README.md) | unos 9.900 | 962 500 151 | Virginia Sanz Ferrús | [/bunol](https://asistente-municipal.vercel.app/bunol) |
| 7 | [Enguera](enguera/README.md) | unos 4.800 | 962 224 033 | Matilde Marín | [/enguera](https://asistente-municipal.vercel.app/enguera) |
| 8 | [Albaida](albaida/README.md) | unos 6.300 | 962 900 960 | Juan Carlos Roses Guerola | [/albaida](https://asistente-municipal.vercel.app/albaida) |

**Albaida va el último a propósito**: del 8 al 11 de octubre de 2026 está en plenas fiestas de Moros i Cristians. Escríbeles a partir del martes 13.

## Cómo trabajar cada pueblo

1. Abre su demo y haz las preguntas de ejemplo. Si algo está mal, corrige `data/pueblos/<pueblo>.json`, sube el cambio y Vercel lo publica solo.
2. Graba su vídeo con la IA real: `npm run video -- <pueblo> --url https://asistente-municipal.vercel.app`. Para grabar todos de una vez: `npm run videos -- --url https://asistente-municipal.vercel.app`.
3. Llama con el guion.
4. Envía el correo de su carpeta con la demo y el enlace de Loom.
5. Marca el estado y apunta las notas en su carpeta.

Los datos salen de búsquedas en internet del 5 de octubre de 2026. **Lo que pone «Comprueba antes de llamar» puede estar desactualizado.**
