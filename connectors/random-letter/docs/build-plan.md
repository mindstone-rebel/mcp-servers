# Build plan

## Goal
Build a minimal local Rebel connector that exposes one read-only MCP tool returning a random uppercase letter.

## Decisions
- Use a local stdio Node.js server.
- Keep the implementation dependency-free.
- Expose one tool: `get_random_letter`.
- Reject unexpected arguments.

## Validation plan
- Build with `npm run build`.
- Exercise initialize, tools/list, and repeated tools/call requests locally.
- Register in Rebel and verify live tool discovery and invocation through the MCP router.
