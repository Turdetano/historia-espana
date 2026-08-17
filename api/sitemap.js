// api/sitemap.js — Sitemap dinámico generado desde Firestore
const PROJECT_ID = "historia-espana-final";
const API_KEY = "AIzaSyAP6kTYZ4r1CYoE7aWJ_Z7YCVM_sbvIaZU";
const SITE = "https://historia-espana-9hbk.vercel.app";
const generateSlug = (t) => t.toString().toLowerCase().normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "").replace(/ñ/g, "n")
  .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").replace(/--+/g, "-");

export default async function handler(req, res) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/articles?pageSize=100&key=${API_KEY}`;
  const json = await (await fetch(url)).json();
  const titles = (json.documents || [])
    .map((d) => (d.fields && d.fields.title && d.fields.title.stringValue) || "")
    .filter(Boolean);
  const hoy = new Date().toISOString().slice(0, 10);

  const estaticas = ["", "articles", "links", "about"]
    .map((p) => `<url><loc>${SITE}/${p}</loc><changefreq>weekly</changefreq></url>`)
    .join("");
  const articulos = titles
    .map((t) => `<url><loc>${SITE}/articulo/${generateSlug(t)}</loc><lastmod>${hoy}</lastmod></url>`)
    .join("");

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${estaticas}${articulos}</urlset>`);
}