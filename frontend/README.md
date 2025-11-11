# Fuel EU Maritime - Frontend

## Overview

A Next.js frontend application for the Fuel EU Maritime compliance platform, built with React, TypeScript, and TailwindCSS following hexagonal architecture principles.

## Architecture

The frontend follows hexagonal (ports & adapters) architecture:

```
src/
  core/
    domain/          # Domain entities (RouteEntity, ComplianceEntity, etc.)
    application/     # Server actions (routeActions, complianceActions, etc.)
    ports/           # Port interfaces (ApiClientPort)
  adapters/
    infrastructure/  # API client implementation
    ui/              # React components (floating-dock)
  app/               # Next.js app router pages
```

## Features

### Four Main Tabs

1. **Routes** (`/routes`)
   - Display all routes in a clean table
   - Filter by vessel type, fuel type, and year
   - Set baseline route
   - Columns: routeId, vesselType, fuelType, year, ghgIntensity, fuelConsumption, distance, totalEmissions

2. **Compare** (`/compare`)
   - Compare routes against baseline
   - Visual bar chart comparing GHG intensity
   - Table with % difference and compliance status
   - Target: 89.3368 gCO₂e/MJ

3. **Banking** (`/banking`)
   - Get compliance balance (CB) for a ship
   - Bank positive CB surplus
   - Apply banked surplus to cover deficits
   - KPIs: cb_before, applied/banked, cb_after

4. **Pooling** (`/pooling`)
   - Create compliance pools with multiple ships
   - Add/remove pool members
   - Pool sum validation (must be ≥ 0)
   - Visual indicators for valid/invalid pools
   - Display pool results with before/after CBs

### Navigation

- Floating dock component at the bottom of each page
- Four icons for navigation: Routes, Compare, Banking, Pooling
- Smooth animations and hover effects

## Setup

### Environment Variables

Create a `.env.local` file in the frontend directory:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
```

For production, update this to your deployed backend URL.

### Installation

```bash
cd frontend
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:3000` (or the port specified by Next.js).

### Build

```bash
npm run build
npm start
```

## API Integration

All API calls are made through server actions (marked with `"use server"`), which:
- Hide API endpoints from the client
- Run on the server for better security
- Use the `NEXT_PUBLIC_API_BASE_URL` environment variable

The API client is configured in `src/adapters/infrastructure/apiClient.ts` and uses the base URL from environment variables, making it easy to switch between development and production backends.

## Styling

- TailwindCSS for styling
- Apple-like, clean, fluid UI design
- Responsive design for mobile and desktop
- Dark mode support via CSS variables

## Project Structure

- `src/app/` - Next.js app router pages and layouts
- `src/core/` - Domain logic, entities, and ports (no React dependencies)
- `src/adapters/` - Infrastructure adapters (API client) and UI components
- `src/components/ui/` - Reusable UI components
- `src/lib/` - Utility functions
