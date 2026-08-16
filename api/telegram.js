// api/telegram.js — Envío seguro a Telegram (los secretos viven solo en Vercel)
const SITE = "https://historia-espana-9hbk.vercel.app";

const generateSlug = (text) =>
  text.toString().toLowerCase().normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "").replace(/ñ/g, "n")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").replace(/--+/g, "-");

const stripHtml = (html) =>
  (html || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|h2|h3|h4|li|blockquote)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });

  // Lee las variables tal y como existen hoy en Vercel (con prefijo VITE_)
  // y aceptará nombres limpios si los creas en el futuro.
  const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || process.env.VITE_TELEGRAM_BOT_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID || process.env.VITE_TELEGRAM_CHAT_ID;
  if (!TELEGRAM_TOKEN || !CHAT_ID) return res.status(500).json({ error: "Faltan credenciales en Vercel" });

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { title, content, image, category } = body;

    const texto = stripHtml(content);
    const slug = generateSlug(title);
    // Cuando migremos las rutas (Punto 8), cambiaremos "/#articulo/" por "/articulo/"
    const enlace = `${SITE}/#articulo/${slug}`;
    const cuerpo = texto.length > 3500 ? texto.slice(0, 3500) + "\n… (continúa en la web)" : texto;
    const mensaje = `📜 ${title}\n📚 ${category || "Historia de España"}\n\n${cuerpo}\n\n🔗 Leer completo con fuentes y mapas:\n${enlace}`;

    // 1) Foto con caption corto (límite de Telegram: 1024 caracteres)
    if (image) {
      await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendPhoto`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: CHAT_ID, photo: image, caption: `📜 ${title}` })
      });
    }

    // 2) Mensaje de texto completo con enlace a la web
    const r = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: CHAT_ID, text: mensaje })
    });
    const data = await r.json();
    if (!data.ok) return res.status(500).json({ error: "Telegram: " + data.description });
    return res.status(200).json(data);
  } catch (error) {
    console.error("ERROR TELEGRAM:", error);
    return res.status(500).json({ error: "Fallo interno" });
  }
}