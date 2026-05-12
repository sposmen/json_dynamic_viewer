import { FORMATS } from '../../config.js';

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

  return <span className="jdv-type-number">{value}</span>;
}