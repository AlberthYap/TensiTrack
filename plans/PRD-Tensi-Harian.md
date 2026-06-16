# Product Requirements Document (PRD)

# Tensi Harian - Aplikasi Pencatat Tekanan Darah

**Version:** 1.0  
**Last Updated:** 24 Mei 2026  
**Status:** MVP Planning  
**Target:** Personal/Small Scale Use

---

## 1. Product Vision

Aplikasi web sederhana yang membantu pengguna dewasa dan lansia mencatat dan memantau tekanan darah harian mereka dengan mudah, memberikan insight kesehatan yang berguna tanpa kompleksitas berlebihan.

### Core Values

- **Simplicity First** - Mudah digunakan untuk semua usia
- **Privacy Focused** - Data kesehatan pribadi yang aman
- **Reliable** - Selalu tersedia dan cepat
- **Accessible** - Ramah untuk lansia dan pengguna dengan keterbatasan

---

## 2. Problem Statement

### Problems

1. Pengguna kesulitan mencatat tekanan darah secara konsisten
2. Sulit melihat pola dan trend tekanan darah dari waktu ke waktu
3. Tidak ada cara mudah untuk memantau apakah tekanan darah dalam kategori normal
4. Aplikasi existing terlalu kompleks atau tidak user-friendly untuk lansia

### Solution

Aplikasi web modern yang fokus pada pencatatan cepat, visualisasi sederhana, dan klasifikasi otomatis tekanan darah dengan UX yang bersih dan mudah dipahami.

---

## 3. Goals & Success Metrics

### Primary Goals

- User dapat mencatat tekanan darah dalam < 30 detik
- User dapat melihat trend mingguan dengan jelas
- User mendapat feedback langsung tentang status tekanan darah

### Success Metrics (MVP)

- Time to first record: < 2 menit setelah registrasi
- Mobile responsive: 100% functional di mobile
- Page load: < 2 detik
- Uptime: > 99%

---

## 4. User Personas

### Primary Persona: Pak Budi (60 tahun)

- **Background:** Pensiunan dengan hipertensi ringan
- **Tech Savvy:** Menengah, bisa pakai smartphone
- **Goals:** Pantau tekanan darah rutin, share data ke dokter
- **Pain Points:** Aplikasi terlalu rumit, tulisan terlalu kecil
- **Needs:** Interface besar, jelas, dan sederhana

### Secondary Persona: Ibu Siti (45 tahun)

- **Background:** Ibu rumah tangga, mulai aware kesehatan
- **Tech Savvy:** Baik, aktif di smartphone
- **Goals:** Tracking kesehatan preventif
- **Pain Points:** Lupa mencatat, tidak ada reminder
- **Needs:** Reminder, insight sederhana, export data

---

## 5. User Journey

### First Time User

```
Register → Verify Email → Onboarding (skip) → Dashboard → Add First Record → See Result
```

### Daily User

```
Login → Dashboard (lihat data terakhir) → Quick Add → Auto Classification → Done
```

### Weekly Review

```
Login → Dashboard → Lihat Grafik 7 Hari → Analytics → Export (optional)
```

---

## 6. Functional Requirements

### 6.1 Authentication

| Feature            | Priority | Description                           |
| ------------------ | -------- | ------------------------------------- |
| Register           | P0       | Email + password, minimal validation  |
| Login              | P0       | Email + password, session persistence |
| Logout             | P0       | Clear session                         |
| Forgot Password    | P1       | Email reset link via Supabase         |
| Email Verification | P1       | Optional untuk MVP                    |

### 6.2 Dashboard

| Feature          | Priority | Description                      |
| ---------------- | -------- | -------------------------------- |
| Latest Reading   | P0       | Tampilkan data terakhir + status |
| Quick Stats      | P0       | Rata-rata 7 hari, status trend   |
| 7-Day Chart      | P0       | Line chart systolic/diastolic    |
| Quick Add Button | P0       | Floating action button           |

### 6.3 Blood Pressure Records (CRUD)

| Feature             | Priority | Description                                       |
| ------------------- | -------- | ------------------------------------------------- |
| Add Record          | P0       | Form: systolic, diastolic, pulse, notes, datetime |
| Edit Record         | P0       | Edit existing record                              |
| Delete Record       | P0       | Soft delete dengan confirmation                   |
| View History        | P0       | List semua records, paginated                     |
| Auto Classification | P0       | Otomatis kategorikan saat save                    |

**Field Validation:**

- Systolic: 50-250 mmHg
- Diastolic: 30-150 mmHg
- Pulse: 30-200 bpm
- Notes: Optional, max 500 char
- Measured At: Default now, bisa edit

### 6.4 Analytics

| Feature               | Priority | Description                |
| --------------------- | -------- | -------------------------- |
| Weekly Average        | P0       | Rata-rata 7 hari terakhir  |
| Monthly Average       | P1       | Rata-rata 30 hari terakhir |
| Trend Indicator       | P0       | Naik/turun/stabil          |
| Category Distribution | P1       | Pie chart kategori         |

### 6.5 Classification System

Auto-classify berdasarkan:

| Category             | Systolic | Diastolic | Color  |
| -------------------- | -------- | --------- | ------ |
| Low                  | < 90     | OR < 60   | Blue   |
| Normal               | < 120    | AND < 80  | Green  |
| Elevated             | 120-129  | AND < 80  | Yellow |
| Hypertension Stage 1 | 130-139  | OR 80-89  | Orange |
| Hypertension Stage 2 | ≥ 140    | OR ≥ 90   | Red    |

---

## 7. Non-Functional Requirements

### Performance

- Initial page load: < 2s
- Time to interactive: < 3s
- Server response: < 500ms
- Mobile optimized

### Security

- HTTPS only
- Supabase RLS enabled
- Password hashing (Supabase default)
- Session timeout: 7 days
- CSRF protection (Next.js default)

### Accessibility

- WCAG 2.1 Level AA target
- Keyboard navigation
- Screen reader friendly
- High contrast mode support
- Font size: minimum 16px
- Touch target: minimum 44x44px

### Browser Support

- Chrome/Edge (latest 2 versions)
- Safari (latest 2 versions)
- Firefox (latest 2 versions)
- Mobile browsers (iOS Safari, Chrome Android)

---

## 8. Information Architecture

```
/
├── / (landing page - public)
├── /login
├── /register
├── /forgot-password
│
├── /dashboard (protected)
│   ├── Latest reading card
│   ├── Quick stats
│   ├── 7-day chart
│   └── Quick add button
│
├── /records (protected)
│   ├── /records (list + add)
│   ├── /records/[id] (detail)
│   └── /records/[id]/edit
│
├── /analytics (protected)
│   ├── Weekly stats
│   ├── Monthly stats
│   └── Charts
│
└── /settings (protected)
    ├── Profile
    ├── Preferences
    └── Export data
```

---

## 9. Technical Architecture

### Tech Stack

```
Frontend:
- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- Lucide Icons

Backend:
- Next.js Server Components
- Next.js Server Actions
- Supabase (Auth + Database)

Database:
- PostgreSQL (via Supabase)

Validation:
- Zod

Forms:
- React Hook Form

Charts:
- Recharts

Deployment:
- Vercel (recommended)
```

### Architecture Principles

**Server-Side First:**

- Prioritas React Server Components (RSC)
- Client components hanya untuk interactivity
- Server Actions untuk mutations
- No separate API routes kecuali perlu

**File Structure:**

```
/app
  /(auth)
    /login
    /register
  /(protected)
    /dashboard
    /records
    /analytics
    /settings
  /api (minimal, hanya jika perlu)
/components
  /ui (shadcn)
  /features
    /dashboard
    /records
    /analytics
/lib
  /supabase
  /utils
  /validations
/types
```

---

## 10. Database Design

### Schema

#### profiles

```sql
id: uuid (PK, references auth.users)
email: text
full_name: text
date_of_birth: date (optional)
created_at: timestamptz
updated_at: timestamptz
```

#### blood_pressure_records

```sql
id: uuid (PK)
user_id: uuid (FK -> profiles.id)
systolic: integer (NOT NULL)
diastolic: integer (NOT NULL)
pulse: integer (optional)
category: text (auto-calculated)
notes: text (optional)
measured_at: timestamptz (NOT NULL)
created_at: timestamptz
updated_at: timestamptz
deleted_at: timestamptz (soft delete)

INDEX: user_id, measured_at DESC
INDEX: user_id, category
```

### RLS Policies

**profiles:**

- Users can read their own profile
- Users can update their own profile

**blood_pressure_records:**

- Users can CRUD their own records only
- Soft delete: update deleted_at instead of DELETE

### Sample RLS Policy

```sql
-- Read own records
CREATE POLICY "Users can view own records"
ON blood_pressure_records FOR SELECT
USING (auth.uid() = user_id AND deleted_at IS NULL);

-- Insert own records
CREATE POLICY "Users can insert own records"
ON blood_pressure_records FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

---

## 11. Server-Side Rendering Strategy

### Page Types

| Route        | Type          | Reason                     |
| ------------ | ------------- | -------------------------- |
| `/`          | Static        | Landing page, no user data |
| `/login`     | Static        | Form only                  |
| `/dashboard` | Dynamic (RSC) | User-specific data         |
| `/records`   | Dynamic (RSC) | User-specific data         |
| `/analytics` | Dynamic (RSC) | User-specific data         |

### Data Fetching Pattern

**Server Components (default):**

```typescript
// app/(protected)/dashboard/page.tsx
export default async function DashboardPage() {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('blood_pressure_records')
    .select('*')
    .order('measured_at', { ascending: false })
    .limit(1)

  return <DashboardView latestRecord={data} />
}
```

**Client Components (minimal):**

- Forms dengan interactivity
- Charts (Recharts)
- Modals/Dialogs
- Real-time updates (optional)

---

## 12. Authentication Flow

### Registration Flow

```
1. User submit form (email, password, name)
2. Server Action validate dengan Zod
3. Supabase Auth create user
4. Auto create profile record
5. Redirect ke /dashboard
```

### Login Flow

```
1. User submit credentials
2. Server Action validate
3. Supabase Auth sign in
4. Set session cookie
5. Redirect ke /dashboard
```

### Session Management

- Supabase handles session
- Middleware check auth di protected routes
- Auto refresh token
- Session expire: 7 days

### Middleware Protection

```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const supabase = createMiddlewareClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session && request.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect("/login");
  }
}
```

---

## 13. API & Server Actions Strategy

### Server Actions (Primary)

**Add Record:**

```typescript
// app/actions/records.ts
"use server";

export async function addRecord(formData: FormData) {
  const supabase = createServerClient();

  // Validate
  const validated = recordSchema.parse({
    systolic: formData.get("systolic"),
    diastolic: formData.get("diastolic"),
    // ...
  });

  // Calculate category
  const category = calculateCategory(validated.systolic, validated.diastolic);

  // Insert
  const { data, error } = await supabase
    .from("blood_pressure_records")
    .insert({ ...validated, category });

  revalidatePath("/dashboard");
  return { data, error };
}
```

**Benefits:**

- No API routes needed
- Type-safe
- Auto CSRF protection
- Integrated dengan RSC

### API Routes (Minimal)

Hanya untuk:

- Webhooks (jika ada)
- Third-party integrations
- Export file generation

---

## 14. Caching Strategy

### Next.js Caching

**Static Pages:**

- Landing page: ISR, revalidate 1 hour

**Dynamic Pages:**

- Dashboard: no-store (always fresh)
- Records list: revalidate on mutation
- Analytics: cache 5 minutes

### Supabase Caching

**Client-side:**

- Minimal, karena server-side first

**Server-side:**

- React cache() untuk dedupe requests
- Revalidate dengan revalidatePath()

### Example

```typescript
import { cache } from "react";

export const getLatestRecord = cache(async (userId: string) => {
  const supabase = createServerClient();
  return await supabase
    .from("blood_pressure_records")
    .select("*")
    .eq("user_id", userId)
    .order("measured_at", { ascending: false })
    .limit(1)
    .single();
});
```

---

## 15. State Management Strategy

### Server State (Primary)

- Data fetching di Server Components
- Server Actions untuk mutations
- URL state untuk filters/pagination

### Client State (Minimal)

- Form state: React Hook Form
- UI state: React useState (local only)
- No global state management needed

### Form Handling

```typescript
// Client Component
'use client'

export function AddRecordForm() {
  const form = useForm<RecordInput>({
    resolver: zodResolver(recordSchema)
  })

  async function onSubmit(data: RecordInput) {
    const result = await addRecord(data)
    if (result.error) {
      form.setError('root', { message: result.error.message })
    } else {
      router.push('/dashboard')
    }
  }

  return <form onSubmit={form.handleSubmit(onSubmit)}>...</form>
}
```

---

## 16. Security Requirements

### Authentication

- ✅ Supabase Auth (battle-tested)
- ✅ Email verification (optional MVP)
- ✅ Password reset flow
- ✅ Session management

### Authorization

- ✅ RLS policies (database level)
- ✅ Middleware protection (route level)
- ✅ Server Action validation (action level)

### Data Protection

- ✅ HTTPS only (Vercel default)
- ✅ Environment variables untuk secrets
- ✅ No sensitive data di client
- ✅ Input validation (Zod)
- ✅ SQL injection prevention (Supabase client)

### Privacy

- ✅ User data isolated (RLS)
- ✅ No third-party analytics (MVP)
- ✅ No data sharing
- ✅ User can delete account

---

## 17. Error Handling Strategy

### Server Actions

```typescript
export async function addRecord(data: RecordInput) {
  try {
    const validated = recordSchema.parse(data);
    const result = await supabase.from("records").insert(validated);

    if (result.error) {
      return { error: result.error.message };
    }

    revalidatePath("/dashboard");
    return { success: true, data: result.data };
  } catch (error) {
    if (error instanceof ZodError) {
      return { error: "Invalid input data" };
    }
    return { error: "Something went wrong" };
  }
}
```

### UI Error Display

- Form errors: inline di field
- Server errors: toast notification
- Network errors: retry button
- 404: custom page
- 500: custom error page

### Logging (Simple)

- Console.error di development
- Vercel logs di production
- No external logging service (MVP)

---

## 18. Performance Requirements

### Core Web Vitals Target

- LCP (Largest Contentful Paint): < 2.5s
- FID (First Input Delay): < 100ms
- CLS (Cumulative Layout Shift): < 0.1

### Optimization Strategies

- ✅ Server Components (less JS)
- ✅ Image optimization (next/image)
- ✅ Font optimization (next/font)
- ✅ Code splitting (automatic)
- ✅ Lazy loading (React.lazy untuk charts)

### Mobile Performance

- Target: 3G network
- Bundle size: < 200KB (initial)
- Time to interactive: < 3s

---

## 19. Accessibility Requirements

### WCAG 2.1 Level AA Compliance

**Keyboard Navigation:**

- ✅ Tab order logical
- ✅ Focus visible
- ✅ Skip to main content
- ✅ Escape to close modals

**Screen Reader:**

- ✅ Semantic HTML
- ✅ ARIA labels where needed
- ✅ Alt text untuk images
- ✅ Form labels proper

**Visual:**

- ✅ Color contrast ratio 4.5:1
- ✅ Text resizable up to 200%
- ✅ No color-only information
- ✅ Focus indicators

**Elderly-Friendly:**

- ✅ Font size minimum 16px
- ✅ Touch targets 44x44px minimum
- ✅ Simple language
- ✅ Clear error messages
- ✅ Undo actions available

---

## 20. Feature Prioritization

### MVP (Phase 1) - Must Have

- [x] Authentication (register, login, logout)
- [x] Dashboard (latest reading, quick stats, 7-day chart)
- [x] CRUD Blood Pressure Records
- [x] Auto Classification
- [x] Responsive Design
- [x] Dark Mode
- [x] Basic Analytics (weekly average)

### Post-MVP (Phase 2) - Should Have

- [ ] Reminder System (daily notification)
- [ ] Weekly Summary (email/in-app)
- [ ] Export PDF
- [ ] Monthly Analytics
- [ ] Profile Settings
- [ ] Data Import (CSV)

### Future (Phase 3) - Nice to Have

- [ ] PWA Support (offline-first)
- [ ] Smart Insights (AI-powered)
- [ ] Emergency Highlight (critical readings)
- [ ] Multi-language Support
- [ ] Share with Doctor (secure link)
- [ ] Medication Tracking
- [ ] Integration with Health Devices

---

## 21. Deployment Architecture

### Hosting

**Vercel (Recommended):**

- ✅ Zero-config Next.js deployment
- ✅ Automatic HTTPS
- ✅ Edge network (fast globally)
- ✅ Preview deployments
- ✅ Free tier sufficient untuk MVP

**Alternative:** Netlify, Railway, Fly.io

### Database

**Supabase:**

- ✅ Managed PostgreSQL
- ✅ Built-in Auth
- ✅ Real-time (optional)
- ✅ Free tier: 500MB database, 50K monthly active users

### Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

### Deployment Flow

```
1. Push to GitHub
2. Vercel auto-deploy
3. Run migrations (Supabase CLI)
4. Test production
5. Monitor
```

---

## 22. CI/CD Recommendation

### Simple Setup (MVP)

**GitHub Actions (Optional):**

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run lint
      - run: npm run type-check
      - run: npm run build
```

**Vercel Auto-Deploy:**

- Main branch → Production
- Other branches → Preview

### Quality Checks

- TypeScript type checking
- ESLint
- Prettier
- Build success

---

## 23. Scaling Consideration

### Current Capacity (MVP)

- Users: 1-100 (personal/family use)
- Records: ~10K per user per year
- Traffic: Low (personal use)

### If Need to Scale (Future)

- Supabase free tier → paid tier
- Add database indexes
- Implement pagination
- Add Redis caching
- CDN untuk static assets
- Database read replicas

### Cost Estimation (MVP)

- Vercel: $0 (free tier)
- Supabase: $0 (free tier)
- Domain: ~$10/year
- **Total: ~$10/year**

---

## 24. Risks & Mitigations

| Risk                       | Impact | Probability | Mitigation                               |
| -------------------------- | ------ | ----------- | ---------------------------------------- |
| Data loss                  | High   | Low         | Supabase auto-backup, export feature     |
| Supabase downtime          | Medium | Low         | Status page monitoring, fallback message |
| User adoption              | Medium | Medium      | Simple onboarding, clear value prop      |
| Accessibility issues       | Medium | Medium      | Regular testing, semantic HTML           |
| Performance on old devices | Low    | Medium      | Progressive enhancement, minimal JS      |

---

## 25. MVP Scope Definition

### IN SCOPE (MVP)

✅ Core CRUD untuk blood pressure records  
✅ Auto classification  
✅ Dashboard dengan chart 7 hari  
✅ Authentication (email/password)  
✅ Responsive design  
✅ Dark mode  
✅ Basic analytics (weekly average)

### OUT OF SCOPE (MVP)

❌ Reminder/notification system  
❌ Email summaries  
❌ Export PDF  
❌ PWA/offline support  
❌ Multi-language  
❌ Social features  
❌ Device integration  
❌ AI insights

### Success Criteria (MVP)

- ✅ User dapat register dan login
- ✅ User dapat add/edit/delete records dalam < 30 detik
- ✅ Dashboard menampilkan data dengan jelas
- ✅ Auto classification bekerja akurat
- ✅ Mobile responsive 100%
- ✅ Page load < 2 detik
- ✅ Zero critical bugs

---

## 26. Development Timeline (Estimasi)

### Phase 1: Foundation

- Setup project (Next.js + Supabase)
- Authentication flow
- Database schema + RLS

### Phase 2: Core Features

- Dashboard layout
- CRUD records
- Auto classification
- Form validation

### Phase 3: Analytics & Polish

- Charts (Recharts)
- Analytics page
- Dark mode
- Responsive design

### Phase 4: Testing & Deploy

- Manual testing
- Accessibility check
- Performance optimization
- Production deployment

**Note:** Timeline tidak disertakan karena per instruksi, fokus pada actionable steps.

---

## 27. Technical Decisions & Rationale

### Why Next.js App Router?

- Server-side first architecture
- Built-in optimizations
- Type-safe dengan TypeScript
- Modern React patterns (RSC)
- Easy deployment

### Why Supabase?

- PostgreSQL (reliable, scalable)
- Built-in auth (less code)
- RLS (security by default)
- Free tier generous
- Good DX

### Why Server Actions?

- No API routes needed
- Type-safe end-to-end
- Less boilerplate
- Better security (CSRF protection)
- Simpler architecture

### Why shadcn/ui?

- Copy-paste components (no dependency bloat)
- Customizable
- Accessible by default
- Tailwind-based
- Modern design

---

## 28. Maintenance Plan

### Regular Tasks

- Monitor Vercel logs (weekly)
- Check Supabase usage (monthly)
- Update dependencies (monthly)
- Backup database (automatic via Supabase)

### Support

- Self-hosted (personal use)
- No customer support needed
- GitHub issues untuk bug tracking (optional)

---

## 29. Appendix

### A. Blood Pressure Classification Reference

Berdasarkan American Heart Association (AHA):

| Category             | Systolic (mmHg) | Diastolic (mmHg) | Action              |
| -------------------- | --------------- | ---------------- | ------------------- |
| Low                  | < 90            | OR < 60          | Konsultasi dokter   |
| Normal               | < 120           | AND < 80         | Maintain lifestyle  |
| Elevated             | 120-129         | AND < 80         | Lifestyle changes   |
| Hypertension Stage 1 | 130-139         | OR 80-89         | Lifestyle + monitor |
| Hypertension Stage 2 | ≥ 140           | OR ≥ 90          | Konsultasi dokter   |

### B. Useful Resources

- Next.js Docs: https://nextjs.org/docs
- Supabase Docs: https://supabase.com/docs
- shadcn/ui: https://ui.shadcn.com
- Tailwind CSS: https://tailwindcss.com
- Recharts: https://recharts.org

### C. Color Palette (Suggestion)

**Light Mode:**

- Background: #FFFFFF
- Text: #1F2937
- Primary: #3B82F6
- Success: #10B981
- Warning: #F59E0B
- Danger: #EF4444

**Dark Mode:**

- Background: #111827
- Text: #F9FAFB
- Primary: #60A5FA
- Success: #34D399
- Warning: #FBBF24
- Danger: #F87171

---

## 30. Next Steps

### Immediate Actions

1. ✅ Review dan approve PRD ini
2. Setup project structure
3. Initialize Next.js + Supabase
4. Create database schema
5. Implement authentication
6. Build core features
7. Test dan deploy

### Questions to Resolve

- Domain name preference?
- Specific design preferences?
- Any additional requirements?

---

**Document Status:** Ready for Review  
**Prepared by:** AI Product Manager & Architect  
**For:** Personal/Small Scale Use  
**Focus:** MVP, Production-Ready, Server-Side First

---

_PRD ini dibuat dengan fokus pada kesederhanaan, praktikalitas, dan implementasi langsung untuk skala kecil/personal use. Semua keputusan teknis dipilih untuk meminimalkan kompleksitas sambil tetap production-ready._
