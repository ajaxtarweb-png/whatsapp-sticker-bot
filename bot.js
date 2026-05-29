/**
 * WhatsApp AI Sticker Bot
 * 100% Free — uses Pollinations.ai (no API key needed)
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// ─── FORCE SYSTEM CHROMIUM BEFORE ANYTHING ELSE ───────────────────────────
try {
  execSync("rm -rf /root/.cache/puppeteer");
  console.log("🧹 Cleared puppeteer cache — forcing system Chromium");
} catch (e) {}

process.env.PUPPETEER_EXECUTABLE_PATH = "/usr/bin/chromium";
process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD = "true";
process.env.PUPPETEER_SKIP_DOWNLOAD = "true";

// ─── NOW load whatsapp-web.js (AFTER env is set) ──────────────────────────
const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const axios = require("axios");
const sharp = require("sharp");

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
    executablePath: "/usr/bin/chromium",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--no-first-run",
      "--no-zygote",
      "--single-process",
    ],
  },
});

// ─── QR CODE ───────────────────────────────────────────────────────────────
client.on("qr", (qr) => {
  console.log("\n📱 Scan this QR code with WhatsApp:\n");
  qrcode.generate(qr, { small: true });
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
  setTimeout(() => client.initialize(), 5000);
});

// ─── MESSAGE HANDLER ───────────────────────────────────────────────────────
client.on("message", async (msg) => {
  const body = msg.body?.trim();
  if (!body) return;

  if (body === HELP_COMMAND) {
    await msg.reply(
      `🤖 *AI Sticker Bot*\n\n` +
      `*Commands:*\n` +
      `• \`!sticker <prompt>\` — Generate a free AI sticker\n\n` +
      `*Examples:*\n` +
      `• \`!sticker happy cat eating pizza\`\n` +
      `• \`!sticker surprised monkey cartoon\`\n\n` +
      `_Powered by Pollinations.ai — 100% free_ 🎨`
    );
    return;
  }

  if (body.toLowerCase().startsWith(STICKER_COMMAND)) {
    const prompt = body.slice(STICKER_COMMAND.length).trim();

    if (!prompt) {
      await msg.reply(`⚠️ Add a prompt!\nExample: \`!sticker funny dog with hat\``);
      return;
    }

    console.log(`🎨 Generating sticker: "${prompt}"`);
    await msg.reply(`🎨 Generating: *"${prompt}"*\nPlease wait ⏳`);

    try {
      const imageBuffer = await generateImage(prompt);
      const stickerBuffer = await convertToSticker(imageBuffer);
      const media = new MessageMedia("image/webp", stickerBuffer.toString("base64"));
      await client.sendMessage(msg.from, media, {
        sendMediaAsSticker: true,
        stickerName: prompt.slice(0, 30),
        stickerAuthor: "AI Sticker Bot",
      });
      console.log(`✅ Sticker sent: "${prompt}"`);
    } catch (err) {
      console.error("❌ Error:", err.message);
      await msg.reply(`❌ Failed to generate sticker. Try again!`);
    }
  }
});

// ─── IMAGE GENERATION (POLLINATIONS.AI — FREE) ────────────────────────────
async function generateImage(prompt) {
  const enhanced = encodeURIComponent(
    `${prompt}, sticker art style, cartoon, thick outline, white background, vibrant colors, cute, clean`
  );
  const url = `https://image.pollinations.ai/prompt/${enhanced}?width=512&height=512&nologo=true&model=flux`;
  const response = await axios.get(url, {
    responseType: "arraybuffer",
    timeout: 60000,
  });
  return Buffer.from(response.data);
}

// ─── STICKER CONVERSION ────────────────────────────────────────────────────
async function convertToSticker(imageBuffer) {
  return await sharp(imageBuffer)
    .resize(512, 512, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .webp({ quality: 80 })
    .toBuffer();
}

// ─── KEEP-ALIVE SERVER ─────────────────────────────────────────────────────
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
