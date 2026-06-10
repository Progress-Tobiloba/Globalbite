import { Router } from 'express';

const router = Router();

const CHEF_SYSTEM_INSTRUCTION = `You are Chef Bite, a warm, knowledgeable, and encouraging AI chef assistant built into the GlobalBite platform for university students.

Your ONLY purpose is to help with culinary topics including recipes, ingredients, cooking techniques, meal planning, dietary advice, and food culture.

If asked about anything unrelated to food or cooking, decline warmly: "I'm Chef Bite, and my expertise is entirely in the kitchen! Ask me anything about food and I'll give you my best!"

Be warm, encouraging, concise and practical. Occasionally use a food emoji 🍳. Never break character.`;

router.post('/', async (req, res) => {
  const { message, history } = req.body;

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({ error: 'A valid message is required.' });
  }

  if (message.length > 2000) {
    return res.status(400).json({ error: 'Message too long.' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const sendEvent = (event, data) => {
    if (res.writableEnded) return;
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      sendEvent('error', { message: 'Groq API key not configured.' });
      return res.end();
    }

    const conversationHistory = Array.isArray(history)
      ? history
          .filter((m) => m && m.role && m.content)
          .map((m) => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: String(m.content),
          }))
      : [];

    const messages = [
      { role: 'system', content: CHEF_SYSTEM_INSTRUCTION },
      ...conversationHistory,
      { role: 'user', content: message.trim() },
    ];

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages,
        max_tokens: 1024,
        temperature: 0.8,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[Chat] Groq API error:', errText);
      sendEvent('error', { message: 'AI service error. Please try again.' });
      return res.end();
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const raw = line.slice(6).trim();
          if (!raw || raw === '[DONE]') continue;
          try {
            const parsed = JSON.parse(raw);
            const text = parsed.choices?.[0]?.delta?.content;
            if (text) sendEvent('chunk', { text });
          } catch {
            // skip malformed lines
          }
        }
      }
    }

    sendEvent('done', { message: 'Stream complete.' });
    res.end();
  } catch (err) {
    console.error('[Chat] Error:', err.message);
    sendEvent('error', { message: 'Something went wrong. Please try again.' });
    res.end();
  }

  req.on('close', () => {
    if (!res.writableEnded) res.end();
  });
});

export default router;
