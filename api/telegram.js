export default async function handler(req, res) {
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
          text: "PRUEBA DIRECTA DESDE VERCEL"
        })
      }
    );

    const data = await response.json();

    console.log("RESPUESTA TELEGRAM:", data);

    res.status(200).json(data);

  } catch (error) {
    console.error("ERROR:", error);
    res.status(500).json({ error });
  }
}