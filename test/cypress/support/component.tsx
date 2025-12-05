import "../../../src/app/globals.css";
import { AppRouterContext, AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { mount, MountOptions, MountReturn } from "cypress/react" // or 'cypress/react18'

// Create a mock router
const createMockRouter = (overrides: Partial<AppRouterInstance> = {}): AppRouterInstance => ({
    back: cy.stub().as("router:back"),
    forward: cy.stub().as("router:forward"),
    push: cy.stub().as("router:push"),
    replace: cy.stub().as("router:replace"),
    refresh: cy.stub().as("router:refresh"),
    prefetch: cy.stub().as("router:prefetch"),
    ...overrides,
});

// Augment the Cypress namespace
declare global {
    namespace Cypress {
        interface Chainable {
            mount(
                component: React.ReactNode,
                options?: MountOptions & { router?: Partial<AppRouterInstance> }
            ): Chainable<MountReturn>;
        }
    }
}

Cypress.Commands.add("mount", (component, options = {}) => {
    const { router, ...mountOptions } = options;

    // Create the mock router instance
    const mockRouter = createMockRouter(router);

    // Wrap the component with the AppRouterContext.Provider
    const wrapped = (
        <AppRouterContext.Provider value={mockRouter}>
            {component}
            </AppRouterContext.Provider>
    );

    return mount(wrapped, mountOptions);
});