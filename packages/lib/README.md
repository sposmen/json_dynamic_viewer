# json-dynamic-viewer

A React library for rendering arbitrarily deep JSON with per-key configurable display behaviors and value formatting. Users expand nodes on demand, choose how each key is visualized, rename labels, and export the entire configuration for reuse.

**[Live demo →](https://www.jaime-giraldo.com/json_dynamic_viewer/)**

## Installation

```bash
# npm
npm install json-dynamic-viewer

# yarn
yarn add json-dynamic-viewer

# pnpm
pnpm add json-dynamic-viewer
```

Import the stylesheet once — typically in your app's root file:

```js
import 'json-dynamic-viewer/style.css';
```

## Basic usage

```jsx
import { JsonViewer } from 'json-dynamic-viewer';
import 'json-dynamic-viewer/style.css';

const data = {
  user: { name: 'Alice', age: 30, active: true },
  orders: [
    { id: 1, total: 149.99, paid: true },
    { id: 2, total: 89.00,  paid: false },
  ],
};

export default function App() {
  return <JsonViewer data={data} />;
}
```

`data` accepts either a plain JavaScript object or a raw JSON string — the library parses it internally.

---

## Examples

### 1 — Read-only viewer with a preset theme

```jsx
import { JsonViewer } from 'json-dynamic-viewer';
import 'json-dynamic-viewer/style.css';

export default function Inspector({ payload }) {
  return (
    <JsonViewer
      data={payload}
      theme="dark"
      configurable={false}
    />
  );
}
```

Available built-in themes: `"default"`, `"dark"`, `"ocean"`.

---

### 2 — Saving and restoring user configuration

Every behavior and format choice the user makes is captured in a plain config object. Persist it however you like and pass it back on the next visit.

```jsx
import { useState, useEffect } from 'react';
import { JsonViewer, createConfig, exportConfig, importConfig } from 'json-dynamic-viewer';
import 'json-dynamic-viewer/style.css';

const STORAGE_KEY = 'my-viewer-config';

export default function PersistentViewer({ data }) {
  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? importConfig(saved) : createConfig();
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, exportConfig(config));
  }, [config]);

  return (
    <JsonViewer
      data={data}
      config={config}
      onConfigChange={setConfig}
    />
  );
}
```

---

### 3 — Pre-configured layout (no UI interaction needed)

Build the config programmatically and pass it in. Users still see the interactive controls and can refine from there.

```jsx
import { JsonViewer, createConfig, setKeyConfig, BEHAVIORS, FORMATS } from 'json-dynamic-viewer';
import 'json-dynamic-viewer/style.css';

const data = {
  company: 'Acme Corp',
  founded: '1985-03-15',
  revenue: 4800000,
  active: true,
  employees: [
    { name: 'Alice', dept: 'Engineering', salary: 120000 },
    { name: 'Bob',   dept: 'Marketing',   salary: 95000  },
  ],
};

// Build config once, outside the component
let config = createConfig();
config = setKeyConfig(config, 'founded',           { format: FORMATS.DATE,     formatOptions: { dateStyle: 'long' } });
config = setKeyConfig(config, 'revenue',           { format: FORMATS.CURRENCY, formatOptions: { currency: 'USD' } });
config = setKeyConfig(config, 'active',            { format: FORMATS.SWITCH });
config = setKeyConfig(config, 'employees',         { behavior: BEHAVIORS.TABLE, label: 'Team' });
config = setKeyConfig(config, 'employees.salary',  { format: FORMATS.CURRENCY, formatOptions: { currency: 'USD' } });

export default function CompanyCard() {
  return <JsonViewer data={data} config={config} />;
}
```

---

### 4 — Custom theme

Pass any subset of CSS variable overrides as a plain object. They layer on top of the default theme.

```jsx
import { JsonViewer } from 'json-dynamic-viewer';
import 'json-dynamic-viewer/style.css';

const brandTheme = {
  '--jdv-font-family':        'Inter, system-ui, sans-serif',
  '--jdv-color-text':         '#1a1a2e',
  '--jdv-color-string':       '#e94560',
  '--jdv-color-number':       '#0f3460',
  '--jdv-color-accent':       '#e94560',
  '--jdv-color-bg':           '#f5f5f5',
  '--jdv-color-border':       '#dce1e7',
  '--jdv-color-section-border': '#e94560',
};

export default function BrandedViewer({ data }) {
  return <JsonViewer data={data} theme={brandTheme} />;
}
```

You can also start from a preset and override only what differs:

```jsx
import { JsonViewer, themes } from 'json-dynamic-viewer';

const myDark = {
  ...themes.dark,
  '--jdv-font-family': 'JetBrains Mono, monospace',
  '--jdv-color-string': '#ff79c6',
};

<JsonViewer data={data} theme={myDark} />
```

---

### 5 — Export and import config as a file

Let users download their configuration and reload it later.

```jsx
import { useState } from 'react';
import { JsonViewer, createConfig, exportConfig, importConfig } from 'json-dynamic-viewer';
import 'json-dynamic-viewer/style.css';

export default function ViewerWithConfigIO({ data }) {
  const [config, setConfig] = useState(createConfig());

  function handleExport() {
    const blob = new Blob([exportConfig(config)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    Object.assign(document.createElement('a'), { href: url, download: 'viewer-config.json' }).click();
    URL.revokeObjectURL(url);
  }

  function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    file.text().then((text) => setConfig(importConfig(text)));
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button onClick={handleExport}>Export config</button>
        <label>
          Import config
          <input type="file" accept=".json" hidden onChange={handleImport} />
        </label>
      </div>
      <JsonViewer data={data} config={config} onConfigChange={setConfig} />
    </div>
  );
}
```

---

### 6 — Pre-analysis before rendering

Inspect the full structure of a JSON document before the user interacts with it. Useful for building your own configuration UI or validating data shape.

```jsx
import { preAnalyze } from 'json-dynamic-viewer';

const data = {
  orders: [
    { id: 1, total: 99.99, address: { city: 'NYC', zip: '10001' } },
  ],
};

const map = preAnalyze(data);
console.log(map);
// {
//   "orders":              { kind: "array-of-objects", suggestedBehavior: "table"  },
//   "orders.0":            { kind: "object",            suggestedBehavior: "fields" },
//   "orders.0.id":         { kind: "primitive",          suggestedBehavior: "auto"  },
//   "orders.0.total":      { kind: "primitive",          suggestedBehavior: "auto"  },
//   "orders.0.address":    { kind: "object",             suggestedBehavior: "fields" },
//   "orders.0.address.city": { kind: "primitive",        suggestedBehavior: "auto"  },
//   ...
// }
```

---

### 7 — Per-key CSS targeting

Every rendered node gets a path-derived CSS class and a `data-jdv-path` attribute so you can style specific keys from your own stylesheet.

`pathToClass(path)` converts a dot-notation path to a valid CSS class:

| Path | Class |
|---|---|
| `"company.name"` | `"jdv-key--company__name"` |
| `"items[0].price"` | `"jdv-key--items-0__price"` |

Both the class and `data-jdv-path` are applied to every element that visually represents a key: node containers, section wrappers, field rows, list items, and primitive value spans.

```css
/* Highlight a specific field label by class */
.jdv-key--company__revenue .jdv-field-label {
  color: #0a7;
  font-weight: bold;
}

/* Target via data attribute — equivalent, attribute-based */
[data-jdv-path="company.headquarters"] .jdv-field-label {
  color: #07a;
}

/* Highlight an entire row */
.jdv-key--company__active {
  background: #fffbe6;
  border-radius: 4px;
  padding: 2px 4px;
}
```

Use `pathToClass` from the library to generate class names programmatically:

```js
import { pathToClass } from 'json-dynamic-viewer';

pathToClass('company.revenue')    // → "jdv-key--company__revenue"
pathToClass('items[0].price')     // → "jdv-key--items-0__price"

// Apply as a dynamic style rule:
const rule = `.${pathToClass('company.revenue')} .jdv-field-label { color: green; }`;
```

---

### 8 — Nested (recursive) JsonViewer

When you embed a `<JsonViewer>` inside another viewer's render tree, pass the `path` prop to connect it. The nested viewer will:

- Inherit the parent's `configurable` state
- Use the parent's config object with path-prefixed keys
- Route all config changes back to the parent

```jsx
import { JsonViewer } from 'json-dynamic-viewer';

const outer = {
  title: 'Dashboard',
  settings: { theme: 'dark', lang: 'en' },
};

const inner = {
  host: 'api.example.com',
  port: 443,
};

export default function App() {
  return (
    <JsonViewer data={outer}>
      {/* Rendered at path "settings.connection" in the outer config */}
      <JsonViewer data={inner} path="settings.connection" />
    </JsonViewer>
  );
}
```

Config keys for the nested viewer are stored as `"settings.connection.host"`, `"settings.connection.port"`, etc. inside the outer config — a single flat object covers the whole tree.

---

## `<JsonViewer>` props

| Prop | Type | Default | Description |
|---|---|---|---|
| `data` | `string \| object` | — | JSON to display. Strings are parsed internally. |
| `config` | `object` | internal | Controlled config. Requires `onConfigChange` when provided. |
| `onConfigChange` | `(config) => void` | — | Called with the full updated config on every user interaction. |
| `theme` | `string \| object` | `"default"` | Preset name (`"default"`, `"dark"`, `"ocean"`) or custom CSS-variable override object. |
| `configurable` | `boolean` | `true` | Show/hide the configuration UI (behavior pickers, format gears, label editors). |
| `path` | `string` | — | Mount path for nested viewers. When set inside a parent `JsonViewer`, inherits parent config and `configurable`. |

---

## Config shape

All display settings live in one flat, serializable object keyed by dot-notation path:

```js
{
  keys: {
    "order.items": {
      label:             "Line Items",    // renamed display label
      behavior:          "table",         // how to render non-primitive values
      collapsed:         false,           // initial collapsed state (sections)
      hidden:            false,           // false | 'value' | true — see below
      keyOrder:          ["name","id"],   // child key sort order (fields behavior)

      // Table-specific
      paginationSize:    25,              // null=auto (>50 rows), 0=off, N=rows/page
      paginationCounter: "rows",          // null | 'rows' | 'pages'
      tableTheme:        "midnight",      // null | 'simple' | 'midnight' | 'modern' | 'site' | 'site-dark'
      hozAlign:          "left",          // null | 'left' | 'center' | 'right' (per column)
    },
    "order.total": {
      format:            "currency",      // one of FORMATS
      formatOptions:     { currency: "USD", locale: "en-US" },
    },
    "order.paid":  { format: "switch" },
    "order.date":  { format: "date", formatOptions: { dateStyle: "medium" } },
  }
}
```

Use `setKeyConfig(config, path, patch)` to update immutably. Use `exportConfig` / `importConfig` to serialize.

### `hidden` option

Controls the visibility of a key:

| Value | Key visible | Value visible |
|---|---|---|
| `false` / not set | yes | yes |
| `'value'` | yes | no — shows `[hidden]` placeholder |
| `true` | no | no — entire row removed from DOM |

In `configurable` mode, a `⊙` button appears on hover next to each label to toggle between visible and `'value'`. Setting `hidden: true` (full removal) is only available via the config object — there is no UI to restore a fully-hidden row.

```js
config = setKeyConfig(config, 'user.password', { hidden: true });     // entire row removed
config = setKeyConfig(config, 'user.ssn',      { hidden: 'value' });  // label shows, value → [hidden]
```

---

## Key behaviors

Behaviors control how **object and array values** are rendered. The user selects a behavior per key via the dropdown that appears when a node is expanded.

| Behavior | Available for | Result |
|---|---|---|
| `auto` | both | Library decides based on content shape |
| `fields` | objects | Label/value grid |
| `section` | objects | Collapsible accordion heading |
| `list` | both | Vertical item list; objects show key as inline descriptor |
| `table` | arrays | [Tabulator.js](https://tabulator.info) table with per-column format pickers |
| `string` | arrays | Comma-separated inline text |

**Auto** mapping:

| Content | Resolved behavior |
|---|---|
| Object | `fields` |
| Array where every item is an object | `table` |
| Everything else | `list` |

---

## Primitive value formats

A `⚙` icon appears on hover for any leaf value. Click it to change the display format.

### String
| Format | Result | Options | Auto-detected |
|---|---|---|---|
| `text` | Raw string | — | — |
| `date` | `Intl.DateTimeFormat` (date only) | `dateStyle`, `locale` | Date-only strings e.g. `"1985-03-15"` |
| `datetime` | `Intl.DateTimeFormat` (date + time) | `dateStyle`, `timeStyle`, `locale` | Strings with time component e.g. `"2024-11-05T09:42:00Z"` |
| `number` | Parsed as number | — | — |
| `currency` | `Intl.NumberFormat` | `currency`, `locale` | — |
| `percentage` | Percent notation | `decimals`, `locale` | — |

Strings that parse as a valid date are automatically suggested as `date` or `datetime` based on whether a time component is present.

### Number
| Format | Result | Options | Auto-detected |
|---|---|---|---|
| `number` | Raw number | — | — |
| `currency` | `Intl.NumberFormat` | `currency`, `locale` | — |
| `percentage` | Percent notation | `decimals`, `locale` | — |
| `date` | `Intl.DateTimeFormat` (date only) | `dateStyle`, `locale` | — |
| `datetime` | `Intl.DateTimeFormat` (date + time) | `dateStyle`, `timeStyle`, `locale` | Unix timestamps (seconds or ms) in 2001–2100 range |

Numbers that fall within a valid Unix timestamp range (seconds: ~10 digits, milliseconds: ~13 digits, both within 2001–2100) are automatically suggested as `datetime`. The library auto-detects whether the value is in seconds or milliseconds.

### Boolean
| Format | Result |
|---|---|
| `checkbox` | Read-only native checkbox |
| `toggle` | Yes / No pill (green / red) |
| `switch` | CSS sliding switch |

---

## Table options

When a key is rendered with the `table` behavior, extra settings are available in the toolbar and stored in config.

### Pagination

| Config key | Type | Default | Description |
|---|---|---|---|
| `paginationSize` | `null \| 0 \| number` | `null` | `null` = auto-enable when >50 rows; `0` = always off; `N` = rows per page |
| `paginationCounter` | `null \| 'rows' \| 'pages'` | `null` | Counter style shown next to pagination controls |

```js
config = setKeyConfig(config, 'employees', {
  behavior:          BEHAVIORS.TABLE,
  paginationSize:    10,
  paginationCounter: 'rows',
});
```

### Table theme (visual style)

Tabulator ships several standard CSS themes. Set `tableTheme` on the array key to change the visual style:

| Value | Description |
|---|---|
| `null` (default) | Tabulator base style |
| `'simple'` | Clean, minimal borders |
| `'midnight'` | Dark background |
| `'modern'` | Bold headers, alternating rows |
| `'site'` | Tabulator website style (light) |
| `'site-dark'` | Tabulator website style (dark) |

```js
config = setKeyConfig(config, 'employees', {
  behavior:    BEHAVIORS.TABLE,
  tableTheme:  'midnight',
});
```

Multiple tables on the same page can use different themes independently.

### Column alignment

Set `hozAlign` on a **column key** (the child path, not the array key) to control horizontal text alignment inside that column. This can be done via the per-column settings panel in the table toolbar, or programmatically:

| Value | Description |
|---|---|
| `null` (default) | Tabulator default (left) |
| `'left'` | Left-aligned |
| `'center'` | Centered |
| `'right'` | Right-aligned |

```js
// Align the 'salary' column to the right inside the 'employees' table
config = setKeyConfig(config, 'employees.salary', { hozAlign: 'right' });
config = setKeyConfig(config, 'employees.id',     { hozAlign: 'center' });
```

---

## Per-key CSS targeting

Every rendered node receives:

- A `jdv-key--<sanitized-path>` CSS class (via `pathToClass()`)
- A `data-jdv-path="dot.notation.path"` attribute

This lets you style individual keys from any external stylesheet without touching the config object.

### Class name rules

`pathToClass(path)` applies these transforms:

1. `[N]` → `-N` (array index brackets become a dash-prefixed number)
2. `.` → `__` (dots become double underscores)
3. Non-alphanumeric/dash/underscore characters are removed

```
"company.name"     → "jdv-key--company__name"
"items[0].price"   → "jdv-key--items-0__price"
"a.b.c"            → "jdv-key--a__b__c"
```

### CSS examples

```css
/* Bold and green label for the revenue field */
.jdv-key--company__revenue .jdv-field-label {
  color: #0a7;
  font-weight: bold;
}

/* Attribute selector — equivalent, more readable for deeply nested paths */
[data-jdv-path="company.headquarters"] .jdv-field-label {
  color: #07a;
}

/* Highlight an entire field row */
.jdv-key--company__active {
  background: #fffbe6;
  border-radius: 4px;
  padding: 2px 4px;
}

/* Style a table column header */
.jdv-key--employees__salary .tabulator-col-title {
  color: #c00;
}
```

The demo app includes a live **Custom CSS** editor panel where you can try these selectors against the sample data in real time.

---

## Theming

All visual tokens are CSS custom properties declared on `.jdv-root`. You can override them globally in your own stylesheet:

```css
.jdv-root {
  --jdv-font-family:        system-ui, sans-serif;
  --jdv-color-string:       #e94560;
  --jdv-color-accent:       #0984e3;
}
```

Or pass overrides directly via the `theme` prop (scoped to that viewer instance).

### Available CSS variables

| Variable | Controls |
|---|---|
| `--jdv-font-family` | Font |
| `--jdv-font-size` | Base font size |
| `--jdv-color-text` | Main text |
| `--jdv-color-text-muted` | Metadata, arrows |
| `--jdv-color-text-label` | Key labels |
| `--jdv-color-string` | String values |
| `--jdv-color-number` | Number values |
| `--jdv-color-null` | Null values |
| `--jdv-color-date` | Date-formatted strings |
| `--jdv-color-error` | Parse errors |
| `--jdv-color-accent` | Custom labels, focus rings |
| `--jdv-color-bg` | Root background |
| `--jdv-color-hover` | Hover backgrounds |
| `--jdv-color-border` | Node body borders |
| `--jdv-color-section-border` | Section heading underline |
| `--jdv-color-bool-on-bg` / `--jdv-color-bool-on-text` | Toggle/switch on-state |
| `--jdv-color-bool-off-bg` / `--jdv-color-bool-off-text` | Toggle/switch off-state |

---

## API reference

```js
import {
  // Component
  JsonViewer,

  // Behaviors
  BEHAVIORS,        // { AUTO, SECTION, LIST, TABLE, FIELDS, STRING }

  // Formats
  FORMATS,          // { TEXT, DATE, DATETIME, NUMBER, CURRENCY, PERCENTAGE,
                    //   CHECKBOX, TOGGLE, SWITCH, CSV }
  FORMATS_BY_TYPE,  // { string: [...], number: [...], boolean: [...], array: [...] }

  // Config helpers (all pure / immutable)
  createConfig,     // () => empty config object
  getKeyConfig,     // (config, path) => key config object
  setKeyConfig,     // (config, path, patch) => new config
  exportConfig,     // (config) => JSON string
  importConfig,     // (jsonString) => config object

  // CSS path utilities
  pathToClass,      // (path) => "jdv-key--<sanitized>" CSS class name

  // Analysis
  preAnalyze,       // (node, maxDepth?) => flat dot-path map
  analyzeShallow,   // (node) => one-level map with childCount
  classifyValue,    // (value) => 'primitive' | 'object' | 'array-of-objects' | ...
  suggestBehavior,  // (value) => BEHAVIORS value

  // Themes
  themes,           // { default, dark, ocean }
} from 'json-dynamic-viewer';
```
