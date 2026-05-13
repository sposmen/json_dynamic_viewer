import { FORMATS, applySortOrder } from '../config.js';

export function formatPrimitive(value, format, opts = {}) {
  if (value == null) return '';
  switch (format) {
    case FORMATS.DATE:
    case FORMATS.DATETIME: {
      // Numeric Unix timestamps: < 1e12 → seconds (multiply by 1000), >= 1e12 → milliseconds
      const ms = typeof value === 'number'
        ? (value < 1e12 ? value * 1000 : value)
        : value;
      const d = new Date(ms);
      if (isNaN(d)) return String(value);
      const dtOpts = { dateStyle: opts.dateStyle ?? 'medium' };
      if (format === FORMATS.DATETIME) dtOpts.timeStyle = opts.timeStyle ?? 'short';
      return new Intl.DateTimeFormat(opts.locale ?? 'default', dtOpts).format(d);
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
    case FORMATS.NUMBER:
      return new Intl.NumberFormat(opts.locale ?? 'en-US', {
        minimumFractionDigits: opts.decimals ?? 0,
        maximumFractionDigits: opts.decimals ?? 20,
      }).format(Number(value));
    case FORMATS.TOGGLE:
    case FORMATS.SWITCH:   return value ? 'Yes' : 'No';
    case FORMATS.CHECKBOX: return value ? '✓' : '✗';
    case FORMATS.CSV:
      return Array.isArray(value)
        ? value.map((v) => (v == null ? '' : String(v))).join(opts.separator ?? ', ')
        : String(value);
    default: return String(value);
  }
}

export function detectColumnType(rows, field) {
  for (const row of rows) {
    const val = row[field];
    if (val !== null && val !== undefined) {
      if (Array.isArray(val))      return 'array';
      if (typeof val === 'object') return 'object';
      return typeof val;
    }
  }
  return 'string';
}

export function columnHasNested(rows, field) {
  return rows.some((row) => row[field] !== null && typeof row[field] === 'object');
}

export function deriveColumnKeys(rows, config, path) {
  const allKeys = [...new Set(rows.flatMap(Object.keys))];
  return applySortOrder(allKeys, config.keys[path]?.keyOrder);
}
