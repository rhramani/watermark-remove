const { Client, handle_file } = require("@gradio/client");
const fs = require("fs");

async function run() {
    try {
        console.log("Connecting to Lama-Cleaner-lama...");
        const app = await Client.connect("Sanster/Lama-Cleaner-lama");
        console.log("Connected. Getting app info...");
        
        // Let's print the API info to see what endpoints it has
        const info = await app.view_api();
        console.log("API Info:", JSON.stringify(info, null, 2));

    } catch (e) {
        console.error("Error:", e.message);
    }
}
run();
