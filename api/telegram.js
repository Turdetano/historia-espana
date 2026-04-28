// ==============================
// 📤 API TELEGRAM FINAL ESTABLE
// ==============================

export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const { title, content, image } = req.body;

    // 🔐 VARIABLES (COMPATIBLES CON TU CONFIG ACTUAL)
    const BOT_TOKEN = process.env.TELEGRAM_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (!BOT_TOKEN || !CHAT_ID) {
      return res.status(500).json({ error: "Faltan variables de entorno" });
    }

    // 📝 MENSAJE
    const message = `
📜 *${title}*

${content}
    `;

    // ==============================
    // 📸 ENVÍO CON IMAGEN
    // ==============================
    if (image && image.startsWith("http")) {

      const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          photo: image,
          caption: message,
          parse_mode: "Markdown"
        })
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error("Error enviando imagen a Telegram");
      }

    } else {

      // ==============================
      // 📝 ENVÍO SOLO TEXTO
      // ==============================
      const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: message,
          parse_mode: "Markdown"
        })
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error("Error enviando mensaje a Telegram");
      }
    }

    return res.status(200).json({ ok: true });

  } catch (error) {
    console.error("❌ Telegram error:", error);
    return res.status(500).json({ error: "Error enviando a Telegram" });
  }
}