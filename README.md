# Watermark Pro

A modern, responsive SaaS application for image watermarking and AI-powered watermark removal.

## Features
- **Bulk Image Upload**: Drag and drop support for multiple images.
- **Custom Watermarks**: Customize text, font, size, opacity, and rotation.
- **AI Removal**: Advanced eraser tool with compliance checks.
- **Scalable Architecture**: Background job processing with BullMQ.
- **Premium UI**: Glassmorphism and smooth animations.

## Tech Stack
- **Frontend**: Next.js 16, Tailwind CSS 4, Framer Motion, Zustand.
- **Backend**: Node.js, Express, Sharp, BullMQ, Redis.

## Getting Started

### 1. Prerequisites
- **Node.js** (v18+)
- **Redis** (Required for background processing)

### 2. Installation
```bash
npm install
cd server && npm install
```

### 3. Running the App
```bash
# Run both frontend and backend concurrently
npm run dev
```

### 4. Configuration
See `server/.env.example` for backend environment variables.
