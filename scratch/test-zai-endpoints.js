require('dotenv').config();

async function run() {
  const apiKey = process.env.GEMINI_API_KEY;
  const endpoints = [
    'https://api.z.ai/api/paas/v4',
    'https://api.z.ai/api/coding/paas/v4',
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`Testing endpoint: ${endpoint}`);
      const res = await fetch(`${endpoint}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'glm-4',
          messages: [{ role: 'user', content: 'Respond with success if you can hear me.' }],
        }),
      });

      console.log(`Status for ${endpoint}:`, res.status);
      const text = await res.text();
      console.log(`Response for ${endpoint}:`, text.substring(0, 200));
    } catch (err) {
      console.error(`Error for ${endpoint}:`, err.message);
    }
  }
}

run();
