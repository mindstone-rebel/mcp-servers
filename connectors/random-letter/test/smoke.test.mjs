import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';

const child = spawn('node', ['dist/index.js'], { stdio: ['pipe', 'pipe', 'inherit'] });
let buffer = '';
const responses = new Map();

child.stdout.on('data', (chunk) => {
  buffer += chunk.toString();
  let index;
  while ((index = buffer.indexOf('\n')) >= 0) {
    const line = buffer.slice(0, index).trim();
    buffer = buffer.slice(index + 1);
    if (!line) continue;
    const msg = JSON.parse(line);
    responses.set(msg.id, msg);
  }
});

function send(id, method, params) {
  child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
}

async function waitFor(id) {
  for (let i = 0; i < 50; i++) {
    if (responses.has(id)) return responses.get(id);
    await new Promise((r) => setTimeout(r, 20));
  }
  throw new Error(`Timed out waiting for response ${id}`);
}

send(1, 'initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'smoke-test', version: '1.0.0' } });
await waitFor(1);
send(2, 'tools/list', {});
const list = await waitFor(2);
assert.equal(list.result.tools[0].name, 'get_random_letter');
send(3, 'tools/call', { name: 'get_random_letter', arguments: {} });
const result = await waitFor(3);
assert.match(result.result.content[0].text, /^Your random letter is [A-Z]\.$/);
child.kill();
console.log('smoke test passed');
