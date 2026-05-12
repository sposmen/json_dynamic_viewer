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

## `<JsonViewer>` props

| Prop | Type | Default | Description |
|---|---|---|---|
| `data` | `string \| object` | — | JSON to display. Strings are parsed internally. |
| `config` | `object` | internal | Controlled config. Requires `onConfigChange` when provided. |
| `onConfigChange` | `(config) => void` | — | Called with the full updated config on every user interaction. |
| `theme` | `string \| object` | `"default"` | Preset name (`"default"`, `"dark"`, `"ocean"`) or custom CSS-variable override object. |

---

## Config shape

All display settings live in one flat, serializable object keyed by dot-notation path:

```js
{
  keys: {
    "order.items": {
      label: "Line Items",           // renamed display label
      behavior: "table",             // how to render non-primitive values
    },
    "order.total": {
      format: "currency",            // how to format primitive values
      formatOptions: { currency: "USD", locale: "en-US" },
    },
    "order.paid":  { format: "switch" },
    "order.date":  { format: "date", formatOptions: { dateStyle: "medium" } },
  }
}
```

Use `setKeyConfig(config, path, patch)` to update immutably. Use `exportConfig` / `importConfig` to serialize.

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
| Format | Result | Options |
|---|---|---|
| `text` | Raw string | — |
| `date` | `Intl.DateTimeFormat` | `dateStyle`, `locale` |
| `number` | Parsed as number | — |
| `currency` | `Intl.NumberFormat` | `currency`, `locale` |
| `percentage` | Percent notation | `decimals`, `locale` |

Strings that parse as a valid date are automatically suggested as `date`.

### Number
| Format | Result | Options |
|---|---|---|
| `number` | Raw number | — |
| `currency` | `Intl.NumberFormat` | `currency`, `locale` |
| `percentage` | Percent notation | `decimals`, `locale` |

### Boolean
| Format | Result |
|---|---|
| `checkbox` | Read-only native checkbox |
| `toggle` | Yes / No pill (green / red) |
| `switch` | CSS sliding switch |

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
  FORMATS,          // { TEXT, DATE, NUMBER, CURRENCY, PERCENTAGE,
                    //   CHECKBOX, TOGGLE, SWITCH, CSV }
  FORMATS_BY_TYPE,  // { string: [...], number: [...], boolean: [...], array: [...] }

  // Config helpers (all pure / immutable)
  createConfig,     // () => empty config object
  getKeyConfig,     // (config, path) => key config object
  setKeyConfig,     // (config, path, patch) => new config
  exportConfig,     // (config) => JSON string
  importConfig,     // (jsonString) => config object

  // Analysis
  preAnalyze,       // (node, maxDepth?) => flat dot-path map
  analyzeShallow,   // (node) => one-level map with childCount
  classifyValue,    // (value) => 'primitive' | 'object' | 'array-of-objects' | ...
  suggestBehavior,  // (value) => BEHAVIORS value

  // Themes
  themes,           // { default, dark, ocean }
} from 'json-dynamic-viewer';
```
