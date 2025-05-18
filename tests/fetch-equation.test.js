const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

module.exports = async function() {
  const code = fs.readFileSync(path.join(__dirname, '../src/overleaf/background.js'), 'utf8');

  const sandbox = {
    chrome: {
      runtime: {
        onInstalled: { addListener: () => {} },
        onMessage: { addListener: () => {} }
      },
      storage: {
        sync: {
          get: async () => ({ apiUrl: 'http://localhost:1234', apiEndpoint: '/mcp' })
        }
      }
    },
    fetch: async (url, options) => {
      sandbox.called = { url, options };
      return { ok: true, json: async () => ({ result: { latex: 'ok' } }) };
    },
    console
  };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  const fetchEquation = sandbox.fetchEquation;
  assert.strictEqual(typeof fetchEquation, 'function', 'fetchEquation should be defined');

  await fetchEquation({ text: 'E=mc^2', format: 'display', numbered: true });

  const { url, options } = sandbox.called;
  assert.strictEqual(url, 'http://localhost:1234/mcp');
  const body = JSON.parse(options.body);
  assert.deepStrictEqual(body, {
    type: 'ExecuteTool',
    tool: 'generate-latex-equation',
    parameters: {
      description: 'E=mc^2',
      format: 'display',
      numbered: true
    }
  });
  console.log('fetchEquation test passed');
};
