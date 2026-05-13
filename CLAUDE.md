# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Start demo app (hot-reload, no lib build needed)
npm run dev

# Build the library to packages/lib/dist/
npm run build:lib

# Build everything
npm run build
```

All commands run from the repo root via npm workspaces. No separate installs needed inside packages.

## Architecture

npm workspaces monorepo with two packages:

- **`packages/lib`** — the React library (pure JS/JSX, Vite)
- **`packages/demo`** — Vite React demo app

The demo aliases `json-dynamic-viewer` directly to `packages/lib/src/index.js` (see `packages/demo/vite.config.js`), so development never requires a lib build step.

### Library data flow

```
JsonViewer (root)
  └─ ViewerContext  ← config, onConfigChange, renderNode
       └─ JsonNode  ← one per key, lazy: children only mount on first expand
            └─ <*Behavior>  ← chosen based on effective behavior for that path
```

**`JsonViewer`** accepts `data` (JSON string or object), an optional controlled `config`, and an optional `onConfigChange` callback. Without the callback it manages config internally.

**`JsonNode`** resolves which behavior to render via a priority chain:
1. Local `resolvedBehavior` state (set by the behavior dropdown)
2. `config.keys[path].behavior` (from saved config)
3. `BEHAVIORS.AUTO` → `suggestBehavior(value)` (analyzer picks based on value shape)

Children are never mounted until the user clicks expand — this is the lazy-loading mechanism.

### Config shape

All per-key configuration lives in one flat object keyed by dot-notation path:

```js
{
  keys: {
    "company.departments": { label: "Depts", behavior: "table", collapsed: false },
    "company.revenue":     { format: "currency", formatOptions: { currency: "USD", locale: "en-US" } },
    "company.active":      { format: "switch" },
    "company.founded":     { format: "date", formatOptions: { dateStyle: "medium" } }
  }
}
```

Use `setKeyConfig(config, path, patch)` (immutable) to update. `exportConfig` / `importConfig` serialize to/from JSON string.

#### `hidden` option

Controls visibility of a key:

| Value | Key visible | Value visible |
|---|---|---|
| `false` / not set | yes | yes |
| `'value'` | yes | no — shows `[hidden]` |
| `true` | no | no — entire row removed |

```js
{
  keys: {
    "user.password": { hidden: true },    // entire row invisible
    "user.ssn":      { hidden: 'value' }, // label shows, value shows [hidden]
  }
}
```

In `configurable` mode, a `⊙` button appears on hover next to each label to toggle between visible and `hidden: 'value'`. Setting `hidden: true` (fully remove a row) is only available via the config object — there is no UI to restore a fully hidden row since it has no visible element to click.

### Primitive formatting

Primitives render through `PrimitiveNode` → type-specific component. A `⚙` gear button (visible on hover) opens an inline format picker. Resetting format also clears `formatOptions`.

| JS type | Available formats | Extra options |
|---|---|---|
| `string` (short) | `text`, `date` | `dateStyle`, `locale` |
| `number` | `number`, `currency`, `percentage` | `currency`, `locale`, `decimals` |
| `boolean` | `checkbox`, `toggle`, `switch` | — |

`isLikelyDate(value)` in `StringValue.jsx` auto-detects date strings to set the initial suggested format. `FORMATS_BY_TYPE` maps JS type names to their available format arrays.

### Behaviors (`packages/lib/src/components/behaviors/`)

| Behavior | When used | Component |
|---|---|---|
| `fields` | plain object | grid of label/value rows |
| `list` | mixed array or array of primitives | `<ul>` list |
| `table` | array-of-objects | Tabulator.js instance |
| `section` | any non-primitive | collapsible heading wrapper |
| `auto` | fallback | delegates to `suggestBehavior()` |

`TableBehavior` creates and destroys the Tabulator instance in `useEffect`. Columns are derived dynamically from the union of all row keys via `deriveColumns`.

### Analyzer (`packages/lib/src/analyzer.js`)

- `classifyValue(value)` → `'primitive' | 'object' | 'array-of-objects' | 'array-mixed' | 'empty-array'`
- `suggestBehavior(value)` → a `BEHAVIORS` value
- `preAnalyze(node, maxDepth?)` → flat map of `{ path: { kind, suggestedBehavior } }` for the whole tree — used by the demo's pre-analysis panel, not called during rendering

### CSS conventions

All library classes are prefixed `jdv-`. Styles live in `packages/lib/src/styles.css` and are imported by `JsonViewer.jsx` so they bundle into `dist/style.css`.

#### Per-key CSS targeting

Every rendered node gets a sanitized CSS class and a `data-jdv-path` attribute so consumers can style specific keys:

```css
/* class-based (use pathToClass() to generate) */
.jdv-key--user__profile { border-left: 2px solid blue; }

/* attribute-based */
[data-jdv-path="company.revenue"] .jdv-field-label { color: green; }
```

`pathToClass(path)` (exported from the library) converts dot-notation paths to valid CSS class names:
- `"company.name"` → `"jdv-key--company__name"`
- `"items[0].price"` → `"jdv-key--items-0__price"`

The class and `data-jdv-path` attribute are applied to every element that visually represents a key: node containers, section wrappers, field rows, list items, and primitive value spans.
