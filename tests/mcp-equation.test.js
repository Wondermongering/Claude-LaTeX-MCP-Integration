const fs = require('fs');
const assert = require('assert');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, '../src/extensions/equation/equation-generator.ts'), 'utf8');
assert.ok(/quadratic formula/.test(content), 'quadratic formula pattern missing');
assert.ok(content.includes('\\\\frac{-b'), 'quadratic formula LaTeX missing');
console.log('mcp-equation test passed');
