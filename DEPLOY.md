# Harmony Street Defect Tracker - Deployment Guide

## 🚀 Quick Deploy

### Prerequisites

- [Node.js 20+](https://nodejs.org/)
- [npm](https://www.npmjs.com/)
- [Git](https://git-scm.com/)
- [Vercel CLI](https://vercel.com/docs/cli) (optional, for local testing)
- [GitHub CLI](https://cli.github.com/) (optional)

---

## Step 1: Environment Setup

### 1.1 Copy Environment Template

```bash
cp .env.local.example .env.local
```

### 1.2 Configure Required Variables

Edit `.env.local` with your actual values:

| Variable | Source | Instructions |
|----------|--------|--------------|
| `DATABASE_URL` | [Neon](https://neon.tech) | Create a PostgreSQL database, copy connection string |
| `BLOB_READ_WRITE_TOKEN` | [Vercel Blob](https://vercel.com/dashboard/stores/blob) | Create a Blob store, copy the token |
| `NEXT_PUBLIC_APP_URL` | Vercel | Your app's URL (e.g., `https://harmony-defects.vercel.app`) |

---

## Step 2: Database Setup

### 2.1 Create Neon Database

1. Sign up at [neon.tech](https://neon.tech)
2. Create a new project
3. Create a database named `harmony_defects`
4. Copy the connection string (use **Pooled connection** for serverless)

### 2.2 Run Migrations

```bash
# Install dependencies
npm install

# Run database migrations
npm run db:migrate

# (Optional) Seed with sample data
npm run db:seed
```

---

## Step 3: Vercel Blob Setup

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to **Storage** → **Blob**
3. Create a new Blob store
4. Copy the **Read/Write Token**
5. Add to your `.env.local` file

---

## Step 4: Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

App will be available at `http://localhost:3000`

---

## Step 5: Production Deployment

### Option A: Vercel Dashboard (Recommended)

1. Push your code to GitHub (see Step 6)
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your GitHub repository
4. Configure environment variables in Vercel dashboard:
   - `DATABASE_URL`
   - `BLOB_READ_WRITE_TOKEN`
   - `NEXT_PUBLIC_APP_URL`
5. Click **Deploy**

### Option B: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

---

## Step 6: GitHub Repository Setup

### 6.1 Create GitHub Repository

```bash
# Using GitHub CLI (recommended)
gh repo create harmony-defect-tracker --public --source=. --push

# Or manually:
# 1. Create repo at https://github.com/new
# 2. git remote add origin https://github.com/YOUR_USERNAME/harmony-defect-tracker.git
# 3. git push -u origin main
```

### 6.2 Configure GitHub Secrets (for CI/CD)

If using GitHub Actions for deployment, add these secrets:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Add the following secrets:
   - `VERCEL_TOKEN` - From [vercel.com/settings/tokens](https://vercel.com/settings/tokens)
   - `VERCEL_ORG_ID` - From your Vercel project settings
   - `VERCEL_PROJECT_ID` - From your Vercel project settings

---

## Step 7: Post-Deployment Verification

### 7.1 Health Checks

```bash
# Check app is running
curl https://YOUR_APP_URL.vercel.app/api/health

# Expected response: {"status":"ok"}
```

### 7.2 Test Core Features

- [ ] Create a new defect report
- [ ] Upload an image
- [ ] View defect list
- [ ] Update defect status
- [ ] Delete a defect

---

## 🔧 Troubleshooting

### Build Failures

| Issue | Solution |
|-------|----------|
| `DATABASE_URL` not found | Ensure env var is set in Vercel dashboard |
| `BLOB_READ_WRITE_TOKEN` missing | Check Vercel Blob store configuration |
| TypeScript errors | Run `npx tsc --noEmit` locally to debug |

### Database Connection Issues

```bash
# Test database connection
psql "YOUR_DATABASE_URL"

# Check migrations status
npm run db:status
```

### Image Upload Failures

- Verify `BLOB_READ_WRITE_TOKEN` is correct
- Check Vercel Blob store has available storage
- Ensure file size is under 4.5MB (Vercel Blob limit)

---

## 📁 File Structure

```
harmony-defect-tracker/
├── .env.local.example      # Environment template
├── .env.local              # Your local secrets (git-ignored)
├── vercel.json             # Vercel deployment config
├── DEPLOY.md               # This file
├── .github/
│   └── workflows/
│       └── ci.yml          # GitHub Actions CI/CD
├── app/                    # Next.js App Router
├── components/             # React components
├── lib/                    # Utilities & database
├── public/                 # Static assets
└── types/                  # TypeScript types
```

---

## 🔄 Continuous Deployment

The repository includes GitHub Actions for CI/CD:

- **Pull Requests**: Lint, type check, and build
- **Main branch**: Automatic deployment to Vercel

See `.github/workflows/ci.yml` for details.

---

## 📚 Additional Resources

- [Next.js Deployment Docs](https://nextjs.org/docs/deployment)
- [Vercel Next.js Guide](https://vercel.com/docs/frameworks/nextjs)
- [Neon Serverless Driver](https://neon.tech/docs/serverless/serverless-driver)
- [Vercel Blob Docs](https://vercel.com/docs/storage/vercel-blob)

---

## 🆘 Support

Having issues? Check:

1. [Vercel Status](https://www.vercel-status.com/)
2. [Neon Status](https://neonstatus.com/)
3. Project logs in Vercel dashboard

Or open an issue on GitHub.
