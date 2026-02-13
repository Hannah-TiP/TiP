# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TiP (Travel Intelligence Perfected) is a luxury travel concierge web application built with Next.js 16 App Router, TypeScript, and Tailwind CSS v4. The app provides AI-powered travel planning, curated hotel recommendations, and premium membership tiers for discerning travelers.

## Development Commands

```bash
# Development
npm run dev              # Start development server at http://localhost:3000

# Building
npm run build            # Create production build
npm start                # Run production server

# Linting
npm run lint             # Run ESLint
```

## Architecture

### Framework & Routing
- **Next.js 16** with App Router (`src/app/` directory)
- File-based routing with layout and page components
- Dynamic routes: `/hotel/[id]/page.tsx` for individual hotel pages
- All pages are client-side components using `"use client"` directive

### Key Route Structure
- `/` - Landing page with hero, membership tiers, and hotel showcase
- `/dream-hotels` - Curated hotel listings
- `/more-dreams` - Additional travel inspiration
- `/insights` - Travel content and articles
- `/concierge` - AI chat interface for trip planning
- `/my-page/*` - User dashboard with nested routes:
  - `/my-page/my-profile` - Profile management
  - `/my-page/membership` - Membership tier management
  - `/my-page/travel-history` - Past bookings
  - `/my-page/hotel-review` - User reviews
  - `/my-page/my-chat` - Concierge chat history
- `/sign-in` - Authentication
- `/hotel/[id]` - Individual hotel detail pages

### Styling System

**Tailwind CSS v4** with custom design tokens defined in `src/app/globals.css`:

- **Typography**: Three font families
  - `font-primary`: Cormorant Garamond (serif, italic headlines)
  - `font-secondary`: Inter (sans-serif, body text)
  - `font-mono`: JetBrains Mono (monospace)

- **Color Palette**: Luxury brand colors
  - `green-dark` (#1E3D2F): Primary brand color
  - `green-footer` (#214032): Footer background
  - `gold` (#C4956A): Accent highlights
  - `gray-light` (#FAF9F7): Section backgrounds
  - `gray-text` (#888888): Secondary text
  - `gray-border` (#E8E7E5): Borders

- **Icons**: Lucide icons loaded via CDN font (class `icon-lucide` with Unicode characters)

### Component Architecture

Reusable components in `src/components/`:
- `SearchBar.tsx` - Main search interface with dropdown filters
- `SignInModal.tsx` - Authentication modal overlay
- `SubscribePopup.tsx` - Newsletter subscription modal
- `TopBar.tsx` - Site-wide top navigation
- `SubNav.tsx` - Secondary navigation bar
- `Footer.tsx` - Site-wide footer
- Dropdown components: `DestinationDropdown`, `DatePickerDropdown`, `GuestsDropdown`, `TravelStyleDropdown`, `TripTypeDropdown`

### State Management
- React `useState` for local component state
- No global state management library (Redux, Zustand, etc.) currently implemented
- Modal visibility and UI interactions managed at component level

### TypeScript Configuration
- Path alias: `@/*` maps to `src/*`
- Strict mode enabled
- Target: ES2017
- JSX: react-jsx (new JSX transform)

### Images
- Remote images from Unsplash configured in `next.config.ts`
- Using Next.js `<Image>` component for optimized loading (where applicable)

## Design Guidelines

### Visual Hierarchy
- Large serif headlines (Cormorant Garamond italic) for dramatic impact
- Small, uppercase, wide-tracked labels (11px, 4px letter-spacing) for section markers
- Generous white space and padding (px-[100px] for section padding)
- Subtle hover states with opacity/color transitions

### Layout Patterns
- Full-width hero sections with background images and overlays
- Centered content with `max-w-7xl` or `max-w-5xl` containers
- Card-based layouts for hotels and features with subtle shadows
- Sticky/floating search bar positioned absolutely on hero

### Component Patterns
- Button styles: Pill-shaped (`rounded-full`) with solid or outline variants
- Modal overlays: Fixed positioning with backdrop blur
- Dropdowns: Absolute positioning with custom styling
- Navigation: Minimal, uppercase labels with wide tracking

## Code Conventions

### Component Structure
- Use `"use client"` directive for interactive components
- Keep page components focused on layout, extract complex logic to child components
- Use TypeScript interfaces for props and data structures
- Prefer functional components with hooks

### Naming
- Component files: PascalCase (e.g., `SearchBar.tsx`)
- Page files: lowercase (e.g., `page.tsx`)
- CSS variables: kebab-case (e.g., `--green-dark`)
- Class names: Tailwind utilities only, no custom classes outside globals.css

### Styling
- Use Tailwind utility classes directly in JSX
- Custom colors via Tailwind config variables (`text-green-dark`, `bg-gold`)
- Responsive design with Tailwind breakpoints (when needed)
- Avoid inline styles except for rare dynamic values

## Data & Content

### Mock Data Location
Static content currently embedded in page components (e.g., `featuredHotels`, `membershipTiers` in `page.tsx`). Future backend integration will require:
- API routes in `src/app/api/`
- Data fetching with Next.js Server Components or client-side hooks
- Environment variables for API keys in `.env.local`

### Image Sources
- Hero and hotel images: Unsplash via CDN URLs
- Pattern: `https://images.unsplash.com/photo-[id]?w=[width]&h=[height]&fit=crop`

## Future Considerations

When adding new features:
- Implement actual authentication (currently just a modal)
- Connect AI concierge to backend API
- Add hotel booking flow and payment integration
- Implement user profile and travel history persistence
- Consider state management library if complexity grows
- Add loading states and error boundaries
- Implement accessibility improvements (ARIA labels, keyboard navigation)
- Add internationalization for EN/KR language toggle
