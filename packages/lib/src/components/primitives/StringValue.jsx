import { FORMATS } from '../../config.js';
import NumberValue from './NumberValue.jsx';

const SHORT_THRESHOLD = 40;

export function isLikelyDate(value) {
  if (typeof value !== 'string' || value.length > SHORT_THRESHOLD) return false;
  return !isNaN(Date.parse(value));
}

export function isShortString(value) {
  return typeof value === 'string' && value.length <= SHORT_THRESHOLD;
}

const NUMERIC_FORMATS = new Set([FORMATS.NUMBER, FORMATS.CURRENCY, FORMATS.PERCENTAGE]);

export default function StringValue({ value, format = FORMATS.TEXT, options = {} }) {
  if (format === FORMATS.DATE) {
    const d = new Date(value);
    if (isNaN(d)) return <span className="jdv-type-string jdv-format-error">{value} (invalid date)</span>;
    const formatted = new Intl.DateTimeFormat(options.locale ?? 'default', {
      dateStyle: options.dateStyle ?? 'medium',
    }).format(d);
    return <span className="jdv-type-string jdv-format-date">{formatted}</span>;
  }

  if (NUMERIC_FORMATS.has(format)) {
    const parsed = Number(value);
    if (isNaN(parsed)) return <span className="jdv-type-string jdv-format-error">{value} (not a number)</span>;
    return <NumberValue value={parsed} format={format} options={options} />;
  }

  return <span className="jdv-type-string">{value}</span>;
}
