const { HfInference } = require("@huggingface/inference");
const fs = require('fs');
require('dotenv').config({ path: '../server/.env' });

const hf = new HfInference(process.env.HF_TOKEN);

async function test() {
  try {
    const files = fs.readdirSync('../uploads');
    if (files.length === 0) {
      console.log('No files in uploads/');
      return;
    }
    const imageData = fs.readFileSync('../uploads/' + files[0]);
    
    console.log('Testing instruct-pix2pix...');
    const response = await hf.imageToImage({
      model: "timbrooks/instruct-pix2pix",
      inputs: imageData,
      parameters: {
        prompt: "remove the watermark and text",
      }
    });

    if (response && response.arrayBuffer) {
      const buffer = Buffer.from(await response.arrayBuffer());
      fs.writeFileSync('output.png', buffer);
      console.log('Success! Saved to output.png');
    } else if (Buffer.isBuffer(response)) {
      fs.writeFileSync('output.png', response);
      console.log('Success! Saved to output.png');
    } else {
      console.log('Failed:', response);
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}
test();
