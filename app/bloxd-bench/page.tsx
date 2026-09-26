'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

const PACK_REPO = 'Bloxdy/texture-packs';
const PACK_BRANCH = 'main';
const PACK_API = `https://api.github.com/repos/${PACK_REPO}/contents`;
const PACK_RAW = `https://raw.githubusercontent.com/${PACK_REPO}/${PACK_BRANCH}`;

type PackFile = {name: string; url: string; path: string};

type PackData = {
  models: PackFile[];
  textures: PackFile[];
  skyboxes: PackFile[];
  folders: string[];
};

const MODEL_EXT = /\.(glb|gltf)$/i;
const TEXTURE_EXT = /\.(png|jpe?g|webp)$/i;
const SKY_EXT = /\.(glb|gltf|json|hdr)$/i;

function rawUrl(path: string) {
  return `${PACK_RAW}/${path.split('/').map(encodeURIComponent).join('/')}`;
}

export default function BloxdBenchPage() {
  const [isDark, setIsDark] = useState(false);
  const [pack, setPack] = useState<PackData>({models: [], textures: [], skyboxes: [], folders: []});
  const [packState, setPackState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [packMessage, setPackMessage] = useState('');
  const [assetFilter, setAssetFilter] = useState('');

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

  /* Auto-load models / textures / skyboxes straight from the GitHub repo */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setPackState('loading');
      setPackMessage('Fetching asset list from the GitHub API…');
      try {
        const rootRes = await fetch(`${PACK_API}?ref=${PACK_BRANCH}`, {
          headers: {Accept: 'application/vnd.github+json'},
        });
        if (!rootRes.ok) throw new Error(`GitHub API HTTP ${rootRes.status}`);
        const root: any = await rootRes.json();
        if (!Array.isArray(root)) throw new Error('Unexpected GitHub API response');

        const dirs = root.filter((e: any) => e && e.type === 'dir' && typeof e.name === 'string');
        const targets = dirs.filter((e: any) => /model|texture|sky/i.test(e.name));
        if (!targets.length) throw new Error('No model/texture/skybox folders found in the repository');

        const data: PackData = {models: [], textures: [], skyboxes: [], folders: targets.map((d: any) => d.name)};

        for (const dir of targets) {
          let entries: any[] = [];
          try {
            const res = await fetch(`${PACK_API}/${encodeURIComponent(dir.name)}?ref=${PACK_BRANCH}`, {
              headers: {Accept: 'application/vnd.github+json'},
            });
            if (res.ok) entries = await res.json();
          } catch {
            entries = [];
          }
          if (!Array.isArray(entries)) continue;
          for (const entry of entries) {
            if (!entry || entry.type !== 'file' || typeof entry.name !== 'string') continue;
            const path = `${dir.name}/${entry.name}`;
            const file: PackFile = {name: entry.name, path, url: rawUrl(path)};
            if (/sky/i.test(dir.name)) {
              if (SKY_EXT.test(entry.name)) data.skyboxes.push(file);
            } else if (MODEL_EXT.test(entry.name)) {
              data.models.push(file);
            } else if (TEXTURE_EXT.test(entry.name)) {
              data.textures.push(file);
            }
          }
        }

        if (cancelled) return;
        setPack(data);
        setPackState('ready');
        setPackMessage(
          `Auto-loaded ${data.models.length} models, ${data.textures.length} textures and ${data.skyboxes.length} skyboxes from ${PACK_REPO} — nothing is served from local folders.`
        );
      } catch (e: any) {
        if (cancelled) return;
        setPackState('error');
        setPackMessage(`Could not reach the GitHub API (${e?.message || 'network error'}). Asset lists are unavailable offline.`);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const shownModels = useMemo(() => {
    const q = assetFilter.trim().toLowerCase();
    return q ? pack.models.filter(f => f.name.toLowerCase().includes(q)) : pack.models;
  }, [pack.models, assetFilter]);

  const shownTextures = useMemo(() => {
    const q = assetFilter.trim().toLowerCase();
    return q ? pack.textures.filter(f => f.name.toLowerCase().includes(q)) : pack.textures;
  }, [pack.textures, assetFilter]);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] transition-colors duration-300">
      <header className="border-b border-[var(--border)] bg-[var(--sidebar-bg)] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/home" className="flex items-center gap-2">
              <img src="/logo.svg" alt="Players Logo" className="w-8 h-8" />
              <span className="font-bold text-xl tracking-tighter">Players</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/home" className="text-sm font-medium text-[var(--text)] hover:text-[var(--primary)] transition-colors">Home</Link>
              <Link href="/documentation" className="text-sm font-medium text-[var(--text)] hover:text-[var(--primary)] transition-colors">Documentation</Link>
              <Link href="/lab" className="text-sm font-medium text-[var(--text)] hover:text-[var(--primary)] transition-colors">Code Lab</Link>
              <Link href="/modrinth" className="text-sm font-medium text-[var(--text)] hover:text-[var(--primary)] transition-colors">Bloxd Modrinth</Link>
              <Link href="/tools" className="text-sm font-medium text-[var(--text)] hover:text-[var(--primary)] transition-colors">Developer Tools</Link>
              <Link href="/bloxd-bench" className="text-sm font-medium text-[var(--primary)] font-semibold">BloxdBench</Link>
              <Link href="/bloxd-ai" className="text-sm font-medium text-[var(--text)] hover:text-[var(--primary)] transition-colors">Bloxd AI</Link>
              <Link href="/workspace" className="text-sm font-medium text-[var(--text)] hover:text-[var(--primary)] transition-colors">Workspace</Link>
              <Link href="/changelog" className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--text)] hover:text-[var(--primary)] transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3h8v4M6 5h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2zm2 5h8m-8 4h8m-8 4h5" /></svg> Changelog</Link>
            </nav>
            <div className="flex items-center gap-4">
              <button onClick={toggleDark} className="p-2 rounded-lg bg-[var(--border)] hover:bg-[var(--nav-hover)] transition-colors" aria-label="Toggle dark mode">
                {isDark ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-12">
          <Link href="/home" className="text-sm text-[var(--text)]/60 hover:text-[var(--primary)] transition-colors">Home</Link>
          <span className="text-sm text-[var(--text)]/40 mx-2">/</span>
          <span className="text-sm font-semibold text-[var(--text)]">BloxdBench</span>
        </div>

        <section className="text-center mb-20">
          <div className="inline-flex items-center gap-2 bg-purple-500/10 text-purple-500 px-4 py-2 rounded-full text-sm font-semibold mb-6">
            <svg className="w-4 h-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            Powered by Three.js - Auto-loads models from Bloxdy/texture-packs
          </div>
          <h1 className="text-5xl sm:text-6xl font-black tracking-tight mb-6">BloxdBench <span className="text-purple-500">Studio</span></h1>
          <p className="text-xl text-[var(--text)]/70 max-w-3xl mx-auto mb-10 leading-relaxed">
            Professional voxel model editor for Bloxd.io. Create, edit, and export custom block models, item models, and voxel structures.
            Models are auto-loaded from the official <a href="https://github.com/Bloxdy/texture-packs" target="_blank" rel="noopener noreferrer" className="text-purple-500 hover:underline font-semibold">Bloxdy/texture-packs</a> repository.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/bloxd-bench" className="bg-purple-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple-600 transition-colors shadow-lg shadow-purple-500/25">
              Open BloxdBench
            </Link>
            <Link href="/guides/mesh-entities" className="bg-[var(--sidebar-bg)] text-[var(--text)] border border-[var(--border)] px-8 py-3 rounded-lg font-semibold hover:bg-[var(--nav-hover)] transition-colors">
              Mesh Entities Guide
            </Link>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          <div className="p-6 bg-[var(--sidebar-bg)] border border-[var(--border)] rounded-xl">
            <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 15l3-3 3 3 3-3v6l-3 3-3-3-3 3V15z" /></svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Block Models</h3>
            <p className="text-[var(--text)]/70">Create custom 3D block models with voxel precision. Export as Bloxd.js code for direct use in Code Blocks.</p>
          </div>
          <div className="p-6 bg-[var(--sidebar-bg)] border border-[var(--border)] rounded-xl">
            <div className="w-12 h-12 bg-pink-500/10 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Item Models</h3>
            <p className="text-[var(--text)]/70">Design custom item models with flat voxel geometry. Perfect for weapons, tools, and held items.</p>
          </div>
          <div className="p-6 bg-[var(--sidebar-bg)] border border-[var(--border)] rounded-xl">
            <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Generic Models</h3>
            <p className="text-[var(--text)]/70">Free-form voxel modeling for any custom structure. Export as GLTF for use in other applications.</p>
          </div>
        </section>

        <section className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-10">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 bg-[var(--sidebar-bg)] border border-[var(--border)] rounded-xl">
              <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
              <h4 className="font-bold mb-1">Auto Model Loading</h4>
              <p className="text-sm text-[var(--text)]/70">Loads 3D models directly from Bloxdy/texture-packs GitHub repo</p>
            </div>
            <div className="p-6 bg-[var(--sidebar-bg)] border border-[var(--border)] rounded-xl">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </div>
              <h4 className="font-bold mb-1">Bloxd.js Export</h4>
              <p className="text-sm text-[var(--text)]/70">One-click export to Bloxd.io JavaScript Code Block API</p>
            </div>
            <div className="p-6 bg-[var(--sidebar-bg)] border border-[var(--border)] rounded-xl">
              <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
              </div>
              <h4 className="font-bold mb-1">GLTF Export</h4>
              <p className="text-sm text-[var(--text)]/70">Export models as standard GLTF for use in Blender, Unity, etc.</p>
            </div>
            <div className="p-6 bg-[var(--sidebar-bg)] border border-[var(--border)] rounded-xl">
              <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
              </div>
              <h4 className="font-bold mb-1">Texture Atlas</h4>
              <p className="text-sm text-[var(--text)]/70">Built-in texture picker with auto-loaded Bloxd.io textures</p>
            </div>
          </div>
        </section>

        <section className="border-t border-[var(--border)] pt-16">
          <h2 className="text-3xl font-bold text-center mb-4">Live Asset Browser</h2>
          <p className="text-center text-[var(--text)]/70 max-w-3xl mx-auto mb-8">
            Models, textures and skyboxes are auto-loaded from the{' '}
            <a href="https://github.com/Bloxdy/texture-packs" target="_blank" rel="noopener noreferrer" className="text-purple-500 hover:underline font-semibold">Bloxdy/texture-packs</a>{' '}
            repository using the GitHub API (<code className="text-xs">api.github.com/repos/Bloxdy/texture-packs/contents</code>) and
            served from <code className="text-xs">raw.githubusercontent.com</code>. No local asset folders are used.
          </p>

          <div className="max-w-3xl mx-auto mb-8 flex flex-col sm:flex-row gap-3 items-stretch">
            <input
              value={assetFilter}
              onChange={e => setAssetFilter(e.target.value)}
              placeholder="Filter auto-loaded assets…"
              className="flex-1 px-4 py-2 rounded-lg bg-[var(--sidebar-bg)] border border-[var(--border)] text-[var(--text)] placeholder:text-[var(--text)]/40 focus:outline-none focus:border-[var(--primary)]"
            />
            <a
              href="https://github.com/Bloxdy/texture-packs"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-lg text-sm font-semibold text-center bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] transition-colors"
            >
              View Repository →
            </a>
          </div>

          <div className="max-w-3xl mx-auto mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-[var(--sidebar-bg)] border border-[var(--border)] rounded-lg text-center">
              <p className="text-2xl font-black text-purple-500">{packState === 'loading' ? '…' : pack.models.length}</p>
              <p className="text-sm text-[var(--text)]/60">Models (.glb / .gltf)</p>
            </div>
            <div className="p-4 bg-[var(--sidebar-bg)] border border-[var(--border)] rounded-lg text-center">
              <p className="text-2xl font-black text-pink-500">{packState === 'loading' ? '…' : pack.textures.length}</p>
              <p className="text-sm text-[var(--text)]/60">Textures (.png / .jpg)</p>
            </div>
            <div className="p-4 bg-[var(--sidebar-bg)] border border-[var(--border)] rounded-lg text-center">
              <p className="text-2xl font-black text-blue-500">{packState === 'loading' ? '…' : pack.skyboxes.length}</p>
              <p className="text-sm text-[var(--text)]/60">Skyboxes</p>
            </div>
          </div>

          <div className="max-w-3xl mx-auto mb-8 text-center">
            <p className={
              'text-sm ' + (packState === 'error' ? 'text-red-500' : 'text-[var(--text)]/60')
            }>
              {packMessage}
            </p>
            {pack.folders.length > 0 && (
              <p className="text-xs text-[var(--text)]/50 mt-2">Scanned folders: {pack.folders.join(', ')}</p>
            )}
          </div>

          {packState === 'ready' && (shownModels.length > 0 || shownTextures.length > 0) && (
            <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-bold mb-3">Auto-loaded models</h3>
                <ul className="max-h-72 overflow-y-auto space-y-1 pr-1">
                  {shownModels.slice(0, 200).map(f => (
                    <li key={f.path}>
                      <a
                        href={f.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-sm text-[var(--text)]/75 hover:text-[var(--primary)] truncate"
                      >
                        {f.name}
                      </a>
                    </li>
                  ))}
                </ul>
                {shownModels.length > 200 && (
                  <p className="text-xs text-[var(--text)]/50 mt-2">Showing first 200 of {shownModels.length}.</p>
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold mb-3">Auto-loaded textures</h3>
                <ul className="max-h-72 overflow-y-auto space-y-1 pr-1">
                  {shownTextures.slice(0, 200).map(f => (
                    <li key={f.path}>
                      <a
                        href={f.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-sm text-[var(--text)]/75 hover:text-[var(--primary)] truncate"
                      >
                        {f.name}
                      </a>
                    </li>
                  ))}
                </ul>
                {shownTextures.length > 200 && (
                  <p className="text-xs text-[var(--text)]/50 mt-2">Showing first 200 of {shownTextures.length}.</p>
                )}
              </div>
            </div>
          )}

          {pack.skyboxes.length > 0 && (
            <div className="max-w-5xl mx-auto mt-8">
              <h3 className="text-lg font-bold mb-3">Auto-loaded skyboxes</h3>
              <div className="flex flex-wrap gap-2">
                {pack.skyboxes.slice(0, 60).map(f => (
                  <a
                    key={f.path}
                    href={f.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg text-sm bg-[var(--sidebar-bg)] border border-[var(--border)] hover:border-[var(--primary)] transition-colors"
                  >
                    {f.name}
                  </a>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>


      <footer className="border-t border-[var(--border)] bg-[var(--sidebar-bg)] mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2"><img src="/logo.svg" alt="Players Logo" className="w-6 h-6" /><span className="font-bold">Players</span></div>
            <p className="text-sm text-[var(--text)]/60">Built by <a href="https://github.com/FallenNightA" target="_blank" rel="noopener noreferrer" className="text-[var(--primary)] hover:underline">FallenNightA</a> · Models from <a href="https://github.com/Bloxdy/texture-packs" target="_blank" rel="noopener noreferrer" className="text-[var(--primary)] hover:underline">Bloxdy/texture-packs</a></p>
            <p className="text-sm text-[var(--text)]/60">Official account: <Link href="https://github.com/HidayatBelajar319" target="_blank" rel="noopener noreferrer" className="text-[var(--primary)] hover:underline">HidayatBelajar319</Link> is one of the official accounts made by <Link href="https://github.com/FallenNightA" target="_blank" rel="noopener noreferrer" className="text-[var(--primary)] hover:underline">FallenNightA</Link> (owner).</p>
            <a href="https://github.com/HidayatBelajar319/BloxdUtility-Documentation" target="_blank" rel="noopener noreferrer" className="text-[var(--text)]/60 hover:text-[var(--primary)] transition-colors"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg></a>
          </div>
        </div>
      </footer>
    </div>
  );
}