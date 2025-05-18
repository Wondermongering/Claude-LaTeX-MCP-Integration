try {
  require('./equation-tool.test.js');
  require('./health-endpoint.test.js');
  require('./mcp-equation.test.js');
  console.log('All tests passed');
} catch (err) {
  console.error('Tests failed');
  console.error(err);
  process.exit(1);
}
