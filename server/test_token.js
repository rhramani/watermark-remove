const { HfInference } = require("@huggingface/inference");
require('dotenv').config({ path: '../server/.env' });
const hf = new HfInference(process.env.HF_TOKEN);
async function test() {
  try {
    const res = await hf.textClassification({
      model: "distilbert-base-uncased-finetuned-sst-2-english",
      inputs: "I like you. I love you"
    });
    console.log("Success", res);
  } catch (e) {
    console.log("Error:", e.message);
  }
}
test();
