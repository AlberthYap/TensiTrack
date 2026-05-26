# Tensi Harian - Aplikasi Pencatat Tekanan Darah

Aplikasi web modern untuk mencatat dan memantau tekanan darah harian dengan mudah.

## 🚀 Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **Backend:** Supabase (PostgreSQL + Auth)
- **Charts:** Recharts
- **Form:** React Hook Form + Zod
- **Icons:** Lucide Icons

## 📋 Prerequisites

- Node.js 18+
- npm atau yarn
- Supabase account

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
   - Create a new project di [Supabase](https://supabase.com)
   - Copy project URL dan anon key
   - Jalankan migrations di `supabase/migrations/` (lihat [Database Setup Guide](docs/DATABASE_SETUP.md))

4. **Environment variables**

```bash
cp .env.example .env.local
```

Edit `.env.local` dengan credentials Supabase Anda:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

5. **Run development server**

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
tensi/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication routes
│   ├── (protected)/       # Protected routes (dashboard, records, etc)
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Landing page
├── components/
│   ├── ui/                # shadcn/ui components
│   └── features/          # Feature-specific components
├── lib/
│   ├── supabase/          # Supabase clients
│   ├── blood-pressure.ts  # BP classification logic
│   ├── validations.ts     # Zod schemas
│   └── utils.ts           # Utility functions
├── types/                 # TypeScript types
├── supabase/
│   └── migrations/        # Database migrations
└── docs/                  # Documentation
```

## 🎯 Features

### MVP (Current)

- ✅ Authentication (register, login, logout)
- ✅ Dashboard dengan latest reading & 7-day chart
- ✅ CRUD Blood Pressure Records
- ✅ Auto Classification (5 categories)
- ✅ Basic Analytics
- ✅ Responsive Design
- ✅ Dark Mode

### Roadmap

- [ ] Reminder System
- [ ] Weekly Summary Email
- [ ] Export PDF
- [ ] PWA Support
- [ ] Smart Insights

## 🏥 Blood Pressure Categories

Berdasarkan American Heart Association (AHA):

| Category             | Systolic | Diastolic |
| -------------------- | -------- | --------- |
| Low                  | < 90     | OR < 60   |
| Normal               | < 120    | AND < 80  |
| Elevated             | 120-129  | AND < 80  |
| Hypertension Stage 1 | 130-139  | OR 80-89  |
| Hypertension Stage 2 | ≥ 140    | OR ≥ 90   |

## 🔒 Security

- Row Level Security (RLS) enabled di Supabase
- HTTPS only
- Input validation dengan Zod
- CSRF protection (Next.js default)
- Session management via Supabase Auth

## 📝 Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
```

## 🚀 Deployment

### Vercel (Recommended)

1. Push code ke GitHub
2. Import project di [Vercel](https://vercel.com)
3. Add environment variables
4. Deploy!

### Environment Variables di Vercel

Tambahkan di Project Settings → Environment Variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## 📖 Documentation

- [Database Setup Guide](docs/DATABASE_SETUP.md)
- [PRD (Product Requirements Document)](plans/PRD-Tensi-Harian.md)

## 🤝 Contributing

Ini adalah project personal/small scale. Contributions welcome!

## 📄 License

MIT

## 👤 Author

Your Name

---

**Note:** Aplikasi ini untuk personal use dan monitoring kesehatan pribadi. Selalu konsultasi dengan dokter untuk keputusan medis.
