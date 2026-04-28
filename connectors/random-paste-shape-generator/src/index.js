#!/usr/bin/env node
const readline = require('readline');

const rl = readline.createInterface({ input: process.stdin, terminal: false });

const SHAPES = [
  { key: 'circle', text: 'circle', emoji: '●', ascii: '( )' },
  { key: 'square', text: 'square', emoji: '■', ascii: '[ ]' },
  { key: 'triangle', text: 'triangle', emoji: '▲', ascii: '/_\\' },
  { key: 'diamond', text: 'diamond', emoji: '◆', ascii: '<>' },
  { key: 'star', text: 'star', emoji: '★', ascii: '*' },
  { key: 'heart', text: 'heart', emoji: '♥', ascii: '<3' },
  { key: 'hexagon', text: 'hexagon', emoji: '⬢', ascii: '/__\\' },
  { key: 'oval', text: 'oval', emoji: '⬭', ascii: '(   )' }
];

function send(obj) {
  process.stdout.write(JSON.stringify(obj) + '\n');
}

function getRandomShape() {
  return SHAPES[Math.floor(Math.random() * SHAPES.length)];
}

function buildPasteText(shape, format) {
  if (format === 'emoji') return shape.emoji;
  if (format === 'ascii') return shape.ascii;
  return shape.text;
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
        serverInfo: { name: 'random-paste-shape-generator-mcp', version: '1.0.0' }
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
          name: 'get_random_paste_shape',
          description: 'Returns one random shape in a paste-ready format.',
          inputSchema: {
            type: 'object',
            properties: {
              format: {
                type: 'string',
                enum: ['text', 'emoji', 'ascii'],
                description: 'Output format for the returned shape. Defaults to emoji.'
              }
            },
            additionalProperties: false
          }
        }]
      }
    });
    return;
  }

  if (method === 'tools/call') {
    const { name, arguments: args = {} } = params || {};

    if (name !== 'get_random_paste_shape') {
      send({ jsonrpc: '2.0', id, error: { code: -32601, message: 'Unknown tool' } });
      return;
    }

    const allowedKeys = ['format'];
    const extraKeys = Object.keys(args).filter((key) => !allowedKeys.includes(key));
    if (extraKeys.length > 0) {
      send({
        jsonrpc: '2.0',
        id,
        result: {
          content: [{ type: 'text', text: `Unexpected arguments: ${extraKeys.join(', ')}.` }],
          isError: true
        }
      });
      return;
    }

    const format = args.format ?? 'emoji';
    if (!['text', 'emoji', 'ascii'].includes(format)) {
      send({
        jsonrpc: '2.0',
        id,
        result: {
          content: [{ type: 'text', text: 'format must be one of: text, emoji, ascii.' }],
          isError: true
        }
      });
      return;
    }

    const shape = getRandomShape();
    const paste = buildPasteText(shape, format);
    send({
      jsonrpc: '2.0',
      id,
      result: {
        content: [{
          type: 'text',
          text: `Shape: ${shape.text}\nFormat: ${format}\nPaste: ${paste}`
        }]
      }
    });
    return;
  }

  send({ jsonrpc: '2.0', id: id ?? null, result: {} });
});
