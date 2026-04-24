# random-letter-mcp

A tiny local MCP server for Rebel that returns a new random uppercase letter on each call.

## What it does

Exposes one read-only tool:

- `get_random_letter` — returns a single random uppercase letter from A to Z.

## Authentication

No authentication is required.

## Running locally

Build the server:

```bash
npm run build
```

Register it in Rebel as a stdio connector pointing to:

```bash
node <absolute path to>/mcp-servers/random-letter-mcp/dist/index.js
```
