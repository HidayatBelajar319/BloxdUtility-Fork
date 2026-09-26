'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const CHANGELOG_MARKDOWN = `# Changelog

All notable changes to Players are recorded here. The newest release is listed first.

## v2.3 — Players Rebrand

Rebranded the website as **Players**, replaced the raster logo with a scalable SVG logo, and removed the personal-features text from the public site.

## v2.2 — BloxdBench Internet Assets

Updated BloxdBench to load models, textures, and skyboxes over the internet from [Bloxdy/texture-packs](https://github.com/Bloxdy/texture-packs), and deleted the local asset folders.

## v2.1 — Internal Documentation

Rebuilt the internal \`/documentation\` experience with automatic discovery from [Bloxdy/code-api](https://github.com/Bloxdy/code-api), a Bloxd.io Game Features tab, and a searchable collection of secret code-only items and blocks.

## v2.0 — Clean URLs & App Router

Replaced the HTML-based routes with clean URLs (\`/home\`, \`/documentation\`, \`/lab\`, \`/modrinth\`, \`/tools\`, \`/bloxd-bench\`, and \`/bloxd-ai\`), deleted the legacy HTML files, and introduced the \`app/home\` route.

## v1.9 — CodexMind AI Developer Integration

Integrated the superpowered server-side CodexMind AI Assistant directly into Code Lab and Command Studio! Developers can now build optimized chat commands, scripts, and gameloops using plain-text prompts which are compiled live using real-time SSE streaming. Get instant code, context linking, and automated editor population!

## v1.8 — Developer Tools & Syntax Engine

Launched the specialized Developer Tools page featuring the M2B Schematic Converter (by RealSlothuLT3), a smart Plugin Auto-Merger, and a Visual QTE Generator.

## v1.7 — Bloxd Modrinth Hub

Added the community resource hub for Mods, Texture Packs, and the advanced Plugin System. Features a dedicated Information Tab with technical guides for high-performance server logic.

## v1.6 — Global Navigation & UI Sync

Unified sidebar navigation across all utility pages and integrated the official Bloxd API documentation with live GitHub syncing and searchable ID lists.

## v1.5 — Documentation Redesign

Upgraded the docs layout for better readability, implemented bookmarking for specific API sections, and added a reading progress indicator.

## v1.4 — Utility Home Dashboard

Added live community stats, a rotating developer tip system, and an API function spotlight module to the homepage.

## v1.0 — Initial Launch

First release: Custom mega-prompt template for Bloxd.io scripts and the original Monaco-powered Code Lab.
`;

const NAV_LINKS = [
  {href: '/home', label: 'Home'},
  {href: '/documentation', label: 'Documentation'},
  {href: '/lab', label: 'Code Lab'},
  {href: '/modrinth', label: 'Bloxd Modrinth'},
  {href: '/tools', label: 'Developer Tools'},
  {href: '/bloxd-bench', label: 'BloxdBench'},
  {href: '/bloxd-ai', label: 'Bloxd AI'},
  {href: '/changelog', label: 'Changelog'},
];

const CHANGELOG_ICON_PATH = 'M8 7V3h8v4M6 5h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2zm2 5h8m-8 4h8m-8 4h5';

function nodeText(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(nodeText).join('');
  if (typeof node === 'object' && 'props' in node && node.props && typeof node.props === 'object' && 'children' in node.props) {
    return nodeText(node.props.children as ReactNode);
  }
  return '';
}

export default function ChangelogPage() {
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
              {NAV_LINKS.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={
                    link.href === '/changelog'
                      ? 'inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--primary)]'
                      : 'text-sm font-medium text-[var(--text)] hover:text-[var(--primary)] transition-colors'
                  }
                >
                  {link.href === '/changelog' && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={CHANGELOG_ICON_PATH} />
                    </svg>
                  )}
                  {link.label}
                </Link>
              ))}
            </nav>
            <button onClick={toggleDark} className="p-2 rounded-lg bg-[var(--border)] hover:bg-[var(--nav-hover)] transition-colors" aria-label="Toggle dark mode">
              {isDark ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12">
          <Link href="/home" className="text-sm text-[var(--text)]/60 hover:text-[var(--primary)] transition-colors">Home</Link>
          <span className="text-sm text-[var(--text)]/40 mx-2">/</span>
          <span className="text-sm font-semibold text-[var(--text)]">Changelog</span>
        </div>

        <section className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">Changelog</h1>
          <p className="text-xl text-[var(--text)]/70 max-w-3xl mx-auto">
            Follow every Players release, from the initial Bloxd.io developer launch through the latest rebuild.
          </p>
        </section>

        <article className="changelog-markdown">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h2: ({node: _node, children, ...props}: any) => {
                const match = /^(v\d+(?:\.\d+)*)\s+[—-]\s+(.+)$/.exec(nodeText(children));
                return (
                  <h2 {...props}>
                    {match ? <><span className="version-badge">{match[1]}</span><span>{match[2]}</span></> : children}
                  </h2>
                );
              },
              a: ({node: _node, children, ...props}: any) => (
                <a {...props} target="_blank" rel="noopener noreferrer">{children}</a>
              ),
            }}
          >
            {CHANGELOG_MARKDOWN}
          </ReactMarkdown>
        </article>
      </main>

      <footer className="border-t border-[var(--border)] bg-[var(--sidebar-bg)] mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex items-center gap-2">
              <img src="/logo.svg" alt="Players Logo" className="w-6 h-6" />
              <span className="font-bold">Players</span>
            </div>
            <p className="text-sm text-[var(--text)]/60">
              Built by <Link href="https://github.com/FallenNightA" target="_blank" rel="noopener noreferrer" className="text-[var(--primary)] hover:underline">FallenNightA</Link>
            </p>
            <p className="text-sm text-[var(--text)]/60">
              Official account: <Link href="https://github.com/HidayatBelajar319" target="_blank" rel="noopener noreferrer" className="text-[var(--primary)] hover:underline">HidayatBelajar319</Link> is one of the official accounts made by <Link href="https://github.com/FallenNightA" target="_blank" rel="noopener noreferrer" className="text-[var(--primary)] hover:underline">FallenNightA</Link> (owner).
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
