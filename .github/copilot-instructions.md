# GitHub Copilot Instructions for the Kimino Hint Project

## Project Overview
This project is a React application built using Vite, featuring TypeScript and Mantine for UI components. The architecture is modular, with a clear separation of concerns across different features and shared components.

## Key Components
- **App Structure**: The application is organized into feature folders under `app/feat/`, with each feature containing its own components and screens. Shared components are located in `app/shared/`.
- **Routing**: The application uses `react-router-dom` for navigation, with routes defined in the main application file.
- **State Management**: The project utilizes `@tanstack/react-query` for data fetching and state management, ensuring efficient data handling across components.

## Development Workflows
- **Running the Application**: Use `npm run dev` to start the development server with hot module replacement (HMR).
- **Building for Production**: Run `npm run build` to compile the application for production.
- **Deploying**: Use `npm run deploy` to deploy the built application to GitHub Pages.
- **Linting**: Run `npm run lint` to check for code quality issues using ESLint.
- **Type Checking**: Use `npm run typecheck` to perform TypeScript type checks.

## Project Conventions
- **File Naming**: Components are named using PascalCase, while files are named in kebab-case (e.g., `event-live-screen.tsx`).
- **Styling**: CSS modules are used for component-specific styles, and global styles are defined in `styles/global.css`.

## Integration Points
- **API Communication**: The application communicates with external APIs using the `@yuki-js/quarkus-crud-js-fetch-client` package, which is configured in the `package.json`.
- **Component Communication**: Props are used for passing data between components, and context providers are utilized for global state management.

## External Dependencies
- **Vite**: The build tool used for development and production builds.
- **Mantine**: A React component library for building user interfaces.
- **React Router**: For handling routing within the application.

## Important Files
- **`vite.config.js`**: Configuration for Vite, including path aliases for easier imports.
- **`tsconfig.json`**: TypeScript configuration, defining compiler options and paths.
- **`eslint.config.js`**: ESLint configuration for maintaining code quality and consistency.

## Conclusion
This document serves as a guide for AI coding agents to understand the structure and workflows of the Kimino Hint project. For further assistance, refer to the README.md for setup instructions and additional context.