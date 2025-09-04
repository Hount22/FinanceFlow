# Personal Finance Manager

## Overview

This is a modern full-stack personal finance management application built with React, TypeScript, Express, and PostgreSQL. The application provides comprehensive tools for tracking financial transactions, managing budgets, setting financial goals, and generating detailed reports. It features a clean, responsive UI built with shadcn/ui components and Tailwind CSS, offering users an intuitive way to monitor their financial health and make informed decisions.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Framework**: shadcn/ui components built on Radix UI primitives for accessible, customizable components
- **Styling**: Tailwind CSS with CSS variables for theming and responsive design
- **Charts**: Recharts library for financial data visualization and reporting
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js for RESTful API server
- **Language**: TypeScript with ES modules for modern JavaScript features
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Validation**: Zod for runtime type validation and schema enforcement
- **Development**: tsx for TypeScript execution in development mode

### Data Storage
- **Database**: PostgreSQL with Neon serverless database provider
- **Schema Management**: Drizzle Kit for database migrations and schema management
- **Tables**: Four main entities - transactions, categories, budgets, and goals
- **Data Types**: Decimal precision for financial amounts, proper date handling, and UUID primary keys
- **In-Memory Storage**: Development fallback using Map-based storage implementation

### API Design
- **Architecture**: RESTful API with standard HTTP methods (GET, POST, PUT, DELETE)
- **Endpoints**: Resource-based routing for transactions, budgets, categories, and goals
- **Validation**: Request body validation using Zod schemas
- **Error Handling**: Centralized error handling with proper HTTP status codes
- **Logging**: Request/response logging with performance metrics

### Authentication & Authorization
- Currently implements a basic structure without authentication
- Designed to be extensible for future user authentication implementation
- Session management placeholder with connect-pg-simple for PostgreSQL session storage

### UI/UX Design
- **Design System**: Consistent component library with neutral color scheme
- **Responsive Design**: Mobile-first approach with responsive breakpoints
- **Accessibility**: Built on Radix UI primitives for WCAG compliance
- **Icons**: Font Awesome icons for visual consistency
- **Typography**: Inter font family for modern, readable interface