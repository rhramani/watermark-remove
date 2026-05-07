const axios = require('axios');
const fs = require('fs');

async function testSegmind() {
  const apiKey = process.env.SEGMIND_API_KEY;
  console.log('Using API Key:', apiKey);

  const testImagePath = 'server/uploads/test_image.jpg'; // I'll assume an image exists or I'll create a dummy
  // Actually, I'll just use a small dummy base64 if I can't find a file.
  const dummyBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

  try {
    console.log('Testing Workflow API...');
    const res1 = await axios.post('https://api.segmind.com/workflows/67ea59aef8ea060b74cf4187-v6', {
      "Watermark_Image": `data:image/jpeg;base64,${dummyBase64}`
    }, {
      headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' }
    }).catch(e => e.response?.data || e.message);
    console.log('Workflow API Response:', JSON.stringify(res1));

    console.log('\nTesting Model API (v1)...');
    const res2 = await axios.post('https://api.segmind.com/v1/watermark-remover', {
      "image": dummyBase64
    }, {
      headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' }
    }).catch(e => e.response?.data || e.message);
    console.log('Model API Response:', JSON.stringify(res2));

  } catch (err) {
    console.error('Test Failed:', err.message);
  }
}

testSegmind();
