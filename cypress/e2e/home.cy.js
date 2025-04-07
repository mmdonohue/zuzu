describe('Home Page', () => {
  beforeEach(() => {
    // Visit the homepage before each test
    cy.visit('/');
  });

  it('should display the hero section with correct title', () => {
    cy.contains('h1', 'Welcome to ZuZu');
    cy.contains('A React scaffold application for integrating multiple tech stacks');
  });

  it('should have navigation buttons in hero section', () => {
    cy.contains('button', 'Dashboard').should('be.visible');
    cy.contains('button', 'Learn More').should('be.visible');
  });

  it('should navigate to the dashboard when clicking the Dashboard button', () => {
    cy.contains('button', 'Dashboard').click();
    cy.url().should('include', '/dashboard');
    cy.contains('h1', 'Dashboard');
  });

  it('should display the technologies section', () => {
    cy.contains('h2', 'Integrated Technologies');
    
    // Check if all technologies are present
    const technologies = [
      'React',
      'MUI',
      'TypeScript',
      'Redux',
      'Tailwind CSS',
      'Webpack',
      'Express',
      'TanStack Query',
      'Cypress',
      'Supabase'
    ];
    
    technologies.forEach(tech => {
      cy.contains('h3', tech);
    });
  });

  it('should have a working navigation menu', () => {
    // Check if the header has the navigation links
    cy.contains('ZuZu');
    cy.contains('a', 'Home');
    cy.contains('a', 'About');
    cy.contains('a', 'Dashboard');
    
    // Click on About and check if it navigates correctly
    cy.contains('a', 'About').click();
    cy.url().should('include', '/about');
    cy.contains('h1', 'About ZuZu');
  });

  it('should have a footer with correct content', () => {
    cy.get('footer').within(() => {
      cy.contains('ZuZu');
      cy.contains('Copyright');
      cy.contains('a', 'Home');
      cy.contains('a', 'About');
      cy.contains('a', 'Dashboard');
    });
  });
});