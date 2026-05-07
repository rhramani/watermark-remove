const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const { Queue, Worker } = require('bullmq');
const IORedis = require('ioredis');
const archiver = require('archiver');
const axios = require('axios');
const FormData = require('form-data');
const { HfInference } = require("@huggingface/inference");
const { Client, handle_file } = require("@gradio/client");
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

console.log('🔑 API Key Loaded:', process.env.REMOVE_BG_API_KEY ? 'YES (Starts with ' + process.env.REMOVE_BG_API_KEY.substring(0, 4) + '...)' : 'NO');
// Hugging Face Client Setup
const hf = new HfInference(process.env.HF_TOKEN);

// Helper: Remove.bg API Call
async function removeBackgroundAPI(imagePath) {
  if (!process.env.REMOVE_BG_API_KEY) {
    console.log('⚠️ No REMOVE_BG_API_KEY found. Skipping AI background removal.');
    return null;
  }

  try {
    const formData = new FormData();
    formData.append('size', 'auto');
    formData.append('image_file', fs.createReadStream(imagePath));

    const response = await axios({
      method: 'post',
      url: 'https://api.remove.bg/v1.0/removebg',
      data: formData,
      responseType: 'arraybuffer',
      headers: {
        ...formData.getHeaders(),
        'X-Api-Key': process.env.REMOVE_BG_API_KEY,
      },
    });

    return Buffer.from(response.data);
  } catch (error) {
    console.error('❌ Remove.bg API Error:', error.response ? error.response.status : error.message);
    return null;
  }
}

// Helper: Hugging Face AI Removal
async function removeWatermarkHF(imagePath) {
  if (!process.env.HF_TOKEN) {
    console.log('⚠️ Hugging Face token missing. Skipping HF.');
    return null;
  }

  try {
    console.log('🚀 Sending to Hugging Face AI (Instruct-Pix2Pix)...');
    const imageData = fs.readFileSync(imagePath);
    
    const response = await hf.imageToImage({
      model: "timbrooks/instruct-pix2pix",
      inputs: imageData,
      parameters: {
        prompt: "remove the watermark text and logo, high quality",
      }
    });

    if (response) {
      console.log('✅ Received AI response');
      const buffer = response instanceof Buffer ? response : Buffer.from(await response.arrayBuffer());
      return buffer;
    }
    return null;
  } catch (error) {
    console.error('❌ HF AI failed:', error.message);
    return null;
  }
}

// Helper: Gradio Space Fallback
async function removeWatermarkGradio(imagePath) {
  const spaces = [
    { name: "foduucom/Watermark-Removal", endpoint: "/process_image", args: (f) => [f, 0.5, true] },
    { name: "DHEIVER/Gradio-Watermark-Removal-App", endpoint: "/process_image", args: (f) => [f, 0.5, true] }
  ];

  for (const space of spaces) {
    try {
      console.log(`🚀 Trying Gradio Space: ${space.name}...`);
      const imageData = fs.readFileSync(imagePath);
      const imageBlob = new Blob([imageData]);

      const app = await Client.connect(space.name);
      
      // Use index 0 as it's the most common for single-function spaces
      const result = await app.predict(0, space.args(handle_file(imageBlob)));

      if (result && result.data && result.data[0]) {
        const fileUrl = result.data[0].url || result.data[0];
        console.log(`✅ Success with Space: ${space.name}`);
        const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
        return Buffer.from(response.data);
      }
    } catch (error) {
      console.error(`❌ Space ${space.name} failed:`, error.message);
    }
  }
  return null;
}

// Multer Storage Setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

app.use(cors());
app.use(express.json());
app.use('/processed', express.static('processed'));

// Ensure directories exist
['uploads', 'processed'].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
});

// Redis connection options
const connectionOptions = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  maxRetriesPerRequest: 0, 
};

// BullMQ Queue & Worker Setup
let watermarkQueue = null;
let worker = null;

const createMockQueue = () => ({
  add: async (name, data) => {
    console.log('🛠️ Mock Processing Job:', name);
    await processJob({ data });
    return { id: 'mock-' + Date.now() };
  },
  addBulk: async (jobs) => {
    for (const job of jobs) {
      await processJob({ data: job.data });
    }
    return jobs.map((_, i) => ({ id: 'mock-' + i }));
  }
});

async function processJob(job) {
  const { file, filename, settings } = job.data;
  console.log(`🚀 Processing job: ${filename} (Type: ${settings.type})`);
  const outputPath = path.join('processed', filename);

  try {
    let image = sharp(file);
    const metadata = await image.metadata();
    console.log(`📸 Image dimensions: ${metadata.width}x${metadata.height}`);

    if (settings.type === 'text') {
      const svgText = `
        <svg width="${metadata.width}" height="${metadata.height}">
          <style>
            .text { 
              fill: ${settings.color}; 
              font-size: ${settings.fontSize}px; 
              font-weight: bold; 
              font-family: Arial;
              opacity: ${settings.opacity};
            }
          </style>
          <text 
            x="50%" 
            y="50%" 
            text-anchor="middle" 
            dominant-baseline="middle" 
            class="text"
            transform="rotate(${settings.rotation}, ${metadata.width / 2}, ${metadata.height / 2})"
          >
            ${settings.text}
          </text>
        </svg>
      `;

      await image
        .composite([{ input: Buffer.from(svgText), top: 0, left: 0 }])
        .toFile(outputPath);
    } else if (settings.type === 'logo' && job.data.logoPath) {
      console.log(`🖼️ Logo overlay: ${job.data.logoPath}`);
      // Calculate position
      let top = 0;
      let left = 0;
      
      // Scale logo based on settings.fontSize
      const logoWidth = Math.round(metadata.width * (settings.fontSize / 100)); 
      console.log(`⚖️ Resizing logo to: ${logoWidth}px`);
      
      // Load the logo and prepare for transparency (Remove background)
      let logoBuffer;
      
      if (process.env.REMOVE_BG_API_KEY) {
        console.log('✨ Using Remove.bg API for logo background removal...');
        logoBuffer = await removeBackgroundAPI(job.data.logoPath);
      }

      if (!logoBuffer) {
        console.log('🤖 Using Enhanced Local Background Removal...');
        const logoRaw = await sharp(job.data.logoPath).resize({ width: logoWidth }).toBuffer();
        
        // Get corner pixel to detect background color more accurately
        const { data: pixels } = await sharp(logoRaw).raw().toBuffer({ resolveWithObject: true });
        const r = pixels[0], g = pixels[1], b = pixels[2];
        const isDarkBg = (r + g + b) / 3 < 128;

        let mask;
        if (!isDarkBg) {
          // Remove Light/White Background: Keep only what is DARKER than the threshold
          mask = await sharp(logoRaw)
            .grayscale()
            .negate() // Invert so Dark becomes Light (Opaque)
            .threshold(25) 
            .toBuffer();
        } else {
          // Remove Dark/Black Background: Keep only what is LIGHTER than the threshold
          mask = await sharp(logoRaw)
            .grayscale()
            .threshold(80) // Higher threshold to filter out textured dark grays
            .toBuffer();
        }

        logoBuffer = await sharp(logoRaw)
          .joinChannel(mask)
          .trim() // Remove extra transparent space
          .png()
          .toBuffer();
      } else {
        // Resize the API result if needed
        logoBuffer = await sharp(logoBuffer).resize({ width: logoWidth }).toBuffer();
      }

      const resizedLogoMetadata = await sharp(logoBuffer).metadata();

      switch (settings.position) {
        case 'top-left': top = 20; left = 20; break;
        case 'top-right': top = 20; left = metadata.width - resizedLogoMetadata.width - 20; break;
        case 'center': top = (metadata.height - resizedLogoMetadata.height) / 2; left = (metadata.width - resizedLogoMetadata.width) / 2; break;
        case 'bottom-left': top = metadata.height - resizedLogoMetadata.height - 20; left = 20; break;
        case 'bottom-right': top = metadata.height - resizedLogoMetadata.height - 20; left = metadata.width - resizedLogoMetadata.width - 20; break;
        default: top = 20; left = 20;
      }

      console.log(`📍 Position: ${top}, ${left}`);

      await image
        .composite([{ input: logoBuffer, top: Math.round(top), left: Math.round(left) }])
        .toFile(outputPath);
    } else {
      // Fallback: just copy the file if no processing done
      await image.toFile(outputPath);
    }
    
    return { processedPath: outputPath };
  } catch (error) {
    console.error(`Error processing job:`, error);
  }
}

async function setupQueue() {
  const redis = new IORedis(connectionOptions);
  
  redis.on('error', (err) => {
    if (!watermarkQueue) {
      console.log('⚠️ Redis not found. Using Mock Queue fallback.');
      watermarkQueue = createMockQueue();
    }
    redis.disconnect();
  });

  redis.on('connect', () => {
    console.log('✅ Redis Connected. BullMQ System Ready');
    watermarkQueue = new Queue('watermark-queue', { connection: redis });
    worker = new Worker('watermark-queue', async (job) => {
      await processJob(job);
    }, { connection: redis });
  });
}

// Routes - DEFINED BEFORE LISTEN
app.post('/api/upload', upload.fields([{ name: 'images' }, { name: 'logo', maxCount: 1 }]), async (req, res) => {
  try {
    if (!watermarkQueue) watermarkQueue = createMockQueue();

    const { settings } = req.body;
    const parsedSettings = JSON.parse(settings);
    const files = req.files['images'];
    const logoFile = req.files['logo'] ? req.files['logo'][0] : null;

    if (!files) {
      return res.status(400).json({ error: 'No images uploaded' });
    }

    const jobs = files.map(file => ({
      name: 'process-image',
      data: {
        file: file.path,
        filename: file.filename,
        settings: parsedSettings,
        logoPath: logoFile ? logoFile.path : null
      }
    }));

    await watermarkQueue.addBulk(jobs);

    res.json({ 
      message: 'Images added to queue', 
      count: files.length, 
      filenames: jobs.map(j => j.data.filename) 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to process images' });
  }
});

app.post('/api/remove-watermark', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    console.log('🚀 Watermark Removal Request Received — Attempting AI Removal...');

    const filename = `cleaned-${Date.now()}-${req.file.filename}.png`;
    const outputPath = path.join('processed', filename);

    // 1. Try Hugging Face Inference API first
    let processedBuffer = await removeWatermarkHF(req.file.path);

    // 2. Try Gradio Space as backup (often higher quality)
    if (!processedBuffer) {
      console.log('🔄 HF API failed. Trying Gradio Space fallback...');
      processedBuffer = await removeWatermarkGradio(req.file.path);
    }

    if (processedBuffer) {
      fs.writeFileSync(outputPath, processedBuffer);
      console.log('✅ AI Removal Successful');
      return res.json({
        message: 'Watermark removed successfully via AI',
        filename: filename,
        url: `http://localhost:5000/processed/${filename}`
      });
    }

    // 3. Fallback to Local Python if all AI fails
    console.log('⚠️ AI Removal failed. Falling back to Local OpenCV Inpainting...');
    const scriptPath = path.join(__dirname, 'remove_watermark.py');

    try {
      const { stdout, stderr } = await execPromise(
        `python "${scriptPath}" "${req.file.path}" "${outputPath}"`
      );
      
      if (!fs.existsSync(outputPath)) {
        throw new Error('Output file was not created by Python script');
      }

      return res.json({
        message: 'Watermark removed successfully via Local Engine',
        filename: filename,
        url: `http://localhost:5000/processed/${filename}`
      });
    } catch (pyErr) {
      console.error('❌ Python Inpainting failed:', pyErr.message);
      return res.status(500).json({ error: 'Watermark removal failed: AI failed and Local engine errored: ' + pyErr.message });
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error during watermark removal' });
  }
});

app.get('/api/download-bulk', async (req, res) => {
  try {
    const { filenames } = req.query;
    const files = JSON.parse(filenames);

    const archive = archiver('zip', { zlib: { level: 9 } });
    res.attachment('watermarked-images.zip');

    archive.on('error', (err) => res.status(500).send({ error: err.message }));
    archive.pipe(res);

    files.forEach(file => {
      const filePath = path.join('processed', file);
      if (fs.existsSync(filePath)) {
        archive.file(filePath, { name: file });
      }
    });

    archive.finalize();
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate zip' });
  }
});

app.get('/api/download/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, 'processed', filename);
  if (fs.existsSync(filePath)) {
    res.download(filePath);
  } else {
    res.status(404).json({ error: 'File not found' });
  }
});

app.get('/api/status', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Start everything
setupQueue();

app.listen(port, () => {
  console.log(`🚀 Server running on  port ${port}`);
});

// Heartbeat
setInterval(() => {}, 1000 * 60 * 60);
