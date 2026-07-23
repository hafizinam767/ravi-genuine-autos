require('dotenv').config();

async function run() {
  const apiKey = process.env.GEMINI_API_KEY;
  const baseUrl = 'http://127.0.0.1:10007/v1';
  console.log('Testing Z-AI proxy at:', baseUrl);
  console.log('Using API Key prefix:', apiKey ? apiKey.substring(0, 10) : 'none');

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gemini-1.5-flash',
        messages: [{ role: 'user', content: 'Respond with success if you can hear me.' }],
      }),
    });

    console.log('Status:', res.status);
    console.log('Headers:', Object.fromEntries(res.headers.entries()));
    const text = await res.text();
    console.log('Body:', text);
  } catch (err) {
    console.error('Error connecting to local Z-AI proxy:', err);
  }
}

run();
