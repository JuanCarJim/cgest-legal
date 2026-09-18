#!/usr/bin/env node
/**
 * Convierte los textos legales de C-Gest en páginas web publicables.
 *
 *   node construir.mjs
 *
 * Google Play y la App Store exigen una URL pública de política de privacidad
 * ANTES de dejar publicar nada, y tiene que seguir en pie mientras la
 * aplicación exista. Por eso vive en su propio repositorio y no dentro del
 * código: se publica con GitHub Pages, no cuesta nada y no se cae porque un
 * servidor deje de pagarse.
 *
 * Los textos se escriben en Markdown porque es lo que se lee y se corrige bien.
 * Esto sólo les pone el HTML y el estilo alrededor.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));

/** El correo de contacto público. Está en un solo sitio a propósito. */
const CORREO = process.env.CORREO_CGEST ?? 'cgest.soporte@gmail.com';

const PAGINAS = [
  { md: 'privacidad.md', html: 'privacidad.html', titulo: 'Política de privacidad · C-Gest' },
  { md: 'terminos.md', html: 'terminos.html', titulo: 'Condiciones de uso · C-Gest' },
];

/**
 * Un Markdown mínimo, el justo para estos dos documentos: títulos, párrafos,
 * negritas, listas y líneas separadoras. Nada de dependencias: una página que
 * tiene que seguir en pie durante años no debería depender de un paquete que
 * haya que ir actualizando.
 */
function aHtml(md) {
  const escapar = (t) =>
    t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // El formato en línea se aplica al bloque YA montado, no línea a línea: una
  // negrita que ocupa dos renglones del Markdown se partía por la mitad.
  const enLinea = (t) =>
    escapar(t)
      .replace(/\*\*([\s\S]+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`(.+?)`/g, '<code>$1</code>')
      // Los correos, enlazados: en el móvil se toca y se abre el correo.
      .replace(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, '<a href="mailto:$1">$1</a>');

  // Se parte en bloques por línea en blanco, que es lo que separa un párrafo
  // de otro en Markdown. Antes se iba línea a línea y se pegaban párrafos que
  // el texto legal tenía a propósito separados.
  const bloques = md.split(/\n\s*\n/);
  const salida = [];

  for (const bruto of bloques) {
    const bloque = bruto.trim();
    if (bloque === '') continue;

    if (/^-{3,}$/.test(bloque)) {
      salida.push('<hr>');
      continue;
    }

    const titulo = /^(#{1,4})\s+([\s\S]*)$/.exec(bloque);
    if (titulo) {
      const n = titulo[1].length;
      const texto = titulo[2].replace(/\s*\n\s*/g, ' ');
      // Cada título con su ancla: Google Play pide una dirección que lleve
      // DIRECTAMENTE a cómo se borra la cuenta, no a la política entera.
      const ancla = texto
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      salida.push(`<h${n} id="${ancla}">${enLinea(texto)}</h${n}>`);
      continue;
    }

    const lineas = bloque.split('\n');
    if (lineas.every((l) => /^\s*[-*]\s+/.test(l))) {
      const puntos = lineas.map((l) => `<li>${enLinea(l.replace(/^\s*[-*]\s+/, ''))}</li>`);
      salida.push(`<ul>\n${puntos.join('\n')}\n</ul>`);
      continue;
    }

    salida.push(`<p>${enLinea(lineas.join(' ').replace(/\s+/g, ' '))}</p>`);
  }

  return salida.join('\n');
}

const ESTILO = `
:root {
  --verde: #2f6f4f; --verde-claro: #eaf3ee;
  --tinta: #1d2b24; --tinta-suave: #4a5a51; --tinta-tenue: #6d7d74;
  --papel: #ffffff; --papel-hundido: #f7f9f8; --borde: #dbe4de;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --verde: #7fc49c; --verde-claro: #16241d;
    --tinta: #e8efea; --tinta-suave: #b9c7c0; --tinta-tenue: #8e9d95;
    --papel: #101713; --papel-hundido: #161f1a; --borde: #27352d;
  }
}
* { box-sizing: border-box; }
body {
  margin: 0; background: var(--papel); color: var(--tinta);
  font: 17px/1.65 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}
.hoja { max-width: 42rem; margin: 0 auto; padding-block: 40px 72px; padding-left: 20px; padding-right: 20px; }
h1 { font-size: 1.9rem; line-height: 1.2; margin: 0 0 6px; text-wrap: balance; }
h2 { font-size: 1.2rem; margin: 34px 0 10px; color: var(--verde); text-wrap: balance; }
h3 { font-size: 1.02rem; margin: 22px 0 8px; }
p, li { color: var(--tinta-suave); }
strong { color: var(--tinta); }
ul { padding-left: 1.2em; }
li { margin-bottom: 6px; }
hr { border: none; border-top: 1px solid var(--borde); margin: 32px 0; }
a { color: var(--verde); }
code { background: var(--papel-hundido); padding: 1px 5px; border-radius: 5px; font-size: .92em; }
.marca {
  display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap;
  padding-bottom: 14px; margin-bottom: 26px; border-bottom: 2px solid var(--borde);
}
.marca .nombre { font-weight: 800; font-size: 1.05rem; color: var(--verde); letter-spacing: .01em; }
.marca .que { font-size: .85rem; color: var(--tinta-tenue); }
.pie { margin-top: 48px; padding-top: 18px; border-top: 1px solid var(--borde); font-size: .85rem; color: var(--tinta-tenue); }
.pie a { margin-right: 14px; }
.fichas { display: grid; gap: 14px; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); margin-top: 26px; }
.ficha {
  display: block; padding: 18px 20px; border: 1px solid var(--borde); border-radius: 12px;
  background: var(--papel-hundido); text-decoration: none; color: inherit;
}
.ficha:hover { border-color: var(--verde); }
.ficha strong { display: block; color: var(--verde); margin-bottom: 4px; }
.ficha span { font-size: .9rem; color: var(--tinta-tenue); }
`;

function pagina({ titulo, cuerpo }) {
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${titulo}</title>
<style>${ESTILO}</style>
</head>
<body>
<main class="hoja">
  <div class="marca">
    <span class="nombre">C-Gest</span>
    <span class="que">Gestión de comunidades de propietarios</span>
  </div>
${cuerpo}
  <div class="pie">
    <a href="./">Inicio</a>
    <a href="./privacidad.html">Privacidad</a>
    <a href="./terminos.html">Condiciones</a>
    <br><br>
    C-Gest · <a href="mailto:${CORREO}">${CORREO}</a>
  </div>
</main>
</body>
</html>
`;
}

for (const { md, html, titulo } of PAGINAS) {
  const texto = readFileSync(join(AQUI, md), 'utf8').replaceAll('CORREO-PENDIENTE', CORREO);
  if (texto.includes('PENDIENTE')) {
    console.error(`⚠  ${md} todavía tiene huecos sin rellenar.`);
  }
  writeFileSync(join(AQUI, html), pagina({ titulo, cuerpo: aHtml(texto) }));
  console.log(`  ${html}`);
}

writeFileSync(
  join(AQUI, 'index.html'),
  pagina({
    titulo: 'C-Gest · Información legal',
    cuerpo: `<h1>Información legal de C-Gest</h1>
<p>C-Gest es una aplicación para que una comunidad de propietarios lleve su propia
gestión: las cuentas, los recibos, las juntas, las actas y los partes de avería.</p>
<div class="fichas">
  <a class="ficha" href="./privacidad.html">
    <strong>Política de privacidad</strong>
    <span>Qué datos se guardan, quién los ve y cómo se borran.</span>
  </a>
  <a class="ficha" href="./terminos.html">
    <strong>Condiciones de uso</strong>
    <span>Qué es C-Gest, qué garantiza y qué no.</span>
  </a>
</div>`,
  }),
);
console.log('  index.html');
