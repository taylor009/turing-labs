# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies
pnpm install

# Development server
pnpm dev

# Build for production
pnpm build

# Run production server
pnpm start

# Run linting
pnpm lint

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run end-to-end tests
pnpm test:e2e

# Run e2e tests with UI mode
pnpm test:e2e:ui

# Debug e2e tests
pnpm test:e2e:debug
```

## Architecture

This is a Next.js 15 application with the following structure:

- **Framework**: Next.js App Router (app directory)
- **UI Components**: shadcn/ui with 40+ pre-built components in `components/ui/`
- **Styling**: Tailwind CSS with CSS variables for theming
- **Main Application**: `project-proposal.tsx` - A project proposal review interface for food product reformulation

### Key Patterns

1. **Component Structure**: All UI components follow shadcn/ui patterns with class-variance-authority for styling variants
2. **Path Aliases**: Use `@/` prefix for imports (e.g., `@/components/ui/button`)
3. **Forms**: Use React Hook Form with Zod validation when building forms
4. **Icons**: Use lucide-react for icons
5. **Dark Mode**: Supported via next-themes

### Build Configuration

The project has relaxed build settings in `next.config.mjs`:
- ESLint errors ignored during builds
- TypeScript errors ignored during builds
- Images are unoptimized

When developing, ensure code quality by running linting manually with `pnpm lint`.

## Testing

The project uses Jest with React Testing Library for unit testing. Test files are located in the `__tests__` directory with the following structure:

- `__tests__/components/auth/` - Authentication component tests
- `__tests__/components/project-proposal/` - Project proposal component tests  
- `__tests__/lib/` - Utility function tests

### Test Configuration

- **Jest Config**: `jest.config.js` with Next.js integration
- **Setup File**: `jest.setup.js` with mocks for Next.js, Supabase, and browser APIs
- **Coverage**: Configured to collect coverage from components, lib, and hooks directories

### Test Coverage

The test suite includes:
- **Auth components**: Login form, signup form, auth provider
- **Project proposal components**: Stakeholder status, header components
- **Utility functions**: CSS class merging utilities

### Running Tests

```bash
# Run all tests once
pnpm test

# Run tests in watch mode during development
pnpm test:watch

# Generate coverage report
pnpm test:coverage
```

## End-to-End Testing

The project uses Playwright for comprehensive end-to-end testing across multiple browsers and devices. E2E tests are located in the `e2e` directory.

### Test Structure

- `e2e/auth.spec.ts` - Authentication flow testing (login, signup, validation)
- `e2e/proposals.spec.ts` - Project proposal functionality and navigation
- `e2e/navigation.spec.ts` - Navigation, layout, and responsive design
- `e2e/ui-components.spec.ts` - UI component interactions and states

### Browser Coverage

Tests run across multiple browsers and devices:
- **Desktop**: Chromium, Firefox, WebKit (Safari)
- **Mobile**: Chrome (Pixel 5), Safari (iPhone 12)

### Test Features

- **Authentication Testing**: Login/signup forms, validation, state management
- **Component Interaction**: Buttons, inputs, forms, cards, icons
- **Navigation Flow**: Page routing, dashboard navigation, back/forward
- **Responsive Design**: Mobile, tablet, desktop viewports
- **Error Handling**: Network failures, JavaScript errors, missing resources
- **Loading States**: Form submission, page transitions, async operations

### Running E2E Tests

```bash
# Run all e2e tests headlessly
pnpm test:e2e

# Run with interactive UI mode
pnpm test:e2e:ui

# Debug mode with browser visible
pnpm test:e2e:debug

# Run with browser visible (headed mode)
pnpm test:e2e:headed

# Run single test with browser visible
pnpm test:e2e:single

# Run specific test file
npx playwright test e2e/auth.spec.ts --headed

# Run debug test specifically
npx playwright test e2e/debug.spec.ts --headed --debug

# Run in specific browser
npx playwright test --project=chromium --headed

# Show browser and run specific test
npx playwright test e2e/debug.spec.ts --headed --project=chromium
```