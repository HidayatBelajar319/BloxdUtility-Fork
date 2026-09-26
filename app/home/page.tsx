'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Script from 'next/script';

const FALLBACK_FILES = ['README.md','API_REFERENCE.md','CLIENT_OPTIONS.md','CALLBACKS.md','ICONS.md','MESH_ENTITY_DOCS.md','SKINS_AND_POSES.md','MOB_SETTINGS.md','ENTITY_SETTINGS.md','PARTICLES.md','SOUNDS_AND_MUSIC.md','QTE_DOCS.md','BLOCK_NAMES.txt','ITEM_NAMES.txt'];
const GITHUB_BASE = "https://raw.githubusercontent.com/Bloxdy/code-api/main/";

// Auto-discover all documentation files from the Bloxdy/code-api GitHub repo.
// Falls back to the hardcoded list if the GitHub API is unavailable (rate limit, offline, etc).
async function fetchDiscovery(): Promise<string[]> {
  try {
    const res = await fetch('https://api.github.com/repos/Bloxdy/code-api/contents');
    if (!res.ok) throw new Error('GitHub API responded with ' + res.status);
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error('Unexpected GitHub API response');
    const files = data
      .filter((f: { type?: string; name?: string }) => f.type === 'file' && (f.name?.endsWith('.md') || f.name?.endsWith('.txt')))
      .map((f: { name: string }) => f.name);
    if (files.length === 0) throw new Error('No documentation files discovered');
    return files;
  } catch (e) {
    console.warn('GitHub API discovery failed, using fallback file list', e);
    return FALLBACK_FILES;
  }
}

export default function HomePage() {
  const [isDark, setIsDark] = useState(false);
  const [stats, setStats] = useState({ funcs: 0, blocks: 0, items: 0, callbacks: 0 });
  const [currentTip, setCurrentTip] = useState(0);
  const [megaPrompt, setMegaPrompt] = useState('');

  const TIPS = [
    {
      text: "Use globalThis to share variables between World Code and Code Blocks. Variables declared with let or const are invisible to Code Blocks!",
      code: "globalThis.scores = {}; // visible everywhere"
    },
    {
      text: "World Code runs exactly ONCE when the lobby starts. All your callbacks and global variables must be initialized here.",
      code: null
    },
    {
      text: "The tick callback fires 20 times per second. Keep tick logic lightweight — heavy code here causes lag for all players.",
      code: "tick = (ms) => {\n  /* fast checks only */\n};"
    },
    {
      text: "Code Blocks have a 500 LINE limit in addition to the 16,000 character limit. Move shared logic to World Code functions if you're getting close.",
      code: null
    },
    {
      text: "Never use // comments — Bloxd.io's code engine doesn't support them! Use /* block comments */ instead.",
      code: "/* This comment works! */\n// This will BREAK your code!"
    },
    {
      text: "Use the Delegator Pattern to let Code Blocks influence game events. Register a real callback in World Code that calls a global handler function.",
      code: "globalThis.handlers = {};\nonPlayerJoin = (id) => {\n  if (globalThis.handlers.join) globalThis.handlers.join(id);\n};"
    },
    {
      text: "api.broadcastMessage() sends a message to ALL players. api.sendMessage() sends to just one player.",
      code: "api.broadcastMessage('Hello everyone!', { color: 'green' });\napi.sendMessage(playerId, 'Only you see this!');"
    },
    {
      text: "Store per-player data using the player ID as a key in a global object. Never use a single variable for per-player info!",
      code: "globalThis.playerData[playerId] = { score: 0, team: null };"
    },
    {
      text: "The swear filter only applies to Code Blocks, NOT to World Code. Keep all text in Code Blocks safe and filter-friendly.",
      code: null
    },
    {
      text: "Use api.setBlockRect() to fill a whole area with blocks at once — much faster than looping over individual api.setBlock() calls.",
      code: "api.setBlockRect([0,0,0], [10,5,10], 'Stone Bricks');"
    },
    {
      text: "myId and playerId store the player ID of whoever triggered the current Code Block or World Code. Use them to target effects.",
      code: "api.giveItem(myId, 'Diamond Sword', 1);"
    },
    {
      text: "thisPos stores the [x, y, z] position of the currently executing Code Block. Useful for spawning items near the block.",
      code: "const [x, y, z] = thisPos;\napi.createItemDrop(x, y+1, z, 'Gold Coin', 5);"
    }
  ];

  useEffect(() => {
    const savedDark = localStorage.getItem('darkMode') === 'true';
    setIsDark(savedDark);
    document.documentElement.classList.toggle('dark', savedDark);
  }, []);

  const toggleDark = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    localStorage.setItem('darkMode', String(newDark));
    document.documentElement.classList.toggle('dark', newDark);
  };

  const animateCount = (target: number, duration = 1200) => {
    let start = 0;
    const step = Math.ceil(target / (duration / 16));
    return new Promise<void>(resolve => {
      const timer = setInterval(() => {
        start = Math.min(start + step, target);
        if (start >= target) {
          clearInterval(timer);
          resolve();
        }
      }, 16);
    });
  };

  const loadStats = async () => {
    try {
      const files = await fetchDiscovery();
      const results = await Promise.all(files.map(file =>
        fetch(GITHUB_BASE + file).then(res => res.text())
      ));
      const apiData = results.reduce((acc, text, i) => {
        if (files[i].endsWith('.md')) {
          try {
            const parsed = JSON.parse(text);
            if (parsed.functions) Object.assign(acc.functions, parsed.functions);
            if (parsed.blocks) acc.blocks.push(...parsed.blocks);
            if (parsed.items) acc.items.push(...parsed.items);
          } catch {}
        }
        return acc;
      }, { functions: {}, blocks: [], items: [] });

      const funcCount = Object.keys(apiData.functions).length;
      const blockCount = apiData.blocks.length;
      const itemCount = apiData.items.length;
      const cbCount = 117; // CALLBACKS.length

      setStats({ funcs: funcCount, blocks: blockCount, items: itemCount, callbacks: cbCount });
      await Promise.all([
        animateCount(funcCount),
        animateCount(blockCount),
        animateCount(itemCount),
        animateCount(cbCount)
      ]);
    } catch (e) {
      console.warn('Failed to load stats', e);
    }
  };

  const showTip = (index: number) => {
    const tip = TIPS[index];
    const textEl = document.getElementById('tip-text');
    const codeEl = document.getElementById('tip-code');
    const counterEl = document.getElementById('tip-counter');
    if (textEl) textEl.textContent = tip.text;
    if (codeEl) {
      if (tip.code) {
        codeEl.textContent = tip.code;
        codeEl.style.display = 'block';
      } else {
        codeEl.style.display = 'none';
      }
    }
    if (counterEl) counterEl.textContent = `${index + 1} / ${TIPS.length}`;
    setCurrentTip(index);
  };

  const nextTip = () => showTip((currentTip + 1) % TIPS.length);
  const prevTip = () => showTip((currentTip - 1 + TIPS.length) % TIPS.length);

  const copyMegaPrompt = () => {
    if (!megaPrompt) return;
    navigator.clipboard.writeText(megaPrompt);
    showToast('✅ PROMPT COPIED!');
  };

  const showToast = (msg: string) => {
    const t = document.getElementById('toast');
    if (t) {
      t.textContent = msg;
      t.style.opacity = '1';
      setTimeout(() => t.style.opacity = '0', 2500);
    }
  };

  const initSystem = async () => {
    const status = document.getElementById('sync-status');
    try {
      let promptBase = "Act as a Bloxd.io Developer Assistant.\n\n";
      const files = await fetchDiscovery();
      const results = await Promise.all(files.map(file =>
        fetch(GITHUB_BASE + file).then(res => res.text().then(text => ({ file, text })))
      ));
      let finalPrompt = promptBase + "\n\n--- API DOCUMENTATION ---\n";
      results.forEach(res => {
        finalPrompt += `\n[FILE: ${res.file}]\n${res.text}\n`;
      });
      setMegaPrompt(finalPrompt);
      if (status) status.innerText = "Synced ✅";
    } catch (e) {
      if (status) status.innerText = "Offline Mode";
      setMegaPrompt("Prompt unavailable.");
    }
  };

  useEffect(() => {
    loadStats();
    showTip(Math.floor(Math.random() * TIPS.length));
    initSystem();
    const interval = setInterval(nextTip, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-[#0d1117] transition-colors duration-300">
      <aside className="sidebar w-72 flex flex-col p-4 custom-scroll overflow-y-auto flex-shrink-0">
        <div className="flex items-center justify-between mb-10 px-2">
          <Link href="/home" className="flex items-center gap-3">
            <img src="/logo.svg" alt="Players Logo" className="w-12 h-12 object-contain" />
            <h1 className="font-bold text-2xl tracking-tighter">Players</h1>
          </Link>
          <button onClick={() => { const sb = document.querySelector('.sidebar'); const overlay = document.querySelector('.sidebar-overlay'); if (sb) sb.classList.toggle('mobile-open'); if (overlay) overlay.classList.toggle('active'); }} className="lg:hidden text-gray-500 hover:text-black focus:outline-none">
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>
        <nav>
          <Link href="/home" className="nav-item active"><i className="fas fa-home mr-3"></i> Home</Link>
          <Link href="/documentation" className="nav-item"><i className="fas fa-book mr-3 opacity-40"></i> Documentation</Link>
          <Link href="/lab" className="nav-item"><i className="fas fa-flask mr-3 opacity-40"></i> Code Lab</Link>
          <Link href="/modrinth" className="nav-item"><i className="fas fa-store mr-3 opacity-40"></i> Bloxd Modrinth</Link>
          <Link href="/tools" className="nav-item"><i className="fas fa-tools mr-3 opacity-40"></i> Developer Tools</Link>
          <Link href="/bloxd-bench" className="nav-item"><i className="fas fa-cubes mr-3 opacity-40"></i> BloxdBench</Link>
          <Link href="/bloxd-ai" className="nav-item"><i className="fas fa-robot mr-3 opacity-40"></i> Bloxd AI</Link>
          <Link href="/changelog" className="nav-item"><i className="fas fa-list-alt mr-3 opacity-40"></i> Changelog</Link>

          <div className="mt-8 px-4 text-[12px] font-bold text-gray-400 uppercase tracking-widest">External</div>
          <a href="https://github.com/Bloxdy/code-api" target="_blank" rel="noopener noreferrer" className="nav-item mt-2"><i className="fab fa-github mr-3 opacity-40"></i> Official API</a>
          <a href="https://bloxd.io" target="_blank" rel="noopener noreferrer" className="nav-item mt-1"><i className="fas fa-globe mr-3 opacity-40"></i> Bloxd.io</a>
          <a href="https://bloxd-io.fandom.com/wiki/Code_Block" target="_blank" rel="noopener noreferrer" className="nav-item mt-1"><i className="fas fa-book-open mr-3 opacity-40"></i> Fandom Wiki</a>

          <Link href="/api/export-workspace" className="nav-item mt-1 flex-col items-start !h-auto !py-3" style={{background:'#fef2f2', color:'#ef4444', border:'1px solid #fecaca', marginTop:'20px'}}>
            <div className="flex items-center"><i className="fas fa-download mr-3" style={{opacity:1}}></i> <strong>DEBUG: Export Source to ZIP</strong></div>
          </Link>

          <div className="mt-8 px-4 text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-3">Live Stats</div>
          <div className="mx-2 bg-white dark:bg-[#161b22] border border-gray-200 dark:border-[#30363d] rounded-xl p-4">
            <div className="flex justify-between items-center mb-2"><span className="text-xs text-gray-500 font-semibold">API Functions</span><span id="sidebar-funcs" className="text-sm font-black text-blue-600 dark:text-blue-400">{stats.funcs || '—'}</span></div>
            <div className="flex justify-between items-center mb-2"><span className="text-xs text-gray-500 font-semibold">Total Blocks</span><span id="sidebar-blocks" className="text-sm font-black text-green-600 dark:text-green-400">{stats.blocks || '—'}</span></div>
            <div className="flex justify-between items-center"><span className="text-xs text-gray-500 font-semibold">Total Items</span><span id="sidebar-items" className="text-sm font-black text-orange-500 dark:text-orange-400">{stats.items || '—'}</span></div>
          </div>
        </nav>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-[#0d1117]">
        <header className="h-16 flex items-center px-4 md:px-10 justify-between border-b border-gray-200 dark:border-[#30363d] flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => { const sb = document.querySelector('.sidebar'); const overlay = document.querySelector('.sidebar-overlay'); if (sb) sb.classList.toggle('mobile-open'); if (overlay) overlay.classList.toggle('active'); }} className="lg:hidden text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white focus:outline-none text-xl mr-2"><i className="fas fa-bars"></i></button>
            <div className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Dashboard / Home</div>
          </div>
          <div id="sync-status" className="text-[11px] bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-3 py-1 rounded border border-blue-100 dark:border-blue-900/30 font-black uppercase tracking-tighter">SYNCING...</div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scroll">

          <div className="ai-banner">
            <div className="ai-banner-text">
              <h2>🤖 Turn ChatGPT/Claude into a coding expert</h2>
              <p className="text-gray-500 dark:text-gray-400 mt-1">Copy the mega-prompt and paste it into ChatGPT, Claude, or other LLMs!</p>
            </div>
            <button onClick={copyMegaPrompt} id="copy-btn" className="btn-copy-ai shadow-sm"><i className="fas fa-copy mr-2"></i>Copy System Prompt</button>
          </div>

          <div className="mb-8 flex justify-between items-center flex-wrap gap-4">
            <div>
              <h1 className="text-5xl font-black mb-3 tracking-tight">Bloxd.io <span className="text-blue-600 dark:text-blue-400">Utility.</span></h1>
              <p className="text-gray-500 dark:text-gray-400 text-xl leading-relaxed font-medium">The ultimate developer hub for Bloxd.io — built by <Link href="https://github.com/FallenNightA" className="text-blue-600 dark:text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">FallenNightA</Link>. <Link href="https://github.com/HidayatBelajar319" className="text-blue-600 dark:text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">HidayatBelajar319</Link> is one of the official accounts made by FallenNightA (owner).</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Link href="/api/export-workspace" style={{background:'#fee2e2', color:'#dc2626', border:'1px solid #fecaca', padding:'12px 20px', borderRadius:'12px', fontWeight:800, fontSize:'14px', textDecoration:'none', display:'flex', alignItems:'center', gap:'8px'}}><i className="fas fa-file-archive text-lg"></i> Export Full Source ZIP</Link>
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat-card"><span className="stat-icon"><i className="fas fa-cog text-blue-600"></i></span><span className="stat-number" id="stat-funcs">{stats.funcs}</span><span className="stat-label">API Functions</span></div>
            <div className="stat-card"><span className="stat-icon"><i className="fas fa-cube text-green-600"></i></span><span className="stat-number" id="stat-blocks">{stats.blocks}</span><span className="stat-label">Block Types</span></div>
            <div className="stat-card"><span className="stat-icon"><i className="fas fa-gamepad text-orange-500"></i></span><span className="stat-number" id="stat-items">{stats.items}</span><span className="stat-label">Item Types</span></div>
            <div className="stat-card"><span className="stat-icon"><i className="fas fa-bell text-yellow-500"></i></span><span className="stat-number" id="stat-callbacks">{stats.callbacks}</span><span className="stat-label">Callbacks</span></div>
          </div>

          <div className="tip-card" id="tip-card">
            <div className="tip-badge"><i className="fas fa-lightbulb" style={{fontSize:'11px'}}></i> Bloxd.io Tip</div>
            <p className="tip-text" id="tip-text">Loading tip...</p>
            <div className="tip-code" id="tip-code" style={{display:'none'}}></div>
            <div className="tip-nav"><button className="tip-btn" onClick={prevTip}>← Prev</button><button className="tip-btn" onClick={nextTip}>Next →</button><span className="tip-counter" id="tip-counter">1 / 10</span></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="search-section">
              <h3><i className="fas fa-search text-blue-500"></i> Item & Block Lookup</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Search any item or block name for use in your scripts.</p>
              <div className="search-bar">
                <input type="text" id="item-search" className="search-input" placeholder="e.g. Diamond Sword, Dirt..." onInput={(e) => doItemSearch(e.target.value)} />
                <select className="search-filter" id="search-type" onChange={() => doItemSearch((document.getElementById('item-search') as HTMLInputElement).value)}><option value="all">All</option><option value="blocks">Blocks</option><option value="items">Items</option></select>
              </div>
              <div className="search-results" id="search-results"><span className="search-empty"><i className="fas fa-keyboard mr-1"></i> Start typing to search...</span></div>
              <div id="search-count" className="text-xs text-gray-400 mt-2"></div>
            </div>
            <div className="spotlight-section">
              <h3><span>✨ Function Spotlight</span><button className="spotlight-refresh" onClick={refreshSpotlight}><i className="fas fa-random mr-1"></i> Shuffle</button></h3>
              <div className="func-name" id="spot-name">api.giveItem()</div>
              <div className="func-desc" id="spot-desc">Loading...</div>
              <div className="func-example" id="spot-example">loading...</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="shortcuts-section">
              <h3><i className="fas fa-keyboard text-gray-600 dark:text-gray-400"></i> Bloxd.io Shortcuts</h3>
              <div className="shortcut-row"><span className="shortcut-label">Open World Code editor</span><div className="kbd-group"><kbd>F8</kbd></div></div>
              <div className="shortcut-row"><span className="shortcut-label">Open Code Block editor</span><div className="kbd-group"><kbd>Right-click</kbd></div></div>
              <div className="shortcut-row"><span className="shortcut-label">Save & close editor</span><div className="kbd-group"><kbd>Escape</kbd></div></div>
              <div className="shortcut-row"><span className="shortcut-label">Trigger adjacent code block</span><div className="kbd-group"><kbd>Right-click</kbd> <kbd>Board</kbd></div></div>
              <div className="shortcut-row"><span className="shortcut-label">Creative inventory</span><div className="kbd-group"><kbd>E</kbd></div></div>
              <div className="shortcut-row"><span className="shortcut-label">Fly up / down (creative)</span><div className="kbd-group"><kbd>Space</kbd> <kbd>Shift</kbd></div></div>
              <div className="shortcut-row"><span className="shortcut-label">Zoom in/out</span><div className="kbd-group"><kbd>Z</kbd></div></div>
              <div className="shortcut-row"><span className="shortcut-label">Debug console</span><div className="kbd-group"><kbd>F12</kbd></div></div>
            </div>
            <div className="changelog-section">
              <h3><i className="fas fa-list-alt text-blue-500"></i> Changelog</h3>
              <div className="changelog-entry"><div className="changelog-dot purple"></div><div><div><span className="changelog-version" style={{background: '#8250df'}}>v2.3</span><span className="changelog-date">Latest Update</span></div><div className="changelog-title">Players Rebrand</div><div className="changelog-desc">Rebranded the website as Players, replaced the raster logo with a scalable SVG logo, and removed the personal-features text from the public site.</div></div></div>
              <div className="changelog-entry"><div className="changelog-dot green"></div><div><div><span className="changelog-version">v2.2</span></div><div className="changelog-title">BloxdBench Internet Assets</div><div className="changelog-desc">Updated BloxdBench to load models, textures, and skyboxes over the internet from Bloxdy/texture-packs, and deleted the local asset folders.</div></div></div>
              <div className="changelog-entry"><div className="changelog-dot orange"></div><div><div><span className="changelog-version">v2.1</span></div><div className="changelog-title">Internal Documentation</div><div className="changelog-desc">Rebuilt the internal /documentation experience with automatic discovery from Bloxdy/code-api, a Bloxd.io Game Features tab, and a searchable collection of secret code-only items and blocks.</div></div></div>
              <div className="changelog-entry"><div className="changelog-dot blue"></div><div><div><span className="changelog-version">v2.0</span></div><div className="changelog-title">Clean URLs &amp; App Router</div><div className="changelog-desc">Replaced the HTML-based routes with clean URLs (/home, /documentation, /lab, /modrinth, /tools, /bloxd-bench, and /bloxd-ai), deleted the legacy HTML files, and introduced the app/home route.</div></div></div>
              <div className="changelog-entry"><div className="changelog-dot purple"></div><div><div><span className="changelog-version" style={{background: '#8250df'}}>v1.9</span></div><div className="changelog-title">CodexMind AI developer integration</div><div className="changelog-desc">Integrated the superpowered server-side CodexMind AI Assistant directly into Code Lab and Command Studio! Developers can now build optimized chat commands, scripts, and gameloops using plain-text prompts which are compiled live using real-time SSE streaming. Get instant code, context linking, and automated editor population!</div></div></div>
              <div className="changelog-entry"><div className="changelog-dot green"></div><div><div><span className="changelog-version">v1.8</span></div><div className="changelog-title">Developer Tools &amp; Syntax Engine</div><div className="changelog-desc">Launched the specialized Developer Tools page featuring the M2B Schematic Converter (by RealSlothuLT3), a smart Plugin Auto-Merger, and a Visual QTE Generator.</div></div></div>
              <div className="changelog-entry"><div className="changelog-dot green"></div><div><div><span className="changelog-version">v1.7</span></div><div className="changelog-title">Bloxd Modrinth Hub</div><div className="changelog-desc">Added the community resource hub for Mods, Texture Packs, and the advanced Plugin System. Features a dedicated Information Tab with technical guides for high-performance server logic.</div></div></div>
              <div className="changelog-entry"><div className="changelog-dot blue"></div><div><div><span className="changelog-version">v1.6</span></div><div className="changelog-title">Global Navigation & UI Sync</div><div className="changelog-desc">Unified sidebar navigation across all utility pages and integrated the official Bloxd API documentation with live GitHub syncing and searchable ID lists.</div></div></div>
              <div className="changelog-entry"><div className="changelog-dot orange"></div><div><div><span className="changelog-version">v1.5</span></div><div className="changelog-title">Documentation Redesign</div><div className="changelog-desc">Upgraded the docs layout for better readability, implemented bookmarking for specific API sections, and added a reading progress indicator.</div></div></div>
              <div className="changelog-entry"><div className="changelog-dot green"></div><div><div><span className="changelog-version">v1.4</span></div><div className="changelog-title">Utility Home Dashboard</div><div className="changelog-desc">Added live community stats, a rotating developer tip system, and an API function spotlight module to the homepage.</div></div></div>
              <div className="changelog-entry"><div className="changelog-dot"></div><div><div><span className="changelog-version">v1.0</span></div><div className="changelog-title">Initial Launch</div><div className="changelog-desc">First release: Custom mega-prompt template for Bloxd.io scripts and the original Monaco-powered Code Lab.</div></div></div>
              <Link href="/changelog" className="inline-block mt-4 text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline">View full changelog → /changelog</Link>
            </div>
          </div>

          <div className="feature-grid">
            <Link href="/lab" className="feature-card"><i className="fas fa-flask text-blue-500 text-2xl mb-4"></i><h3 className="text-xl font-extrabold mb-2">Code Lab</h3><p className="text-gray-500 dark:text-gray-400 font-medium">Monaco-powered editor with Bloxd.io autocomplete. Supports all API functions, blocks, items, and callbacks out of the box.</p><div className="mt-4 text-blue-600 dark:text-blue-400 text-sm font-bold">Open Lab →</div></Link>
            <Link href="/documentation" className="feature-card"><i className="fas fa-book-open text-green-600 text-2xl mb-4"></i><h3 className="text-xl font-extrabold mb-2">API Documentation</h3><p className="text-gray-500 dark:text-gray-400 font-medium">Browse all official documentation files synced live from the Bloxd.io GitHub. Full-text search with highlight.</p><div className="mt-4 text-green-600 dark:text-green-400 text-sm font-bold">Browse Docs →</div></Link>
            <div className="feature-card" onClick={copyMegaPrompt}><i className="fas fa-scroll text-yellow-500 text-2xl mb-4"></i><h3 className="text-xl font-extrabold mb-2">Mega-Prompt Template</h3><p className="text-gray-500 dark:text-gray-400 font-medium">One-click copy of a 3000+ word system prompt that turns LLMs like ChatGPT/Claude into a Bloxd.io expert — no hallucinations.</p><div className="mt-4 text-yellow-600 dark:text-yellow-400 text-sm font-bold">Copy Prompt →</div></div>
            <Link href="/bloxd-bench" className="feature-card"><i className="fas fa-cubes text-purple-500 text-2xl mb-4"></i><h3 className="text-xl font-extrabold mb-2">BloxdBench</h3><p className="text-gray-500 dark:text-gray-400 font-medium">Design and preview custom 3D models and voxel structures right in your browser. (Compatible with Windows 8.1 / older systems)</p><div className="mt-4 text-purple-600 dark:text-purple-400 text-sm font-bold">Open Builder →</div></Link>
          </div>

          <div className="text-center py-8 text-sm text-gray-400 dark:text-gray-500 border-t border-gray-100 dark:border-[#30363d] mt-4">
            <p>Built by <a href="https://github.com/FallenNightA" className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">FallenNightA</a> · Inspired by <a href="https://github.com/delfineonx" className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">Delfineonx</a> · API data from <a href="https://github.com/Bloxdy/code-api" className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">Bloxdy/code-api</a> · Documentation at <Link href="/documentation" className="text-blue-500 hover:underline">/documentation</Link></p>
            <p className="mt-2">Official account: <Link href="https://github.com/HidayatBelajar319" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">HidayatBelajar319</Link> is one of the official accounts made by <Link href="https://github.com/FallenNightA" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">FallenNightA</Link> (owner).</p>
          </div>

        </div>

        <div className="sidebar-overlay" onClick={() => { const sb = document.querySelector('.sidebar'); const overlay = document.querySelector('.sidebar-overlay'); if (sb) sb.classList.toggle('mobile-open'); if (overlay) overlay.classList.toggle('active'); }}></div>
        <div id="toast">✅ PROMPT COPIED!</div>

        <Script id="home-scripts" strategy="lazyOnload">
          {`
            const FALLBACK_FILES = ['README.md','API_REFERENCE.md','CLIENT_OPTIONS.md','CALLBACKS.md','ICONS.md','MESH_ENTITY_DOCS.md','SKINS_AND_POSES.md','MOB_SETTINGS.md','ENTITY_SETTINGS.md','PARTICLES.md','SOUNDS_AND_MUSIC.md','QTE_DOCS.md','BLOCK_NAMES.txt','ITEM_NAMES.txt'];
            const GITHUB_BASE = "https://raw.githubusercontent.com/Bloxdy/code-api/main/";
            let API_FUNCTIONS = {}, BLOCKS = [], ITEMS = [];
            const CALLBACKS = ['tick','onClose','onPlayerJoin','onPlayerLeave','doPeriodicSave','onPlayerJump','onRespawnRequest','playerCommand','onPlayerChat','onPlayerChangeBlock','onPlayerDropItem','onPlayerPickedUpItem','onPlayerSelectInventorySlot','onBlockStand','onPlayerAttemptCraft','onPlayerCraft','onPlayerAttemptOpenChest','onPlayerOpenedChest','onWorldChangeBlock','onCreateBloxdMeshEntity','onEntityCollision','onPlayerAttemptSpawnMob','onWorldAttemptSpawnMob','onPlayerSpawnMob','onWorldSpawnMob','onWorldAttemptDespawnMob','onMobDespawned','onPlayerAttack','onPlayerDamagingOtherPlayer','onPlayerDamagingMob','onMobDamagingPlayer','onMobDamagingOtherMob','onAttemptKillPlayer','onPlayerKilledOtherPlayer','onMobKilledPlayer','onPlayerKilledMob','onMobKilledOtherMob','onPlayerPotionEffect','onPlayerDamagingMeshEntity','onPlayerBreakMeshEntity','onPlayerUsedThrowable','onPlayerThrowableHitTerrain','onTouchscreenActionButton','onTaskClaimed','onChunkLoaded','onPlayerRequestChunk','onItemDropCreated','onPlayerStartChargingItem','onPlayerFinishChargingItem'];

            async function fetchDiscovery() {
              try {
                const res = await fetch('https://api.github.com/repos/Bloxdy/code-api/contents');
                if (!res.ok) throw new Error('GitHub API failed');
                const data = await res.json();
                if (!Array.isArray(data)) throw new Error('Invalid response');
                const files = data.filter(f => f.type === 'file' && (f.name.endsWith('.md') || f.name.endsWith('.txt'))).map(f => f.name);
                if (files.length === 0) throw new Error('No files');
                return files;
              } catch (e) {
                console.warn('Discovery failed, using fallback list', e);
                return FALLBACK_FILES;
              }
            }

            function doItemSearch(query) {
              const type = document.getElementById('search-type').value;
              const resultsEl = document.getElementById('search-results');
              const countEl = document.getElementById('search-count');
              query = query.trim().toLowerCase();
              if (!query) { resultsEl.innerHTML = '<span class="search-empty"><i class="fas fa-keyboard mr-1"></i> Start typing to search...</span>'; countEl.textContent = ''; return; }
              let pool = [];
              if (type === 'all' || type === 'blocks') pool = pool.concat(BLOCKS.map(b => ({ name: b, kind: 'block' })));
              if (type === 'all' || type === 'items') pool = pool.concat(ITEMS.map(i => ({ name: i, kind: 'item' })));
              const seen = new Set();
              const matches = pool.filter(entry => { if (seen.has(entry.name)) return false; if (entry.name.toLowerCase().includes(query)) { seen.add(entry.name); return true; } return false; }).slice(0, 20);
              if (matches.length === 0) { resultsEl.innerHTML = '<span class="search-empty"><i class="fas fa-times mr-1"></i> No matches found.</span>'; countEl.textContent = ''; return; }
              resultsEl.innerHTML = matches.map(m => '<span class="search-tag ' + (m.kind === 'item' ? 'item-tag' : '') + '" onclick="copyName(\\'' + m.name.replace(/'/g, "\\'") + '\\')">' + m.name + '</span>').join('');
              const total = pool.filter(e => e.name.toLowerCase().includes(query)).length;
              countEl.textContent = total > 20 ? 'Showing 20 of ' + total + ' matches — keep typing to narrow down' : total + ' match' + (total !== 1 ? 'es' : '') + ' found';
            }

            function copyName(name) { navigator.clipboard.writeText('"' + name + '"'); showToast('📋 Copied: "' + name + '"'); }

            function refreshSpotlight() { const funcs = Object.entries(API_FUNCTIONS); if (funcs.length === 0) return; const [name, data] = funcs[Math.floor(Math.random() * funcs.length)]; document.getElementById('spot-name').textContent = 'api.' + name + '()'; document.getElementById('spot-desc').textContent = data.description || 'No description available.'; document.getElementById('spot-example').textContent = data.example || 'api.' + name + '(...);'; }

            function showToast(msg) { const t = document.getElementById('toast'); if (t) { t.textContent = msg; t.style.opacity = '1'; setTimeout(() => t.style.opacity = '0', 2500); } }

            async function initData() {
              try {
                const FILES = await fetchDiscovery();
                const results = await Promise.all(FILES.map(file => fetch(GITHUB_BASE + file).then(res => res.text())));
                results.forEach((text, i) => {
                  if (FILES[i].endsWith('.md')) {
                    try {
                      const parsed = JSON.parse(text);
                      if (parsed.functions) Object.assign(API_FUNCTIONS, parsed.functions);
                      if (parsed.blocks) BLOCKS.push(...parsed.blocks);
                      if (parsed.items) ITEMS.push(...parsed.items);
                    } catch {}
                  } else if (FILES[i].endsWith('.txt')) {
                    const items = text.split('\\n').filter(l => l.trim() && !l.startsWith('#'));
                    if (FILES[i].includes('BLOCK')) BLOCKS.push(...items);
                    if (FILES[i].includes('ITEM')) ITEMS.push(...items);
                  }
                });
                refreshSpotlight();
              } catch (e) { console.warn('Failed to load API data', e); }
            }
            initData();
          `}
        </Script>
      </main>
    </div>
  );
}