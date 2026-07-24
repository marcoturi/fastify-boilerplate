// https://github.com/cucumber/cucumber-js/blob/main/docs/configuration.md
const config = {
  import: ['tests/support/**/*.ts', 'tests/**/*.steps.ts'],
  paths: ['tests/**/*.feature'],
  // Only one formatter may target stdout (the last wins); keep `pretty` there and
  // send the machine-readable reports to files.
  format: ['json:reports/cucumber-report.json', 'html:reports/index.html', 'pretty'],
  formatOptions: { snippetInterface: 'async-await' },
};

export default config;
