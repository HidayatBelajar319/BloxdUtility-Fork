'use client';

/**
 * Shared, zero-config AI provider module for Bloxd.
 *
 * Provider priority order (used by the default "auto" selection):
 *   1. Puter.js      — genuinely no key, CORS-free, cost absorbed by the end user's
 *                      free Puter account. This is the default zero-config path.
 *   2. BYOK keys     — OpenRouter (`openrouter/free`) then Groq. Keys are pasted by the
 *                      user into Settings, stored in localStorage only, and read from
 *                      localStorage at call time. They are never committed or uploaded.
 *   3. Pollinations  — ONLY reachable when the user supplied a real `pk_` / `sk_` key.
 *
 * Anonymous Pollinations text access is intentionally NOT supported: the shared free
 * budget is exhausted (HTTP 200 responses carrying ENOSPC / budget error strings and
 * stale cached answers). Every Pollinations response is body-sniffed so those payloads
 * are treated as errors and never as model output.
 */

export type FreeAiRole = 'system' | 'user' | 'assistant';

export interface FreeAiMessage {
  role: FreeAiRole;
  content: string;
}

export type ProviderId =
  | 'auto'
  | 'puter'
  | 'server'
  | 'openrouter'
  | 'groq'
  | 'pollinations';

export type ConcreteProvider = 'puter' | 'openrouter' | 'groq' | 'pollinations';

export const PUTER_SCRIPT_SRC = 'https://js.puter.com/v2/';

/** Suggested Puter models. The first entry is the default. */
export const PUTER_MODELS = ['gpt-5.6-luna', 'z-ai/glm-5.3'] as const;
export const DEFAULT_PUTER_MODEL: string = PUTER_MODELS[0];

export const OPENROUTER_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';
export const OPENROUTER_MODEL = 'openrouter/free';

export const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
export const GROQ_MODEL = 'llama-3.3-70b-versatile';

export const POLLINATIONS_ENDPOINT = 'https://gen.pollinations.ai/v1/chat/completions';
export const POLLINATIONS_CODE_MODEL = 'openai/gpt-5.3-codex';
export const POLLINATIONS_CHAT_MODEL = 'openai/gpt-4o-mini';

/** First-token budget applied to every provider. */
export const FIRST_TOKEN_TIMEOUT_MS = 30_000;

/** Safety net for streams that never emit an explicit end/done event. */
const PUTOVER_WATCHDOG_MS = 120_000;

/** Bloxd.io scripting assistant persona. Every free-provider call is prefixed with this. */
export const BloxdSystemPrompt = `You are the Bloxd.io scripting assistant inside Bloxd Utility — a code assistant that writes, explains and debugs Bloxd.io scripts.

Output rules (mandatory):
- Always return runnable code inside a fenced code block, tagged with its language (for example \`\`\`javascript or \`\`\`python). No untagged code, ever.
- Ship complete, working code. Never leave placeholder stubs or "TODO" markers in place of real logic.
- Keep prose outside the fenced block and short: what the code does and how to use it.
- If a Bloxd.io API signature is uncertain, say so explicitly instead of inventing one.`;

/** Client-side file capability block; mirrors the server-side block in /api/chat. */
export const FreeAiFileOpsInstruction = `\n\n[SYSTEM CAPABILITY - FILE MANIPULATION]:
You may create, update, rename and delete files in the user's workspace. Use these exact XML commands and nothing else:
1. Create or update a file:
<command type="create_file" name="filepath">file contents</command>
2. Rename a file:
<command type="rename_file" name="old_filepath" new_name="new_filepath"></command>
3. Delete a file:
<command type="delete_file" name="filepath"></command>

Example — if the user asks to "delete target.js as it is raw trash", answer:
I have deleted target.js for you!
<command type="delete_file" name="target.js"></command>

Always emit these command structures for file operations so the workspace applies them immediately.`;

export const PROVIDER_LABELS: Record<ProviderId, string> = {
  auto: 'Auto (Free — Puter, then your key, then Pollinations)',
  puter: 'Puter.js — free, no key needed',
  server: 'CodeMind server keys (existing /api/chat)',
  openrouter: 'OpenRouter — my own free key',
  groq: 'Groq — my own free key',
  pollinations: 'Pollinations — my own key',
};

/* -------------------------------------------------------------------------- */
/* Errors                                                                      */
/* -------------------------------------------------------------------------- */

export type ProviderErrorKind =
  | 'popup-blocked'
  | 'missing-key'
  | 'http'
  | 'body'
  | 'timeout'
  | 'empty'
  | 'aborted';

export class ProviderError extends Error {
  provider: string;
  kind: ProviderErrorKind;
  userMessage: string;
  hint?: string;

  constructor(
    provider: string,
    kind: ProviderErrorKind,
    userMessage: string,
    hint?: string,
  ) {
    super(userMessage);
    this.name = 'ProviderError';
    this.provider = provider;
    this.kind = kind;
    this.userMessage = userMessage;
    this.hint = hint;
  }
}

export function isProviderError(err: unknown): err is ProviderError {
  return err instanceof ProviderError;
}

/* -------------------------------------------------------------------------- */
/* BYOK key storage — localStorage only, read at call time, never committed      */
/* -------------------------------------------------------------------------- */

const KEY_STORAGE_KEY = 'bloxd.free-ai.keys.v1';

export interface FreeAiKeys {
  openrouter: string;
  groq: string;
  pollinations: string;
}

const EMPTY_KEYS: FreeAiKeys = { openrouter: '', groq: '', pollinations: '' };

/** Reads BYOK keys straight out of localStorage on every call. */
export function getFreeAiKeys(): FreeAiKeys {
  if (typeof window === 'undefined') return { ...EMPTY_KEYS };
  try {
    const raw = window.localStorage.getItem(KEY_STORAGE_KEY);
    if (!raw) return { ...EMPTY_KEYS };
    const parsed = JSON.parse(raw);
    return {
      openrouter: typeof parsed?.openrouter === 'string' ? parsed.openrouter.trim() : '',
      groq: typeof parsed?.groq === 'string' ? parsed.groq.trim() : '',
      pollinations:
        typeof parsed?.pollinations === 'string' ? parsed.pollinations.trim() : '',
    };
  } catch {
    return { ...EMPTY_KEYS };
  }
}

/** Persists BYOK keys in this browser only. Returns the merged result. */
export function saveFreeAiKeys(patch: Partial<FreeAiKeys>): FreeAiKeys {
  if (typeof window === 'undefined') return { ...EMPTY_KEYS };
  const next: FreeAiKeys = { ...getFreeAiKeys(), ...patch };
  (Object.keys(next) as (keyof FreeAiKeys)[]).forEach((k) => {
    next[k] = (next[k] || '').trim();
  });
  try {
    window.localStorage.setItem(KEY_STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* storage blocked or full — keys stay in memory for this session only */
  }
  return next;
}

export function clearFreeAiKeys(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(KEY_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/** Pollinations is only usable behind a real, user-supplied key. */
export function isPollinationsKey(key: string | undefined | null): boolean {
  return typeof key === 'string' && /^(pk_|sk_)/.test(key.trim());
}

export function hasByokKey(provider: ConcreteProvider, keys: FreeAiKeys): boolean {
  if (provider === 'puter') return true;
  if (provider === 'pollinations') return isPollinationsKey(keys.pollinations);
  return Boolean(keys[provider]);
}

export function missingKeyMessage(provider: ConcreteProvider): string {
  if (provider === 'pollinations') {
    return 'Pollinations needs your own key, starting with "pk_" or "sk_". Paste it in Settings.';
  }
  return `No ${provider} key saved. Paste your own free key in Settings.`;
}

/* -------------------------------------------------------------------------- */
/* Provider chain                                                              */
/* -------------------------------------------------------------------------- */

export interface ProviderAttempt {
  provider: ConcreteProvider;
  label: string;
}

/**
 * Resolves the ordered providers to try.
 * `auto` → Puter.js first, then any BYOK key, then Pollinations (key-gated).
 */
export function resolveProviderChain(
  provider: ProviderId,
  keys: FreeAiKeys,
): ProviderAttempt[] {
  if (provider === 'server') return [];
  if (provider !== 'auto') {
    return [
      { provider: provider as ConcreteProvider, label: PROVIDER_LABELS[provider] },
    ];
  }

  const chain: ProviderAttempt[] = [{ provider: 'puter', label: PROVIDER_LABELS.puter }];
  if (keys.openrouter) {
    chain.push({ provider: 'openrouter', label: PROVIDER_LABELS.openrouter });
  }
  if (keys.groq) {
    chain.push({ provider: 'groq', label: PROVIDER_LABELS.groq });
  }
  if (isPollinationsKey(keys.pollinations)) {
    chain.push({ provider: 'pollinations', label: PROVIDER_LABELS.pollinations });
  }
  return chain;
}

/* -------------------------------------------------------------------------- */
/* Response validation — an error payload is never model output                 */
/* -------------------------------------------------------------------------- */

/** Stale cached anonymous-Pollinations payload fingerprint. */
export const STALE_PAYLOAD_MARKER = 'chatcmpl-830a5120750463f9';

const FENCE_PROBE_RE = /```/;

const BUDGET_ERROR_PATTERNS: RegExp[] = [
  /enospc/i,
  /no\s*space\s*left/i,
  /out\s*of\s*(budget|credit|quota|funds)/i,
  /budget\s*(exhausted|exceeded|depleted|reached|used\s*up|error)/i,
  /shared\s*(budget|pool|quota)\s*(is\s*)?(exhausted|depleted|empty)/i,
  /insufficient[_\s-]*(quota|credit|balance|funds)/i,
  /quota\s*(exhausted|exceeded|reached)/i,
  /rate[_\s-]*limit(ed)?\b/i,
  /payment\s+required/i,
  /too\s+many\s+requests/i,
  /exceeded\s+your\s+current\s+quota/i,
];

const ERROR_ENVELOPE_PATTERNS: RegExp[] = [
  /^\s*\{\s*"?error"?\s*:/i,
  /^\s*\{\s*"?message"?\s*:\s*"(?:error|failed)/i,
  /^\s*\{\s*"object"\s*:\s*"error"/i,
  /^\s*Error:\s/i,
];

/** Unambiguous service-failure signals: never model output, no exceptions. */
const HARD_ERROR_PATTERNS: RegExp[] = [
  /enospc/i,
  /no\s*space\s*left/i,
  /\b500\s+internal\s+server\s+error\b/i,
];

/**
 * True when a payload is a budget/quota failure rather than an answer.
 *
 * `isCodeBlock` is used when sniffing a fenced block: a block that is nothing but a
 * budget error is never real code, so the softer patterns apply unconditionally.
 * For a whole model response the softer patterns only apply when the response has no
 * fenced code block and is short — that keeps a legitimate answer *about* rate
 * limiting from being thrown away.
 */
export function looksLikeProviderError(
  text: string | null | undefined,
  opts: { isCodeBlock?: boolean } = {},
): boolean {
  if (!text) return false;
  if (text.includes(STALE_PAYLOAD_MARKER)) return true;

  const trimmed = text.trim();
  if (!trimmed) return false;

  for (const re of HARD_ERROR_PATTERNS) {
    if (re.test(trimmed)) return true;
  }

  let budgetHit = false;
  for (const re of BUDGET_ERROR_PATTERNS) {
    if (re.test(trimmed)) {
      budgetHit = true;
      break;
    }
  }

  if (budgetHit) {
    if (opts.isCodeBlock) return true;
    if (trimmed.length > 1200) return false;
    if (FENCE_PROBE_RE.test(trimmed)) return false;
    return true;
  }

  // Only treat a bare envelope as an error when the whole answer *is* the envelope.
  if (trimmed.length < 600) {
    for (const re of ERROR_ENVELOPE_PATTERNS) {
      if (re.test(trimmed)) return true;
    }
  }
  return false;
}

export interface ValidatedOutput {
  ok: boolean;
  text: string;
  error?: string;
}

/**
 * Final gate before any text reaches the chat UI or the editor.
 * Rejects empty answers and every budget / ENOSPC / stale-cached payload shape.
 */
export function validateModelOutput(
  raw: string | null | undefined,
  providerLabel: string,
): ValidatedOutput {
  const text = (raw || '').trim();
  if (!text) {
    return { ok: false, text: '', error: `${providerLabel} returned an empty response.` };
  }
  if (looksLikeProviderError(text)) {
    return {
      ok: false,
      text: '',
      error:
        `${providerLabel} returned a service error instead of an answer ` +
        '(shared budget exhausted / ENOSPC / stale cached response). Nothing was applied — ' +
        'add your own free key in Settings, or try again later.',
    };
  }
  return { ok: true, text };
}

/* -------------------------------------------------------------------------- */
/* Fenced code extraction                                                       */
/* -------------------------------------------------------------------------- */

export interface ExtractedCode {
  code: string;
  lang: string;
}

const FENCE_RE = /```([A-Za-z0-9_+#.-]*)[ \t]*\r?\n([\s\S]*?)```/g;

const LANGUAGE_ALIASES: Record<string, string> = {
  js: 'javascript',
  jsx: 'javascript',
  mjs: 'javascript',
  cjs: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  py: 'python',
  sh: 'bash',
  shell: 'bash',
  zsh: 'bash',
  yml: 'yaml',
  md: 'markdown',
};

export function normalizeLanguage(lang: string | undefined | null): string {
  const key = (lang || '').trim().toLowerCase();
  if (!key) return '';
  return LANGUAGE_ALIASES[key] || key;
}

/**
 * Extracts a fenced code block from a model response. Returns the last block by
 * default (or the largest). Returns null when there is nothing safe to apply, so
 * error strings are never inserted into the editor as code.
 */
export function extractFencedCode(text: string, preferLargest = false): ExtractedCode | null {
  if (!text) return null;
  FENCE_RE.lastIndex = 0;
  const blocks: ExtractedCode[] = [];
  let match: RegExpExecArray | null;
  while ((match = FENCE_RE.exec(text)) !== null) {
    const code = (match[2] || '').trim();
    if (code.length < 3) continue;
    if (looksLikeProviderError(code, { isCodeBlock: true })) continue;
    blocks.push({ code, lang: normalizeLanguage(match[1]) });
  }
  if (blocks.length === 0) return null;
  if (preferLargest) {
    return blocks.reduce((best, b) => (b.code.length > best.code.length ? b : best), blocks[0]);
  }
  return blocks[blocks.length - 1];
}

/* -------------------------------------------------------------------------- */
/* Small async utilities                                                        */
/* -------------------------------------------------------------------------- */

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (err: Error) => void;
  settled: boolean;
}

function createDeferred<T>(): Deferred<T> {
  const d = {} as Deferred<T>;
  d.promise = new Promise<T>((resolve, reject) => {
    d.resolve = (value: T) => {
      if (d.settled) return;
      d.settled = true;
      resolve(value);
    };
    d.reject = (err: Error) => {
      if (d.settled) return;
      d.settled = true;
      reject(err);
    };
  });
  d.settled = false;
  return d;
}

const POPUP_HINT =
  'Puter signs you in through a popup window. If it never appeared, the browser blocked it — allow popups for this site and try again.';

function popupBlockedError(): ProviderError {
  return new ProviderError(
    'Puter.js',
    'popup-blocked',
    'Puter sign-in never completed — the popup was most likely blocked. Allow popups for this site and try again.',
    POPUP_HINT,
  );
}

function firstTokenTimeoutError(providerLabel: string): ProviderError {
  if (providerLabel === 'Puter.js') return popupBlockedError();
  return new ProviderError(
    providerLabel,
    'timeout',
    `${providerLabel} sent no output within ${Math.round(FIRST_TOKEN_TIMEOUT_MS / 1000)}s.`,
  );
}

function abortedError(providerLabel: string): ProviderError {
  return new ProviderError(providerLabel, 'aborted', 'Request cancelled.');
}

function normalizeError(err: unknown, providerLabel: string): ProviderError {
  if (isProviderError(err)) return err;
  const message = err instanceof Error ? err.message : String(err ?? '');
  if (/popup|sign.?in|not\s*logged|unauthorized|401|403/i.test(message)) {
    if (providerLabel === 'Puter.js') return popupBlockedError();
    return new ProviderError(providerLabel, 'http', message || `${providerLabel} request failed.`);
  }
  return new ProviderError(
    providerLabel,
    'http',
    message || `${providerLabel} request failed.`,
  );
}

/** Normalises the many shapes Puter / OpenAI-compatible endpoints return. */
function extractCompletionText(res: unknown): string {
  if (typeof res === 'string') return res;
  if (!res || typeof res !== 'object') return '';
  const r = res as Record<string, any>;
  const candidates = [
    r.text,
    r.message?.text,
    r.message?.content,
    r.choices?.[0]?.message?.content,
    r.choices?.[0]?.delta?.content,
    r.choices?.[0]?.text,
    r.content,
  ];
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim()) return c;
  }
  return '';
}

/* -------------------------------------------------------------------------- */
/* Puter.js — default zero-config provider                                     */
/* -------------------------------------------------------------------------- */

interface PuterLike {
  ai?: {
    chat: (
      messages: FreeAiMessage[] | string,
      options?: { model?: string; stream?: boolean },
    ) => Promise<unknown>;
  };
}

declare global {
  interface Window {
    puter?: PuterLike;
  }
}

let puterLoadPromise: Promise<PuterLike> | null = null;

/** Injects the Puter.js script tag once, lazily, with a hard load timeout. */
export function loadPuter(timeoutMs: number = FIRST_TOKEN_TIMEOUT_MS): Promise<PuterLike> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.reject(
      new ProviderError('Puter.js', 'http', 'Puter.js can only run in a browser.'),
    );
  }
  if (window.puter?.ai?.chat) return Promise.resolve(window.puter as PuterLike);
  if (puterLoadPromise) return puterLoadPromise;

  const failWith = (err: Error) => {
    puterLoadPromise = null;
    return err;
  };

  puterLoadPromise = new Promise<PuterLike>((resolve, reject) => {
    const timer = setTimeout(() => reject(failWith(popupBlockedError())), timeoutMs);

    const cleanup = () => clearTimeout(timer);

    const settle = () => {
      if (window.puter?.ai?.chat) {
        cleanup();
        resolve(window.puter as PuterLike);
      } else {
        cleanup();
        reject(
          failWith(
            new ProviderError(
              'Puter.js',
              'http',
              'Puter.js loaded but did not expose an AI API.',
              POPUP_HINT,
            ),
          ),
        );
      }
    };

    const failed = () => {
      cleanup();
      reject(
        failWith(
          new ProviderError(
            'Puter.js',
            'http',
            'Could not load the Puter.js script. Check your connection and try again.',
          ),
        ),
      );
    };

    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${PUTER_SCRIPT_SRC}"]`,
    );
    if (existing) {
      existing.addEventListener('load', settle);
      existing.addEventListener('error', failed);
      return;
    }

    const script = document.createElement('script');
    script.src = PUTER_SCRIPT_SRC;
    script.async = true;
    script.addEventListener('load', settle);
    script.addEventListener('error', failed);
    document.head.appendChild(script);
  });

  return puterLoadPromise;
}

/**
 * Streams one Puter.js completion, pushing deltas to `onDelta`.
 * Rejects with the popup message when no first token arrives within the budget.
 */
export async function puterChatStream(opts: {
  messages: FreeAiMessage[];
  model: string;
  onDelta?: (delta: string) => void;
  signal?: AbortSignal;
}): Promise<string> {
  const { messages, model, onDelta, signal } = opts;

  if (signal?.aborted) throw abortedError('Puter.js');

  const puter = await loadPuter();
  if (signal?.aborted) throw abortedError('Puter.js');

  const firstToken = createDeferred<string>();
  const done = createDeferred<string>();
  let lastCumulative = '';
  let emitted = '';
  let finished = false;
  let watchdog: ReturnType<typeof setTimeout> | null = null;

  const clearWatchdog = () => {
    if (watchdog) {
      clearTimeout(watchdog);
      watchdog = null;
    }
  };

  const finish = (fallback: string) => {
    if (finished) return;
    finished = true;
    clearWatchdog();
    done.resolve(fallback);
  };
  const abort = (err: Error) => {
    if (finished) return;
    finished = true;
    clearWatchdog();
    firstToken.reject(err);
    done.reject(err);
  };

  const push = (delta: string) => {
    if (finished || !delta) return;
    emitted += delta;
    if (!firstToken.settled) {
      firstToken.resolve(delta);
      // Safety net: a stream that never emits an explicit end/done must not hang forever.
      clearWatchdog();
      watchdog = setTimeout(() => finish(lastCumulative || emitted), PUTOVER_WATCHDOG_MS);
    }
    try {
      onDelta?.(delta);
    } catch {
      /* a consumer error must never kill the stream */
    }
  };

  const consume = (payload: any, isDone: boolean) => {
    if (finished) return;
    if (payload === undefined || payload === null) {
      if (isDone) finish(lastCumulative || emitted);
      return;
    }
    if (typeof payload === 'string') {
      push(payload);
      if (isDone) finish(lastCumulative || emitted);
      return;
    }
    if (typeof payload.error === 'string' || payload.error) {
      abort(normalizeError(payload.error, 'Puter.js'));
      return;
    }
    const explicitDelta = payload.delta;
    if (typeof explicitDelta === 'string' && explicitDelta) {
      push(explicitDelta);
    } else if (typeof payload.text === 'string') {
      if (payload.text.startsWith(lastCumulative)) {
        push(payload.text.slice(lastCumulative.length));
      } else if (payload.text) {
        push(payload.text);
      }
      lastCumulative = payload.text;
    }
    if (isDone) finish(lastCumulative || emitted);
  };

  const onAbort = () => abort(abortedError('Puter.js'));
  signal?.addEventListener('abort', onAbort, { once: true });

  (async () => {
    try {
      const res: any = await puter.ai!.chat(messages, { model, stream: true });

      if (res && typeof res.on === 'function') {
        res.on('change', (p: any) => consume(p, Boolean(p?.done)));
        res.on('data', (p: any) => consume(p, false));
        res.on('error', (e: any) => abort(normalizeError(e, 'Puter.js')));
        res.on('end', () => finish(lastCumulative || emitted));
        res.on('done', () => finish(lastCumulative || emitted));
        return;
      }

      if (res && typeof res[Symbol.asyncIterator] === 'function') {
        for await (const chunk of res as AsyncIterable<any>) {
          const piece =
            typeof chunk === 'string'
              ? chunk
              : chunk?.delta ?? chunk?.text ?? extractCompletionText(chunk);
          if (typeof piece === 'string' && piece) push(piece);
        }
        finish(lastCumulative || emitted);
        return;
      }

      let text = extractCompletionText(res);
      if (!text && res && typeof res.text === 'function') {
        text = await Promise.resolve(res.text());
      }
      if (text) push(text);
      finish(text || emitted);
    } catch (err) {
      abort(normalizeError(err, 'Puter.js'));
    }
  })();

  done.promise.catch(() => {
    /* surfaced via the awaited first-token gate below */
  });

  try {
    await withTimeout(firstToken.promise, FIRST_TOKEN_TIMEOUT_MS, () => popupBlockedError());
  } catch (err) {
    finish('');
    signal?.removeEventListener('abort', onAbort);
    throw isProviderError(err) ? err : firstTokenTimeoutError('Puter.js');
  }

  try {
    return await done.promise;
  } catch (err) {
    throw normalizeError(err, 'Puter.js');
  } finally {
    signal?.removeEventListener('abort', onAbort);
  }
}

function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  makeError: () => Error,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(makeError()), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

/* -------------------------------------------------------------------------- */
/* OpenAI-compatible SSE (OpenRouter / Groq)                                   */
/* -------------------------------------------------------------------------- */

async function sseChatCompletion(opts: {
  url: string;
  headers: Record<string, string>;
  body: Record<string, unknown>;
  providerLabel: string;
  onDelta?: (delta: string) => void;
  signal?: AbortSignal;
}): Promise<string> {
  const { url, headers, body, providerLabel, onDelta, signal } = opts;

  if (signal?.aborted) throw abortedError(providerLabel);

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new ProviderError(
      providerLabel,
      'http',
      `${providerLabel} request failed (HTTP ${response.status}). ${detail.slice(0, 180)}`.trim(),
    );
  }

  if (!response.body) {
    const json = await response.json().catch(() => null);
    return extractCompletionText(json);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const firstToken = createDeferred<string>();
  const done = createDeferred<string>();
  let buffer = '';
  let accumulated = '';
  let finished = false;

  const abort = (err: Error) => {
    if (finished) return;
    finished = true;
    firstToken.reject(err);
    done.reject(err);
  };
  const finish = () => {
    if (finished) return;
    finished = true;
    done.resolve(accumulated);
  };
  const onAbort = () => abort(abortedError(providerLabel));
  signal?.addEventListener('abort', onAbort, { once: true });

  const pump = (async () => {
    try {
      while (!finished) {
        const { value, done: reading } = await reader.read();
        if (reading) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const data = trimmed.slice(5).trim();
          if (!data || data === '[DONE]') continue;
          let parsed: any;
          try {
            parsed = JSON.parse(data);
          } catch {
            continue;
          }
          if (parsed?.error) {
            abort(
              new ProviderError(
                providerLabel,
                'body',
                `${providerLabel} stream error: ${String(
                  parsed.error?.message || JSON.stringify(parsed.error),
                ).slice(0, 180)}`,
              ),
            );
            return;
          }
          const delta = parsed?.choices?.[0]?.delta?.content;
          if (typeof delta === 'string' && delta) {
            if (!firstToken.settled) firstToken.resolve(delta);
            accumulated += delta;
            onDelta?.(delta);
          }
        }
      }
      finish();
    } catch (err) {
      if (signal?.aborted) {
        abort(abortedError(providerLabel));
        return;
      }
      abort(normalizeError(err, providerLabel));
    }
  })();
  pump.catch(() => {
    /* handled through the awaited gates */
  });

  done.promise.catch(() => {
    /* handled through the awaited first-token gate */
  });

  try {
    await withTimeout(firstToken.promise, FIRST_TOKEN_TIMEOUT_MS, () =>
      firstTokenTimeoutError(providerLabel),
    );
  } catch (err) {
    finish();
    signal?.removeEventListener('abort', onAbort);
    try {
      await reader.cancel();
    } catch {
      /* ignore */
    }
    throw isProviderError(err) ? err : firstTokenTimeoutError(providerLabel);
  }

  try {
    return await done.promise;
  } catch (err) {
    throw normalizeError(err, providerLabel);
  } finally {
    signal?.removeEventListener('abort', onAbort);
  }
}

/* -------------------------------------------------------------------------- */
/* Pollinations — key-gated, body-sniffed                                      */
/* -------------------------------------------------------------------------- */

/**
 * `safe` filtering is intentionally NOT requested: it mangles code output.
 * The body is fetched whole, sniffed, and only then surfaced.
 */
async function pollinationsChat(opts: {
  key: string;
  messages: FreeAiMessage[];
  model: string;
  task: 'code' | 'chat';
  signal?: AbortSignal;
}): Promise<string> {
  const { key, messages, model, task, signal } = opts;

  if (!isPollinationsKey(key)) {
    throw new ProviderError('Pollinations', 'missing-key', missingKeyMessage('pollinations'));
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${key}`,
    'api-key': key,
  };
  if (typeof window !== 'undefined' && window.location?.href) {
    headers.Referer = window.location.href;
  }

  const response = await fetch(POLLINATIONS_ENDPOINT, {
    method: 'POST',
    headers,
    // no `safe` field — code tasks must not be filtered
    body: JSON.stringify({ model, messages, stream: false }),
    signal,
  });

  const raw = await response.text();

  if (!response.ok) {
    throw new ProviderError(
      'Pollinations',
      'http',
      `Pollinations request failed (HTTP ${response.status}). ${raw.slice(0, 180)}`.trim(),
    );
  }

  let parsedText = '';
  try {
    const json = JSON.parse(raw);
    if (json?.error) {
      const message = typeof json.error === 'string' ? json.error : json.error?.message;
      throw new ProviderError(
        'Pollinations',
        'body',
        `Pollinations returned an error: ${String(message || '').slice(0, 180)}`,
      );
    }
    parsedText = extractCompletionText(json);
  } catch (err) {
    if (isProviderError(err)) throw err;
    parsedText = raw; // non-JSON body — sniff it as raw text
  }

  if (looksLikeProviderError(raw) || looksLikeProviderError(parsedText)) {
    throw new ProviderError(
      'Pollinations',
      'body',
      task === 'code'
        ? 'Pollinations shared budget is exhausted (HTTP 200 carrying an ENOSPC / budget error). No code was applied.'
        : 'Pollinations shared budget is exhausted (HTTP 200 carrying an ENOSPC / budget error).',
    );
  }

  return parsedText;
}

/* -------------------------------------------------------------------------- */
/* Public entry point                                                          */
/* -------------------------------------------------------------------------- */

export interface FreeAiRequest {
  messages: FreeAiMessage[];
  provider: ProviderId;
  task?: 'code' | 'chat';
  /** When true, deltas are pushed through `onDelta` as they arrive. */
  stream?: boolean;
  puterModel?: string;
  /** Receives text deltas live when `stream` is true. */
  onDelta?: (delta: string) => void;
  onProvider?: (info: { provider: string; label: string; model: string }) => void;
  onProviderError?: (info: { provider: string; label: string; message: string }) => void;
  signal?: AbortSignal;
}

export interface FreeAiResult {
  text: string;
  provider: ConcreteProvider;
  model: string;
}

export function modelForProvider(
  provider: ConcreteProvider,
  opts: { puterModel?: string; task?: 'code' | 'chat' },
): string {
  if (provider === 'puter') return opts.puterModel || DEFAULT_PUTER_MODEL;
  if (provider === 'openrouter') return OPENROUTER_MODEL;
  if (provider === 'groq') return GROQ_MODEL;
  return opts.task === 'code' ? POLLINATIONS_CODE_MODEL : POLLINATIONS_CHAT_MODEL;
}

function usableMessages(messages: FreeAiMessage[]): FreeAiMessage[] {
  return messages.filter(
    (m) => m && typeof m.content === 'string' && m.content.trim() !== '',
  );
}

/**
 * Runs `messages` down the provider chain, falling back on failure, and always
 * validating the output before handing it back to the caller.
 */
export async function requestFreeAi(req: FreeAiRequest): Promise<FreeAiResult> {
  const {
    messages,
    provider,
    task = 'code',
    stream = false,
    puterModel = DEFAULT_PUTER_MODEL,
    onDelta,
    onProvider,
    onProviderError,
    signal,
  } = req;

  const clean = usableMessages(messages);
  if (clean.length === 0) {
    throw new ProviderError('AI', 'empty', 'There is nothing to send to the AI.');
  }

  const keys = getFreeAiKeys();
  const chain = resolveProviderChain(provider, keys);
  if (chain.length === 0) {
    throw new ProviderError('AI', 'missing-key', 'No AI provider is selected.');
  }

  const failures: { label: string; message: string }[] = [];

  for (const attempt of chain) {
    if (signal?.aborted) throw abortedError(attempt.label);

    const model = modelForProvider(attempt.provider, { puterModel, task });
    const displayName =
      attempt.provider === 'puter' ? 'Puter.js' : providerDisplayName(attempt.provider);

    try {
      if (attempt.provider !== 'pollinations' && !hasByokKey(attempt.provider, keys)) {
        throw new ProviderError(
          displayName,
          'missing-key',
          missingKeyMessage(attempt.provider),
        );
      }

      let text: string;

      if (attempt.provider === 'puter') {
        onProvider?.({ provider: displayName, label: attempt.label, model });
        text = await puterChatStream({
          messages: clean,
          model,
          onDelta: stream ? onDelta : undefined,
          signal,
        });
      } else if (attempt.provider === 'openrouter') {
        onProvider?.({ provider: displayName, label: attempt.label, model });
        text = await sseChatCompletion({
          url: OPENROUTER_ENDPOINT,
          headers: {
            Authorization: `Bearer ${keys.openrouter}`,
            'HTTP-Referer':
              typeof window !== 'undefined' ? window.location.origin : 'https://bloxd.io',
            'X-Title': 'Bloxd Utility',
          },
          body: { model, messages: clean, stream: true },
          providerLabel: displayName,
          onDelta: stream ? onDelta : undefined,
          signal,
        });
      } else if (attempt.provider === 'groq') {
        onProvider?.({ provider: displayName, label: attempt.label, model });
        text = await sseChatCompletion({
          url: GROQ_ENDPOINT,
          headers: { Authorization: `Bearer ${keys.groq}` },
          body: { model, messages: clean, stream: true, max_tokens: 4096 },
          providerLabel: displayName,
          onDelta: stream ? onDelta : undefined,
          signal,
        });
      } else {
        onProvider?.({ provider: displayName, label: attempt.label, model });
        text = await pollinationsChat({
          key: keys.pollinations,
          messages: clean,
          model,
          task,
          signal,
        });
        if (stream && text) onDelta?.(text);
      }

      const validated = validateModelOutput(text, displayName);
      if (!validated.ok) {
        throw new ProviderError(
          attempt.provider,
          'body',
          validated.error || `${displayName} returned an unusable response.`,
        );
      }

      return { text: validated.text, provider: attempt.provider, model };
    } catch (err: any) {
      if (err?.kind === 'aborted' || signal?.aborted) throw abortedError(attempt.label);
      const message = isProviderError(err) ? err.userMessage : String(err?.message || err);
      failures.push({ label: displayName, message });
      onProviderError?.({ provider: attempt.provider, label: displayName, message });
    }
  }

  const detail = failures.map((f) => `• ${f.label}: ${f.message}`).join('\n');
  throw new ProviderError(
    'AI',
    'http',
    chain.length > 1 ? `All AI providers failed.\n${detail}` : detail || 'The AI provider failed.',
    chain.length > 1 ? 'Add your own free key in Settings for a reliable fallback.' : undefined,
  );
}

function providerDisplayName(provider: ConcreteProvider): string {
  switch (provider) {
    case 'puter':
      return 'Puter.js';
    case 'openrouter':
      return 'OpenRouter';
    case 'groq':
      return 'Groq';
    default:
      return 'Pollinations';
  }
}
