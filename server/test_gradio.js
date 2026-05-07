const { Client, handle_file } = require("@gradio/client");
const fs = require('fs');

async function test() {
  try {
    const client = await Client.connect("DHEIVER/Gradio-Watermark-Removal-App");
    
    const files = fs.readdirSync('../uploads');
    if (files.length === 0) return console.log("No files");
    
    const imagePath = '../uploads/' + files[0];
    const imageBlob = new Blob([fs.readFileSync(imagePath)]);

    console.log("Processing image...");
    const result = await client.predict("/process_image", [
        handle_file(imageBlob), 
        0.8,
        true 
    ]);

    console.log("Result:", result.data);
  } catch (err) {
    console.error("Error:", err.message);
  }
}
test();
