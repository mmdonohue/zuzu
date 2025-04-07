// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Custom command to login
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/');
  cy.window().then((win) => {
    // Access the store directly from the window object
    const store = (win as any).__store__;
    
    // Dispatch a login action
    if (store) {
      store.dispatch({
        type: 'auth/login/fulfilled',
        payload: {
          user: {
            id: 'test-user-id',
            email,
            name: 'Test User',
          },
          session: {
            access_token: 'fake-access-token',
          },
        },
      });
    } else {
      // Fallback if store isn't available
      cy.log('Store not found in window, using UI login');
      // Implement UI login flow here
    }
  });
});

// Custom command to check if an element contains a class
Cypress.Commands.add('hasClass', { prevSubject: true }, (subject, className) => {
  cy.wrap(subject).should('have.class', className);
});

// Example custom command to check API response
Cypress.Commands.add('checkApiResponse', (endpoint: string, expectedStatus = 200) => {
  cy.request({
    url: `http://localhost:5000/api${endpoint}`,
    failOnStatusCode: false,
  }).then((response) => {
    expect(response.status).to.equal(expectedStatus);
  });
});

// Type definitions for custom commands
declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>;
      hasClass(className: string): Chainable<JQuery<HTMLElement>>;
      checkApiResponse(endpoint: string, expectedStatus?: number): Chainable<void>;
    }
  }
}