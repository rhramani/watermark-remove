const { HfInference } = require("@huggingface/inference");
require('dotenv').config({ path: '../server/.env' });
const hf = new HfInference(process.env.HF_TOKEN);
async function test() {
  try {
    const fs = require('fs');
    const files = fs.readdirSync('../uploads');
    if (files.length === 0) return console.log("No files");
    const imageBlob = fs.readFileSync('../uploads/' + files[0]);
    
    console.log("Testing runwayml/stable-diffusion-inpainting...");
    const res = await hf.request({
      model: "runwayml/stable-diffusion-inpainting",
      inputs: "test" 
    });
    console.log("Success", res);
  } catch (e) {
    console.log("Error:", e.message);
  }
}
test();
