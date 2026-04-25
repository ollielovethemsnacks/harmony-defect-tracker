# 6 Harmony Street Defect Tracker

A kanban board web application for tracking building inspection defects at 6 Harmony Street, Calamvale.

## Features

- **Kanban Board**: Drag-and-drop interface with three columns (TODO, IN_PROGRESS, DONE)
- **Defect Management**: Create, edit, and delete defect cards
- **Image Upload**: Attach photos to defect reports using Vercel Blob
- **Comments**: Add comments to defects for tracking progress
- **Search & Filter**: Find defects by number, title, or location

## Tech Stack

- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Neon PostgreSQL with Drizzle ORM
- **Drag & Drop**: @dnd-kit
- **Image Storage**: Vercel Blob
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- Neon PostgreSQL database
- Vercel account (for Blob storage)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd harmony-defect-tracker
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.local.example .env.local
   ```
   Edit `.env.local` with your actual credentials.

4. Run database migrations:
   ```bash
   npx drizzle-kit migrate
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | Neon PostgreSQL connection string | Yes |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob token for image storage | Yes |
| `NEXT_PUBLIC_APP_URL` | Public app URL (optional) | No |

## Project Structure

```
harmony-defect-tracker/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── page.tsx           # Main kanban board
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/               # UI components
│   ├── kanban/           # Kanban-specific components
│   ├── defects/          # Defect management components
│   └── shared/           # Shared components
├── lib/                   # Utilities
│   ├── db/               # Database schema and connection
│   └── utils/            # Helper functions
├── types/                 # TypeScript types
├── public/               # Static assets
└── drizzle.config.ts     # Drizzle ORM configuration
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npx drizzle-kit migrate` - Run database migrations
- `npx drizzle-kit generate` - Generate migration files

## License

Private - For 6 Harmony Street building inspection use only.
# CI Trigger
// Deployment timestamp: Sat Apr 25 15:06:56 AEST 2026
