const { HfInference } = require("@huggingface/inference");
require('dotenv').config({ path: '../server/.env' });
const hf = new HfInference(process.env.HF_TOKEN);
async function test() {
  try {
    const fs = require('fs');
    const imagePath = '../uploads/' + fs.readdirSync('../uploads')[0];
    const imageBlob = fs.readFileSync(imagePath);
    
    console.log("Testing sdxl-turbo...");
    const res = await hf.imageToImage({
      model: "stabilityai/sdxl-turbo",
      inputs: imageBlob,
      parameters: {
        prompt: "clean image without watermark"
      }
    });
    console.log("Success! Got response type:", typeof res);
  } catch (e) {
    console.log("Error:", e.message);
  }
}
test();
