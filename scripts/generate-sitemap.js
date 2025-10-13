#!/usr/bin/env node
import { writeFileSync, readFileSync } from 'fs';
import { resolve } from 'path';

const origin = process.env.SITEMAP_ORIGIN || 'https://www.katherinefang.com';
const routes = ['/', '/contact'];

try {
  const cfgPath = resolve(process.cwd(), 'data/app-config.json');
  const raw = readFileSync(cfgPath, 'utf-8');
  const cfg = JSON.parse(raw);
  const ids = Array.isArray(cfg?.projects) ? cfg.projects.map(p => p.id).filter(Boolean) : [];
  for (const id of ids) {
    routes.push(`/project/${id}`);
  }
} catch (e) {
  // fallback: only static routes
}

const now = new Date().toISOString();
const urls = routes.map((p) => `  <url>\n    <loc>${origin}${p}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>${p === '/' ? '1.0' : '0.8'}</priority>\n  </url>`).join('\n');

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;

const outPath = resolve(process.cwd(), 'public/sitemap.xml');
writeFileSync(outPath, xml);
console.log(`Sitemap written to ${outPath}`);