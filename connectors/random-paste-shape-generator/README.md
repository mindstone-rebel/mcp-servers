# random-paste-shape-generator-mcp

A tiny local MCP server for Rebel that returns a random paste-ready shape.

## What it does

Exposes one read-only tool:

- `get_random_paste_shape` — returns a random shape in `emoji`, `ascii`, or `text` format.

## Authentication

No authentication is required.

## Running locally

Build the server:

```bash
npm run build
```

Register it in Rebel as a stdio connector pointing to:

```bash
node <absolute path to>/mcp-servers/random-paste-shape-generator-mcp/dist/index.js
```
