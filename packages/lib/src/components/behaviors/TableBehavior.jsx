import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator.min.css';
// Additional themes imported as inline strings so they can be injected dynamically
import simpleCss    from 'tabulator-tables/dist/css/tabulator_simple.min.css?inline';
import midnightCss  from 'tabulator-tables/dist/css/tabulator_midnight.min.css?inline';
import modernCss    from 'tabulator-tables/dist/css/tabulator_modern.min.css?inline';
import siteCss      from 'tabulator-tables/dist/css/tabulator_site.min.css?inline';
import siteDarkCss  from 'tabulator-tables/dist/css/tabulator_site_dark.min.css?inline';
import { useViewerContext, ViewerContext } from '../ViewerContext.jsx';
import { BEHAVIORS, FORMATS, FORMATS_BY_TYPE, applySortOrder } from '../../config.js';
import { suggestBehavior } from '../../analyzer.js';
import EditableLabel from '../EditableLabel.jsx';
import FieldsBehavior from './FieldsBehavior.jsx';
import ListBehavior from './ListBehavior.jsx';

// ── Theme management ─────────────────────────────────────────────────────────

const THEME_STYLE_ID = 'jdv-tabulator-theme-override';

const THEME_CSS_MAP = {
  simple:    simpleCss,
  midnight:  midnightCss,
  modern:    modernCss,
  site:      siteCss,
  'site-dark': siteDarkCss,
};

export const TABLE_THEME_OPTIONS = [
  { label: 'None',      value: '' },
  { label: 'Simple',    value: 'simple' },
  { label: 'Midnight',  value: 'midnight' },
  { label: 'Modern',    value: 'modern' },
  { label: 'Site',      value: 'site' },
  { label: 'Site Dark', value: 'site-dark' },
];

// Module-level instance counter so the style element is only removed
// when the last TableBehavior unmounts.
let _tabulatorThemeRefs = 0;

function applyTabulatorTheme(theme) {
  const css = THEME_CSS_MAP[theme] ?? '';
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

// ── Primitive / CSV formatting ───────────────────────────────────────────────

function formatPrimitive(value, format, opts = {}) {
  if (value == null) return '';
  switch (format) {
    case FORMATS.DATE: {
      const d = new Date(value);
      return isNaN(d) ? String(value)
        : new Intl.DateTimeFormat(opts.locale ?? 'default', { dateStyle: opts.dateStyle ?? 'medium' }).format(d);
    }
    case FORMATS.CURRENCY:
      return new Intl.NumberFormat(opts.locale ?? 'en-US', {
        style: 'currency', currency: opts.currency ?? 'USD',
      }).format(Number(value));
    case FORMATS.PERCENTAGE: {
      const dec = opts.decimals ?? 2;
      return new Intl.NumberFormat(opts.locale ?? 'en-US', {
        style: 'percent', minimumFractionDigits: dec, maximumFractionDigits: dec,
      }).format(Number(value) / 100);
    }
    case FORMATS.TOGGLE:   return value ? 'Yes' : 'No';
    case FORMATS.CHECKBOX: return value ? '✓' : '✗';
    case FORMATS.CSV:
      return Array.isArray(value)
        ? value.map((v) => (v == null ? '' : String(v))).join(opts.separator ?? ', ')
        : String(value);
    default: return String(value);
  }
}

// ── Column type detection ────────────────────────────────────────────────────

function detectColumnType(rows, field) {
  for (const row of rows) {
    const val = row[field];
    if (val !== null && val !== undefined) {
      if (Array.isArray(val))        return 'array';
      if (typeof val === 'object')   return 'object';
      return typeof val;
    }
  }
  return 'string';
}

function columnHasNested(rows, field) {
  return rows.some((row) => row[field] !== null && typeof row[field] === 'object');
}

// ── Cell content (object/array cells — no key header, driven by column config) ──

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
  const allKeys  = [...new Set(rows.flatMap(Object.keys))];
  const keys     = applySortOrder(allKeys, config.keys[path]?.keyOrder);

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

        // Array rendered as CSV string
        if (Array.isArray(value) && format === FORMATS.CSV) {
          return formatPrimitive(value, FORMATS.CSV, opts);
        }

        // Nested object or array → mount a React JsonNode
        if (value !== null && typeof value === 'object') {
          const container = document.createElement('div');
          container.className = 'jdv-cell-node';

          onRendered(() => {
            const ctx  = contextRef.current;
            const root = createRoot(container);

            // ResizeObserver triggers Tabulator row + container height recalc
            const observer = new ResizeObserver(() => {
              try {
                cell.getRow().normalizeHeight();
                // adjustTableSize updates the scroll container's total height
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

        // Primitive value in a mixed column
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
  if (format === FORMATS.DATE) return (
    <select className="jdv-behavior-select"
      value={options.dateStyle ?? 'medium'}
      onChange={(e) => onChange({ ...options, dateStyle: e.target.value })}>
      {['full', 'long', 'medium', 'short'].map((s) => <option key={s} value={s}>{s}</option>)}
    </select>
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
  const allKeys    = [...new Set(rows.flatMap(Object.keys))];
  const keyOrder   = config.keys[path]?.keyOrder;
  const keys       = applySortOrder(allKeys, keyOrder);

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
    root.unmount();
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

export default function TableBehavior({ node, path }) {
  const ctx = useViewerContext();
  const { config, configurable, onConfigChange } = ctx;
  const [settingsOpen, setSettingsOpen] = useState(false);
  const containerRef  = useRef(null);
  const tableRef      = useRef(null);
  const cellItemsRef  = useRef([]);  // { root, observer } per nested cell
  const contextRef    = useRef(ctx);

  useEffect(() => { contextRef.current = ctx; });

  // Apply selected Tabulator theme CSS override; clean up when last instance unmounts
  const tableTheme = config.keys[path]?.tableTheme ?? '';
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
    applyTabulatorTheme(tableTheme);
  }, [tableTheme]);

  useEffect(() => {
    if (!containerRef.current) return;

    cleanupCellItems(cellItemsRef.current);
    cellItemsRef.current = [];

    const kc = config.keys[path] ?? {};
    // paginationSize: null/undefined = auto (on if >50 rows), 0 = off, N = on with N rows
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

  const kc           = config.keys[path] ?? {};
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

          <div className="jdv-table-pagination-controls">
            <label>
              Style:
              <select
                className="jdv-table-pagination-select"
                value={tableTheme}
                onChange={handleThemeChange}
              >
                {TABLE_THEME_OPTIONS.map(({ label, value }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>
          </div>
        </div>
      )}

      {configurable && settingsOpen && (
        <ColumnSettings rows={node} path={path} config={config} onConfigChange={onConfigChange} />
      )}

      <div ref={containerRef} className="jdv-table" />
    </div>
  );
}