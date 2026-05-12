import { FORMATS } from '../../config.js';

export default function BooleanValue({ value, format = FORMATS.CHECKBOX }) {
  if (format === FORMATS.TOGGLE) {
    return (
      <span className={`jdv-bool-toggle ${value ? 'jdv-bool-on' : 'jdv-bool-off'}`}>
        {value ? 'Yes' : 'No'}
      </span>
    );
  }

  if (format === FORMATS.SWITCH) {
    return (
      <span className={`jdv-bool-switch ${value ? 'jdv-bool-on' : 'jdv-bool-off'}`} aria-checked={value} role="switch">
        <span className="jdv-bool-switch-thumb" />
      </span>
    );
  }

  // CHECKBOX (default)
  return (
    <input
      type="checkbox"
      className="jdv-bool-checkbox"
      checked={value}
      readOnly
      aria-label={String(value)}
    />
  );
}