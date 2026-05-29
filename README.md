# 🤖 WhatsApp AI Sticker Bot — Render Deploy

Free WhatsApp sticker bot using Pollinations.ai.
No API key. No credit card. Deploy free on Render.com via GitHub.

---

## 🚀 Deploy Steps (Android Friendly)

### Step 1 — Upload to GitHub (browser only)

1. Open **github.com** on Chrome
2. Sign in → tap **+** → **New repository**
3. Name: `whatsapp-sticker-bot` → **Public** → **Create**
4. Tap **Add file** → **Upload files**
5. Upload all these files:
   - `bot.js`
   - `package.json`
   - `Dockerfile`
   - `render.yaml`
6. Tap **Commit changes**

---

### Step 2 — Deploy on Render (browser only)

1. Open **render.com** → Sign up free (use GitHub login)
2. Tap **New +** → **Web Service**
3. Choose **"Build and deploy from a Git repository"**
4. Connect GitHub → select `whatsapp-sticker-bot`
5. Render auto-reads `render.yaml` — just tap **Deploy** ✅

---

### Step 3 — Get QR Code from Logs

1. In Render dashboard → your service → **Logs** tab
2. Wait ~3 minutes for build
3. QR code prints in the logs — **screenshot it**
4. Open WhatsApp → **Linked Devices** → **Link a Device** → scan

Bot is live in your groups! 🎉

---

## 💬 Commands

| Command | What it does |
|---|---|
| `!sticker <prompt>` | Generates a free AI sticker |
| `!help` | Shows commands |

**Examples:**
```
!sticker happy cat eating pizza
!sticker surprised monkey cartoon
!sticker robot with sunglasses
```

---

## ⚠️ Render Free Tier Note

Render free tier **sleeps after 15 minutes of inactivity**.
The bot has a built-in health check server on port 3000 to help with this.

To keep it fully awake for free:
1. Go to **uptimerobot.com** (free)
2. Add a new monitor → HTTP
3. Paste your Render service URL (e.g. `https://whatsapp-sticker-bot.onrender.com`)
4. Set interval to **5 minutes**

This pings your bot every 5 minutes so it never sleeps.

---

## 📁 Files

```
whatsapp-sticker-bot/
├── bot.js          ← bot logic (Pollinations.ai)
├── package.json    ← dependencies
├── Dockerfile      ← builds Node + Chrome
├── render.yaml     ← Render config
└── .gitignore      ← keeps junk out of GitHub
```
