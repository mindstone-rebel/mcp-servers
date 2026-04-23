# random-number-mcp build plan

## Purpose
Refresh the existing local `random-number-mcp` so it meets the `build-custom-mcp-server` skill quality bar while staying intentionally minimal.

## Project location
`/Users/harry/mcp-servers/random-number-mcp`

## Registration target
Rebel server name: `random-number`

## Scope
- Single tool: `generate_random_number`
- Local stdio MCP server
- No external APIs
- No credentials or authentication
- Read-only, non-destructive behaviour

## Tool contract
### `generate_random_number`
- Inputs:
  - `min` integer, inclusive, default `1`
  - `max` integer, inclusive, default `100`
- Validation:
  - both values must be integers
  - `min` must be less than or equal to `max`
- Output:
  - one random integer in the inclusive range `[min, max]`

## Required refresh work
- Align `package.json` with starter-template expectations
- Add `LICENSE`
- Replace empty `README.md` with real documentation
- Add `docs/build-plan.md`
- Add baseline smoke test in `test/smoke.test.mjs`
- Add tool-behaviour tests for valid and invalid ranges
- Rebuild the project and verify registration in Rebel

## Test plan
- Build succeeds with `npm run build`
- Smoke test completes MCP initialize handshake
- `tools/list` returns at least one tool
- `generate_random_number` default range returns an integer within 1-100
- `generate_random_number` custom range returns an integer within the requested range
- `generate_random_number` with equal bounds returns that exact value
- `generate_random_number` with `min > max` returns an error response

## Ready state
The refresh is ready for testing when the missing template files and docs exist, package metadata is aligned, and the project builds cleanly.