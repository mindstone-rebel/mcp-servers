#!/usr/bin/env node
const readline = require('readline');

const rl = readline.createInterface({ input: process.stdin, terminal: false });

function send(obj) {
  process.stdout.write(JSON.stringify(obj) + '\n');
}

function randomUppercaseLetter() {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  return alphabet[Math.floor(Math.random() * alphabet.length)];
}

rl.on('line', (line) => {
  let msg;
  try {
    msg = JSON.parse(line.trim());
  } catch {
    return;
  }

  const { id, method, params } = msg;

  if (method === 'initialize') {
    send({
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: { name: 'random-letter-mcp', version: '1.0.0' }
      }
    });
    return;
  }

  if (method === 'notifications/initialized') {
    return;
  }

  if (method === 'tools/list') {
    send({
      jsonrpc: '2.0',
      id,
      result: {
        tools: [{
          name: 'get_random_letter',
          description: 'Returns a single random uppercase letter from A to Z.',
          inputSchema: {
            type: 'object',
            properties: {},
            additionalProperties: false
          }
        }]
      }
    });
    return;
  }

  if (method === 'tools/call') {
    const { name, arguments: args = {} } = params || {};

    if (name !== 'get_random_letter') {
      send({ jsonrpc: '2.0', id, error: { code: -32601, message: 'Unknown tool' } });
      return;
    }

    if (Object.keys(args).length > 0) {
      send({
        jsonrpc: '2.0',
        id,
        result: {
          content: [{ type: 'text', text: 'This tool does not take any arguments.' }],
          isError: true
        }
      });
      return;
    }

    const letter = randomUppercaseLetter();
    send({
      jsonrpc: '2.0',
      id,
      result: {
        content: [{ type: 'text', text: `Your random letter is ${letter}.` }]
      }
    });
    return;
  }

  send({ jsonrpc: '2.0', id: id ?? null, result: {} });
});
