import { FORMATS } from '../../config.js';

// Unix seconds: ~2001–2096; Unix milliseconds: same range × 1000
const TS_SEC_MIN = 978307200;    // 2001-01-01
const TS_SEC_MAX = 4102444800;   // 2100-01-01
const TS_MS_MIN  = TS_SEC_MIN * 1000;
const TS_MS_MAX  = TS_SEC_MAX * 1000;

export function isLikelyTimestamp(value) {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) return false;
  return (value >= TS_SEC_MIN && value <= TS_SEC_MAX) ||
         (value >= TS_MS_MIN  && value <= TS_MS_MAX);
}

// Converts a numeric timestamp to a Date, auto-detecting seconds vs milliseconds
function timestampToDate(value) {
  const ms = value >= TS_MS_MIN ? value : value * 1000;
  return new Date(ms);
}

export default function NumberValue({ value, format = FORMATS.NUMBER, options = {} }) {
  const locale = options.locale ?? 'en-US';

  if (format === FORMATS.CURRENCY) {
    const formatted = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: options.currency ?? 'USD',
    }).format(value);
    return <span className="jdv-type-number jdv-format-currency">{formatted}</span>;
  }

  if (format === FORMATS.PERCENTAGE) {
    const decimals = options.decimals ?? 2;
    const formatted = new Intl.NumberFormat(locale, {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value / 100);
    return <span className="jdv-type-number jdv-format-percentage">{formatted}</span>;
  }

  if (format === FORMATS.DATE) {
    const d = timestampToDate(value);
    if (isNaN(d)) return <span className="jdv-type-number jdv-format-error">{value} (invalid timestamp)</span>;
    const formatted = new Intl.DateTimeFormat(options.locale ?? 'default', {
      dateStyle: options.dateStyle ?? 'medium',
    }).format(d);
    return <span className="jdv-type-number jdv-format-date">{formatted}</span>;
  }

  if (format === FORMATS.DATETIME) {
    const d = timestampToDate(value);
    if (isNaN(d)) return <span className="jdv-type-number jdv-format-error">{value} (invalid timestamp)</span>;
    const formatted = new Intl.DateTimeFormat(options.locale ?? 'default', {
      dateStyle: options.dateStyle ?? 'medium',
      timeStyle: options.timeStyle ?? 'short',
    }).format(d);
    return <span className="jdv-type-number jdv-format-date">{formatted}</span>;
  }

  return <span className="jdv-type-number">{value}</span>;
}