# Optiphoenix Client Survey Tool

Survey tool built with Next.js — PMs create and publish forms; clients submit feedback via unique links.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS
- MySQL + Prisma
- Zod validation (later steps)

## Prerequisites on your Mac

| Tool | Status |
|------|--------|
| Node.js (nvm) | Installed |
| Homebrew | Installed |
| MySQL | **Install via XAMPP** — see [docs/MYSQL_SETUP.md](docs/MYSQL_SETUP.md) (no Xcode needed) |

## Run locally

```bash
cd /Users/safatkamal/Desktop/ABTests/Optiphoenix-Client-Survey-Tool
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Database commands

| Command | What it does |
|---------|----------------|
| `npm run db:generate` | Regenerate Prisma client after schema changes |
| `npm run db:migrate` | Create/update MySQL tables from schema |
| `npm run db:studio` | Visual database browser (port 5555) |

## Other commands

| Command | What it does |
|---------|----------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Run production build |
| `npm run lint` | Lint code |
