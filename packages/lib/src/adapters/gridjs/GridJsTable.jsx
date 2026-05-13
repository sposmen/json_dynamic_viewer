import { useEffect, useLayoutEffect, useReducer, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Grid } from 'gridjs-react';
import { h as gH, Component as GComponent } from 'gridjs';
import { useViewerContext, ViewerContext } from '../../components/ViewerContext.jsx';
import { BEHAVIORS, FORMATS, FORMATS_BY_TYPE } from '../../config.js';
import { suggestBehavior } from '../../analyzer.js';
import EditableLabel from '../../components/EditableLabel.jsx';
import FieldsBehavior from '../../components/behaviors/FieldsBehavior.jsx';
import ListBehavior from '../../components/behaviors/ListBehavior.jsx';
import { formatPrimitive, detectColumnType, columnHasNested, deriveColumnKeys } from '../tableUtils.js';

// ── Theme management ─────────────────────────────────────────────────────────

const THEME_STYLE_ID = 'jdv-gridjs-theme-override';

let _gridjsThemeRefs = 0;

// Style-controller registry: only the first mounted GridJsTable shows the style picker
const _gridjsMountRegistry = new Map(); // path -> { seq, notify }
let _gridjsMountSeq = 0;

function _getGridjsPrimary() {
  if (_gridjsMountRegistry.size === 0) return null;
  return [..._gridjsMountRegistry.entries()]
    .reduce((best, [p, e]) => e.seq < best[1].seq ? [p, e] : best)[0];
}

function _notifyGridjsAll() {
  for (const { notify } of _gridjsMountRegistry.values()) notify();
}

function applyGridJsTheme(css) {
  let el = document.getElementById(THEME_STYLE_ID);
  if (css) {
    if (!el) {
      el = document.createElement('style');
      el.id = THEME_STYLE_ID;
      document.head.appendChild(el);
    }
    el.textContent = css;
  } else if (el) {
    el.textContent = '';
  }
}

// ── Preact wrapper that owns a React root per cell ───────────────────────────
// Using a Preact class component keeps React StrictMode's double-invoke logic
// out of the picture — Preact has its own lifecycle, unaffected by StrictMode.

class CellRoot extends GComponent {
  componentDidMount() {
    this._root = createRoot(this._el);
    this._root.render(this.props.element);
  }
  componentDidUpdate() {
    this._root?.render(this.props.element);
  }
  componentWillUnmount() {
    const r = this._root;
    this._root = null;
    setTimeout(() => r?.unmount());
  }
  render() {
    return gH('div', { ref: (el) => { this._el = el; }, class: 'jdv-cell-node' });
  }
}

// ── Cell content (object/array cells) ───────────────────────────────────────

function CellContent({ value, path }) {
  const { config } = useViewerContext();
  const behavior = config.keys[path]?.behavior;
  const actual   = (!behavior || behavior === BEHAVIORS.AUTO)
    ? suggestBehavior(value)
    : behavior;

  if (actual === BEHAVIORS.LIST) return <ListBehavior   node={value} path={path} />;
  return                                <FieldsBehavior node={value} path={path} />;
}

// ── Format extra options ─────────────────────────────────────────────────────

function FormatExtraOptions({ format, options, onChange }) {
  if (format === FORMATS.DATE || format === FORMATS.DATETIME) return (
    <>
      <select className="jdv-behavior-select"
        value={options.dateStyle ?? 'medium'}
        onChange={(e) => onChange({ ...options, dateStyle: e.target.value })}>
        {['full', 'long', 'medium', 'short'].map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      {format === FORMATS.DATETIME && (
        <select className="jdv-behavior-select"
          value={options.timeStyle ?? 'short'}
          onChange={(e) => onChange({ ...options, timeStyle: e.target.value })}>
          {['full', 'long', 'medium', 'short'].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      )}
    </>
  );
  if (format === FORMATS.CURRENCY) return (
    <input className="jdv-format-opt-input" placeholder="USD" maxLength={3}
      value={options.currency ?? ''} style={{ width: 44 }}
      onChange={(e) => onChange({ ...options, currency: e.target.value.toUpperCase() })} />
  );
  return null;
}

// ── Column settings panel ────────────────────────────────────────────────────

function ColumnSettings({ rows, path, config, onConfigChange }) {
  const keys = deriveColumnKeys(rows, config, path);

  function moveCol(key, delta) {
    const idx  = keys.indexOf(key);
    const next = [...keys];
    [next[idx], next[idx + delta]] = [next[idx + delta], next[idx]];
    onConfigChange(path, { keyOrder: next });
  }

  return (
    <div className="jdv-col-settings">
      <div className="jdv-col-settings-header">
        <span />
        <span>Column</span><span>Type</span><span>Format</span><span>Align</span>
      </div>
      {keys.map((key, i) => {
        const colPath      = path ? `${path}.${key}` : key;
        const kc           = config.keys[colPath] ?? {};
        const detectedType = detectColumnType(rows, key);
        const formats      = FORMATS_BY_TYPE[detectedType] ?? [];
        const currentFmt   = kc.format ?? '';
        const fmtOpts      = kc.formatOptions ?? {};

        return (
          <div key={key} className="jdv-col-setting-row">
            <span className="jdv-sort-btns">
              <button className="jdv-sort-btn" onClick={() => moveCol(key, -1)} disabled={i === 0}>↑</button>
              <button className="jdv-sort-btn" onClick={() => moveCol(key,  1)} disabled={i === keys.length - 1}>↓</button>
            </span>
            <EditableLabel path={colPath} fallback={key} />
            <span className="jdv-col-setting-type">{detectedType}</span>

            {detectedType === 'object' ? (
              <select className="jdv-behavior-select"
                value={kc.behavior ?? ''}
                onChange={(e) => onConfigChange(colPath, { behavior: e.target.value || null })}>
                <option value="">auto</option>
                <option value={BEHAVIORS.FIELDS}>fields</option>
                <option value={BEHAVIORS.LIST}>list</option>
              </select>
            ) : formats.length > 0 ? (
              <select className="jdv-behavior-select" value={currentFmt}
                onChange={(e) => onConfigChange(colPath, { format: e.target.value || null, formatOptions: {} })}>
                <option value="">—</option>
                {formats.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            ) : (
              <span style={{ color: 'var(--jdv-color-text-muted)', fontSize: 11 }}>—</span>
            )}

            <span className="jdv-col-setting-opts">
              <FormatExtraOptions format={currentFmt} options={fmtOpts}
                onChange={(next) => onConfigChange(colPath, { formatOptions: next })} />
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

const PAGE_SIZE_OPTIONS = [
  { label: 'Auto',  value: '' },
  { label: 'All',   value: '0' },
  { label: '10',    value: '10' },
  { label: '25',    value: '25' },
  { label: '50',    value: '50' },
  { label: '100',   value: '100' },
  { label: '250',   value: '250' },
];

export default function GridJsTable({ node, path }) {
  const ctx = useViewerContext();
  const { config, configurable, onConfigChange, plugins } = ctx;
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [, _forceUpdate] = useReducer(n => n + 1, 0);
  const contextRef = useRef(ctx);
  contextRef.current = ctx; // keep in sync so formatters always see latest ctx

  // Register for style-controller election (first mounted = primary)
  useLayoutEffect(() => {
    const seq = ++_gridjsMountSeq;
    _gridjsMountRegistry.set(path, { seq, notify: _forceUpdate });
    _notifyGridjsAll();
    return () => {
      _gridjsMountRegistry.delete(path);
      _notifyGridjsAll();
    };
  }, []);

  const availableThemes = plugins?.table?.themes ?? [];
  const tableTheme = config.keys[path]?.tableTheme ?? '';

  useEffect(() => {
    _gridjsThemeRefs++;
    return () => {
      _gridjsThemeRefs--;
      if (_gridjsThemeRefs === 0) {
        const el = document.getElementById(THEME_STYLE_ID);
        if (el) el.textContent = '';
      }
    };
  }, []);

  useEffect(() => {
    const theme = availableThemes.find((t) => t.name === tableTheme);
    applyGridJsTheme(theme?.css ?? '');
  }, [tableTheme, availableThemes]);

  const keys = deriveColumnKeys(node, config, path);
  const kc   = config.keys[path] ?? {};

  const rawSize    = kc.paginationSize;
  const pageSizeValue = kc.paginationSize == null ? '' : String(kc.paginationSize);
  const pagination = rawSize == null
    ? (node.length > 50 ? { limit: 50 } : undefined)
    : rawSize > 0 ? { limit: rawSize } : undefined;

  const columns = keys.map((key) => {
    const colPath   = path ? `${path}.${key}` : key;
    const colKc     = config.keys[colPath] ?? {};
    const format    = colKc.format;
    const opts      = colKc.formatOptions ?? {};
    const hasNested = columnHasNested(node, key);

    return {
      id: key,
      name: colKc.label ?? key,
      formatter: hasNested
        ? (cell) => {
            if (cell !== null && cell !== undefined && typeof cell === 'object') {
              // Return a Preact VNode that owns its own React root (via CellRoot).
              // This avoids the placeholder-ID approach which breaks under React StrictMode.
              return gH(CellRoot, {
                element: (
                  <ViewerContext.Provider value={contextRef.current}>
                    <CellContent value={cell} path={colPath} />
                  </ViewerContext.Provider>
                ),
              });
            }
            return format ? formatPrimitive(cell, format, opts) : (cell == null ? '' : String(cell));
          }
        : format
          ? (cell) => formatPrimitive(cell, format, opts)
          : undefined,
    };
  });

  const data = node.map((row) =>
    keys.map((key) => {
      const colPath = path ? `${path}.${key}` : key;
      const colKc   = config.keys[colPath] ?? {};
      const format  = colKc.format;
      const opts    = colKc.formatOptions ?? {};
      const val     = row[key];
      if (val !== null && val !== undefined && typeof val === 'object') return val;
      return format ? formatPrimitive(val, format, opts) : (val == null ? '' : String(val));
    })
  );

  function handlePageSizeChange(e) {
    const raw = e.target.value;
    onConfigChange(path, { paginationSize: raw === '' ? null : Number(raw) });
  }

  function handleThemeChange(e) {
    onConfigChange(path, { tableTheme: e.target.value || null });
  }

  return (
    <div className="jdv-table-wrapper">
      {configurable && (
        <div className="jdv-table-toolbar">
          <button
            className={`jdv-table-settings-btn ${settingsOpen ? 'jdv-table-settings-btn--open' : ''}`}
            onClick={() => setSettingsOpen((s) => !s)}
          >
            ⚙ Columns
          </button>

          <div className="jdv-table-pagination-controls">
            <label>
              Rows/page:
              <select
                className="jdv-table-pagination-select"
                value={pageSizeValue}
                onChange={handlePageSizeChange}
              >
                {PAGE_SIZE_OPTIONS.map(({ label, value }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>
          </div>

          {availableThemes.length > 0 && _getGridjsPrimary() === path && (
            <div className="jdv-table-pagination-controls">
              <label>
                Style:
                <select
                  className="jdv-table-pagination-select"
                  value={tableTheme}
                  onChange={handleThemeChange}
                >
                  <option value="">None</option>
                  {availableThemes.map(({ name, label }) => (
                    <option key={name} value={name}>{label}</option>
                  ))}
                </select>
              </label>
            </div>
          )}
        </div>
      )}

      {configurable && settingsOpen && (
        <ColumnSettings rows={node} path={path} config={config} onConfigChange={onConfigChange} />
      )}

      <Grid
        columns={columns}
        data={data}
        pagination={pagination}
        resizable
        className={{ table: 'jdv-table' }}
      />
    </div>
  );
}
