# Testing in Blactify

This project uses a multi-layered testing strategy to ensure reliability.

## 1. Unit Testing (Vitest)
Used for testing utility functions, validation schemas, custom hooks, and standalone components.

- **Location**: `tests/unit/` or sibling to the file being tested (e.g., `src/lib/utils.test.ts`).
- **Framework**: [Vitest](https://vitest.dev/)
- **Libraries**: React Testing Library, jsdom.
- **Run**: `npm run test:unit`
- **Watch mode**: `npm run test:unit:watch`
- **Coverage**: `npm run test:unit:coverage`

## 2. Integration & E2E Testing (Playwright)
Used for testing user flows across multiple screens and sections.

- **Location**: `tests/`
- **Framework**: [Playwright](https://playwright.dev/)
- **Run**: `npm run test:e2e`

## Adding New Tests

### Unit Tests
Create a file named `*.test.ts` or `*.test.tsx`.
If testing a library: `src/lib/my-lib.test.ts`
If testing a component: `src/components/ui/MyComponent.test.tsx`

### Integration Tests
Create a file in `tests/` named `*.spec.ts`.

## Best Practices
- Mock external APIs and services (Firebase, Supabase) in unit tests using Vitest's `vi.mock()`.
- Aim for high coverage in core business logic (`src/lib`).
- Component tests should focus on user interactions and accessibility.
