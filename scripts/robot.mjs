// Robot de noticias de Sin Gato por Liebre (Vibras Positivas HM)
// Corre en GitHub Actions cada 30 minutos: busca en Google Noticias y actualiza data/noticias.json
import { readFile, writeFile } from 'node:fs/promises';

const FILE = 'data/noticias.json';
const QUERIES = [
  'títulos falsos funcionarios',
  'diploma falso cargo público',
  'hoja de vida falsa funcionario',
  'falsedad en documento público título universitario',
  'Fundación San José títulos',
  'certificado laboral falso contratista',
  'consulta pública de títulos SNIES',
  'tarjeta profesional falsa',
  'candidato título falso Colombia',
  'convalidación título falsa Colombia'
];
const KEEP = /t[ií]tul|diplom|hoja de vida|certificad|falsed|falsific|saber pro|convalid|tarjeta profesional|san jos[eé]|guerrero/i;

const decode = s => s.replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1')
  .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
const tag = (xml, t) => { const m = xml.match(new RegExp(`<${t}[^>]*>([\\s\\S]*?)</${t}>`)); return m ? decode(m[1]) : ''; };

async function search(q) {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(q + ' when:30d')}&hl=es-419&gl=CO&ceid=CO:es-419`;
  const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (VibrasPositivasHM robot)' } });
  if (!r.ok) throw new Error(`${r.status} ${q}`);
  const xml = await r.text();
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(m => {
    const it = m[1];
    const source = tag(it, 'source') || 'Google Noticias';
    let title = tag(it, 'title');
    if (source && title.endsWith(' - ' + source)) title = title.slice(0, -(source.length + 3));
    return { title, source, link: tag(it, 'link'), date: new Date(tag(it, 'pubDate') || Date.now()).toISOString() };
  });
}

let prev = { noticias: [] };
try { prev = JSON.parse(await readFile(FILE, 'utf8')); } catch {}

const map = new Map();
for (const n of prev.noticias || []) map.set(n.title.toLowerCase().slice(0, 70), n);
let nuevas = 0;
for (const q of QUERIES) {
  try {
    for (const n of await search(q)) {
      if (!n.title || !KEEP.test(n.title)) continue;
      const k = n.title.toLowerCase().slice(0, 70);
      if (!map.has(k)) { map.set(k, n); nuevas++; }
    }
  } catch (e) { console.log('Fallo en búsqueda:', e.message); }
  await new Promise(r => setTimeout(r, 800));
}

const noticias = [...map.values()].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 200);
await writeFile(FILE, JSON.stringify({
  actualizado: new Date().toISOString(),
  fuente: 'Robot Sin Gato por Liebre (Google Noticias)',
  noticias
}, null, 2) + '\n');
console.log(`Listo: ${nuevas} noticias nuevas, ${noticias.length} en total.`);
