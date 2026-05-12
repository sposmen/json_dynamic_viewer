# json-dynamic-viewer

npm workspaces monorepo for the `json-dynamic-viewer` React library.

| Package | Description |
|---|---|
| [`packages/lib`](packages/lib) | The publishable React library — see its README for full API docs |
| [`packages/demo`](packages/demo) | Vite demo app ([live →](https://www.jaime-giraldo.com/json_dynamic_viewer/)) |

## Development

```bash
# Start demo app with hot-reload (no lib build needed)
npm run dev

# Build the library to packages/lib/dist/
npm run build:lib

# Build everything
npm run build
```