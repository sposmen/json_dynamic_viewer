import { useEffect, useLayoutEffect, useReducer, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import tabulatorBaseCss from 'tabulator-tables/dist/css/tabulator.min.css?inline';
import { useViewerContext, ViewerContext } from '../../components/ViewerContext.jsx';
import { BEHAVIORS, FORMATS, FORMATS_BY_TYPE, applySortOrder } from '../../config.js';
import { suggestBehavior } from '../../analyzer.js';
import EditableLabel from '../../components/EditableLabel.jsx';
import FieldsBehavior from '../../components/behaviors/FieldsBehavior.jsx';
import ListBehavior from '../../components/behaviors/ListBehavior.jsx';
import { formatPrimitive, detectColumnType, columnHasNested, deriveColumnKeys } from '../tableUtils.js';

// ── CSS management ───────────────────────────────────────────────────────────

const BASE_STYLE_ID  = 'jdv-tabulator-base';
const THEME_STYLE_ID = 'jdv-tabulator-theme-override';

let _tabulatorThemeRefs = 0;

// Style-controller registry: only the first mounted TabulatorTable shows the style picker
const _tabulatorMountRegistry = new Map(); // path -> { seq, notify }
let _tabulatorMountSeq = 0;

function _getTabulatorPrimary() {
  if (_tabulatorMountRegistry.size === 0) return null;
  return [..._tabulatorMountRegistry.entries()]
    .reduce((best, [p, e]) => e.seq < best[1].seq ? [p, e] : best)[0];
}

function _notifyTabulatorAll() {
  for (const { notify } of _tabulatorMountRegistry.values()) notify();
}

function injectStyleOnce(id, css) {
  if (!document.getElementById(id)) {
    const el = document.createElement('style');
    el.id = id;
    el.textContent = css;
    document.head.appendChild(el);
  }
}

function applyTabulatorTheme(css) {
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

// ── Column builder ───────────────────────────────────────────────────────────

function buildColumns(rows, config, path, contextRef, cellItemsRef, tableRef) {
  const keys = deriveColumnKeys(rows, config, path);

  return keys.map((key) => {
    const colPath = path ? `${path}.${key}` : key;
    const kc      = config.keys[colPath] ?? {};
    const format  = kc.format;
    const opts    = kc.formatOptions ?? {};
    const hasNested = columnHasNested(rows, key);

    const col = { title: kc.label ?? key, field: key, resizable: true, hozAlign: kc.hozAlign || undefined };

    if (hasNested) {
      col.formatter = (cell, _params, onRendered) => {
        const value = cell.getValue();

        if (Array.isArray(value) && format === FORMATS.CSV) {
          return formatPrimitive(value, FORMATS.CSV, opts);
        }

        if (value !== null && typeof value === 'object') {
          const container = document.createElement('div');
          container.className = 'jdv-cell-node';

          onRendered(() => {
            const ctx  = contextRef.current;
            const root = createRoot(container);

            const observer = new ResizeObserver(() => {
              try {
                cell.getRow().normalizeHeight();
                tableRef.current?.rowManager?.adjustTableSize?.();
              } catch (_) { /* row or table may be gone */ }
            });
            observer.observe(container);

            cellItemsRef.current.push({ root, observer });

            root.render(
              <ViewerContext.Provider value={ctx}>
                <CellContent value={value} path={colPath} />
              </ViewerContext.Provider>
            );
          });

          return container;
        }

        return format ? formatPrimitive(value, format, opts) : (value == null ? '' : String(value));
      };
    } else if (format) {
      if (format === FORMATS.CHECKBOX) {
        col.formatter = 'tickCross';
        col.formatterParams = { allowEmpty: true };
      } else {
        col.formatter = (cell) => formatPrimitive(cell.getValue(), format, opts);
      }
    }

    return col;
  });
}

// ── Column settings panel ────────────────────────────────────────────────────

function FormatExtraOptions({ format, options, onChange }) {
  if (format === FORMATS.CURRENCY) return (
    <>
      <input className="jdv-format-opt-input" placeholder="USD" maxLength={3}
        value={options.currency ?? ''} style={{ width: 44 }}
        onChange={(e) => onChange({ ...options, currency: e.target.value.toUpperCase() })} />
      <input className="jdv-format-opt-input" placeholder="en-US"
        value={options.locale ?? ''} style={{ width: 60 }}
        onChange={(e) => onChange({ ...options, locale: e.target.value })} />
    </>
  );
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
  if (format === FORMATS.PERCENTAGE) return (
    <>
      <input className="jdv-format-opt-input" type="number" min={0} max={6}
        placeholder="2" value={options.decimals ?? ''} style={{ width: 36 }}
        onChange={(e) => onChange({ ...options, decimals: Number(e.target.value) })} />
      <span style={{ fontSize: 10, color: 'var(--jdv-color-text-muted)' }}>dec</span>
    </>
  );
  if (format === FORMATS.CSV) return (
    <>
      <input className="jdv-format-opt-input" placeholder=", "
        value={options.separator ?? ''} style={{ width: 44 }}
        title="Separator"
        onChange={(e) => onChange({ ...options, separator: e.target.value })} />
      <span style={{ fontSize: 10, color: 'var(--jdv-color-text-muted)' }}>sep</span>
    </>
  );
  return null;
}

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
        <span>Column</span><span>Type</span><span>Format</span><span>Align</span><span>Options</span>
      </div>
      {keys.map((key, i) => {
        const colPath      = path ? `${path}.${key}` : key;
        const kc           = config.keys[colPath] ?? {};
        const detectedType = detectColumnType(rows, key);
        const formats      = FORMATS_BY_TYPE[detectedType] ?? [];
        const currentFmt   = kc.format ?? '';
        const fmtOpts      = kc.formatOptions ?? {};
        const currentAlign = kc.hozAlign ?? '';

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
                <option value="">nested</option>
                {formats.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            ) : (
              <span style={{ color: 'var(--jdv-color-text-muted)', fontSize: 11 }}>—</span>
            )}

            <span className="jdv-align-toggle">
              {[['left','←'],['center','≡'],['right','→']].map(([align, icon]) => (
                <button
                  key={align}
                  className={`jdv-align-btn${currentAlign === align ? ' jdv-align-btn--active' : ''}`}
                  onClick={() => onConfigChange(colPath, { hozAlign: currentAlign === align ? null : align })}
                  title={align}
                >
                  {icon}
                </button>
              ))}
            </span>

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

function cleanupCellItems(items) {
  items.forEach(({ root, observer }) => {
    observer?.disconnect();
    // Defer unmount to avoid React 18 "synchronous unmount during render" warning.
    // The container may already be detached from the DOM by the time this fires — that's fine.
    setTimeout(() => root.unmount());
  });
}

const PAGE_SIZE_OPTIONS = [
  { label: 'Auto',  value: '' },
  { label: 'All',   value: '0' },
  { label: '10',    value: '10' },
  { label: '25',    value: '25' },
  { label: '50',    value: '50' },
  { label: '100',   value: '100' },
  { label: '250',   value: '250' },
];

const COUNTER_OPTIONS = [
  { label: 'None',  value: '' },
  { label: 'Rows',  value: 'rows' },
  { label: 'Pages', value: 'pages' },
];

export default function TabulatorTable({ node, path }) {
  const ctx = useViewerContext();
  const { config, configurable, onConfigChange, plugins } = ctx;
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [, _forceUpdate] = useReducer(n => n + 1, 0);
  const containerRef  = useRef(null);
  const tableRef      = useRef(null);
  const cellItemsRef  = useRef([]);
  const contextRef    = useRef(ctx);

  useEffect(() => { contextRef.current = ctx; });

  // Register for style-controller election (first mounted = primary)
  useLayoutEffect(() => {
    const seq = ++_tabulatorMountSeq;
    _tabulatorMountRegistry.set(path, { seq, notify: _forceUpdate });
    _notifyTabulatorAll();
    return () => {
      _tabulatorMountRegistry.delete(path);
      _notifyTabulatorAll();
    };
  }, []);

  const availableThemes = plugins?.table?.themes ?? [];
  const tableTheme = config.keys[path]?.tableTheme ?? '';

  // Inject base Tabulator CSS once on first mount
  useEffect(() => {
    injectStyleOnce(BASE_STYLE_ID, tabulatorBaseCss);
  }, []);

  // Apply selected theme CSS; clean up when last instance unmounts
  useEffect(() => {
    _tabulatorThemeRefs++;
    return () => {
      _tabulatorThemeRefs--;
      if (_tabulatorThemeRefs === 0) {
        const el = document.getElementById(THEME_STYLE_ID);
        if (el) el.textContent = '';
      }
    };
  }, []);

  useEffect(() => {
    const theme = availableThemes.find((t) => t.name === tableTheme);
    applyTabulatorTheme(theme?.css ?? '');
  }, [tableTheme, availableThemes]);

  useEffect(() => {
    if (!containerRef.current) return;

    cleanupCellItems(cellItemsRef.current);
    cellItemsRef.current = [];

    const kc = config.keys[path] ?? {};
    const rawSize  = kc.paginationSize;
    const pageSize = (rawSize == null || rawSize === 0) ? 50 : rawSize;
    const paginate = rawSize == null ? node.length > 50 : rawSize > 0;
    const counter  = kc.paginationCounter || false;

    tableRef.current = new Tabulator(containerRef.current, {
      data: node,
      columns: buildColumns(node, config, path, contextRef, cellItemsRef, tableRef),
      layout: 'fitDataStretch',
      pagination: paginate ? 'local' : false,
      paginationSize: pageSize,
      paginationCounter: counter,
      movableColumns: true,
    });

    return () => {
      cleanupCellItems(cellItemsRef.current);
      cellItemsRef.current = [];
      tableRef.current?.destroy();
      tableRef.current = null;
    };
  }, [node, config, path]);

  const kc            = config.keys[path] ?? {};
  const pageSizeValue = kc.paginationSize == null ? '' : String(kc.paginationSize);
  const counterValue  = kc.paginationCounter ?? '';

  function handlePageSizeChange(e) {
    const raw = e.target.value;
    onConfigChange(path, { paginationSize: raw === '' ? null : Number(raw) });
  }

  function handleCounterChange(e) {
    onConfigChange(path, { paginationCounter: e.target.value || null });
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

            <label>
              Counter:
              <select
                className="jdv-table-pagination-select"
                value={counterValue}
                onChange={handleCounterChange}
              >
                {COUNTER_OPTIONS.map(({ label, value }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>
          </div>

          {availableThemes.length > 0 && _getTabulatorPrimary() === path && (
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

      <div ref={containerRef} className="jdv-table" />
    </div>
  );
}
