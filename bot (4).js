/**
 * WhatsApp AI Sticker Bot
 * 100% Free — uses Pollinations.ai (no API key needed)
 * Deploy on Railway via GitHub
 */

const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const axios = require("axios");
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

// ─── CONFIG ────────────────────────────────────────────────────────────────
const STICKER_COMMAND = "!sticker";
const HELP_COMMAND = "!help";
const TMP_DIR = path.join(__dirname, "tmp");

if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR);

// ─── WHATSAPP CLIENT ───────────────────────────────────────────────────────
const client = new Client({
  authStrategy: new LocalAuth({
    dataPath: process.env.SESSION_PATH || "./.wwebjs_auth",
  }),
  puppeteer: {
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",   // required for Railway/Docker
      "--disable-gpu",
      "--no-first-run",
      "--no-zygote",
      "--single-process",          // important for containers
    ],
  },
});

// ─── QR CODE ───────────────────────────────────────────────────────────────
client.on("qr", (qr) => {
  console.log("\n📱 Scan this QR code with WhatsApp:\n");
  qrcode.generate(qr, { small: true });
  // Also log raw QR string so you can use qr.io if terminal doesn't render
  console.log("\nRaw QR (paste into https://qr.io if needed):\n", qr);
});

client.on("ready", () => {
  console.log("✅ Bot is ready! Listening for messages...");
});

client.on("auth_failure", (msg) => {
  console.error("❌ Auth failed:", msg);
});

client.on("disconnected", (reason) => {
  console.warn("⚠️ Disconnected:", reason);
  // Auto-reconnect
  setTimeout(() => client.initialize(), 5000);
});

// ─── MESSAGE HANDLER ───────────────────────────────────────────────────────
client.on("message", async (msg) => {
  const body = msg.body?.trim();
  if (!body) return;

  // ── !help ──
  if (body === HELP_COMMAND) {
    await msg.reply(
      `🤖 *AI Sticker Bot*\n\n` +
      `*Commands:*\n` +
      `• \`!sticker <prompt>\` — Generate a free AI sticker\n\n` +
      `*Examples:*\n` +
      `• \`!sticker happy cat eating pizza\`\n` +
      `• \`!sticker surprised monkey cartoon\`\n` +
      `• \`!sticker crying laughing face sticker\`\n\n` +
      `_Powered by Pollinations.ai — 100% free_ 🎨`
    );
    return;
  }

  // ── !sticker ──
  if (body.toLowerCase().startsWith(STICKER_COMMAND)) {
    const prompt = body.slice(STICKER_COMMAND.length).trim();

    if (!prompt) {
      await msg.reply(
        `⚠️ Add a prompt after the command!\n` +
        `Example: \`!sticker funny dog with hat\``
      );
      return;
    }

    console.log(`🎨 Generating sticker: "${prompt}"`);
    await msg.reply(`🎨 Generating: *"${prompt}"*\nUsing free AI... please wait ⏳`);

    try {
      const imageBuffer = await generateImage(prompt);
      const stickerBuffer = await convertToSticker(imageBuffer);

      const media = new MessageMedia(
        "image/webp",
        stickerBuffer.toString("base64")
      );

      await client.sendMessage(msg.from, media, {
        sendMediaAsSticker: true,
        stickerName: prompt.slice(0, 30),
        stickerAuthor: "AI Sticker Bot",
      });

      console.log(`✅ Sticker sent: "${prompt}"`);
    } catch (err) {
      console.error("❌ Error:", err.message);
      await msg.reply(
        `❌ Failed to generate sticker.\nTry a different prompt or wait a moment.`
      );
    }
  }
});

// ─── IMAGE GENERATION (POLLINATIONS.AI — FREE) ────────────────────────────
async function generateImage(prompt) {
  // Enhance prompt for sticker-style output
  const enhanced = encodeURIComponent(
    `${prompt}, sticker art style, cartoon, thick outline, white background, vibrant colors, cute, clean`
  );

  // Pollinations.ai — completely free, no API key, no signup
  const url = `https://image.pollinations.ai/prompt/${enhanced}?width=512&height=512&nologo=true&model=flux`;

  console.log(`📡 Calling Pollinations.ai...`);

  const response = await axios.get(url, {
    responseType: "arraybuffer",
    timeout: 60000, // 60s timeout — free APIs can be slow
    headers: {
      "User-Agent": "WhatsApp-Sticker-Bot/1.0",
    },
  });

  return Buffer.from(response.data);
}

// ─── STICKER CONVERSION ────────────────────────────────────────────────────
async function convertToSticker(imageBuffer) {
  // WhatsApp stickers: WebP, 512x512, under 500KB
  return await sharp(imageBuffer)
    .resize(512, 512, {
      fit: "contain",
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    })
    .webp({ quality: 80 })
    .toBuffer();
}

// ─── KEEP-ALIVE (prevents Railway from sleeping) ───────────────────────────
const http = require("http");
const PORT = process.env.PORT || 3000;

http.createServer((req, res) => {
  res.writeHead(200);
  res.end("WhatsApp Sticker Bot is running ✅");
}).listen(PORT, () => {
  console.log(`🌐 Health check server on port ${PORT}`);
});

// ─── START ─────────────────────────────────────────────────────────────────
console.log("🚀 Starting WhatsApp Sticker Bot...");
client.initialize();
