'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/* ------------------------------------------------------------------ *
 * Remote sources
 * ------------------------------------------------------------------ */
const GITHUB_API = 'https://api.github.com/repos/Bloxdy/code-api/contents';
const RAW_BASE = 'https://raw.githubusercontent.com/Bloxdy/code-api/main';
const REPO_URL = 'https://github.com/Bloxdy/code-api';
const FANDOM_URL = 'https://bloxd-io.fandom.com/wiki/Code_Block';
const BLOXD_URL = 'https://bloxd.io';

const FALLBACK_FILES = [
  'README.md',
  'api.md',
  'blocks.md',
  'items.md',
  'events.md',
  'tutorials.md',
  'documentation.txt',
  'changelog.txt',
];

/* ------------------------------------------------------------------ *
 * Bloxd.io game data
 * ------------------------------------------------------------------ */
const ALL_FEATURES: {name: string; desc: string}[] = [
  {name: 'Code Blocks', desc: 'Run real JavaScript inside a world with the full Bloxd.io api object.'},
  {name: 'Survival & Mining', desc: 'Gather resources, smelt ores and craft the full tool progression.'},
  {name: 'Creative Building', desc: 'Unlimited blocks, flying camera and instant placement for fast builds.'},
  {name: 'Crafting & Workbenches', desc: 'Recipe grid, Workbench, Artisan Bench and potioneer stations.'},
  {name: 'Farming & Crops', desc: 'Tilled soil, growth stages, seeds and harvest loops for food economy.'},
  {name: 'Mob AI & Herds', desc: 'Spawners, herd behaviour, aggro targets and per-mob stat settings.'},
  {name: 'Bosses & Custom Mobs', desc: 'Draugr, Frost and Spirit variants with tuned max health and damage.'},
  {name: 'PvP Combat', desc: 'Melee, bows, paintball guns, knockback and kill-streak tracking.'},
  {name: 'Loot & Chests', desc: 'Standard, iron, loot, moonstone and ghost chests with slot-level api access.'},
  {name: 'Lucky Blocks', desc: 'Random rewards from lucky, weapon, gun, ghost, pet and mystery blocks.'},
  {name: 'Portals', desc: 'Sixteen dye-coloured portals that teleport entities on contact.'},
  {name: 'Items & Potions', desc: 'Consumables, buffs, arrows of every effect and instant-heal variants.'},
  {name: 'Enchanting', desc: 'Wood through moonstone enchanting tables and permanent item upgrades.'},
  {name: 'Trading & NPCs', desc: 'Trader and wizard shop blocks for currency driven economies.'},
  {name: 'Objectives & Obbies', desc: 'Checkpoint, goal, finish, death and absorb blocks for course design.'},
  {name: 'Physics & Tiles', desc: 'Gravity, explosions, projectiles, raycasts and falling sand behaviour.'},
  {name: 'Day/Night & Skyboxes', desc: 'Skybox switching, time of day queries and custom sky rendering.'},
  {name: 'Water & Fire', desc: 'Flowing water, drowning checks, fire spread and burn damage states.'},
  {name: 'Beds, Spawns & Respawn', desc: 'Coloured beds, strong beds, spawn blocks and lobby selection.'},
  {name: 'Custom Worlds', desc: 'Custom lobbies, lobby types, name/meta lookups and rule configs.'},
];

const ITEMS_AND_USES: {item: string; use: string}[] = [
  {item: 'Wood / Stone / Iron Pickaxe', use: 'Mining tier progression — each tier mines the previous tier blocks faster.'},
  {item: 'Diamond Pickaxe', use: 'Required to mine diamond and moonstone ore.'},
  {item: 'Moonstone Pickaxe', use: 'Harvests moonstone ore, the hardest natural resource.'},
  {item: 'Artisan Axe', use: 'Chops trees twice as fast and strips bark for barkless logs.'},
  {item: 'Shears / Artisan Shears', use: 'Collect leaves, wool and foliage blocks without destroying them.'},
  {item: 'Sword (wood → moonstone)', use: 'Melee damage; Knight Sword adds extra knockback.'},
  {item: 'Spear / Dagger / Boomerang', use: 'Reach weapons, fast critical daggers and returning projectiles.'},
  {item: 'Bow + Arrow', use: 'Ranged damage; effect arrows apply a status effect on hit.'},
  {item: 'Arrow of Speed / Strength', use: 'Applies haste or strength to the target for a short window.'},
  {item: 'Arrow of Shield / Defense', use: 'Grants extra shield amount or flat damage reduction on hit.'},
  {item: 'Paintball Gun', use: 'Paints blocks and players with colour instead of damaging them.'},
  {item: 'Rocket / Super Rocket / Obby Rocket', use: 'Explosive projectiles with increasing blast force and colour.'},
  {item: 'Grenade / Bouncy Bomb', use: 'Thrown explosives — grenade for damage, bouncy bomb for fun.'},
  {item: 'Bread / Apple / Baked Potato', use: 'Restore hunger and keep regeneration running.'},
  {item: 'Beef Stew / Bowl of Rice', use: 'High-saturation meals from the cooking stations.'},
  {item: 'Aura XP Potion / Orb / Fragment', use: 'Aura progression currency used by the crafting tier tree.'},
  {item: 'Brain Rot Potion', use: 'Traded at the wizard shop for high-tier crafting materials.'},
  {item: 'Bone Meal / Bone', use: 'Bone meal grows crops instantly; bones craft into other items.'},
  {item: 'Torch / Coloured Torch', use: 'Permanent light source — any colour, no fuel required.'},
  {item: 'Gold Trophy / Diamond Trophy', use: 'Scoreboard and leaderboard display objects.'},
];

const SECRET_ITEMS: {name: string; how: string; desc: string}[] = [
  {name: 'Code Block', how: "api.setBlock(playerId, [x, y, z], 'Code Block', false)", desc: 'Places a live JavaScript block. Nothing spawns it — only a script can create it.'},
  {name: 'Obby Death Block', how: "api.setBlock(id, [x, y, z], 'Obby Death Block', false)", desc: 'Instantly kills or respawns whoever stands on it. Obby courses are built from code.'},
  {name: 'Obby Absorb Block', how: "api.setBlock(id, [x, y, z], 'Obby Absorb Block', false)", desc: 'Absorbs an entity into the block — used for secret rooms and teleport traps.'},
  {name: 'Obby Absorb Death Block', how: "api.setBlock(id, [x, y, z], 'Obby Absorb Death Block', false)", desc: 'Absorbs and kills the entity, giving full control over trap behaviour.'},
  {name: 'Custom Lobby Block', how: "api.setBlock(id, [x, y, z], 'Custom Lobby Block', false)", desc: 'Teleports a player to a lobby selected by the script, bypassing the normal lobby list.'},
  {name: 'Generator Spawn Block (Diamond)', how: "api.setBlock(id, [x, y, z], 'Generator Spawn Block (Diamond)', false)", desc: 'Diamond generator that never appears in survival generators.'},
  {name: 'Generator Spawn Block (Moonstone)', how: "api.setBlock(id, [x, y, z], 'Generator Spawn Block (Moonstone)', false)", desc: 'Moonstone generator reserved for endgame custom maps.'},
  {name: 'Gold Watermelon Stag Spawner Block', how: "api.setBlock(id, [x, y, z], 'Gold Watermelon Stag Spawner Block', false)", desc: 'Spawns the rare golden stag boss with custom health and loot.'},
  {name: 'Draugr Warper Spawner Block', how: "api.setBlock(id, [x, y, z], 'Draugr Warper Spawner Block', false)", desc: 'Warp-capable elite mob that can teleport across a world.'},
  {name: 'Mystery Block / Ghost Mystery Block', how: "api.setBlock(id, [x, y, z], 'Mystery Block', false)", desc: 'Code-controlled mystery block — the script decides which reward table is rolled.'},
  {name: 'Bouncy Bomb Block', how: "api.setBlock(id, [x, y, z], 'Bouncy Bomb Block', false)", desc: 'Physics-driven bouncing explosive that keeps its own launch velocity.'},
  {name: 'Timed Spike Bomb Block', how: "api.setBlock(id, [x, y, z], 'Timed Spike Bomb Block', false)", desc: 'Arms on a script-set timer, then damages every entity in radius.'},
  {name: 'Toxin Ball Block', how: "api.setBlock(id, [x, y, z], 'Toxin Ball Block', false)", desc: 'Ranged poison projectile that applies a poison effect on impact.'},
  {name: 'Crystal', how: "api.setItemSlot(playerId, slot, 'Crystal', amount)", desc: 'Ultra-rare drop used only by code-driven reward systems and custom shops.'},
];

const BLOCK_NAMES: {group: string; names: string[]}[] = [
  {
    group: 'Natural',
    names: ['Dirt', 'Messy Dirt', 'Grass Block', 'Sand', 'Red Sand', 'Clay', 'Gravel', 'Snow', 'Stone', 'Smooth Stone', 'Diorite', 'Andesite', 'Granite', 'Sandstone', 'Ice', 'Obsidian', 'Bedrock', 'Magma'],
  },
  {
    group: 'Ores & Ore Blocks',
    names: ['Coal Ore', 'Iron Ore', 'Gold Ore', 'Lapis Lazuli Ore', 'Emerald Ore', 'Diamond Ore', 'Moonstone Ore', 'Block of Coal', 'Block of Iron', 'Block of Gold', 'Block of Diamond', 'Block of Moonstone'],
  },
  {
    group: 'Wood & Planks',
    names: ['Maple Log', 'Pine Log', 'Plum Log', 'Cedar Log', 'Aspen Log', 'Jungle Log', 'Palm Log', 'Cherry Log', 'Mango Log', 'Spectral Log', 'Maple Wood Planks', 'Pine Wood Planks', 'Cherry Wood Planks', 'Spectral Wood Planks', 'White Planks', 'Black Planks'],
  },
  {
    group: 'Slabs, Doors & Ladders',
    names: ['Maple Slab', 'Dirt Slab', 'Stone Slab', 'Smooth Stone Slab', 'Sandstone Slab', 'Bricks Slab', 'White Concrete Slab', 'Black Concrete Slab', 'Maple Door', 'Aspen Door', 'Maple Trapdoor', 'Maple Ladder', 'Iron Ladder'],
  },
  {
    group: 'Decorative & Lighting',
    names: ['Bricks', 'Stone Bricks', 'Glass', 'Black Glass', 'Patterned White Glass', 'White Wool', 'Black Wool', 'Gray Concrete', 'White Concrete', 'Bookshelf', 'Beacon', 'Torch', 'White Torch', 'Yellow Neon', 'Magenta Neon', 'Bin', 'Vending Machine'],
  },
  {
    group: 'Chests & Containers',
    names: ['Chest', 'Iron Chest', 'Loot Chest', 'Moonstone Chest', 'Crate', 'Hollow Crate', 'Ghost Chest'],
  },
  {
    group: 'Crops & Agriculture',
    names: ['Wheat', 'Tilled Soil', 'Watermelon', 'Pumpkin', 'Carved Pumpkin', "Jack o'Lantern", 'Melon', 'Rice', 'Cranberries', 'Cotton', 'Corn Plant', 'Carrot Plant', 'Potato Plant', 'Beetroot Plant', 'Sugar Cane Plant', 'Coffee Plant'],
  },
  {
    group: 'Utility & Game Mech',
    names: ['Code Block', 'Furnace', 'Workbench', 'Artisan Bench', 'Chopping Board', 'Frying Pan', 'Radar', 'Active Radar', 'Checkpoint Block', 'Finish Block', 'Goal Block (Red)', 'Water', 'Invisible Solid'],
  },
  {
    group: 'Portals & Lucky Blocks',
    names: ['Black Portal', 'Blue Portal', 'Cyan Portal', 'Green Portal', 'Purple Portal', 'Red Portal', 'White Portal', 'Yellow Portal', 'Lucky Block', 'Ultra Lucky Block', 'Weapon Lucky Block', 'Gun Lucky Block', 'Ghost Lucky Block', 'Pet Lucky Block', 'Mystery Block', 'Ghost Mystery Block'],
  },
];

const ITEM_NAMES: {group: string; names: string[]}[] = [
  {
    group: 'Tools',
    names: ['Wood Pickaxe', 'Stone Pickaxe', 'Iron Pickaxe', 'Gold Pickaxe', 'Diamond Pickaxe', 'Moonstone Pickaxe', 'Golem Pickaxe', 'Artisan Axe', 'Wood Spade', 'Iron Spade', 'Wood Hoe', 'Diamond Hoe', 'Shears', 'Artisan Shears'],
  },
  {
    group: 'Melee Weapons',
    names: ['Wood Sword', 'Stone Sword', 'Iron Sword', 'Gold Sword', 'Diamond Sword', 'Knight Sword', 'Wood Spear', 'Iron Spear', 'Moonstone Spear', 'Wood Dagger', 'Moonstone Dagger', 'Wood Boomerang', 'Diamond Boomerang'],
  },
  {
    group: 'Ranged & Guns',
    names: ['Bow', 'Arrow', 'Paint Bow', 'Paintball Gun', 'Black Paintball Gun', 'Heavy Paintball Gun', 'AK-47', 'AWP', 'Ammo'],
  },
  {
    group: 'Arrows & Potions',
    names: ['Arrow of Speed', 'Arrow of Strength', 'Arrow of Haste', 'Arrow of Jumping', 'Arrow of Shield', 'Arrow of Defense', 'Arrow of Instant Healing', 'Arrow of Instant Damage', 'Arrow of Invisibility', 'Arrow of X-Ray Vision', 'Aura XP Potion', 'Aura XP Orb', 'Aura XP Fragment', 'Brain Rot Potion'],
  },
  {
    group: 'Explosives & Throwables',
    names: ['Rocket', 'Super Rocket', 'Obby Rocket', 'Grenade', 'Bouncy Bomb', 'Moonstone Explosive'],
  },
  {
    group: 'Food & Consumables',
    names: ['Apple', 'Banana', 'Baked Potato', 'Beef Stew', 'Bread', 'Bowl', 'Bowl of Rice', 'Carrot', 'Potato', 'Beetroot', 'Melon', 'Bone Meal', 'Bone'],
  },
  {
    group: 'Trophies & Currency',
    names: ['Gold Trophy', 'Wood Trophy', 'Stone Trophy', 'Iron Trophy', 'Diamond Trophy', 'Moonstone Trophy', 'Gold Coin', 'Crystal'],
  },
];

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */
function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function nodeText(node: any): string {
  if (node == null) return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(nodeText).join('');
  if (node.props && node.props.children) return nodeText(node.props.children);
  return '';
}

function headingsOf(md: string) {
  const out: {level: number; text: string; id: string}[] = [];
  const seen: Record<string, number> = {};
  md.split('\n').forEach(line => {
    const m = /^(#{1,4})\s+(.*)$/.exec(line);
    if (!m) return;
    const text = m[2].replace(/[*_`]/g, '').trim();
    if (!text) return;
    const base = slugify(text);
    seen[base] = (seen[base] || 0) + 1;
    out.push({level: m[1].length, text, id: seen[base] > 1 ? `${base}-${seen[base]}` : base});
  });
  return out;
}

function highlightCount(text: string, query: string) {
  if (!query.trim()) return 0;
  const needle = query.trim().toLowerCase();
  let count = 0;
  let idx = text.toLowerCase().indexOf(needle);
  while (idx !== -1) {
    count++;
    idx = text.toLowerCase().indexOf(needle, idx + needle.length);
  }
  return count;
}

const NAV_LINKS = [
  {href: '/home', label: 'Home'},
  {href: '/documentation', label: 'Documentation'},
  {href: '/lab', label: 'Code Lab'},
  {href: '/modrinth', label: 'Bloxd Modrinth'},
  {href: '/tools', label: 'Developer Tools'},
  {href: '/bloxd-bench', label: 'BloxdBench'},
  {href: '/bloxd-ai', label: 'Bloxd AI'},
  {href: '/workspace', label: 'Workspace'},
  {href: '/changelog', label: 'Changelog'},
];

/* ------------------------------------------------------------------ *
 * Page
 * ------------------------------------------------------------------ */
export default function DocumentationPage() {
  const [isDark, setIsDark] = useState(false);
  const [tab, setTab] = useState<'docs' | 'features'>('docs');

  const [files, setFiles] = useState<string[]>([]);
  const [contents, setContents] = useState<Record<string, string>>({});
  const [activeFile, setActiveFile] = useState('');
  const [discovering, setDiscovering] = useState(true);
  const [loadingFile, setLoadingFile] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);
  const [notice, setNotice] = useState('');
  const [fileError, setFileError] = useState('');

  const [search, setSearch] = useState('');
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [featureSearch, setFeatureSearch] = useState('');

  /* theme */
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

  /* bookmarks */
  useEffect(() => {
    try {
      const raw = localStorage.getItem('players-docs-bookmarks');
      if (raw) setBookmarks(JSON.parse(raw));
    } catch {
      setBookmarks([]);
    }
  }, []);

  const toggleBookmark = (name: string) => {
    setBookmarks(prev => {
      const next = prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name];
      try {
        localStorage.setItem('players-docs-bookmarks', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  /* auto-discovery from GitHub */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setDiscovering(true);
      try {
        const res = await fetch(GITHUB_API, {
          headers: {Accept: 'application/vnd.github+json'},
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: any = await res.json();
        if (!Array.isArray(data)) throw new Error('Unexpected response');
        const names: string[] = data
          .filter((f: any) => f && f.type === 'file' && typeof f.name === 'string' && /\.(md|txt)$/i.test(f.name))
          .map((f: any) => f.name as string)
          .sort((a, b) => a.localeCompare(b));
        if (!names.length) throw new Error('No documentation files found');
        if (cancelled) return;
        setFiles(names);
        setActiveFile(prev => (prev && names.includes(prev) ? prev : names.find(n => /^readme\.md$/i.test(n)) || names[0]));
        setUsingFallback(false);
        setNotice(`${names.length} documentation file${names.length === 1 ? '' : 's'} auto-discovered from Bloxdy/code-api.`);
      } catch (e: any) {
        if (cancelled) return;
        setFiles(FALLBACK_FILES);
        setActiveFile(FALLBACK_FILES[0]);
        setUsingFallback(true);
        setNotice(`Live GitHub discovery unavailable (${e?.message || 'network error'}) — using the built-in file list.`);
      } finally {
        if (!cancelled) setDiscovering(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /* load active file from raw.githubusercontent.com */
  const loadFile = useCallback(async (name: string) => {
    if (!name || contents[name] !== undefined) return;
    setLoadingFile(true);
    setFileError('');
    try {
      const res = await fetch(`${RAW_BASE}/${encodeURIComponent(name)}`, {cache: 'no-store'});
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      setContents(prev => (prev[name] !== undefined ? prev : {...prev, [name]: text}));
    } catch (e: any) {
      setFileError(`Could not load ${name} (${e?.message || 'network error'}).`);
    } finally {
      setLoadingFile(false);
    }
  }, [contents]);

  useEffect(() => {
    loadFile(activeFile);
  }, [activeFile, loadFile]);

  /* derived */
  const markdownFiles = useMemo(() => files.filter(f => /\.md$/i.test(f)), [files]);
  const textFiles = useMemo(() => files.filter(f => /\.txt$/i.test(f)), [files]);

  const visibleMarkdown = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return markdownFiles;
    return markdownFiles.filter(f => f.toLowerCase().includes(q) || highlightCount(contents[f] || '', search) > 0);
  }, [markdownFiles, files, search, contents]);

  const visibleText = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return textFiles;
    return textFiles.filter(f => f.toLowerCase().includes(q) || highlightCount(contents[f] || '', search) > 0);
  }, [textFiles, search, contents]);

  const activeContent = activeFile ? contents[activeFile] || '' : '';
  const isMarkdown = /\.md$/i.test(activeFile);
  const headings = useMemo(() => headingsOf(activeContent), [activeContent]);
  const idByText = useMemo(() => {
    const map = new Map<string, string>();
    headings.forEach(h => {
      if (!map.has(h.text)) map.set(h.text, h.id);
    });
    return map;
  }, [headings]);
  const matches = useMemo(() => highlightCount(activeContent, search), [activeContent, search]);

  const filteredFeatures = useMemo(() => {
    const q = featureSearch.trim().toLowerCase();
    if (!q) return ALL_FEATURES;
    return ALL_FEATURES.filter(f => f.name.toLowerCase().includes(q) || f.desc.toLowerCase().includes(q));
  }, [featureSearch]);

  const filteredItems = useMemo(() => {
    const q = featureSearch.trim().toLowerCase();
    if (!q) return ITEMS_AND_USES;
    return ITEMS_AND_USES.filter(i => i.item.toLowerCase().includes(q) || i.use.toLowerCase().includes(q));
  }, [featureSearch]);

  const blockMatches = useMemo(() => {
    const q = featureSearch.trim().toLowerCase();
    return BLOCK_NAMES.map(g => ({
      ...g,
      names: q ? g.names.filter(n => n.toLowerCase().includes(q)) : g.names,
    })).filter(g => g.names.length);
  }, [featureSearch]);

  const itemMatches = useMemo(() => {
    const q = featureSearch.trim().toLowerCase();
    return ITEM_NAMES.map(g => ({
      ...g,
      names: q ? g.names.filter(n => n.toLowerCase().includes(q)) : g.names,
    })).filter(g => g.names.length);
  }, [featureSearch]);

  const exportMd = () => {
    if (!activeFile || !activeContent) return;
    const blob = new Blob([activeContent], {type: 'text/markdown;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeFile;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] transition-colors duration-300">
      {/* Header */}
      <header className="border-b border-[var(--border)] bg-[var(--sidebar-bg)] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/home" className="flex items-center gap-2">
              <img src="/logo.svg" alt="Players Logo" className="w-8 h-8" />
              <span className="font-bold text-xl tracking-tighter">Players</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              {NAV_LINKS.map(l => (
                <Link
                  key={l.href}
                  href={l.href}
                  className={
                    l.href === '/documentation'
                      ? 'text-sm font-medium text-[var(--primary)] font-semibold'
                      : 'text-sm font-medium text-[var(--text)] hover:text-[var(--primary)] transition-colors'
                  }
                >
                  {l.href === '/changelog' && (
                    <svg className="inline-block w-4 h-4 mr-1.5 align-text-bottom" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3h8v4M6 5h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2zm2 5h8m-8 4h8m-8 4h5" />
                    </svg>
                  )}
                  {l.label}
                </Link>
              ))}
            </nav>
            <div className="flex items-center gap-4">
              <button
                onClick={toggleDark}
                className="p-2 rounded-lg bg-[var(--border)] hover:bg-[var(--nav-hover)] transition-colors"
                aria-label="Toggle dark mode"
              >
                {isDark ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb */}
        <div className="mb-8">
          <Link href="/home" className="text-sm text-[var(--text)]/60 hover:text-[var(--primary)] transition-colors">Home</Link>
          <span className="text-sm text-[var(--text)]/40 mx-2">/</span>
          <span className="text-sm font-semibold text-[var(--text)]">Documentation</span>
        </div>

        {/* Hero */}
        <section className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">Documentation</h1>
          <p className="text-xl text-[var(--text)]/70 max-w-3xl mx-auto">
            Full API reference for Bloxd.io plus a complete guide to the game itself. Auto-discovered live from the
            official <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="text-[var(--primary)] hover:underline font-semibold">Bloxdy/code-api</a> repository.
          </p>
        </section>

        {/* Tabs */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex rounded-xl border border-[var(--border)] bg-[var(--sidebar-bg)] p-1">
            <button
              onClick={() => setTab('docs')}
              className={
                tab === 'docs'
                  ? 'px-6 py-2 rounded-lg font-semibold text-sm bg-[var(--primary)] text-white'
                  : 'px-6 py-2 rounded-lg font-semibold text-sm text-[var(--text)] hover:text-[var(--primary)] transition-colors'
              }
            >
              Code API Docs
            </button>
            <button
              onClick={() => setTab('features')}
              className={
                tab === 'features'
                  ? 'px-6 py-2 rounded-lg font-semibold text-sm bg-[var(--primary)] text-white'
                  : 'px-6 py-2 rounded-lg font-semibold text-sm text-[var(--text)] hover:text-[var(--primary)] transition-colors'
              }
            >
              Bloxd.io Game Features
            </button>
          </div>
        </div>

        {tab === 'docs' ? (
          /* ================= CODE API DOCS ================= */
          <>
            {/* Toolbar */}
            <section className="mb-8">
              <div className="flex flex-col lg:flex-row gap-4 items-stretch">
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search files and content…"
                  className="flex-1 px-4 py-3 rounded-xl bg-[var(--sidebar-bg)] border border-[var(--border)] text-[var(--text)] placeholder:text-[var(--text)]/40 focus:outline-none focus:border-[var(--primary)]"
                />
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm text-[var(--text)]/60">
                    {discovering ? 'Discovering…' : `${files.length} files`}
                    {matches > 0 && search ? ` · ${matches} match${matches === 1 ? '' : 'es'} in ${activeFile}` : ''}
                  </span>
                  <button
                    onClick={exportMd}
                    disabled={!activeContent}
                    className="px-4 py-2 rounded-lg text-sm font-semibold bg-[var(--sidebar-bg)] border border-[var(--border)] hover:border-[var(--primary)] disabled:opacity-40 transition-colors"
                  >
                    Export MD
                  </button>
                  <a
                    href={REPO_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-lg text-sm font-semibold bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] transition-colors"
                  >
                    GitHub Repo
                  </a>
                </div>
              </div>
              {notice && (
                <p className="mt-3 text-sm text-[var(--text)]/60">
                  {notice}
                  {usingFallback && ' You can still browse every file below.'}
                </p>
              )}
              {fileError && <p className="mt-3 text-sm text-red-500">{fileError}</p>}
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Sidebar: file list + TOC + bookmarks */}
              <aside className="lg:col-span-1">
                <div className="lg:sticky lg:top-24 space-y-6">
                  <div>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text)]/50 mb-3">Bookmarks</h2>
                    {bookmarks.length === 0 ? (
                      <p className="text-sm text-[var(--text)]/50">Star a file to pin it here.</p>
                    ) : (
                      <ul className="space-y-1">
                        {bookmarks.map(b => (
                          <li key={b}>
                            <button
                              onClick={() => setActiveFile(b)}
                              className="text-sm text-left w-full truncate hover:text-[var(--primary)] text-[var(--text)]/80 transition-colors"
                            >
                              ★ {b}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text)]/50 mb-3">Markdown ({visibleMarkdown.length})</h2>
                    <ul className="space-y-1 max-h-64 overflow-y-auto pr-1">
                      {visibleMarkdown.map(f => (
                        <li key={f} className="flex items-center gap-1">
                          <button
                            onClick={() => setActiveFile(f)}
                            className={
                              'flex-1 text-left text-sm px-2 py-1 rounded truncate transition-colors ' +
                              (activeFile === f
                                ? 'bg-[var(--primary)] text-white font-semibold'
                                : 'text-[var(--text)]/80 hover:bg-[var(--nav-hover)]')
                            }
                          >
                            {f}
                          </button>
                          <button
                            onClick={() => toggleBookmark(f)}
                            aria-label={`Bookmark ${f}`}
                            className={
                              'px-1 ' + (bookmarks.includes(f) ? 'text-yellow-500' : 'text-[var(--text)]/30 hover:text-yellow-500')
                            }
                          >
                            ★
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text)]/50 mb-3">Text ({visibleText.length})</h2>
                    <ul className="space-y-1">
                      {visibleText.map(f => (
                        <li key={f} className="flex items-center gap-1">
                          <button
                            onClick={() => setActiveFile(f)}
                            className={
                              'flex-1 text-left text-sm px-2 py-1 rounded truncate transition-colors ' +
                              (activeFile === f
                                ? 'bg-[var(--primary)] text-white font-semibold'
                                : 'text-[var(--text)]/80 hover:bg-[var(--nav-hover)]')
                            }
                          >
                            {f}
                          </button>
                          <button
                            onClick={() => toggleBookmark(f)}
                            aria-label={`Bookmark ${f}`}
                            className={
                              'px-1 ' + (bookmarks.includes(f) ? 'text-yellow-500' : 'text-[var(--text)]/30 hover:text-yellow-500')
                            }
                          >
                            ★
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {headings.length > 0 && (
                    <div>
                      <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text)]/50 mb-3">On this page</h2>
                      <ul className="space-y-1 max-h-64 overflow-y-auto pr-1">
                        {headings.map(h => (
                          <li key={h.id} style={{paddingLeft: `${(h.level - 1) * 10}px`}}>
                            <a
                              href={`#${h.id}`}
                              onClick={e => {
                                e.preventDefault();
                                const el = document.getElementById(h.id);
                                if (el) el.scrollIntoView({behavior: 'smooth', block: 'start'});
                              }}
                              className="block text-sm text-[var(--text)]/70 hover:text-[var(--primary)] truncate transition-colors"
                            >
                              {h.text}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </aside>

              {/* Reader */}
              <section className="lg:col-span-3">
                <div className="flex items-center justify-between mb-4 gap-3">
                  <h2 className="text-2xl font-bold truncate">{activeFile || 'No file selected'}</h2>
                  {activeFile && (
                    <button
                      onClick={() => toggleBookmark(activeFile)}
                      className={
                        'shrink-0 px-3 py-2 rounded-lg text-sm font-semibold border transition-colors ' +
                        (bookmarks.includes(activeFile)
                          ? 'border-yellow-500 text-yellow-500'
                          : 'border-[var(--border)] text-[var(--text)]/70 hover:border-[var(--primary)]')
                      }
                    >
                      ★ {bookmarks.includes(activeFile) ? 'Bookmarked' : 'Bookmark'}
                    </button>
                  )}
                </div>

                {loadingFile && <p className="text-[var(--text)]/60">Loading {activeFile}…</p>}

                {!loadingFile && activeContent && isMarkdown && (
                  <article className="md-body">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({node, children, ...props}: any) => {
                          const t = nodeText(children);
                          return <h1 id={idByText.get(t) || slugify(t)} {...props}>{children}</h1>;
                        },
                        h2: ({node, children, ...props}: any) => {
                          const t = nodeText(children);
                          return <h2 id={idByText.get(t) || slugify(t)} {...props}>{children}</h2>;
                        },
                        h3: ({node, children, ...props}: any) => {
                          const t = nodeText(children);
                          return <h3 id={idByText.get(t) || slugify(t)} {...props}>{children}</h3>;
                        },
                        h4: ({node, children, ...props}: any) => {
                          const t = nodeText(children);
                          return <h4 id={idByText.get(t) || slugify(t)} {...props}>{children}</h4>;
                        },
                        a: ({node, children, ...props}: any) => (
                          <a {...props} target="_blank" rel="noopener noreferrer">{children}</a>
                        ),
                      }}
                    >
                      {activeContent}
                    </ReactMarkdown>
                  </article>
                )}

                {!loadingFile && activeContent && !isMarkdown && (
                  <pre className="bg-[var(--sidebar-bg)] border border-[var(--border)] rounded-xl p-5 overflow-x-auto text-sm whitespace-pre-wrap">
                    {activeContent}
                  </pre>
                )}

                {!loadingFile && !activeContent && !fileError && (
                  <p className="text-[var(--text)]/60">Select a file from the list to read it.</p>
                )}
              </section>
            </div>
          </>
        ) : (
          /* ================= GAME FEATURES ================= */
          <>
            <section className="mb-8">
              <input
                value={featureSearch}
                onChange={e => setFeatureSearch(e.target.value)}
                placeholder="Search features, items, blocks and secret items…"
                className="w-full max-w-2xl px-4 py-3 rounded-xl bg-[var(--sidebar-bg)] border border-[var(--border)] text-[var(--text)] placeholder:text-[var(--text)]/40 focus:outline-none focus:border-[var(--primary)]"
              />
            </section>

            {/* All features */}
            <section className="mb-16">
              <h2 className="text-3xl font-bold mb-6">All Features</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredFeatures.map(f => (
                  <div key={f.name} className="p-5 bg-[var(--sidebar-bg)] border border-[var(--border)] rounded-xl">
                    <h3 className="font-bold mb-1">{f.name}</h3>
                    <p className="text-sm text-[var(--text)]/70">{f.desc}</p>
                  </div>
                ))}
              </div>
              {filteredFeatures.length === 0 && <p className="text-[var(--text)]/60">No features match that search.</p>}
            </section>

            {/* Items & uses */}
            <section className="mb-16">
              <h2 className="text-3xl font-bold mb-6">Items &amp; Uses</h2>
              <div className="overflow-x-auto border border-[var(--border)] rounded-xl">
                <table className="w-full text-sm">
                  <thead className="bg-[var(--sidebar-bg)]">
                    <tr>
                      <th className="text-left px-4 py-3 font-bold">Item</th>
                      <th className="text-left px-4 py-3 font-bold">Use</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map(row => (
                      <tr key={row.item} className="border-t border-[var(--border)]">
                        <td className="px-4 py-3 font-semibold align-top whitespace-nowrap">{row.item}</td>
                        <td className="px-4 py-3 text-[var(--text)]/70">{row.use}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredItems.length === 0 && <p className="text-[var(--text)]/60 mt-3">No items match that search.</p>}
            </section>

            {/* Secret items */}
            <section className="mb-16">
              <h2 className="text-3xl font-bold mb-2">Secret Items</h2>
              <p className="text-[var(--text)]/70 mb-6 max-w-3xl">
                These items and blocks have no survival drop and no crafting recipe. They only exist when a script places
                them with the Code API.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {SECRET_ITEMS.filter(s => {
                  const q = featureSearch.trim().toLowerCase();
                  if (!q) return true;
                  return (
                    s.name.toLowerCase().includes(q) ||
                    s.desc.toLowerCase().includes(q) ||
                    s.how.toLowerCase().includes(q)
                  );
                }).map(s => (
                  <div key={s.name} className="p-5 bg-[var(--sidebar-bg)] border border-[var(--border)] rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold px-2 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400">CODE ONLY</span>
                      <h3 className="font-bold">{s.name}</h3>
                    </div>
                    <p className="text-sm text-[var(--text)]/70 mb-2">{s.desc}</p>
                    <code className="block text-xs bg-[var(--code-bg)] border border-[var(--border)] rounded-lg px-3 py-2 overflow-x-auto">
                      {s.how}
                    </code>
                  </div>
                ))}
              </div>
            </section>

            {/* Blocks overview */}
            <section className="mb-16">
              <h2 className="text-3xl font-bold mb-6">Blocks Overview</h2>
              <div className="space-y-8">
                {blockMatches.map(g => (
                  <div key={g.group}>
                    <h3 className="text-lg font-bold mb-3 text-[var(--text)]/80">{g.group}</h3>
                    <div className="flex flex-wrap gap-2">
                      {g.names.map(n => (
                        <span
                          key={n}
                          className="px-3 py-1.5 rounded-lg text-sm bg-[var(--sidebar-bg)] border border-[var(--border)]"
                        >
                          {n}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
                {blockMatches.length === 0 && <p className="text-[var(--text)]/60">No blocks match that search.</p>}
              </div>
            </section>

            {/* Items overview */}
            <section className="mb-16">
              <h2 className="text-3xl font-bold mb-6">Items Overview</h2>
              <div className="space-y-8">
                {itemMatches.map(g => (
                  <div key={g.group}>
                    <h3 className="text-lg font-bold mb-3 text-[var(--text)]/80">{g.group}</h3>
                    <div className="flex flex-wrap gap-2">
                      {g.names.map(n => (
                        <span
                          key={n}
                          className="px-3 py-1.5 rounded-lg text-sm bg-[var(--sidebar-bg)] border border-[var(--border)]"
                        >
                          {n}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
                {itemMatches.length === 0 && <p className="text-[var(--text)]/60">No items match that search.</p>}
              </div>
            </section>

            <section className="flex flex-wrap items-center justify-center gap-4">
              <a
                href={FANDOM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 rounded-lg font-semibold bg-[var(--sidebar-bg)] border border-[var(--border)] hover:border-[var(--primary)] transition-colors"
              >
                Fandom Wiki
              </a>
              <a
                href={BLOXD_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 rounded-lg font-semibold bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] transition-colors"
              >
                Play Bloxd.io
              </a>
            </section>
          </>
        )}
      </main>

      <footer className="border-t border-[var(--border)] bg-[var(--sidebar-bg)] mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img src="/logo.svg" alt="Players Logo" className="w-6 h-6" />
              <span className="font-bold">Players</span>
            </div>
            <p className="text-sm text-[var(--text)]/60">
              Built by{' '}
              <a href="https://github.com/FallenNightA" target="_blank" rel="noopener noreferrer" className="text-[var(--primary)] hover:underline">FallenNightA</a>
              {' · '}Data from{' '}
              <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="text-[var(--primary)] hover:underline">Bloxdy/code-api</a>
            </p>
            <p className="text-sm text-[var(--text)]/60">
              Official account:{' '}
              <Link href="https://github.com/HidayatBelajar319" target="_blank" rel="noopener noreferrer" className="text-[var(--primary)] hover:underline">HidayatBelajar319</Link>
              {' is one of the official accounts made by '}
              <Link href="https://github.com/FallenNightA" target="_blank" rel="noopener noreferrer" className="text-[var(--primary)] hover:underline">FallenNightA</Link>
              {' (owner).'}
            </p>
            <a href="https://github.com/HidayatBelajar319/BloxdUtility-Documentation" target="_blank" rel="noopener noreferrer" className="text-[var(--text)]/60 hover:text-[var(--primary)] transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
              </svg>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
