import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';

const DIST = 'dist/index.js';
const HANDSHAKE_TIMEOUT_MS = 5000;

function readJsonLines(stream, { timeoutMs, predicate }) {
  return new Promise((resolve, reject) => {
    let buf = '';
    const timer = setTimeout(
      () => reject(new Error(`timed out after ${timeoutMs}ms waiting for predicate match`)),
      timeoutMs,
    );
    const onData = (chunk) => {
      buf += chunk.toString('utf8');
      const lines = buf.split('\n');
      buf = lines.pop() ?? '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        let parsed;
        try {
          parsed = JSON.parse(trimmed);
        } catch {
          continue;
        }
        if (predicate(parsed)) {
          clearTimeout(timer);
          stream.removeListener('data', onData);
          resolve(parsed);
          return;
        }
      }
    };
    stream.on('data', onData);
    stream.once('close', () => {
      clearTimeout(timer);
      stream.removeListener('data', onData);
      reject(new Error('stream closed before predicate matched'));
    });
  });
}

function spawnServer() {
  if (!existsSync(DIST)) {
    throw new Error(`${DIST} not found — run \`npm run build\` before \`npm test\``);
  }
  return spawn(process.execPath, [DIST], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env },
  });
}

async function initializeServer(child) {
  const initReq = {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'smoke-test', version: '0.0.0' },
    },
  };

  child.stdin.write(JSON.stringify(initReq) + '\n');

  return readJsonLines(child.stdout, {
    timeoutMs: HANDSHAKE_TIMEOUT_MS,
    predicate: (m) => m.id === 1,
  });
}

async function callTool(child, id, name, args) {
  const req = {
    jsonrpc: '2.0',
    id,
    method: 'tools/call',
    params: {
      name,
      arguments: args,
    },
  };

  child.stdin.write(JSON.stringify(req) + '\n');

  return readJsonLines(child.stdout, {
    timeoutMs: HANDSHAKE_TIMEOUT_MS,
    predicate: (m) => m.id === id,
  });
}

test('server completes MCP initialize handshake', async (t) => {
  const child = spawnServer();
  t.after(() => {
    if (!child.killed) child.kill('SIGTERM');
  });

  const response = await initializeServer(child);

  assert.equal(response.jsonrpc, '2.0');
  assert.ok(response.result, 'initialize response must include result');
  assert.ok(typeof response.result.protocolVersion === 'string');
});

test('tools/list returns generate_random_number tool', async (t) => {
  const child = spawnServer();
  t.after(() => {
    if (!child.killed) child.kill('SIGTERM');
  });

  await initializeServer(child);
  child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');
  child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list' }) + '\n');

  const response = await readJsonLines(child.stdout, {
    timeoutMs: HANDSHAKE_TIMEOUT_MS,
    predicate: (m) => m.id === 2,
  });

  assert.ok(Array.isArray(response.result?.tools));
  const tool = response.result.tools.find((t) => t.name === 'generate_random_number');
  assert.ok(tool, 'generate_random_number must be registered');
  assert.equal(tool.inputSchema?.type, 'object');
  assert.ok(tool.description?.length > 0);
});

test('generate_random_number returns integer in default range', async (t) => {
  const child = spawnServer();
  t.after(() => {
    if (!child.killed) child.kill('SIGTERM');
  });

  await initializeServer(child);
  child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');
  const response = await callTool(child, 3, 'generate_random_number', {});

  assert.equal(response.jsonrpc, '2.0');
  assert.ok(Array.isArray(response.result?.content));
  const text = response.result.content[0]?.text ?? '';
  const match = text.match(/Random number: (-?\d+)/);
  assert.ok(match, 'response should contain a generated integer');
  const value = Number(match[1]);
  assert.equal(Number.isInteger(value), true);
  assert.equal(value >= 1 && value <= 100, true);
});

test('generate_random_number respects custom range', async (t) => {
  const child = spawnServer();
  t.after(() => {
    if (!child.killed) child.kill('SIGTERM');
  });

  await initializeServer(child);
  child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');
  const response = await callTool(child, 4, 'generate_random_number', { min: 500, max: 600 });

  const text = response.result.content[0]?.text ?? '';
  const match = text.match(/Random number: (-?\d+)/);
  assert.ok(match, 'response should contain a generated integer');
  const value = Number(match[1]);
  assert.equal(Number.isInteger(value), true);
  assert.equal(value >= 500 && value <= 600, true);
});

test('generate_random_number returns exact value for equal bounds', async (t) => {
  const child = spawnServer();
  t.after(() => {
    if (!child.killed) child.kill('SIGTERM');
  });

  await initializeServer(child);
  child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');
  const response = await callTool(child, 5, 'generate_random_number', { min: 42, max: 42 });

  const text = response.result.content[0]?.text ?? '';
  assert.equal(text, 'Random number: 42');
});

test('generate_random_number returns error when min is greater than max', async (t) => {
  const child = spawnServer();
  t.after(() => {
    if (!child.killed) child.kill('SIGTERM');
  });

  await initializeServer(child);
  child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');
  const response = await callTool(child, 6, 'generate_random_number', { min: 10, max: 5 });

  assert.equal(response.result?.isError, true);
  const text = response.result?.content?.[0]?.text ?? '';
  assert.match(text, /Invalid range/);
});
