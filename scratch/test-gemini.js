const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function run() {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log('Testing with API Key prefix:', apiKey ? apiKey.substring(0, 10) : 'none');
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent('Hello, respond with success if you can hear me.');
    console.log('Response:', result.response.text());
  } catch (err) {
    console.error('Error occurred:', err);
  }
}

run();
