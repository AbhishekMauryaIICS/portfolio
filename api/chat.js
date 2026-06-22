// Vercel serverless function — keeps your OpenAI key on the server, never in the browser.
// Set OPENAI_API_KEY in your Vercel project's Environment Variables (Settings → Environment Variables).
// Do NOT put the key anywhere in this file or in your repo.

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Server is missing OPENAI_API_KEY. Add it in Vercel project settings.' });
    return;
  }

  const { messages } = req.body || {};
  if (!Array.isArray(messages)) {
    res.status(400).json({ error: 'Invalid request body — expected { messages: [...] }' });
    return;
  }

  // Basic guardrails: cap history length and message size sent upstream
  const trimmedHistory = messages.slice(-12).map(m => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: String(m.content || '').slice(0, 1500),
  }));

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              "You are the AI assistant embedded on Abhishek Maurya's portfolio website. " +
              'Abhishek is a Software Engineer, Web Developer, Digital Marketer, and Cyber Security expert based in India, with 7+ years of experience. ' +
              'Answer visitor questions about his skills, services, and experience in a friendly, concise way. ' +
              "If asked something unrelated to Abhishek or his work, gently redirect to his portfolio topics. Keep replies under 100 words.",
          },
          ...trimmedHistory,
        ],
        max_tokens: 300,
        temperature: 0.6,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      res.status(response.status).json({ error: data.error?.message || 'Upstream error' });
      return;
    }

    const reply = data.choices?.[0]?.message?.content?.trim() || "Sorry, I couldn't generate a reply.";
    res.status(200).json({ reply });
  } catch (err) {
    res.status(500).json({ error: 'Server error contacting OpenAI.' });
  }
};
