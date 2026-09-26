'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function ToolsPage() {
  const [isDark, setIsDark] = useState(false);

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

  const tools = [
    { name: 'M2B Schematic Converter', href: '/tools/m2b', icon: 'fa-cube', color: 'green', desc: 'Convert Minecraft schematics to Bloxd format' },
    { name: 'Plugin Auto-Merger', href: '/tools/merger', icon: 'fa-puzzle-piece', color: 'purple', desc: 'Merge multiple plugins into one' },
    { name: 'Visual QTE Generator', href: '/tools/qte', icon: 'fa-gamepad', color: 'orange', desc: 'Create Quick Time Events visually' },
    { name: 'Particle Designer', href: '/tools/particles', icon: 'fa-sparkles', color: 'pink', desc: 'Design custom particle effects' },
    { name: 'GUI Builder', href: '/tools/gui', icon: 'fa-desktop', color: 'gold', desc: 'Build custom GUI interfaces' },
    { name: 'Texture Pack Generator', href: '/tools/texture', icon: 'fa-palette', color: 'cyan', desc: 'Generate texture packs for Bloxd' },
    { name: 'Command Studio', href: '/tools/commands', icon: 'fa-terminal', color: 'indigo', desc: 'Visual command builder' },
    { name: 'Smart Mob Maker', href: '/tools/mobs', icon: 'fa-dragon', color: 'rose', desc: 'Create custom mobs and bosses' },
  ];

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
              <Link href="/tools" className="text-sm font-medium text-[var(--primary)] font-semibold">Developer Tools</Link>
              <Link href="/bloxd-bench" className="text-sm font-medium text-[var(--text)] hover:text-[var(--primary)] transition-colors">BloxdBench</Link>
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12">
          <Link href="/home" className="text-sm text-[var(--text)]/60 hover:text-[var(--primary)] transition-colors">Home</Link>
          <span className="text-sm text-[var(--text)]/40 mx-2">/</span>
          <span className="text-sm font-semibold text-[var(--text)]">Developer Tools</span>
        </div>

        <section className="mb-16">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">Developer Toolbox</h1>
          <p className="text-xl text-[var(--text)]/70 max-w-3xl">Select a tool to build your custom mods, assets, and scripts for Bloxd.io.</p>
        </section>

        <section>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {tools.map((tool) => (
              <Link key={tool.name} href={tool.href} className="group p-6 bg-[var(--sidebar-bg)] border border-[var(--border)] rounded-xl hover:border-[var(--primary)] hover:shadow-lg hover:shadow-[var(--primary)]/10 transition-all duration-300">
                <div className={`w-12 h-12 bg-${tool.color}-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-${tool.color}-500/20 transition-colors`}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={getIconPath(tool.icon)} />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">{tool.name}</h3>
                <p className="text-sm text-[var(--text)]/70">{tool.desc}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-16 border-t border-[var(--border)] pt-12">
          <h2 className="text-2xl font-bold mb-6 text-center">Quick Links</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <Link href="/documentation" className="p-4 bg-[var(--sidebar-bg)] border border-[var(--border)] rounded-lg text-center hover:border-[var(--primary)] transition-colors"><p className="font-semibold">Documentation</p><p className="text-sm text-[var(--text)]/60">API reference</p></Link>
            <Link href="/lab" className="p-4 bg-[var(--sidebar-bg)] border border-[var(--border)] rounded-lg text-center hover:border-[var(--primary)] transition-colors"><p className="font-semibold">Code Lab</p><p className="text-sm text-[var(--text)]/60">Monaco editor</p></Link>
            <Link href="/bloxd-bench" className="p-4 bg-[var(--sidebar-bg)] border border-[var(--border)] rounded-lg text-center hover:border-[var(--primary)] transition-colors"><p className="font-semibold">BloxdBench</p><p className="text-sm text-[var(--text)]/60">Voxel editor</p></Link>
            <Link href="/bloxd-ai" className="p-4 bg-[var(--sidebar-bg)] border border-[var(--border)] rounded-lg text-center hover:border-[var(--primary)] transition-colors"><p className="font-semibold">Bloxd AI</p><p className="text-sm text-[var(--text)]/60">AI assistant</p></Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--border)] bg-[var(--sidebar-bg)] mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2"><img src="/logo.svg" alt="Players Logo" className="w-6 h-6" /><span className="font-bold">Players</span></div>
            <p className="text-sm text-[var(--text)]/60">Built by <a href="https://github.com/FallenNightA" target="_blank" rel="noopener noreferrer" className="text-[var(--primary)] hover:underline">FallenNightA</a> · Data from <a href="https://github.com/Bloxdy/code-api" target="_blank" rel="noopener noreferrer" className="text-[var(--primary)] hover:underline">Bloxdy/code-api</a></p>
            <p className="text-sm text-[var(--text)]/60">Official account: <Link href="https://github.com/HidayatBelajar319" target="_blank" rel="noopener noreferrer" className="text-[var(--primary)] hover:underline">HidayatBelajar319</Link> is one of the official accounts made by <Link href="https://github.com/FallenNightA" target="_blank" rel="noopener noreferrer" className="text-[var(--primary)] hover:underline">FallenNightA</Link> (owner).</p>
            <a href="https://github.com/HidayatBelajar319/BloxdUtility-Documentation" target="_blank" rel="noopener noreferrer" className="text-[var(--text)]/60 hover:text-[var(--primary)] transition-colors"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg></a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function getIconPath(icon: string): string {
  const icons: Record<string, string> = {
    'fa-cube': 'M8 15l3-3 3 3 3-3v6l-3 3-3-3-3 3V15z',
    'fa-puzzle-piece': 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
    'fa-gamepad': 'M21 12a9 9 0 01-9 9 9.35 9.35 0 01-6.74-2.88L3 21l1.9-5.7a9.38 9.38 0 01-.87-6.72A9 9 0 1121 12z',
    'fa-sparkles': 'M5 3v4M3 5h4M12 2v4M10 4h4M19 3v4M17 5h4M21 12h-4M23 10v4M12 19v4M10 21h4M3 19v-4M5 17h4',
    'fa-desktop': 'M9 18V5l12-2v13M9 9l12 2M9 15l12 2',
    'fa-palette': 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z',
    'fa-terminal': 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4',
    'fa-dragon': 'M21 12a9 9 0 01-9 9 9.35 9.35 0 01-6.74-2.88L3 21l1.9-5.7a9.38 9.38 0 01-.87-6.72A9 9 0 1121 12z',
  };
  return icons[icon] || 'M13 2L3 14h9l-1 8 10-12h-9l1-8z';
}