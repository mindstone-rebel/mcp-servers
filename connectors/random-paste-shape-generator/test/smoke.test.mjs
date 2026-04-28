import { spawn } from 'node:child_process';
import { once } from 'node:events';
import assert from 'node:assert/strict';

const child = spawn('node', ['dist/index.js'], {
  cwd: new URL('..', import.meta.url).pathname,
  stdio: ['pipe', 'pipe', 'inherit']
});

let buffer = '';
const messages = [];
child.stdout.setEncoding('utf8');
child.stdout.on('data', (chunk) => {
  buffer += chunk;
  let idx;
  while ((idx = buffer.indexOf('\n')) >= 0) {
    const line = buffer.slice(0, idx).trim();
    buffer = buffer.slice(idx + 1);
    if (line) messages.push(JSON.parse(line));
  }
});

function send(message) {
  child.stdin.write(JSON.stringify(message) + '\n');
}

async function waitForMessage(id) {
  for (;;) {
    const existing = messages.find((m) => m.id === id);
    if (existing) return existing;
    await once(child.stdout, 'data');
  }
}

send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: {} });
const init = await waitForMessage(1);
assert.equal(init.result.serverInfo.name, 'random-paste-shape-generator-mcp');

send({ jsonrpc: '2.0', method: 'notifications/initialized' });
send({ jsonrpc: '2.0', id: 2, method: 'tools/list' });
const list = await waitForMessage(2);
assert.equal(list.result.tools[0].name, 'get_random_paste_shape');

send({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'get_random_paste_shape', arguments: { format: 'emoji' } } });
const call = await waitForMessage(3);
const text = call.result.content[0].text;
assert.match(text, /^Shape: .+\nFormat: emoji\nPaste: .+$/);

child.kill();
