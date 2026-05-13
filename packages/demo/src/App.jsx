import { useEffect, useRef, useState } from 'react';
import { JsonViewer, NativeTableAdapter, exportConfig, importConfig, preAnalyze, themes } from 'json-dynamic-viewer';
import { createTabulatorAdapter } from 'json-dynamic-viewer/adapters/tabulator';
import simpleTheme   from 'json-dynamic-viewer/adapters/tabulator/themes/simple';
import midnightTheme from 'json-dynamic-viewer/adapters/tabulator/themes/midnight';
import modernTheme   from 'json-dynamic-viewer/adapters/tabulator/themes/modern';
import siteTheme     from 'json-dynamic-viewer/adapters/tabulator/themes/site';
import siteDarkTheme from 'json-dynamic-viewer/adapters/tabulator/themes/site-dark';
import { createGridJsAdapter } from 'json-dynamic-viewer/adapters/gridjs';
import mermaidTheme  from 'json-dynamic-viewer/adapters/gridjs/themes/mermaid';
import { sampleJson } from './sampleData.js';

const tabulatorAdapter = createTabulatorAdapter({
  themes: [simpleTheme, midnightTheme, modernTheme, siteTheme, siteDarkTheme],
});

const gridJsAdapter = createGridJsAdapter({ themes: [mermaidTheme] });

const TABLE_ADAPTERS = {
  tabulator: tabulatorAdapter,
  gridjs:    gridJsAdapter,
  native:    NativeTableAdapter,
};

const ADAPTER_LABELS = {
  tabulator: 'Tabulator',
  gridjs:    'Grid.js',
  native:    'Native HTML',
};

const PRESET_LABELS = {
  default: '☀ Default',
  dark:    '🌙 Dark',
  ocean:   '🌊 Ocean',
};

const CUSTOM_VARS = [
  { label: 'Text',    key: '--jdv-color-text' },
  { label: 'String',  key: '--jdv-color-string' },
  { label: 'Number',  key: '--jdv-color-number' },
  { label: 'Label',   key: '--jdv-color-text-label' },
  { label: 'Accent',  key: '--jdv-color-accent' },
  { label: 'BG',      key: '--jdv-color-bg' },
  { label: 'Border',  key: '--jdv-color-border' },
];

export default function App() {
  const [jsonInput, setJsonInput]     = useState(sampleJson);
  const [activeJson, setActiveJson]   = useState(sampleJson);
  const [config, setConfig]           = useState(null);
  const [parseError, setParseError]   = useState(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [configurable, setConfigurable] = useState(true);

  // Table adapter state
  const [tableAdapterKey, setTableAdapterKey] = useState('tabulator');

  // Theme state
  const [preset, setPreset]           = useState('default');
  const [customVars, setCustomVars]   = useState({});
  const [showThemeEditor, setShowThemeEditor] = useState(false);

  // Custom CSS editor
  const [showCssEditor, setShowCssEditor] = useState(false);
  const [customCss, setCustomCss] = useState(
`/* Target a specific key by its generated class */
.jdv-key--company__revenue .jdv-field-label {
  color: #0a7;
  font-weight: bold;
}

/* Target by data attribute */
[data-jdv-path="company.headquarters"] .jdv-field-label {
  color: #07a;
}

/* Highlight an entire field row */
.jdv-key--company__active {
  background: #fffbe6;
  border-radius: 4px;
  padding: 2px 4px;
}`
  );
  const cssStyleRef = useRef(null);

  useEffect(() => {
    if (!cssStyleRef.current) {
      cssStyleRef.current = document.createElement('style');
      cssStyleRef.current.id = 'jdv-demo-custom-css';
      document.head.appendChild(cssStyleRef.current);
    }
    cssStyleRef.current.textContent = customCss;
    return () => cssStyleRef.current?.remove();
  }, [customCss]);

  // Resizable split pane
  const [leftPct, setLeftPct] = useState(50);
  const containerRef = useRef(null);
  const dragging     = useRef(false);

  function onDividerMouseDown(e) {
    e.preventDefault();
    dragging.current = true;

    function onMouseMove(ev) {
      if (!dragging.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pct  = ((ev.clientX - rect.left) / rect.width) * 100;
      setLeftPct(Math.max(20, Math.min(80, pct)));
    }

    function onMouseUp() {
      dragging.current = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  const theme = { ...themes[preset], ...customVars };

  function applyJson() {
    try {
      JSON.parse(jsonInput);
      setActiveJson(jsonInput);
      setParseError(null);
      setConfig(null);
    } catch (e) {
      setParseError(e.message);
    }
  }

  function prettifyJson() {
    try {
      const parsed = JSON.parse(jsonInput);
      setJsonInput(JSON.stringify(parsed, null, 2));
      setParseError(null);
    } catch (e) {
      setParseError(e.message);
    }
  }

  function handleExportConfig() {
    if (!config) return alert('No config changes yet.');
    const blob = new Blob([exportConfig(config)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'viewer-config.json'; a.click();
    URL.revokeObjectURL(url);
  }

  function handleImportConfig(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try { setConfig(importConfig(ev.target.result)); }
      catch { alert('Invalid config file'); }
    };
    reader.readAsText(file);
  }

  function handleExportTheme() {
    const blob = new Blob([JSON.stringify(theme, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'viewer-theme.json'; a.click();
    URL.revokeObjectURL(url);
  }

  function setCustomVar(key, value) {
    setCustomVars((prev) => ({ ...prev, [key]: value }));
  }

  function resetCustomVars() {
    setCustomVars({});
  }

  const analysis = showAnalysis ? preAnalyze(JSON.parse(activeJson)) : null;

  const panelBg     = preset === 'dark' ? '#1e1e1e' : preset === 'ocean' ? '#f0f8ff' : '#fff';
  const panelText   = preset === 'dark' ? '#d4d4d4' : '#333';
  const panelBorder = preset === 'dark' ? '#3c3c3c' : preset === 'ocean' ? '#b2d8f7' : '#ddd';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: panelBg }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 16px', background: '#0d1117', borderBottom: '1px solid #30363d',
      }}>
        <svg height="20" width="20" viewBox="0 0 16 16" fill="#e6edf3">
          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
        </svg>
        <span style={{ color: '#e6edf3', fontWeight: 700, fontSize: 15 }}>JSON Dynamic Viewer</span>
        <span style={{ color: '#8b949e', fontSize: 13 }}>—</span>
        <a
          href="https://github.com/sposmen/json_dynamic_viewer"
          target="_blank"
          rel="noreferrer"
          style={{ color: '#58a6ff', fontSize: 13, textDecoration: 'none' }}
        >
          github.com/sposmen/json_dynamic_viewer
        </a>
      </div>

      {/* ── Main split pane ────────────────────────────────────────────── */}
      <div ref={containerRef} style={{ flex: 1, display: 'flex', overflow: 'hidden', background: panelBg }}>

        {/* ── Left: JSON input ─────────────────────────────────────────── */}
        <div style={{ width: `${leftPct}%`, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div style={{ padding: '10px 14px', background: '#1e1e1e', color: '#fff', fontWeight: 'bold', fontSize: 13 }}>
            JSON Input
          </div>

          <textarea
            style={{
              flex: 1, padding: 12, fontFamily: 'monospace', fontSize: 12,
              border: 'none', resize: 'none', background: '#282828', color: '#d4d4d4', outline: 'none',
            }}
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            spellCheck={false}
          />

          {parseError && (
            <div style={{ background: '#fee', color: '#900', padding: '6px 12px', fontSize: 12 }}>
              {parseError}
            </div>
          )}

          <div style={{ display: 'flex', gap: 6, padding: '8px 10px', borderTop: `1px solid ${panelBorder}`, background: panelBg, flexWrap: 'wrap' }}>
            <button onClick={applyJson}    style={btn('#0070f3')}>Apply JSON</button>
            <button onClick={prettifyJson} style={btn('#444')}>Prettify</button>
            <button onClick={handleExportConfig} style={btn('#555')}>Export Config</button>
            <label style={btn('#555', true)}>
              Import Config <input type="file" accept=".json" hidden onChange={handleImportConfig} />
            </label>
            <button onClick={() => setShowAnalysis((s) => !s)} style={btn('#777')}>
              {showAnalysis ? 'Hide' : 'Show'} Analysis
            </button>
            <button
              onClick={() => setConfigurable((s) => !s)}
              style={btn(configurable ? '#2a7a2a' : '#888')}
              title="Toggle configuration UI visibility"
            >
              {configurable ? '⚙ Config on' : '⚙ Config off'}
            </button>
            <button onClick={() => setShowCssEditor((s) => !s)} style={btn(showCssEditor ? '#5a3e9e' : '#666')}>
              {showCssEditor ? '▲' : '▼'} Custom CSS
            </button>
          </div>

          {showCssEditor && (
            <div style={{ borderTop: `1px solid ${panelBorder}`, background: panelBg }}>
              <div style={{ padding: '6px 10px 4px', fontSize: 11, color: panelText, fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Custom CSS — targets <code style={{ background: '#eee', padding: '1px 4px', borderRadius: 3, color: '#333' }}>.jdv-key--*</code> classes &amp; <code style={{ background: '#eee', padding: '1px 4px', borderRadius: 3, color: '#333' }}>[data-jdv-path]</code></span>
              </div>
              <textarea
                value={customCss}
                onChange={(e) => setCustomCss(e.target.value)}
                spellCheck={false}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  height: 160, padding: '6px 10px',
                  fontFamily: 'monospace', fontSize: 11,
                  border: 'none', resize: 'vertical',
                  background: '#1a1a2e', color: '#a9b7d0', outline: 'none',
                }}
              />
            </div>
          )}
        </div>

        {/* ── Divider ──────────────────────────────────────────────────── */}
        <div
          onMouseDown={onDividerMouseDown}
          style={{
            width: 5,
            flexShrink: 0,
            cursor: 'col-resize',
            background: panelBorder,
            transition: 'background 0.15s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            userSelect: 'none',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#0070f3')}
          onMouseLeave={(e) => (e.currentTarget.style.background = panelBorder)}
        >
          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.4)', borderRadius: 1 }} />
        </div>

        {/* ── Right: viewer + theme controls ───────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

          {/* Theme bar */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
            padding: '8px 12px', background: panelBg, borderBottom: `1px solid ${panelBorder}`,
          }}>
            <span style={{ fontSize: 11, color: panelText, fontWeight: 'bold', marginRight: 4 }}>Theme:</span>

            {Object.keys(PRESET_LABELS).map((key) => (
              <button
                key={key}
                onClick={() => { setPreset(key); resetCustomVars(); }}
                style={{
                  ...btn(preset === key ? '#0070f3' : '#888'),
                  outline: preset === key ? '2px solid #0070f3' : 'none',
                  outlineOffset: 1,
                }}
              >
                {PRESET_LABELS[key]}
              </button>
            ))}

            <button onClick={() => setShowThemeEditor((s) => !s)} style={btn('#444')}>
              {showThemeEditor ? '▲' : '▼'} Customize
            </button>

            {Object.keys(customVars).length > 0 && (
              <button onClick={resetCustomVars} style={btn('#c00')}>Reset</button>
            )}

            <button onClick={handleExportTheme} style={btn('#555')}>Export Theme</button>

            <span style={{ marginLeft: 8, fontSize: 11, color: panelText, fontWeight: 'bold' }}>Table:</span>
            {Object.keys(ADAPTER_LABELS).map((key) => (
              <button
                key={key}
                onClick={() => setTableAdapterKey(key)}
                style={{
                  ...btn(tableAdapterKey === key ? '#7c3aed' : '#888'),
                  outline: tableAdapterKey === key ? '2px solid #7c3aed' : 'none',
                  outlineOffset: 1,
                }}
              >
                {ADAPTER_LABELS[key]}
              </button>
            ))}
          </div>

          {/* Custom var editor */}
          {showThemeEditor && (
            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: '8px 16px',
              padding: '10px 14px', background: panelBg,
              borderBottom: `1px solid ${panelBorder}`, fontSize: 11,
            }}>
              {CUSTOM_VARS.map(({ label, key }) => (
                <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 5, color: panelText }}>
                  <input
                    type="color"
                    value={customVars[key] ?? themes[preset]?.[key] ?? '#000000'}
                    style={{ width: 26, height: 22, border: 'none', cursor: 'pointer', borderRadius: 3 }}
                    onChange={(e) => setCustomVar(key, e.target.value)}
                  />
                  {label}
                </label>
              ))}
            </div>
          )}

          {/* Pre-analysis panel */}
          {showAnalysis && analysis && (
            <div style={{
              padding: 10, background: '#fffbe6', borderBottom: `1px solid #e8d`,
              fontFamily: 'monospace', fontSize: 11, maxHeight: 180, overflowY: 'auto',
            }}>
              <strong>Pre-analysis:</strong>
              <table style={{ borderCollapse: 'collapse', marginTop: 6, width: '100%' }}>
                <thead>
                  <tr style={{ background: '#f5e6c8' }}>
                    <th style={th}>Path</th>
                    <th style={th}>Kind</th>
                    <th style={th}>Suggested</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(analysis).map(([path, meta]) => (
                    <tr key={path}>
                      <td style={td}>{path}</td>
                      <td style={td}>{meta.kind}</td>
                      <td style={td}>{meta.suggestedBehavior}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Viewer */}
          <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
            <JsonViewer
              data={activeJson}
              config={config}
              onConfigChange={setConfig}
              theme={theme}
              configurable={configurable}
              plugins={{ table: TABLE_ADAPTERS[tableAdapterKey] }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function btn(bg, isLabel = false) {
  return {
    background: bg, color: '#fff', border: 'none', borderRadius: 4,
    padding: '5px 10px', cursor: 'pointer', fontSize: 11, fontFamily: 'inherit',
    display: isLabel ? 'inline-block' : undefined,
  };
}

const th = { padding: '2px 8px', textAlign: 'left', borderBottom: '1px solid #ddd' };
const td = { padding: '2px 8px', borderBottom: '1px solid #eee' };
