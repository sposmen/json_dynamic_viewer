/**
 * Behavior options for a key node.
 * - 'auto'    : library decides based on content type
 * - 'section' : renders as a collapsible section heading
 * - 'list'    : renders array items as a vertical list
 * - 'table'   : renders array-of-objects via Tabulator
 * - 'fields'  : renders object properties as labeled field rows
 */
export const BEHAVIORS = Object.freeze({
  AUTO: 'auto',
  SECTION: 'section',
  LIST: 'list',
  TABLE: 'table',
  FIELDS: 'fields',
  STRING: 'string',   // arrays only — renders elements as a comma-separated string
});

/**
 * Format options for primitive values, grouped by detected JS type.
 *
 * string  → TEXT | DATE
 * number  → NUMBER | CURRENCY | PERCENTAGE
 * boolean → CHECKBOX | TOGGLE | SWITCH
 */
export const FORMATS = Object.freeze({
  // string
  TEXT:       'text',
  DATE:       'date',
  // number
  NUMBER:     'number',
  CURRENCY:   'currency',
  PERCENTAGE: 'percentage',
  // boolean
  CHECKBOX:   'checkbox',
  TOGGLE:     'toggle',
  SWITCH:     'switch',
  // array (table cells only)
  CSV:        'csv',
});

export const FORMATS_BY_TYPE = Object.freeze({
  string:  [FORMATS.TEXT, FORMATS.DATE, FORMATS.NUMBER, FORMATS.CURRENCY, FORMATS.PERCENTAGE],
  number:  [FORMATS.NUMBER, FORMATS.CURRENCY, FORMATS.PERCENTAGE],
  boolean: [FORMATS.CHECKBOX, FORMATS.TOGGLE, FORMATS.SWITCH],
  array:   [FORMATS.CSV],
});

/**
 * Creates a default empty viewer configuration.
 *
 * Full key config shape:
 *   {
 *     keys: {
 *       "dot.notation.path": {
 *         label?:         string,   // display name override
 *         behavior?:      string,   // one of BEHAVIORS (non-primitives)
 *         collapsed?:     boolean,  // initial collapsed state
 *         format?:        string,   // one of FORMATS (primitives)
 *         formatOptions?: {
 *           // date
 *           dateStyle?: 'full'|'long'|'medium'|'short',
 *           // currency
 *           locale?:    string,   // e.g. 'en-US'
 *           currency?:  string,   // e.g. 'USD'
 *           // percentage
 *           decimals?:  number,
 *         }
 *       }
 *     }
 *   }
 */
export function createConfig(overrides = {}) {
  return {
    keys: {},
    ...overrides,
  };
}

export function getKeyConfig(config, path) {
  return config.keys[path] ?? {};
}

export function setKeyConfig(config, path, patch) {
  return {
    ...config,
    keys: {
      ...config.keys,
      [path]: { ...(config.keys[path] ?? {}), ...patch },
    },
  };
}

export function applySortOrder(keys, keyOrder) {
  if (!keyOrder || keyOrder.length === 0) return keys;
  const inOrder = keyOrder.filter((k) => keys.includes(k));
  const rest    = keys.filter((k) => !keyOrder.includes(k));
  return [...inOrder, ...rest];
}

export function exportConfig(config) {
  return JSON.stringify(config, null, 2);
}

export function importConfig(json) {
  return JSON.parse(json);
}
