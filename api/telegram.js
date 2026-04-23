export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  try {
    // 🔥 PARSE SEGURO (CLAVE)
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    const { title, content, image } = body;

    console.log("DATOS RECIBIDOS:", body);

    // 📸 SI HAY IMAGEN
    if (image) {
      const response = await fetch(
        `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendPhoto`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            chat_id: CHAT_ID,
            photo: image,
            caption: `📜 ${title}\n\n${content}`
          })
        }
      );

      const data = await response.json();
      console.log("TELEGRAM FOTO:", data);

      return res.status(200).json(data);
    }

    // 📝 SOLO TEXTO
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: `📜 ${title}\n\n${content}`
        })
      }
    );

    const data = await response.json();
    console.log("TELEGRAM TEXTO:", data);

    return res.status(200).json(data);

  } catch (error) {
    console.error("ERROR TELEGRAM:", error);
    return res.status(500).json({ error: "Fallo interno" });
  }
}