export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const { title, content } = req.body;

  const message = `?? Nuevo artículo publicado:\n\n${title}\n\n${content}`;

  const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: message
        })
      }
    );

    const data = await response.json();
    console.log("Telegram response:", data);

    res.status(200).json({ ok: true });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error enviando a Telegram" });
  }
}