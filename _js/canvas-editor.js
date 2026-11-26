// Live canvas sketches for posts: a canvas (2D or WebGL) running code the reader can edit in place.
// Markup comes from _includes/canvas.html. Build: `npm run build:editor` -> assets/js/canvas-editor.js
//
// Each sketch runs in its own iframe with a <canvas id="canvas">, like a CodePen pen, so code can use
// getContext('2d' | 'webgl' | 'webgl2') and keep its globals to itself. Re-running throws the iframe away,
// which also stops its animation loops and frees its GL context.
// Every non-JS file (shaders, data) is reachable from the code as files['name'] and as
// document.getElementById('name').textContent.

import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { keymap } from '@codemirror/view';
import { indentWithTab } from '@codemirror/commands';
import { HighlightStyle, StreamLanguage, syntaxHighlighting } from '@codemirror/language';
import { javascript } from '@codemirror/lang-javascript';
import { shader } from '@codemirror/legacy-modes/mode/clike';
import { html } from '@codemirror/legacy-modes/mode/xml';
import { css } from '@codemirror/legacy-modes/mode/css';
import { tags as t } from '@lezer/highlight';

const RUN_DELAY = 700;    // ms after the last keystroke before re-running
const SAVE_DELAY = 800;   // ms after the last keystroke before autosaving
const MAX_LOG = 200;
const MOUNT_MARGIN = '800px 0px';   // build the editor this close to the screen
const RUN_MARGIN = '200px 0px';     // run (or resume) the code this close; pause it beyond

const glsl = StreamLanguage.define(shader), htmlLang = StreamLanguage.define(html), cssLang = StreamLanguage.define(css);
const language = name =>
  /\.m?js$/.test(name) ? javascript() :
  /\.(glsl|vert|frag|vs|fs)$/.test(name) ? glsl :
  /\.html?$/.test(name) ? htmlLang :
  /\.css$/.test(name) ? cssLang : [];

const highlight = HighlightStyle.define([
  { tag: [t.keyword, t.controlKeyword, t.moduleKeyword, t.operatorKeyword], color: '#b5322b', fontWeight: '600' },
  { tag: [t.definitionKeyword, t.modifier], color: '#b5322b' },
  { tag: [t.string, t.special(t.string), t.regexp], color: '#4f7a28' },
  { tag: [t.number, t.bool, t.null, t.atom], color: '#a35f00' },
  { tag: [t.comment, t.lineComment, t.blockComment], color: '#8a8a8a', fontStyle: 'italic' },
  { tag: [t.function(t.variableName), t.function(t.propertyName)], color: '#1f5f99' },
  { tag: [t.definition(t.variableName), t.definition(t.propertyName)], color: '#313131', fontWeight: '600' },
  { tag: [t.typeName, t.className], color: '#7a3e9d' },
  { tag: t.propertyName, color: '#2f6f6a' },
  { tag: [t.processingInstruction, t.macroName], color: '#7a3e9d' },
  { tag: t.invalid, color: '#fff', backgroundColor: '#b5322b' },
]);

const theme = EditorView.theme({
  '&': { fontSize: '13px', backgroundColor: '#fbfaf9' },
  '&.cm-focused': { outline: 'none' },
  '.cm-scroller': { fontFamily: 'Menlo, Monaco, "Courier New", monospace', lineHeight: '1.55' },
  '.cm-content': { caretColor: '#b5322b' },
  '.cm-gutters': { backgroundColor: '#f3f1ef', color: '#a09a96', border: 'none' },
  '.cm-activeLine': { backgroundColor: 'rgba(202, 60, 53, .05)' },
  '.cm-activeLineGutter': { backgroundColor: 'rgba(202, 60, 53, .1)', color: '#b5322b' },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection': { backgroundColor: 'rgba(202, 60, 53, .18) !important' },
  '.cm-matchingBracket': { backgroundColor: 'rgba(202, 60, 53, .15)', outline: 'none' },
});

// --- the page inside the iframe -------------------------------------------------------------
// a JSON string that is safe inside <script>
const scriptJSON = v => JSON.stringify(v).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');

// runs before the sketch's code: forwards console + errors to the page, makes requestAnimationFrame pausable,
// and exposes the extra files
function prelude(key, files) {
  return `(() => {
const key = ${scriptJSON(key)};
window.files = ${scriptJSON(files)};
for (const [name, text] of Object.entries(files)) {
  const s = document.createElement('script');
  s.type = 'text/plain'; s.id = name; s.textContent = text;
  document.head.append(s);
}
const send = (level, text) => parent.postMessage({ sketch: key, level, text }, '*');
const fmt = v => {
  if (typeof v === 'string') return v;
  if (v instanceof Error) return v.stack || String(v);
  try { return JSON.stringify(v) ?? String(v); } catch { return String(v); }
};
for (const level of ['log', 'info', 'warn', 'error']) {
  const orig = console[level].bind(console);
  console[level] = (...args) => { orig(...args); send(level, args.map(fmt).join(' ')); };
}
addEventListener('error', e => send('error', e.error ? fmt(e.error) : e.message + (e.lineno ? ' (' + e.filename + ':' + e.lineno + ')' : '')));
addEventListener('unhandledrejection', e => send('error', 'Uncaught (in promise) ' + fmt(e.reason)));

// requestAnimationFrame that can be paused; the time it reports skips the paused stretch
const raf = window.requestAnimationFrame.bind(window);
const held = new Map();
let next = 1, paused = false, pending = false, pausedAt = 0, pausedFor = 0;
const pump = () => {
  if (pending || paused || !held.size) return;
  pending = true;
  raf(now => {
    pending = false;
    if (paused) return;
    const cbs = [...held.values()];
    held.clear();
    for (const cb of cbs) try { cb(now - pausedFor); } catch (e) { send('error', fmt(e)); }
  });
};
window.requestAnimationFrame = cb => { const id = next++; held.set(id, cb); pump(); return id; };
window.cancelAnimationFrame = id => { held.delete(id); };
// timers hold still too: a timeout that fires while paused waits for the resume, an interval skips its ticks
const realTimeout = window.setTimeout.bind(window), realInterval = window.setInterval.bind(window);
const parked = [];
window.setTimeout = (fn, ms, ...args) => typeof fn !== 'function' ? realTimeout(fn, ms, ...args)
  : realTimeout(() => { if (paused) parked.push(() => fn(...args)); else fn(...args); }, ms);
window.setInterval = (fn, ms, ...args) => typeof fn !== 'function' ? realInterval(fn, ms, ...args)
  : realInterval(() => { if (!paused) fn(...args); }, ms);
addEventListener('message', e => {
  if (!e.data || e.data.sketch !== key || typeof e.data.pause !== 'boolean' || e.data.pause === paused) return;
  paused = e.data.pause;
  if (paused) { pausedAt = performance.now(); return; }
  pausedFor += performance.now() - pausedAt;
  for (const fn of parked.splice(0)) try { fn(); } catch (e) { send('error', fmt(e)); }
  pump();
});
})();`;
}

// code with top-level import/export runs as an ES module (strict mode, its own scope, can import from CDNs)
const isModule = code => /^\s*(import\s*[\w{*'"]|export\s)/m.test(code);

// a sketch can bring its own page: an .html file replaces the default <canvas id="canvas"> (it should still
// have one), and .css files are added as styles. Both are also editable tabs.
function documentFor(key, { width, height, pixelated }, entry, code, files) {
  const safe = s => s.replace(/<\/script/gi, '<\\/script');
  const page = Object.keys(files).find(n => /\.html?$/.test(n));
  const styles = Object.keys(files).filter(n => /\.css$/.test(n)).map(n => files[n]).join('\n').replace(/<\/style/gi, '<\\/style');
  const canvasStyle = page ? '' : `canvas{display:block;width:100%;height:100%${pixelated ? ';image-rendering:pixelated' : ''}}`;
  return `<!doctype html><html><head><meta charset="utf-8">
<style>html,body{margin:0;height:100%;overflow:hidden;background:transparent}${canvasStyle}</style>
<style>${styles}</style>
</head><body>${page ? files[page] : `<canvas id="canvas" width="${width}" height="${height}"></canvas>`}
<script>${safe(prelude(key, files))}</script>
<script${isModule(code) ? ' type="module"' : ''}>${safe(code)}
//# sourceURL=${entry}</script>
</body></html>`;
}

// --- one sketch ---------------------------------------------------------------------------------
function hashOf(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0).toString(36);
}

const el = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
};

function button(label, title, onClick) {
  const b = el('button', 'sketch-button', label);
  b.type = 'button';
  b.title = title;
  b.addEventListener('click', onClick);
  return b;
}

function storage() {
  try { const s = window.localStorage; s.getItem('x'); return s; } catch { return null; }
}

function mount(root) {
  const id = root.dataset.sketch;
  const key = location.pathname + '#' + id;
  const opts = {
    width: +root.dataset.width || 600,
    height: +root.dataset.height || 400,
    pixelated: root.hasAttribute('data-pixelated'),
  };
  const autorun = root.dataset.autorun !== 'false';

  const sources = [...root.querySelectorAll('.sketch-source')];
  const original = Object.fromEntries(sources.map(pre => [pre.dataset.file, pre.textContent.replace(/^\n+/, '').trimEnd() + '\n']));
  const hidden = new Set(sources.filter(pre => pre.hasAttribute('data-hidden')).map(pre => pre.dataset.file));
  const names = Object.keys(original).filter(n => !hidden.has(n));   // the files with an editor tab
  const entry = names.find(n => /\.m?js$/.test(n)) || names[0];
  const base = hashOf(JSON.stringify(original));

  // restore the reader's edits, unless the author has changed the sketch since
  const store = storage(), storeKey = 'sketch:' + key;
  let saved = null;
  try { saved = JSON.parse(store?.getItem(storeKey) || 'null'); } catch {}
  if (saved && saved.base !== base) { store?.removeItem(storeKey); saved = null; }
  const current = { ...original, ...(saved?.files || {}) };

  // --- layout
  const stage = root.querySelector('.sketch-stage');
  const bar = el('div', 'sketch-toolbar');
  const tabs = el('div', 'sketch-tabs');
  const actions = el('div', 'sketch-actions');
  const status = el('span', 'sketch-status');
  const editorBox = el('div', 'sketch-editor');
  const logBox = el('div', 'sketch-console');
  logBox.hidden = true;
  bar.append(tabs, status, actions);
  sources.forEach(pre => pre.remove());
  stage.after(logBox, bar, editorBox);
  root.classList.add('is-live');

  // --- editors, one per file, shown through tabs
  let active = entry;
  const views = {}, panes = {};
  let runTimer = 0, saveTimer = 0;

  const edited = () => names.some(n => views[n].state.doc.toString() !== original[n]);
  const contents = () => ({ ...original, ...Object.fromEntries(names.map(n => [n, views[n].state.doc.toString()])) });

  const flash = (text, ms = 1500) => {
    status.textContent = text;
    clearTimeout(flash.t);
    if (ms) flash.t = setTimeout(() => { status.textContent = ''; }, ms);
  };

  function save() {
    clearTimeout(saveTimer);
    if (!store) return;
    try {
      if (edited()) {
        const files = {};
        for (const n of names) if (views[n].state.doc.toString() !== original[n]) files[n] = views[n].state.doc.toString();
        store.setItem(storeKey, JSON.stringify({ base, files }));
        flash('salvo');
      } else store.removeItem(storeKey);
    } catch { flash('não foi possível salvar', 3000); }
    resetBtn.disabled = !edited();
  }

  const onChange = EditorView.updateListener.of(u => {
    if (!u.docChanged) return;
    resetBtn.disabled = !edited();
    clearTimeout(saveTimer);
    saveTimer = setTimeout(save, SAVE_DELAY);
    if (live) { clearTimeout(runTimer); runTimer = setTimeout(run, RUN_DELAY); }   // live editing once it has run
  });

  const keys = keymap.of([
    indentWithTab,
    { key: 'Mod-Enter', run: () => { run(); return true; } },
    { key: 'Mod-s', run: () => { save(); return true; } },
  ]);

  for (const name of names) {
    panes[name] = editorBox.appendChild(el('div', 'sketch-pane'));
    panes[name].hidden = name !== active;
    views[name] = new EditorView({
      parent: panes[name],
      state: EditorState.create({
        doc: current[name],
        extensions: [basicSetup, keys, theme, syntaxHighlighting(highlight), language(name), onChange],
      }),
    });
  }

  if (names.length > 1) {
    for (const name of names) {
      const tab = button(name, 'Abrir ' + name, () => {
        active = name;
        for (const n of names) panes[n].hidden = n !== name;
        tabs.querySelectorAll('.sketch-tab').forEach(b => b.classList.toggle('is-active', b === tab));
        views[name].requestMeasure();
      });
      tab.classList.add('sketch-tab');
      tab.classList.toggle('is-active', name === active);
      tabs.append(tab);
    }
  } else tabs.append(el('span', 'sketch-filename', entry));

  // --- running
  let frame = null, live = false, userPaused = false, visible = false, wanted = autorun;

  const log = (level, text) => {
    logBox.hidden = false;
    const line = el('div', 'sketch-log sketch-log-' + level, text);
    logBox.append(line);
    while (logBox.childElementCount > MAX_LOG) logBox.firstChild.remove();
    logBox.scrollTop = logBox.scrollHeight;
  };

  const syncPause = () => frame?.contentWindow?.postMessage({ sketch: key, pause: userPaused || !visible }, '*');

  // nothing runs until the sketch is near the screen; a run asked for before that waits for it
  function run() {
    clearTimeout(runTimer);
    if (!visible) { wanted = true; return; }
    wanted = false;
    live = true;
    logBox.replaceChildren();
    logBox.hidden = true;
    const files = contents();
    const extra = Object.fromEntries(Object.keys(files).filter(n => n !== entry).map(n => [n, files[n]]));
    const next = el('iframe', 'sketch-frame');
    next.title = 'Resultado: ' + id;
    next.addEventListener('load', syncPause);
    next.srcdoc = documentFor(key, opts, entry, files[entry], extra);
    if (frame) frame.replaceWith(next); else stage.replaceChildren(next);
    frame = next;
  }

  addEventListener('message', e => {
    if (frame && e.source === frame.contentWindow && e.data?.sketch === key && e.data.level) log(e.data.level, e.data.text);
  });

  // --- toolbar actions
  const runBtn = button('▶ Executar', 'Executar de novo (Ctrl/Cmd + Enter)', run);
  const pauseBtn = button('❚❚ Pausar', 'Pausar a animação', () => {
    userPaused = !userPaused;
    pauseBtn.textContent = userPaused ? '▶ Continuar' : '❚❚ Pausar';
    syncPause();
  });
  const copyBtn = button('Copiar', 'Copiar o código desta aba', async () => {
    const text = views[active].state.doc.toString();
    try { await navigator.clipboard.writeText(text); }
    catch {
      const ta = el('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;opacity:0';
      document.body.append(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    flash('copiado!');
  });
  const resetBtn = button('Restaurar', 'Voltar ao código original', () => {
    for (const n of names) views[n].dispatch({ changes: { from: 0, to: views[n].state.doc.length, insert: original[n] } });
    save();
    run();
    flash('código original restaurado');
  });
  resetBtn.disabled = !edited();
  actions.append(runBtn, pauseBtn, copyBtn, resetBtn);

  // start sketches as they come near the screen, and pause them (animation frames and timers) once they leave
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible && wanted) run();
    else syncPause();
  }, { rootMargin: RUN_MARGIN }).observe(stage);

  if (!autorun) {
    const start = button('▶ Executar', 'Executar o código', run);
    start.classList.add('sketch-start');
    stage.replaceChildren(start);
  }
}

// editors are built only when a sketch gets within MOUNT_MARGIN of the screen; until then it shows its code as text
const mounter = new IntersectionObserver(entries => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    mounter.unobserve(e.target);
    try { mount(e.target); } catch (err) { console.error('sketch', e.target.dataset.sketch, err); }
  }
}, { rootMargin: MOUNT_MARGIN });
document.querySelectorAll('.sketch:not(.is-live)').forEach(root => mounter.observe(root));
