import { useState } from 'react';
import { useViewerContext } from '../ViewerContext.jsx';
import { BEHAVIORS, FORMATS, FORMATS_BY_TYPE } from '../../config.js';
import { suggestBehavior } from '../../analyzer.js';
import EditableLabel from '../EditableLabel.jsx';
import FieldsBehavior from './FieldsBehavior.jsx';
import ListBehavior from './ListBehavior.jsx';
import { formatPrimitive, detectColumnType, deriveColumnKeys } from '../../adapters/tableUtils.js';

// ── Format extra options ─────────────────────────────────────────────────────

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

// ── Column settings panel ────────────────────────────────────────────────────

function ColumnSettings({ rows, path }) {
  const { config, onConfigChange } = useViewerContext();
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
                <option value="">—</option>
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

export default function NativeTable({ node, path }) {
  const { config, configurable } = useViewerContext();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const keys = deriveColumnKeys(node, config, path);

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
        </div>
      )}

      {configurable && settingsOpen && (
        <ColumnSettings rows={node} path={path} />
      )}

      <table className="jdv-native-table">
        <thead>
          <tr>
            {keys.map((key) => {
              const colPath = path ? `${path}.${key}` : key;
              const kc = config.keys[colPath] ?? {};
              return (
                <th key={key} style={kc.hozAlign ? { textAlign: kc.hozAlign } : undefined}>
                  {kc.label ?? key}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {node.map((row, i) => (
            <tr key={i}>
              {keys.map((key) => {
                const colPath = path ? `${path}.${key}` : key;
                const kc  = config.keys[colPath] ?? {};
                const val = row[key] ?? null;
                const fmt  = kc.format;
                const opts = kc.formatOptions ?? {};

                let content;
                if (val !== null && typeof val === 'object') {
                  if (Array.isArray(val) && fmt) {
                    content = formatPrimitive(val, fmt, opts);
                  } else {
                    const actual = (!kc.behavior || kc.behavior === BEHAVIORS.AUTO)
                      ? suggestBehavior(val)
                      : kc.behavior;
                    content = actual === BEHAVIORS.LIST
                      ? <ListBehavior node={val} path={colPath} />
                      : <FieldsBehavior node={val} path={colPath} />;
                  }
                } else {
                  content = fmt
                    ? formatPrimitive(val, fmt, opts)
                    : (val == null ? '' : String(val));
                }

                return (
                  <td key={key} style={kc.hozAlign ? { textAlign: kc.hozAlign } : undefined}>
                    {content}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
