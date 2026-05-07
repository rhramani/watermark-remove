const { HfInference } = require("@huggingface/inference");
require('dotenv').config({ path: '../server/.env' });
const hf = new HfInference(process.env.HF_TOKEN);
async function test() {
  try {
    const res = await hf.request({
      model: "stabilityai/stable-diffusion-xl-base-1.0",
      inputs: "test" 
    });
    console.log("Success", res);
  } catch (e) {
    console.log("Error:", e.message);
  }
}
test();
