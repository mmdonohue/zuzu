// ***********************************************************
// This support/e2e.ts file is processed and loaded automatically 
// before your test files.
//
// This file can be used to configure all e2e tests and
// create custom commands.
// ***********************************************************

// Import commands.ts using ES2015 syntax
import './commands';

// Example of globally available data for tests
declare global {
  namespace Cypress {
    interface Cypress {
      env(key: 'apiUrl'): string;
      env(key: 'adminUser'): { email: string; password: string };
      env(key: 'regularUser'): { email: string; password: string };
      env(key: string): any;
    }
  }
}

// Cypress configuration and overrides
Cypress.on('uncaught:exception', (err, runnable) => {
  // Returning false here prevents Cypress from failing the test
  // This is useful when testing third-party libraries that throw uncaught exceptions
  return false;
});