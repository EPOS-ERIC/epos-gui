import { defineConfig } from 'cypress';

export default defineConfig({
  videosFolder: 'cypress/videos',
  screenshotsFolder: 'cypress/screenshots',
  fixturesFolder: 'cypress/fixtures',
  video: false,
  screenshotOnRunFailure: false,
  defaultCommandTimeout: 4000,
  viewportWidth: 1920,
  viewportHeight: 1200,
  e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    // eslint-disable-next-line prefer-arrow/prefer-arrow-functions
    setupNodeEvents(on, config) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
      return require('./cypress/plugins/index.js')(on, config);
    },
    baseUrl: 'http://localhost:4200/testpath',
    experimentalStudio: true,
  },
});
