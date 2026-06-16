# Tensi Harian - Aplikasi Pencatat Tekanan Darah

Aplikasi web modern untuk mencatat dan memantau tekanan darah harian dengan mudah, aman, dan visual yang menarik.

## ✨ Highlights

- 🎨 **Visual Modern** — Glass-morphism, gradient, animasi halus, dan dark mode
- 📊 **Analitik Mendalam** — Grafik 30 hari, distribusi kategori, tren perbandingan
- 📤 **Export Fleksibel** — Excel (.xlsx) dan PDF dengan header branded
- 📥 **Import CSV** — Upload data historis dengan validasi otomatis
- 🔗 **Share dengan QR Code** — Buat link share-only dengan QR untuk scan cepat
- 🔐 **Aman & Privat** — Row Level Security (RLS), enkripsi, dan kontrol penuh
- 📱 **Responsif** — Optimal di mobile, tablet, dan desktop

## 🚀 Tech Stack

- **Framework:** Next.js 14+ (App Router) dengan TypeScript
- **Styling:** Tailwind CSS + custom design system (gradients, glass, animations)
- **UI Components:** shadcn/ui (Button, Card, Input, Label, Badge) + custom components
- **Backend:** Supabase (PostgreSQL + Auth + RLS)
- **Charts:** Recharts
- **Export:** xlsx (Excel), jspdf + jspdf-autotable (PDF)
- **QR Code:** qrcode.react
- **Icons:** Lucide Icons
- **Date:** date-fns dengan locale Indonesia
- **Validation:** Zod

## 📋 Prerequisites

- Node.js 18+
- npm atau yarn
- Akun Supabase (gratis)

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
   - Buat project baru di [Supabase](https://supabase.com)
   - Salin project URL dan anon key
   - Jalankan migrations di `supabase/migrations/` secara berurutan:
     - `001_create_profiles.sql`
     - `002_create_blood_pressure_records.sql`
     - `003_create_rls_policies.sql`
     - `004_create_share_tokens.sql`
     - `005_atomic_share_token_increment.sql`

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

Buka [http://localhost:3000](http://localhost:3000)

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
- ✅ Dashboard dengan latest reading, weekly chart, dan quick stats
- ✅ CRUD Blood Pressure Records dengan validasi
- ✅ Auto Classification mengikuti pedoman AHA (5 kategori)
- ✅ Detail page untuk setiap pencatatan
- ✅ Pagination & filter berdasarkan tanggal
- ✅ Discard confirmation di form edit
- ✅ Responsive Design & Dark Mode

#### Analytics
- ✅ Monthly statistics (rata-rata, max, min)
- ✅ 30-day blood pressure chart
- ✅ Category distribution (pie chart)
- ✅ Trend comparison (vs 30 hari sebelumnya)
- ✅ Empty state untuk user baru

#### Sharing
- ✅ Generate share link dengan token unik
- ✅ Expiration date & max views control
- ✅ **QR Code** untuk scan cepat oleh device lain
- ✅ Revoke & delete share tokens
- ✅ Public share page dengan branding

#### Export & Import
- ✅ Export ke Excel (.xlsx)
- ✅ Export ke PDF dengan branded header
- ✅ **Import CSV** dengan preview & validasi
- ✅ Template download untuk format CSV

#### Settings
- ✅ Update profil (nama, tanggal lahir)
- ✅ Change password
- ✅ Delete account (soft delete)

#### Visual & UX
- ✅ Custom design system (gradient, glass, animations)
- ✅ Animated aurora background
- ✅ Glass-morphism sidebar & header
- ✅ Gradient text & icons
- ✅ Stagger animations untuk cards
- ✅ Loading skeletons dengan shimmer
- ✅ Custom 404 page
- ✅ Global error boundary
- ✅ SEO (OG meta, robots, sitemap)
- ✅ Breadcrumbs navigation

### Roadmap (Post-MVP)

- [ ] Reminder System (push notification)
- [ ] Weekly Summary Email
- [ ] PWA Support (offline mode)
- [ ] Smart Insights (AI recommendations)
- [ ] Multi-user (family accounts)
- [ ] Integration dengan Apple Health / Google Fit
- [ ] Medication tracking

## 🏥 Blood Pressure Categories

Berdasarkan American Heart Association (AHA):

| Category             | Systolic    | Diastolic   |
| -------------------- | ----------- | ----------- |
| Low (Rendah)         | < 90        | OR < 60     |
| Normal               | < 120       | AND < 80    |
| Elevated (Meningkat) | 120-129     | AND < 80    |
| Hypertension Stage 1 | 130-139     | OR 80-89    |
| Hypertension Stage 2 | ≥ 140       | OR ≥ 90     |

## 🔒 Security

- **Row Level Security (RLS)** di Supabase untuk semua tabel
- **HTTPS only** di production
- **Input validation** dengan Zod di server actions
- **Session management** via Supabase Auth
- **CSRF protection** (Next.js built-in)
- **Soft delete** untuk data records
- **Atomic share token increment** untuk mencegah race condition
- **Token-based access** untuk registrasi (`REGISTER_ACCESS_TOKEN`)

## 📝 Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

## 🚀 Deployment

### Vercel (Recommended)

1. Push code ke GitHub
2. Import project di [Vercel](https://vercel.com)
3. Add environment variables
4. Deploy!

### Environment Variables

Tambahkan di Project Settings → Environment Variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL` (URL production)
- `REGISTER_ACCESS_TOKEN` (token untuk akses registrasi)

## 📖 Documentation

- [Database Setup Guide](docs/DATABASE_SETUP.md)
- [Deployment Guide](docs/DEPLOYMENT_GUIDE.md)
- [Development Guide](docs/DEVELOPMENT_GUIDE.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)
- [PRD (Product Requirements Document)](plans/PRD-Tensi-Harian.md)
- [Project Summary](docs/PROJECT_SUMMARY.md)

## 🎨 Design System

Aplikasi ini menggunakan custom design system yang didefinisikan di `app/globals.css` dan `tailwind.config.ts`:

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

Ini adalah project personal/small scale. Contributions welcome!

## 📄 License

MIT

## 👤 Author

Alberth Yaputra

---

**Disclaimer:** Aplikasi ini untuk personal use dan monitoring kesehatan pribadi. Selalu konsultasi dengan dokter untuk keputusan medis.
