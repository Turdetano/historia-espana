export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { title, content } = req.body;

  const TOKEN = process.env.TELEGRAM_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  const text = `📜 Nuevo artículo publicado\n\n${title}\n\n${content}`;

  try {
    const telegramRes = await fetch(
      `https://api.telegram.org/bot${TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text
        })
      }
    );

    const data = await telegramRes.json();

    return res.status(200).json(data);

  } catch (error) {
    return res.status(500).json({ error: "Error enviando a Telegram" });
  }
}