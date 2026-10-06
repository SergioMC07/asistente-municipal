// ============================================
// Graba el vídeo de la demo de un pueblo
// ============================================
// Uso (con la demo publicada o con `npm run dev` en marcha):
//   npm run video -- chinchon --url https://tu-proyecto.vercel.app
//
// Abre la demo en un móvil simulado, escribe las preguntas, espera las
// respuestas reales del asistente, registra una incidencia y enseña el panel
// de demostración (conversaciones, incidencias o solicitudes y resumen).
// Deja en prospectos/ayuntamientos/<slug>/video/ (o prospectos/empresas/…) el MP4, una miniatura GIF y una portada para el correo.
//
// Opciones:
//   --url          dirección de la web (por defecto NEXT_PUBLIC_APP_URL o localhost:3000)
//   --desconocida  pregunta que NO está en la ficha, para enseñar que no inventa
//   --incidencia   aviso de incidencia con qué pasa y dónde
//   --marca        texto en una etiqueta fija (p. ej. "Vista previa")
//   --publica      dirección que se muestra en el vídeo, si se graba en local
//                  (por defecto la de --url)
//
// La primera vez: npx playwright install chromium

import { execFileSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { chromium, type FrameLocator, type Locator, type Page } from 'playwright';
import { contactWhatsapp, formatPhone } from '../src/lib/contact';
import { textos } from '../src/lib/entidad';
import { getPueblo } from '../src/lib/pueblo';

const W = 1280;
const H = 720;
const FONTS = path.join(process.cwd(), 'node_modules/geist/dist/fonts/geist-sans');

type Args = { slug?: string; url?: string; desconocida?: string; incidencia?: string; marca?: string; publica?: string };

function parseArgs(argv: string[]): Args {
  const args: Record<string, string | undefined> = {};
  const positional: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      args[argv[i].slice(2)] = argv[i + 1] ?? '';
      i += 1;
    } else {
      positional.push(argv[i]);
    }
  }
  return { ...args, slug: positional[0] };
}

async function loadEnv() {
  try {
    const raw = await fs.readFile(path.join(process.cwd(), '.env.local'), 'utf8');
    for (const line of raw.split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  } catch {
    // sin .env.local
  }
}

function ffmpegPath(): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('@ffmpeg-installer/ffmpeg').path;
  } catch {
    return 'ffmpeg';
  }
}

const esc = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Página que rodea a la demo: rótulos a la izquierda, móvil a la derecha. */
function escenario(o: {
  titulo: string;
  lema: string;
  color: string;
  demoUrl: string;
  /** Dirección que se lee en pantalla (la pública, aunque se grabe en local). */
  publica: string;
  telefono: string;
  pasos: number;
  marca?: string;
  cierre: string;
}) {
  const host = o.publica.replace(/^https?:\/\//, '');
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><style>
@font-face{font-family:Geist;src:url(fonts/Geist-Regular.woff2) format('woff2');font-weight:400}
@font-face{font-family:Geist;src:url(fonts/Geist-Medium.woff2) format('woff2');font-weight:500}
@font-face{font-family:Geist;src:url(fonts/Geist-SemiBold.woff2) format('woff2');font-weight:600}
:root{--cobalt:${o.color};--ink:oklch(0.24 0.035 258);--muted:oklch(0.46 0.03 258);--canvas:color-mix(in oklch, ${o.color} 5%, oklch(0.925 0.008 258));--line:oklch(0.86 0.014 258);--ease:cubic-bezier(.22,1,.36,1)}
*{box-sizing:border-box}
body{margin:0;width:${W}px;height:${H}px;overflow:hidden;background:var(--canvas);color:var(--ink);font-family:Geist,system-ui,sans-serif;-webkit-font-smoothing:antialiased}
.brand{position:absolute;top:44px;left:104px;display:flex;align-items:center;gap:10px;font-weight:600;font-size:17px}
.mono{width:30px;height:30px;border-radius:8px;background:var(--cobalt);color:#fff;display:grid;place-items:center;font-size:14px}
.stage{display:grid;grid-template-columns:1fr 380px;gap:72px;align-items:center;height:100%;padding:0 104px}
.copy{transition:opacity 180ms ease,transform 280ms var(--ease)}
.copy.out{opacity:0;transform:translateY(8px)}
.who{font-size:18px;color:var(--muted)}
h1{font-size:46px;line-height:1.08;letter-spacing:-.035em;font-weight:600;margin:14px 0 0;max-width:15ch;text-wrap:balance}
.copy p{font-size:21px;line-height:1.5;color:var(--muted);margin:18px 0 0;max-width:32ch}
.steps{display:flex;gap:6px;margin-top:40px}
.steps i{width:34px;height:4px;border-radius:2px;background:var(--line);transition:background 300ms ease}
.steps i.on{background:var(--cobalt)}
.foot{position:absolute;bottom:40px;left:104px;font-size:15px;color:var(--muted)}
.phone{width:380px;height:660px;border-radius:46px;background:oklch(0.2 0.02 258);padding:10px;box-shadow:0 34px 70px -24px oklch(0.24 0.035 258 / .45)}
.phone iframe{width:100%;height:100%;border:0;border-radius:36px;background:#fff}
.card{position:absolute;inset:0;z-index:30;background:var(--cobalt);color:#fff;display:flex;flex-direction:column;justify-content:center;padding:0 104px;transition:opacity 450ms ease}
.card.hide{opacity:0;pointer-events:none}
.card .mono{background:#fff;color:var(--cobalt);width:44px;height:44px;border-radius:12px;font-size:20px;font-weight:600}
.card h1{font-size:60px;max-width:18ch;margin-top:36px}
.card p{font-size:24px;opacity:.85;margin:18px 0 0}
.card .url{font-size:30px;font-weight:600;opacity:1;margin-top:34px}
#cursor{position:absolute;left:0;top:0;z-index:20;pointer-events:none;transform:translate(1000px,560px);transition:transform 700ms var(--ease)}
#cursor svg{filter:drop-shadow(0 2px 3px rgba(0,0,0,.3))}
.ring{position:absolute;left:-14px;top:-14px;width:28px;height:28px;border-radius:50%;background:rgba(29,74,165,.35);animation:ring 450ms var(--ease) forwards}
@keyframes ring{from{transform:scale(.4);opacity:1}to{transform:scale(1.7);opacity:0}}
.marca{position:absolute;top:40px;left:230px;z-index:40;background:#b4410e;color:#fff;font-size:13px;font-weight:600;padding:6px 12px;border-radius:99px}
</style></head><body>
<div class="brand"><span class="mono">A</span>Atentia</div>
<div class="stage">
  <div class="copy" id="copy">
    <div class="who">${esc(o.titulo)}</div>
    <h1 id="title">Asistente 24 horas</h1>
    <p id="text"></p>
    <div class="steps">${'<i></i>'.repeat(o.pasos)}</div>
  </div>
  <div class="phone"><iframe src="${esc(o.demoUrl)}" title="Demo"></iframe></div>
</div>
<div class="foot">${esc(host)}</div>
<div id="cursor"><svg width="22" height="26" viewBox="0 0 22 26"><path d="M2 2l17 12.5-7.6 1.3 4.4 8.2-3.3 1.6-4.3-8.3L2 22.6z" fill="#fff" stroke="#111" stroke-width="1.6" stroke-linejoin="round"/></svg></div>
<div class="card" id="intro">
  <span class="mono">A</span>
  <h1>${esc(o.titulo)}</h1>
  <p>${esc(o.lema)}</p>
</div>
<div class="card hide" id="outro">
  <span class="mono">A</span>
  <h1>${esc(o.cierre)}</h1>
  <p class="url">${esc(host)}</p>
  <p>WhatsApp ${esc(o.telefono)}</p>
</div>
${o.marca ? `<div class="marca">${esc(o.marca)}</div>` : ''}
<script>
const copy=document.getElementById('copy');
window.caption=(i,title,text)=>{copy.classList.add('out');setTimeout(()=>{
  document.getElementById('title').textContent=title;document.getElementById('text').textContent=text;
  document.querySelectorAll('.steps i').forEach((el,n)=>el.classList.toggle('on',n<=i));
  copy.classList.remove('out')},200)};
const cursor=document.getElementById('cursor');
window.moveCursor=(x,y)=>{cursor.style.transform='translate('+x+'px,'+y+'px)'};
window.tap=()=>{const r=document.createElement('span');r.className='ring';cursor.appendChild(r);setTimeout(()=>r.remove(),500)};
window.card=(id,show)=>document.getElementById(id).classList.toggle('hide',!show);
</script></body></html>`;
}

async function main() {
  await loadEnv();
  const args = parseArgs(process.argv.slice(2));
  if (!args.slug) {
    console.error('Uso: npm run video -- <slug> [--url https://tu-proyecto.vercel.app]');
    process.exit(1);
  }
  const pueblo = await getPueblo(args.slug);
  if (!pueblo) throw new Error(`No existe data/pueblos/${args.slug}.json`);

  // Acepta la web (https://x.vercel.app) o el enlace de la demo (https://x.vercel.app/chinchon).
  const base = (args.url || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
    .replace(/\/+$/, '')
    .replace(new RegExp(`/${pueblo.slug}$`), '');
  const demoUrl = `${base}/${pueblo.slug}`;
  // El escenario se sirve en el mismo origen que la demo para que el navegador
  // deje cargarla dentro (sin bloqueos entre orígenes ni de red local).
  const ESCENARIO = `${base}/__escenario__/`;
  const [p1, p2] = pueblo.sugerencias;
  const negocio = pueblo.tipo === 'negocio';
  const t = textos(pueblo);
  const desconocida = args.desconocida || pueblo.demo?.desconocida;
  const registro = args.incidencia || pueblo.demo?.incidencia;
  const pasos = negocio
    ? [
        {
          titulo: 'Responde con la información de su web.',
          texto: 'Precios, horarios y cómo apuntarse, a cualquier hora del día.',
          mensaje: p1 || '¿Cuánto cuesta?',
        },
        {
          titulo: 'También de noche y en fin de semana.',
          texto: 'Cuando el centro está cerrado, tus futuros alumnos siguen teniendo respuesta.',
          mensaje: p2 || '¿Qué horario tenéis?',
        },
        {
          titulo: 'Si no lo sabe, no se lo inventa.',
          texto: 'Remite al teléfono del centro o propone que le llamen.',
          mensaje: desconocida || '¿Tenéis algún descuento para estudiantes?',
        },
        {
          titulo: 'Convierte preguntas en alumnos.',
          texto: 'Recoge la solicitud para que el centro llame.',
          mensaje: registro || 'Me gustaría apuntarme. ¿Me podéis llamar el lunes por la tarde?',
          incidencia: true,
        },
        {
          titulo: 'Y tú lo ves todo en tu panel.',
          texto: 'Quién ha escrito, a quién llamar y las citas, desde el móvil.',
          panel: 'abrir' as const,
        },
        {
          titulo: 'Cada contacto, listo para llamar.',
          texto: 'Y un resumen con lo que más preguntan y lo que no supo responder.',
          panel: 'resumen' as const,
        },
      ]
    : [
        {
          titulo: 'Responde con la información de su web.',
          texto: 'Horarios, trámites y servicios, a cualquier hora del día.',
          mensaje: p1 || '¿Qué horario tiene el ayuntamiento?',
        },
        {
          titulo: 'También a visitantes y en fin de semana.',
          texto: 'Cuando la oficina está cerrada, los vecinos siguen teniendo respuesta.',
          mensaje: p2 || '¿Qué puedo visitar en el pueblo?',
        },
        {
          titulo: 'Si no lo sabe, no se lo inventa.',
          texto: 'Deriva al teléfono o al horario de la oficina.',
          mensaje: desconocida || '¿Qué día pasa el camión de recogida de muebles viejos?',
        },
        {
          titulo: 'Recoge incidencias con número de registro.',
          texto: 'En el servicio real se avisa al responsable municipal.',
          mensaje: registro || 'La farola de la Plaza Mayor, junto al número 5, no se enciende por la noche',
          incidencia: true,
        },
        {
          titulo: 'Y el ayuntamiento lo ve todo.',
          texto: 'Qué preguntan los vecinos, día a día, en su panel.',
          panel: 'abrir' as const,
        },
        {
          titulo: 'Incidencias y resumen del mes.',
          texto: 'Cada aviso con su estado, y lo que el asistente no supo responder.',
          panel: 'resumen' as const,
        },
      ];

  const outDir = path.join(process.cwd(), 'prospectos', negocio ? 'empresas' : 'ayuntamientos', pueblo.slug, 'video');
  const rawDir = path.join(outDir, '.grabacion');
  await fs.rm(rawDir, { recursive: true, force: true });
  await fs.mkdir(rawDir, { recursive: true });

  console.log(`Grabando ${demoUrl}…`);
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  const context = await browser.newContext({
    viewport: { width: W, height: H },
    recordVideo: { dir: rawDir, size: { width: W, height: H } },
    locale: 'es-ES',
    timezoneId: 'Europe/Madrid',
    colorScheme: 'light',
  });
  const page = await context.newPage();
  const t0 = Date.now();
  const now = () => (Date.now() - t0) / 1000;

  await page.route(`${ESCENARIO}**`, async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.includes('/fonts/')) {
      const file = path.join(FONTS, path.basename(url.pathname));
      return route.fulfill({ body: await fs.readFile(file), contentType: 'font/woff2' });
    }
    return route.fulfill({
      contentType: 'text/html; charset=utf-8',
      body: escenario({
        titulo: t.titulo,
        color: pueblo.color ?? '#1D4AA5',
        lema: negocio ? 'Asistente 24 horas para tus alumnos' : 'Asistente 24 horas para vecinos y visitantes',
        demoUrl,
        publica: args.publica ? `${args.publica.replace(/\/+$/, '')}/${pueblo.slug}` : demoUrl,
        telefono: formatPhone(contactWhatsapp()),
        pasos: pasos.length,
        marca: args.marca,
        cierre: negocio ? 'Pruébalo tú, como un alumno.' : 'Pruébelo usted, como un vecino.',
      }),
    });
  });

  await page.goto(ESCENARIO);
  const inicio = now();
  const demo: FrameLocator = page.frameLocator('iframe');
  try {
    await demo.locator('#mensaje').waitFor({ timeout: 30_000 });
  } catch {
    throw new Error(`No se pudo abrir ${demoUrl}. ¿Está la web en marcha y existe la demo?`);
  }
  await page.evaluate(() => document.fonts.ready);
  // Más sitio para la conversación: el escenario ya dice de qué pueblo es la demo.
  // (La portada tapa la demo, así que se pulsa desde el propio botón.)
  await demo
    .getByRole('button', { name: 'Ocultar aviso' })
    .evaluate((el: HTMLElement) => el.click(), undefined, { timeout: 3000 })
    .catch(() => {});
  await sleep(2600);
  await page.evaluate(() => (window as any).card('intro', false));
  await sleep(600);

  const moveTo = async (target: Locator) => {
    const box = await target.boundingBox();
    if (!box) return;
    await page.evaluate(
      ([x, y]) => (window as any).moveCursor(x, y),
      [box.x + box.width / 2 - 4, box.y + box.height / 2 - 2]
    );
    await sleep(750);
  };
  const tap = () => page.evaluate(() => (window as any).tap());

  const preguntar = async (page: Page, texto: string) => {
    const input = demo.locator('#mensaje');
    await moveTo(input);
    await tap();
    await input.click();
    await input.pressSequentially(texto, { delay: 42 });
    await sleep(300);
    const enviar = demo.getByRole('button', { name: 'Enviar' });
    await moveTo(enviar);
    const respuesta = page.waitForResponse(
      (r) => r.url().includes('/api/chat') && r.request().method() === 'POST',
      { timeout: 60_000 }
    );
    await tap();
    await enviar.click();
    const r = await respuesta;
    if (!r.ok()) throw new Error(`El asistente ha fallado (${r.status()}): ${await r.text()}`);
    // El hilo marca aria-busy mientras llega la respuesta.
    await demo.locator('[aria-busy="false"]').waitFor({ timeout: 90_000 });
    await sleep(600);
    // Que se lea la respuesta desde el principio (y la tarjeta de incidencia entera).
    await demo
      .locator('.msg-in')
      .last()
      .evaluate((el) => el.scrollIntoView({ block: 'start', behavior: 'smooth' }))
      .catch(() => {});
    await sleep(500);
    return demo.locator('.leading-relaxed').last().innerText().catch(() => '');
  };

  const panelUrl = `${base}/panel/demo/${pueblo.slug}`;
  const desplazar = (top: number) =>
    demo
      .locator('body')
      .evaluate((_, y) => window.scrollTo({ top: y, behavior: 'smooth' }), top)
      .catch(() => {});
  const pulsar = async (objetivo: Locator) => {
    await moveTo(objetivo);
    await tap();
    await objetivo.click();
  };

  let marcaGif = 0;
  let captura: Buffer | null = null;
  for (const [i, paso] of pasos.entries()) {
    await page.evaluate(([i, t, x]) => (window as any).caption(i, t, x), [i, paso.titulo, paso.texto] as const);
    await sleep(1300);
    if (i === 0) marcaGif = now();

    if (paso.mensaje) {
      const texto = await preguntar(page, paso.mensaje);
      if (paso.incidencia && !(await demo.getByText(/^(INC|SOL)-\d{4}$/).isVisible())) {
        console.warn('  ! No ha salido la tarjeta de incidencia o solicitud: revisa el vídeo o cambia --incidencia');
      }
      await sleep(Math.min(7500, Math.max(2800, 1800 + texto.length * 28)));
      // Portada del correo: la conversación con la tarjeta de incidencia o solicitud.
      if (paso.incidencia) captura = await page.screenshot({ type: 'png' });
    } else if (paso.panel === 'abrir') {
      // El cajón «Panel» del chat y, desde él, el panel completo de demostración.
      await pulsar(demo.getByRole('button', { name: /^Panel/ }));
      await sleep(2200);
      const completo = demo.getByRole('link', { name: 'Ver el panel completo' });
      await moveTo(completo);
      await tap();
      // El enlace abre otra pestaña: aquí se carga en el mismo móvil.
      await page.evaluate((url) => {
        document.querySelector('iframe')!.src = url;
      }, panelUrl);
      await demo.getByRole('heading', { name: 'Conversaciones' }).waitFor({ timeout: 30_000 });
      await page.evaluate(() => (window as any).moveCursor(760, 600));
      await sleep(2600);
      await desplazar(420);
      await sleep(2600);
      await desplazar(0);
      await sleep(900);
    } else if (paso.panel === 'resumen') {
      const registros = demo.getByRole('link', { name: new RegExp(`^${t.clase === 'solicitud' ? 'Solicitudes' : 'Incidencias'}`) });
      await pulsar(registros);
      await demo.getByRole('heading', { name: t.clase === 'solicitud' ? 'Solicitudes' : 'Incidencias' }).waitFor({ timeout: 30_000 });
      await page.evaluate(() => (window as any).moveCursor(760, 600));
      await sleep(3200);
      await pulsar(demo.getByRole('link', { name: 'Resumen' }));
      await demo.getByRole('heading', { name: 'Resumen' }).waitFor({ timeout: 30_000 });
      await page.evaluate(() => (window as any).moveCursor(760, 600));
      await sleep(2200);
      await desplazar(520);
      await sleep(3000);
    }
  }

  captura ??= await page.screenshot({ type: 'png' });
  await page.evaluate(() => (window as any).card('outro', true));
  await sleep(4800);

  const video = page.video();
  await context.close();
  const webm = await video!.path();

  const mp4 = path.join(outDir, `atentia-${pueblo.slug}.mp4`);
  const gif = path.join(outDir, 'miniatura.gif');
  const png = path.join(outDir, 'portada.png');
  const ffmpeg = ffmpegPath();
  const run = (a: string[]) => execFileSync(ffmpeg, ['-y', '-loglevel', 'error', ...a]);

  run(['-ss', inicio.toFixed(2), '-i', webm, '-c:v', 'libx264', '-preset', 'slow', '-crf', '18',
    '-pix_fmt', 'yuv420p', '-r', '30', '-movflags', '+faststart', mp4]);
  run(['-ss', marcaGif.toFixed(2), '-t', '7', '-i', webm, '-vf',
    'fps=12,scale=640:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=128[p];[b][p]paletteuse=dither=bayer:bayer_scale=4',
    gif]);

  // Portada: la captura con un botón de reproducir encima, como la de Loom.
  const portada = await browser.newPage({ viewport: { width: W, height: H } });
  await portada.setContent(`<body style="margin:0;position:relative">
    <img src="data:image/png;base64,${captura.toString('base64')}" style="display:block;width:${W}px">
    <div style="position:absolute;inset:0;display:grid;place-items:center;background:rgba(10,20,45,.18)">
      <div style="width:116px;height:116px;border-radius:50%;background:${pueblo.color ?? '#1D4AA5'};display:grid;place-items:center;box-shadow:0 18px 40px -10px rgba(0,0,0,.45)">
        <svg width="44" height="50" viewBox="0 0 44 50"><path d="M6 4l34 21L6 46z" fill="#fff"/></svg>
      </div>
    </div></body>`);
  await portada.screenshot({ path: png });
  await browser.close();
  await fs.rm(rawDir, { recursive: true, force: true });

  const rel = (f: string) => path.relative(process.cwd(), f);
  console.log(`\nListo:\n  · ${rel(mp4)}  (vídeo)\n  · ${rel(gif)}  (miniatura animada)\n  · ${rel(png)}  (portada)`);
  console.log('\nMíralo entero antes de enviarlo. Luego súbelo a Loom (Upload) o a Google Drive');
  console.log('y en el correo pon la miniatura o la portada con el enlace al vídeo.');
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
