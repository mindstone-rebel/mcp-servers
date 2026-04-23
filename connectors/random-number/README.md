# random-number-mcp MCP Server

A tiny local MCP server that generates a random integer within a requested inclusive range.

MCP (Model Context Protocol) server for random number generation. Compatible with any MCP host that speaks stdio transport.

## Requirements

- Node.js 18+
- npm
- No credentials required

## Install & build

```bash
npm install
npm run build
```

## Run locally

```bash
cp .env.example .env
npm start
```

The server communicates over stdio, so it does not print anything useful when run directly — point your MCP host at `dist/index.js`.

## Test

```bash
npm test
```

Runs the smoke and behaviour tests for the built server.

## Credentials

This connector does not require any credentials.

- `.env.example` is present only for consistency with the standard MCP starter template.
- No environment variables are required.

## Tools

- `generate_random_number(min?, max?)` — generates a random integer between `min` and `max`, inclusive. Defaults to `1` and `100` when omitted. Returns a text response containing the generated integer. If `min > max`, returns an MCP error response.

## Notes

- The tool is read-only and non-destructive.
- The output is intentionally simple because this connector is meant as a minimal local MCP example.

## License

FSL-1.1-MIT. See [LICENSE](LICENSE) for the full terms.