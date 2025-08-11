const { ESLint } = require('eslint');

(async function main() {
  const chalk = await import('chalk').then((m) => m.default);

  const eslint = new ESLint();
  const results = await eslint.lintFiles(['.']);

  const formatter = await eslint.loadFormatter('stylish');
  const resultText = formatter.format(results);

  const hasErrors = results.some((r) => r.errorCount > 0 || r.fatalErrorCount > 0);

  if (hasErrors) {
    console.error(resultText);
    process.exit(1);
  } else {
    console.log(chalk.green('✅ All good! No linting errors found.'));
  }
})();
