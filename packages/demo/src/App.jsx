import { useState } from 'react';
import { JsonViewer, exportConfig, importConfig, preAnalyze, themes } from 'json-dynamic-viewer';
import { sampleJson } from './sampleData.js';

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

  // Theme state
  const [preset, setPreset]           = useState('default');
  const [customVars, setCustomVars]   = useState({});
  const [showThemeEditor, setShowThemeEditor] = useState(false);

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
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', height: '100vh', background: panelBg }}>

      {/* ── Left: JSON input ───────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', borderRight: `1px solid ${panelBorder}` }}>
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
          <button onClick={applyJson}          style={btn('#0070f3')}>Apply JSON</button>
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
        </div>
      </div>

      {/* ── Right: viewer + theme controls ────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

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
          />
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