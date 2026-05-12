import { useState } from 'react';
import { useViewerContext } from '../ViewerContext.jsx';
import { FORMATS, FORMATS_BY_TYPE } from '../../config.js';
import StringValue, { isLikelyDate, isShortString } from './StringValue.jsx';
import NumberValue from './NumberValue.jsx';
import BooleanValue from './BooleanValue.jsx';

function defaultFormat(value) {
  if (typeof value === 'boolean') return FORMATS.CHECKBOX;
  if (typeof value === 'number')  return FORMATS.NUMBER;
  if (typeof value === 'string')  return isLikelyDate(value) ? FORMATS.DATE : FORMATS.TEXT;
  return null;
}

function FormattedValue({ value, format, options }) {
  if (value === null)              return <span className="jdv-type-null">null</span>;
  if (typeof value === 'boolean')  return <BooleanValue value={value} format={format} />;
  if (typeof value === 'number')   return <NumberValue  value={value} format={format} options={options} />;
  if (typeof value === 'string')   return <StringValue  value={value} format={format} options={options} />;
  return <span className="jdv-type-string">{String(value)}</span>;
}

function FormatOptions({ valueType, format, options, onChange }) {
  if (format === FORMATS.CURRENCY) {
    return (
      <span className="jdv-format-opts">
        <input
          className="jdv-format-opt-input"
          placeholder="USD"
          value={options.currency ?? ''}
          maxLength={3}
          style={{ width: 48 }}
          onChange={(e) => onChange({ ...options, currency: e.target.value.toUpperCase() })}
        />
        <input
          className="jdv-format-opt-input"
          placeholder="en-US"
          value={options.locale ?? ''}
          style={{ width: 64 }}
          onChange={(e) => onChange({ ...options, locale: e.target.value })}
        />
      </span>
    );
  }

  if (format === FORMATS.DATE) {
    return (
      <span className="jdv-format-opts">
        <select
          className="jdv-behavior-select"
          value={options.dateStyle ?? 'medium'}
          onChange={(e) => onChange({ ...options, dateStyle: e.target.value })}
        >
          {['full', 'long', 'medium', 'short'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </span>
    );
  }

  if (format === FORMATS.PERCENTAGE) {
    return (
      <span className="jdv-format-opts">
        <input
          className="jdv-format-opt-input"
          type="number"
          min={0}
          max={6}
          placeholder="2"
          value={options.decimals ?? ''}
          style={{ width: 40 }}
          onChange={(e) => onChange({ ...options, decimals: Number(e.target.value) })}
        />
        <span style={{ fontSize: 10, color: '#999' }}>decimals</span>
      </span>
    );
  }

  return null;
}

export default function PrimitiveNode({ value, path }) {
  const { config, configurable, onConfigChange } = useViewerContext();
  const [pickerOpen, setPickerOpen] = useState(false);

  const keyConfig = config.keys[path] ?? {};
  const savedFormat = keyConfig.format;
  const formatOptions = keyConfig.formatOptions ?? {};

  const valueType = value === null ? 'null' : typeof value;
  const availableFormats = FORMATS_BY_TYPE[valueType] ?? [];
  const format = savedFormat ?? defaultFormat(value);

  const canFormat = availableFormats.length > 1 ||
    (typeof value === 'string' && isShortString(value));

  function handleFormatChange(e) {
    onConfigChange(path, { format: e.target.value, formatOptions: {} });
  }

  function handleOptionsChange(nextOptions) {
    onConfigChange(path, { formatOptions: nextOptions });
  }

  return (
    <span className="jdv-primitive-node">
      <FormattedValue value={value} format={format} options={formatOptions} />

      {configurable && canFormat && (
        <button
          className={`jdv-format-gear ${pickerOpen ? 'jdv-format-gear--open' : ''}`}
          onClick={() => setPickerOpen((s) => !s)}
          title="Format options"
        >
          ⚙
        </button>
      )}

      {configurable && pickerOpen && canFormat && (
        <span className="jdv-format-picker">
          <select
            className="jdv-behavior-select"
            value={format ?? ''}
            onChange={handleFormatChange}
          >
            {availableFormats.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
          <FormatOptions
            valueType={valueType}
            format={format}
            options={formatOptions}
            onChange={handleOptionsChange}
          />
        </span>
      )}
    </span>
  );
}