export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages } = req.body;

  // Convert OpenAI-style {role, content} history into Gemini's
  // {role, parts:[{text}]} format. Gemini uses 'model' instead of 'assistant'.
  const contents = (messages || []).map(function (m) {
    return {
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    };
  });

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: contents })
      }
    );

    const data = await response.json();
    console.log('Gemini raw response:', JSON.stringify(data));
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';

    res.status(200).json({ reply });
  } catch (err) {
    res.status(500).json({ error: 'Something went wrong' });
  }
}
