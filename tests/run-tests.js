try {
  require('./equation-tool.test.js');
  console.log('All tests passed');
} catch (err) {
  console.error('Tests failed');
  console.error(err);
  process.exit(1);
}
