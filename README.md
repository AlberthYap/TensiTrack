# Tensi Harian — Blood Pressure Tracker

A modern web application to easily and securely record and monitor daily blood pressure with polished visuals.

## ✨ Highlights

- 🎨 **Modern Visuals** — Glass-morphism, gradients, smooth animations, and dark mode
- 📊 **Deep Analytics** — 30-day charts, category distribution, trend comparison
- 📤 **Flexible Export** — Excel (.xlsx) and PDF with branded headers
- 📥 **CSV Import** — Upload historical data with automatic validation
- 🔗 **Share with QR Code** — Create read-only share links with QR for quick scanning
- 🔐 **Secure & Private** — Row Level Security (RLS), encryption, and full control
- 📱 **Responsive** — Optimized for mobile, tablet, and desktop

## 🚀 Tech Stack

- **Framework:** Next.js 14+ (App Router) with TypeScript
- **Styling:** Tailwind CSS + custom design system (gradients, glass, animations)
- **UI Components:** shadcn/ui (Button, Card, Input, Label, Badge) + custom components
- **Backend:** Supabase (PostgreSQL + Auth + RLS)
- **Charts:** Recharts
- **Export:** xlsx (Excel), jspdf + jspdf-autotable (PDF)
- **QR Code:** qrcode.react
- **Icons:** Lucide Icons
- **Date:** date-fns with Indonesian locale
- **Validation:** Zod

## 📋 Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account (free tier)

## 🛠️ Installation

1. **Clone repository**

```bash
git clone <repository-url>
cd tensi
```

2. **Install dependencies**

```bash
npm install
```

3. **Setup Supabase**
   - Create a new project on [Supabase](https://supabase.com)
   - Copy the project URL and anon key
   - Run **all** migrations in `supabase/migrations/` in order:
     - `001_create_profiles.sql`
     - `002_create_blood_pressure_records.sql`
     - `003_create_rls_policies.sql`
     - `004_create_share_tokens.sql`
     - `005_atomic_share_token_increment.sql`
     - `006_share_rate_limits.sql`
     - `007_auth_rate_limits.sql`
     - `008_add_demo_user.sql`
     - `009_medications_and_targets.sql`

   **Note**: After migration `008`, run the seed script to create the demo user:
   ```bash
   npx tsx scripts/seed-demo-user.ts
   ```

4. **Setup environment variables**

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
REGISTER_ACCESS_TOKEN=your-secret-token-for-registration
```

5. **Run development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
tensi/
├── app/                              # Next.js App Router
│   ├── (auth)/                       # Auth routes (login, register, forgot/reset)
│   ├── (protected)/                  # Protected routes (dashboard, records, analytics, settings)
│   │   ├── dashboard/
│   │   ├── records/
│   │   │   ├── [id]/                 # Detail page
│   │   │   ├── [id]/edit/
│   │   │   └── new/
│   │   ├── analytics/
│   │   └── settings/
│   ├── share/[token]/                # Public share link page
│   ├── actions/                      # Server actions
│   ├── api/                          # API routes (export)
│   ├── error.tsx                     # Global error boundary
│   ├── not-found.tsx                 # 404 page
│   ├── robots.ts                     # SEO robots
│   ├── sitemap.ts                    # SEO sitemap
│   ├── layout.tsx                    # Root layout (OG, theme, etc)
│   ├── globals.css                   # Global styles + design system
│   └── page.tsx                      # Landing page
├── components/
│   ├── ui/                           # Reusable UI primitives
│   │   ├── category-badge.tsx        # Gradient category chip
│   │   ├── stat-card.tsx             # Stats with icon and trend
│   │   ├── sparkline.tsx             # Lightweight SVG chart
│   │   ├── empty-state.tsx           # Animated empty state
│   │   ├── breadcrumbs.tsx           # Navigation breadcrumbs
│   │   └── ...
│   └── features/                     # Feature-specific components
│       ├── auth/                     # Auth forms
│       ├── dashboard/                # Dashboard widgets
│       ├── records/                  # Records CRUD + share + import
│       ├── analytics/                # Charts
│       ├── settings/                 # Profile, password, delete account
│       └── layout/                   # Sidebar, header, mobile nav
├── lib/
│   ├── supabase/                     # Supabase clients (server, client, admin, middleware)
│   ├── blood-pressure.ts             # BP classification logic
│   ├── validations.ts                # Zod schemas
│   ├── export.ts                     # Excel export helpers
│   ├── pdf-export.ts                 # PDF export helpers
│   ├── csv-import.ts                 # CSV parser & validator
│   ├── date.ts                       # Date formatters
│   └── utils.ts                      # Utility functions (cn, etc)
├── types/                            # TypeScript types
├── supabase/
│   └── migrations/                   # Database migrations
└── docs/                             # Documentation
```

## 🎯 Features

### MVP (Current)

#### Core
- ✅ Authentication (register, login, logout, forgot/reset password)
- ✅ Dashboard with latest reading, weekly chart, and quick stats
- ✅ CRUD Blood Pressure Records with validation
- ✅ Auto Classification following AHA guidelines (5 categories)
- ✅ Detail page for each record
- ✅ Pagination & date range filters
- ✅ Discard confirmation on edit form
- ✅ Responsive Design & Dark Mode

#### Analytics
- ✅ Monthly statistics (average, max, min)
- ✅ 30-day blood pressure chart
- ✅ Category distribution (pie chart)
- ✅ Trend comparison (vs previous 30 days)
- ✅ Empty state for new users

#### Sharing
- ✅ Generate share link with unique token
- ✅ Expiration date & max views control
- ✅ **QR Code** for quick scanning by other devices
- ✅ Revoke & delete share tokens
- ✅ Public share page with branding

#### Export & Import
- ✅ Export to Excel (.xlsx)
- ✅ Export to PDF with branded header
- ✅ **CSV Import** with preview & validation
- ✅ Template download for CSV format

#### Medication Tracking
- ✅ Daily medication checklist (add, toggle, delete)
- ✅ Quick-add form with name & dosage
- ✅ Visual all-done celebration when all meds taken

#### Health Goals
- ✅ Target blood pressure setting in profile
- ✅ Weekly progress bar vs target on dashboard

#### Settings
- ✅ Update profile (name, date of birth, target BP)
- ✅ Change password
- ✅ Delete account (soft delete)

#### Visual & UX
- ✅ Custom design system (gradient, glass, animations)
- ✅ Animated aurora background
- ✅ Glass-morphism sidebar & header
- ✅ Gradient text & icons
- ✅ Stagger animations for cards
- ✅ Loading skeletons with shimmer
- ✅ Custom 404 page
- ✅ Global error boundary
- ✅ SEO (OG meta, robots, sitemap)
- ✅ Breadcrumbs navigation

### Roadmap (Post-MVP)

- [ ] Reminder System (push notification)
- [ ] Weekly Summary Email
- [ ] Smart Insights (AI recommendations)
- [ ] Multi-user (family accounts)
- [ ] Integration with Apple Health / Google Fit

Already delivered beyond MVP:
- [x] PWA Support (offline mode)
- [x] Demo account with 24h auto-cleanup
- [x] WhatsApp sharing
- [x] Medication tracking
- [x] Weekly summary card
- [x] Target BP goals
- [x] Pattern insights (morning vs evening)

## 🏥 Blood Pressure Categories

Based on American Heart Association (AHA):

| Category             | Systolic    | Diastolic   |
| -------------------- | ----------- | ----------- |
| Low                  | < 90        | OR < 60     |
| Normal               | < 120       | AND < 80    |
| Elevated             | 120-129     | AND < 80    |
| Hypertension Stage 1 | 130-139     | OR 80-89    |
| Hypertension Stage 2 | ≥ 140       | OR ≥ 90     |

## 🔒 Security

- **Row Level Security (RLS)** on Supabase for all tables
- **HTTPS only** in production
- **Input validation** with Zod in server actions
- **Session management** via Supabase Auth
- **CSRF protection** (Next.js built-in)
- **Soft delete** for records
- **Atomic share token increment** to prevent race conditions
- **Token-based access** for registration (`REGISTER_ACCESS_TOKEN`)

## 📝 Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

## 🚀 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project on [Vercel](https://vercel.com)
3. Add environment variables
4. Deploy!

### Environment Variables

Add in Project Settings → Environment Variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL` (production URL)
- `REGISTER_ACCESS_TOKEN` (token for registration access)

## 📖 Documentation

- [Database Setup Guide](docs/DATABASE_SETUP.md)
- [Deployment Guide](docs/DEPLOYMENT_GUIDE.md)
- [Development Guide](docs/DEVELOPMENT_GUIDE.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)
- [PRD (Product Requirements Document)](plans/PRD-Tensi-Harian.md)
- [Project Summary](docs/PROJECT_SUMMARY.md)

## 🎨 Design System

The app uses a custom design system defined in `app/globals.css` and `tailwind.config.ts`:

### Gradient Utilities

- `bg-gradient-hero` — Blue → Indigo → Purple
- `bg-gradient-cool` — Blue → Cyan
- `bg-gradient-warm` — Orange → Pink
- `bg-gradient-success` — Emerald → Teal
- `bg-gradient-danger` — Red → Rose
- `bg-gradient-warning` — Yellow → Orange
- `bg-gradient-purple` — Purple → Pink
- `bg-gradient-pink` — Pink → Rose

### Text Gradient

- `text-gradient` — Primary
- `text-gradient-cool` — Blue
- `text-gradient-warm` — Orange/Pink
- `text-gradient-success` — Emerald

### Animations

- `animate-shimmer` — Loading skeleton
- `animate-float` — Floating effect
- `animate-pulse-soft` — Soft pulsing
- `animate-fade-in-up` — Fade in from bottom
- `animate-scale-in` — Scale entrance
- `animate-slide-in-right` — Slide from right

### Glass Effect

- `glass` — Frosted glass background
- `bg-aurora` — Aurora gradient
- `bg-grid` — Subtle grid pattern

## 🤝 Contributing

Personal / small-scale project. Contributions welcome!

## 📄 License

MIT

## 👤 Author

Alberth Yaputra

---

**Disclaimer:** This app is for personal use and personal health monitoring. Always consult a doctor for medical decisions.
