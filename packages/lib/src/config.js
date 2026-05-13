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
 * string  → TEXT | DATE | DATETIME
 * number  → NUMBER | CURRENCY | PERCENTAGE | DATE | DATETIME
 * boolean → CHECKBOX | TOGGLE | SWITCH
 */
export const FORMATS = Object.freeze({
  // string / temporal
  TEXT:       'text',
  DATE:       'date',
  DATETIME:   'datetime',
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
  string:  [FORMATS.TEXT, FORMATS.DATE, FORMATS.DATETIME, FORMATS.NUMBER, FORMATS.CURRENCY, FORMATS.PERCENTAGE],
  number:  [FORMATS.NUMBER, FORMATS.CURRENCY, FORMATS.PERCENTAGE, FORMATS.DATE, FORMATS.DATETIME],
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
 *         label?:         string,            // display name override
 *         behavior?:      string,            // one of BEHAVIORS (non-primitives)
 *         collapsed?:     boolean,           // initial collapsed state
 *         hidden?:            false|'value'|true,    // false=visible; 'value'=show key, hide content; true=hide entirely
 *         paginationSize?:    null|0|number,         // null=auto (on if >50 rows), 0=off, N=rows per page (tables only)
 *         paginationCounter?: null|'rows'|'pages',   // row/page counter style (tables only)
 *         tableTheme?:        null|'simple'|'midnight'|'modern'|'site'|'site-dark', // Tabulator CSS theme (tables only)
 *         hozAlign?:          null|'left'|'center'|'right', // column horizontal alignment (table columns only)
 *         format?:            string,                // one of FORMATS (primitives)
 *         formatOptions?: {
 *           // date / datetime
 *           dateStyle?: 'full'|'long'|'medium'|'short',
 *           timeStyle?: 'full'|'long'|'medium'|'short',  // datetime only
 *           // currency / number
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

/**
 * Converts a dot-notation path to a valid CSS class segment.
 * "company.items[0].name" → "jdv-key--company__items-0__name"
 */
export function pathToClass(path) {
  const sanitized = path
    .replace(/\[(\d+)\]/g, '-$1')
    .replace(/\./g, '__')
    .replace(/[^a-zA-Z0-9_-]/g, '');
  return 'jdv-key--' + sanitized;
}

export function exportConfig(config) {
  return JSON.stringify(config, null, 2);
}

export function importConfig(json) {
  return JSON.parse(json);
}
