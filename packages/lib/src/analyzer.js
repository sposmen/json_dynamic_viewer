import { BEHAVIORS } from './config.js';

/**
 * Classifies a value's content type to a suggested behavior.
 */
export function classifyValue(value) {
  if (value === null || typeof value !== 'object') {
    return 'primitive';
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return 'empty-array';
    const allObjects = value.every((item) => item !== null && typeof item === 'object' && !Array.isArray(item));
    return allObjects ? 'array-of-objects' : 'array-mixed';
  }
  return 'object';
}

export function suggestBehavior(value) {
  const kind = classifyValue(value);
  switch (kind) {
    case 'array-of-objects': return BEHAVIORS.TABLE;
    case 'array-mixed':      return BEHAVIORS.LIST;
    case 'object':           return BEHAVIORS.FIELDS;
    default:                 return BEHAVIORS.AUTO;
  }
}

/**
 * Pre-analyses one level of a JSON node without recursing into children.
 * Returns a map of { key: { kind, suggestedBehavior, childCount } }.
 */
export function analyzeShallow(node) {
  if (node === null || typeof node !== 'object') return {};

  const entries = Array.isArray(node)
    ? node.map((v, i) => [String(i), v])
    : Object.entries(node);

  return Object.fromEntries(
    entries.map(([key, value]) => {
      const kind = classifyValue(value);
      const childCount = value !== null && typeof value === 'object'
        ? Array.isArray(value) ? value.length : Object.keys(value).length
        : 0;
      return [key, { kind, suggestedBehavior: suggestBehavior(value), childCount }];
    })
  );
}

/**
 * Walks the entire JSON tree up to maxDepth and returns a flat map of
 * dot-notation paths to their analysis metadata.
 * Used for the pre-render overview — does NOT render anything.
 */
export function preAnalyze(node, maxDepth = 5, _path = '', _depth = 0) {
  if (_depth >= maxDepth || node === null || typeof node !== 'object') return {};

  const entries = Array.isArray(node)
    ? node.map((v, i) => [String(i), v])
    : Object.entries(node);

  const result = {};
  for (const [key, value] of entries) {
    const path = _path ? `${_path}.${key}` : key;
    const kind = classifyValue(value);
    result[path] = { kind, suggestedBehavior: suggestBehavior(value) };
    if (value !== null && typeof value === 'object') {
      Object.assign(result, preAnalyze(value, maxDepth, path, _depth + 1));
    }
  }
  return result;
}
