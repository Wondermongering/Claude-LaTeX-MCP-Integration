const fs = require('fs');
const assert = require('assert');

const path = require('path');
const content = fs.readFileSync(path.join(__dirname, '../src/index.ts'), 'utf8');
assert.ok(/export const equationTool/.test(content), 'equationTool export missing');
console.log('equation-tool test passed');
