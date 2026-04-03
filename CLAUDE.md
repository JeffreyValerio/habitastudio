# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start development server (localhost:3000)
npm run build        # Generate Prisma client + build for production
npm run lint         # Run ESLint

# Database
npm run db:push      # Push Prisma schema changes to the database
npm run db:studio    # Open Prisma Studio (visual DB browser)
npm run db:seed      # Seed initial admin user and sample data
```

There is no test runner configured.

## Architecture

**Habita Studio** is a furniture/remodeling company website with two main surfaces:
- **Public site** — marketing pages, product catalog, blog, contact form
- **Admin panel** (`/admin/*`) — protected CRUD for products, services, projects, quotes, and receipts

### Key architectural decisions

**Server Actions over API routes for mutations.** All admin CRUD (create/update/delete products, quotes, receipts, etc.) uses Next.js Server Actions (`"use server"`), not API routes. API routes only exist for auth (`/api/auth/*`), image upload (`/api/upload`), and the public contact form (`/api/contact`).

**Authentication.** JWT stored in an httpOnly cookie. `lib/auth.ts` exposes `getCurrentUser()` (reads cookie + verifies JWT) and `requireAdmin()` (redirects to login if not authenticated). The admin layout (`app/admin/layout.tsx`) calls `requireAdmin()` on every render.

**Image management.** Images are uploaded to Cloudinary via `/api/upload`. `lib/cloudinary.ts` handles uploads and deletions. Products and projects can have a main image plus a gallery array stored as Cloudinary URLs.

**PDF generation.** Quotes and receipts generate PDFs two ways:
- Server-side: `lib/generate-pdf-server.ts` and `lib/generate-receipt-pdf-server.ts` (used in server actions)
- Client-side: `lib/generate-pdf.ts` (used by download buttons in the browser)

**Data fetching.** Public pages read from `lib/data/*.ts` functions, which call Prisma directly (no HTTP layer). These functions are called in Server Components.

### Database schema (Prisma + PostgreSQL)

Core models: `User`, `Product`, `Service`, `Project`, `Quote` (with `QuoteItem[]`), `Receipt`, `QuoteSequence`, `ReceiptSequence`.

Quote and receipt numbers are auto-incremented per year using the `QuoteSequence`/`ReceiptSequence` tables.

### Directory layout

```
app/
  admin/          # Protected admin panel (requires auth)
  api/            # Auth, upload, contact, search endpoints
  catalogo/       # Public product catalog
components/
  admin/          # Admin-specific UI (forms, tables, PDF buttons)
  ui/             # shadcn/ui primitives
lib/
  auth.ts         # JWT login/logout, getCurrentUser, requireAdmin
  prisma.ts       # Prisma singleton (pg adapter)
  cloudinary.ts   # Image upload/delete helpers
  data/           # Server-side data fetching functions
  generate-pdf*.ts # PDF generation logic
prisma/
  schema.prisma   # Database schema
scripts/
  seed.ts         # Creates admin@habitastudio.online / admin123
```

### Environment variables required

```
DATABASE_URL
CLOUDINARY_URL
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
RESEND_API_KEY
JWT_SECRET
```
