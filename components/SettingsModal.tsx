'use client';

import { X, Eye, EyeOff } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useEffect, useState } from 'react';
import {
  PROVIDER_LABELS,
  PUTER_MODELS,
  clearFreeAiKeys,
  getFreeAiKeys,
  isPollinationsKey,
  resolveProviderChain,
  saveFreeAiKeys,
  type ProviderId,
} from '@/lib/free-ai';

const PROVIDER_ORDER: ProviderId[] = ['auto', 'puter', 'openrouter', 'groq', 'pollinations', 'server'];

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const {
    openAIApiKey, setOpenAIApiKey, geminiApiKey, setGeminiApiKey,
    editorFontSize, setEditorFontSize,
    freeAiProvider, setFreeAiProvider, freeAiPuterModel, setFreeAiPuterModel,
  } = useAppStore();
  const [showOpenAI, setShowOpenAI] = useState(false);
  const [showGemini, setShowGemini] = useState(false);
  const [showByok, setShowByok] = useState(false);
  const [byokKeys, setByokKeys] = useState(() => getFreeAiKeys());

  useEffect(() => {
    setByokKeys(getFreeAiKeys());
  }, []);

  const updateByok = (field: 'openrouter' | 'groq' | 'pollinations', value: string) => {
    setByokKeys(saveFreeAiKeys({ [field]: value }));
  };

  const chain = resolveProviderChain(freeAiProvider, byokKeys).map(a => a.provider).join(' \u2192 ');

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flexItems-center justify-center p-4">
      <div className="bg-[var(--surface)] w-full max-w-md rounded-xl border border-[var(--border)] shadow-xl overflow-hidden mt-20 mx-auto">
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <h2 className="text-lg font-semibold">Settings</h2>
          <button onClick={onClose} className="p-1 hover:bg-[var(--background)] rounded-md">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-[var(--text-muted)] uppercase tracking-wider">Free AI — No Config Required</h3>

            <div className="space-y-2">
              <label className="text-sm font-medium">Provider</label>
              <select
                value={freeAiProvider}
                onChange={(e) => setFreeAiProvider(e.target.value as ProviderId)}
                className="w-full bg-[var(--background)] border border-[var(--border)] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
              >
                {PROVIDER_ORDER.map(id => (
                  <option key={id} value={id}>{PROVIDER_LABELS[id]}</option>
                ))}
              </select>
              {chain && (
                <p className="text-xs text-[var(--text-muted)]">Fallback order: {chain}</p>
              )}
            </div>

            {freeAiProvider === 'puter' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Puter.js Model</label>
                <select
                  value={freeAiPuterModel}
                  onChange={(e) => setFreeAiPuterModel(e.target.value)}
                  className="w-full bg-[var(--background)] border border-[var(--border)] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                >
                  {PUTER_MODELS.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            )}

            <p className="text-xs text-[var(--text-muted)]">
              Puter.js needs no key and no CORS setup. The first request may open a sign-in
              popup — allow popups for this site if it does not appear.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium text-sm text-[var(--text-muted)] uppercase tracking-wider">
              Bring Your Own Free Key <span className="normal-case tracking-normal">(optional)</span>
            </h3>

            <div className="space-y-2">
              <label className="text-sm font-medium">OpenRouter API Key</label>
              <div className="relative">
                <input
                  type={showByok ? 'text' : 'password'}
                  value={byokKeys.openrouter}
                  onChange={(e) => updateByok('openrouter', e.target.value)}
                  placeholder="sk-or-..."
                  autoComplete="off"
                  className="w-full bg-[var(--background)] border border-[var(--border)] rounded-md px-3 py-2 text-sm pr-10 focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                />
                <button
                  onClick={() => setShowByok(!showByok)}
                  className="absolute right-2 top-2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  {showByok ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Groq API Key</label>
              <input
                type={showByok ? 'text' : 'password'}
                value={byokKeys.groq}
                onChange={(e) => updateByok('groq', e.target.value)}
                placeholder="gsk_..."
                autoComplete="off"
                className="w-full bg-[var(--background)] border border-[var(--border)] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Pollinations API Key</label>
              <input
                type={showByok ? 'text' : 'password'}
                value={byokKeys.pollinations}
                onChange={(e) => updateByok('pollinations', e.target.value)}
                placeholder="pk_... or sk_..."
                autoComplete="off"
                className="w-full bg-[var(--background)] border border-[var(--border)] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
              />
              {byokKeys.pollinations && !isPollinationsKey(byokKeys.pollinations) && (
                <p className="text-xs text-amber-500">
                  Pollinations keys must start with pk_ or sk_.
                </p>
              )}
            </div>

            <p className="text-xs text-[var(--text-muted)]">
              Keys are stored in this browser only (localStorage), read at call time, and sent
              straight to the provider. They are never uploaded to our servers or committed.
            </p>

            <button
              onClick={() => {
                clearFreeAiKeys();
                setByokKeys({ openrouter: '', groq: '', pollinations: '' });
              }}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] underline"
            >
              Clear saved keys
            </button>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium text-sm text-[var(--text-muted)] uppercase tracking-wider">API Keys</h3>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">OpenAI API Key</label>
              <div className="relative">
                <input
                  type={showOpenAI ? 'text' : 'password'}
                  value={openAIApiKey}
                  onChange={(e) => setOpenAIApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full bg-[var(--background)] border border-[var(--border)] rounded-md px-3 py-2 text-sm pr-10 focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                />
                <button 
                  onClick={() => setShowOpenAI(!showOpenAI)}
                  className="absolute right-2 top-2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  {showOpenAI ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Google Gemini API Key</label>
              <div className="relative">
                <input
                  type={showGemini ? 'text' : 'password'}
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  placeholder="AIza..."
                  className="w-full bg-[var(--background)] border border-[var(--border)] rounded-md px-3 py-2 text-sm pr-10 focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                />
                <button 
                  onClick={() => setShowGemini(!showGemini)}
                  className="absolute right-2 top-2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  {showGemini ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
             <h3 className="font-medium text-sm text-[var(--text-muted)] uppercase tracking-wider">Editor</h3>
             <div className="space-y-2">
              <label className="text-sm font-medium">Font Size ({editorFontSize}px)</label>
              <input 
                type="range" 
                min="10" max="24" 
                value={editorFontSize}
                onChange={(e) => setEditorFontSize(parseInt(e.target.value))}
                className="w-full"
              />
             </div>
          </div>
        </div>

        <div className="p-4 border-t border-[var(--border)] bg-[var(--background)] flex justify-end">
          <button 
            onClick={onClose}
            className="bg-[var(--primary)] text-white px-4 py-2 rounded-md font-medium text-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
