const { Client } = require("@gradio/client");
async function run() {
    const spaces = ["multimodalart/stable-diffusion-inpainting", "hysts/lama", "ahmedabdo/lama-cleaner", "xiankgx/Watermark-Removal"];
    for (const space of spaces) {
        try {
            console.log("Testing:", space);
            const app = await Client.connect(space);
            console.log("Success for:", space);
        } catch (e) {
            console.log("Failed:", space, e.message);
        }
    }
}
run();
