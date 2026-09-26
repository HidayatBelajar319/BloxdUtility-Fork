# 💜 Players — Bloxd.io Utility

![Status: Active](https://img.shields.io/badge/status-Active-green.svg)
![Next.js](https://img.shields.io/badge/Next.js-14_App_Router-black?style=flat-square)
![No API Key](https://img.shields.io/badge/AI-No_API_Key_Required-blueviolet?style=flat-square)

**The ultimate developer hub for Bloxd.io — built by [FallenNightA](https://github.com/FallenNightA).**
**Turn any AI into a Bloxd.io expert with the Automated Mega-Prompt Generator — now with free, zero-config AI built in!**

> 🏢 **Official account:** [HidayatBelajar319](https://github.com/HidayatBelajar319) is one of the official accounts made by **FallenNightA** (owner).

---

## 🌐 Live Demo
🔗 **[https://bloxdutility.netlify.app/](https://bloxdutility.netlify.app/)**
📚 **Documentation site:** [BloxdUtility-Documentation repo](https://github.com/HidayatBelajar319/BloxdUtility-Documentation)

---

## ✨ Features
✅ **Home Dashboard (`/home`)** – Live community stats, rotating Bloxd.io dev tips, API function spotlight, item/block lookup, changelog feed.

✅ **Free AI, zero config 🤖** – Bloxd AI + Code Lab CodexMind run on **Puter.js** with no API key. Optional bring-your-own free key (OpenRouter/Groq) in Settings, Pollinations only behind your own key with error-sniffing guards.

✅ **CodexMind AI Dev Companion** – Streaming AI helper inside Code Lab. Generate commands, callbacks, and game loops with automatic workspace mapping.

✅ **Automated AI Mega-Prompt Generator** – Combines custom instructions with real-time GitHub API data (`Bloxdy/code-api`) to guide any general-purpose LLM step-by-step.

✅ **Internal Documentation (`/documentation`)** – Code API docs via **automatic GitHub discovery** (no hardcoded file list) + a **Bloxd.io Game Features** tab: every feature, every item and what it's for, including **secret code-only items**.

✅ **BloxdBench (`/bloxd-bench`)** – Voxel model studio that loads models/textures/skyboxes **over the internet** from [`Bloxdy/texture-packs`](https://github.com/Bloxdy/texture-packs). No local asset folders.

✅ **Developer Tools (`/tools`)** – M2B Schematic Converter, Plugin Auto-Merger, Visual QTE Generator, and more.

✅ **Bloxd Modrinth (`/modrinth`)** – Community hub for mods, texture packs, and server plugins.

✅ **Changelog (`/changelog`)** – Markdown-powered release notes synced with `CHANGELOG.md`, linked from every sidebar.

---

## 🗺️ Clean URLs (no `.html`)
| Route | Page |
|---|---|
| `/` → `/home` | Home dashboard |
| `/documentation` | Internal docs + game features |
| `/lab` | Code Lab |
| `/modrinth` | Bloxd Modrinth |
| `/tools` | Developer Tools |
| `/bloxd-bench` | BloxdBench studio |
| `/bloxd-ai` | Bloxd AI |
| `/changelog` | Release notes |

---

## 🛠️ Technologies
- **Framework**: [Next.js 14](https://nextjs.org/) App Router + TypeScript + Tailwind CSS
- **Editor**: Monaco Editor · **3D**: Three.js · **Docs**: Marked.js + Prism.js
- **Data**: GitHub REST API auto-discovery (`Bloxdy/code-api`, `Bloxdy/texture-packs`)
- **AI**: [Puter.js](https://docs.puter.com/AI/) (default, no key) · OpenRouter/Groq BYOK · `/api/chat` server path

---

## 🚀 Local Run & Setup
1. Clone the repository.
2. Install packages:
   ```bash
   npm install
   ```
3. Run the dev server (no API key needed — AI works out of the box):
   ```bash
   npm run dev
   ```
4. Optional — power users only, create `.env.local`:
   ```env
   GEMINI_API_KEY=your_key_here
   OPENROUTER_API_KEY=your_key_here
   ```

---

## 🤝 How to Contribute
1. Fork the repository.
2. Create a branch (`git checkout -b feature/your-idea`).
3. Commit, push, open a Pull Request!

---

## 🙏 Credits
- **Company**: Players · **Owner/Author**: [FallenNightA](https://github.com/FallenNightA)
- **Official account**: [HidayatBelajar319](https://github.com/HidayatBelajar319) (made by FallenNightA)
- **Bloxd.io**: [Official Website](https://bloxd.io)
- **API Data**: [Bloxdy/code-api](https://github.com/Bloxdy/code-api) · **Models**: [Bloxdy/texture-packs](https://github.com/Bloxdy/texture-packs)
- Inspired by [Delfineonx](https://github.com/delfineonx) · See [LICENSE.md](../LICENSE.md)
