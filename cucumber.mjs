// https://github.com/cucumber/cucumber-js/blob/main/docs/configuration.md
const config = {
  import: ['src/**/*.(!spec).ts', 'tests/**/*.ts'],
  paths: ['tests/**/*.feature'],
  format: [
    'json:reports/cucumber-report.json',
    'html:reports/index.html',
    'summary',
    'progress-bar',
    '@cucumber/pretty-formatter',
  ],
  formatOptions: { snippetInterface: 'async-await' },
};

export default config;
