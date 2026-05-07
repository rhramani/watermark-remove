const { Client, handle_file } = require("@gradio/client");

async function run() {
    try {
        console.log("Testing foduucom/Watermark-Removal space...");
        const app = await Client.connect("foduucom/Watermark-Removal");
        console.log("Success! App info:", await app.view_api());
    } catch (e) {
        console.log("Failed:", e.message);
    }
}
run();
