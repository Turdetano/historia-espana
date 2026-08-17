// api/seo.js — HTML estático para bots (Telegram, WhatsApp, Google…)
const PROJECT_ID = "historia-espana-final";
const API_KEY = "AIzaSyAP6kTYZ4r1CYoE7aWJ_Z7YCVM_sbvIaZU";
const SITE = "https://historia-espana-9hbk.vercel.app";
const DEFAULT_IMG = "https://res.cloudinary.com/djlv6e9o3/image/upload/w_1200,h_630,c_fill/xyosvpcz52hxqbrc8wlm.jpg";

const generateSlug = (t) => t.toString().toLowerCase().normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "").replace(/ñ/g, "n")
  .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").replace(/--+/g, "-");
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const strip = (h) => (h || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const firstImg = (h) => ((h || "").match(/<img[^>]+src="([^"]+)"/) || [])[1];

async function getArticles() {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/articles?pageSize=100&key=${API_KEY}`;
  const json = await (await fetch(url)).json();
  return (json.documents || []).map((d) => {
    const f = d.fields || {};
    const s = (k) => (f[k] && f[k].stringValue) || "";
    return { title: s("title"), content: s("content"), category: s("category"), image: s("image") };
  });
}

export default async function handler(req, res) {
  const slug = (req.query.slug || "").toString();
  const a = (await getArticles()).find((x) => generateSlug(x.title) === slug);

  if (!a) {
    res.status(404).setHeader("Content-Type", "text/html; charset=utf-8");
    res.send("<h1>Artículo no encontrado</h1>");
    return;
  }

  const desc = esc(strip(a.content).slice(0, 200)) + "…";
  const img = a.image || firstImg(a.content) || DEFAULT_IMG;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(`<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>${esc(a.title)} | Hispania Imperial</title>
<meta name="description" content="${desc}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="Hispania Imperial">
<meta property="og:title" content="${esc(a.title)}">
<meta property="og:description" content="${desc}">
<meta property="og:image" content="${img}">
<meta property="og:url" content="${SITE}/articulo/${slug}">
<meta name="twitter:card" content="summary_large_image">
</head>
<body>
<article>
<h1>${esc(a.title)}</h1>
<p><strong>${esc(a.category)}</strong> · Hispania Imperial</p>
${a.content}
<p>📜 Lectura completa en ${SITE}/articulo/${slug}</p>
</article>
</body>
</html>`);
}