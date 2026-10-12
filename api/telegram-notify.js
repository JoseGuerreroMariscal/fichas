export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    return response.status(503).json({ ok: false, error: 'Telegram is not configured' });
  }

  const body = typeof request.body === 'object' ? request.body : {};
  const activity = typeof body.activity === 'string' ? body.activity.slice(0, 80) : '';
  const difficulty = typeof body.difficulty === 'string' ? body.difficulty.slice(0, 40) : '';
  const count = Number.isInteger(body.count) ? body.count : null;
  if (!activity || !difficulty || count === null || count < 1 || count > 100) {
    return response.status(400).json({ ok: false, error: 'Invalid notification data' });
  }

  const text = [
    '📚 Nueva ficha generada en FichasFacil',
    `Actividad: ${activity}`,
    `Dificultad: ${difficulty}`,
    `Ejercicios: ${count}`
  ].join('\n');

  try {
    const telegramResponse = await fetch(`https://api.telegram.org/bot${encodeURIComponent(token)}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true })
    });
    if (!telegramResponse.ok) return response.status(502).json({ ok: false, error: 'Telegram rejected the message' });
    return response.status(204).end();
  } catch {
    return response.status(502).json({ ok: false, error: 'Telegram request failed' });
  }
}
