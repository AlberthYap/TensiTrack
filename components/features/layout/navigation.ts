import { Activity, LayoutDashboard, FileText, BarChart3, Settings } from 'lucide-react'

/**
 * Single source of truth untuk navigasi utama aplikasi.
 * Dipakai oleh Sidebar (desktop) dan MobileNav (mobile).
 */
export const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    description: 'Ringkasan tekanan darah',
  },
  {
    name: 'Riwayat',
    href: '/records',
    icon: FileText,
    description: 'Daftar pencatatan',
  },
  {
    name: 'Analitik',
    href: '/analytics',
    icon: BarChart3,
    description: 'Tren & statistik',
  },
  {
    name: 'Pengaturan',
    href: '/settings',
    icon: Settings,
    description: 'Profil & preferensi',
  },
] as const

export const APP_BRAND = {
  name: 'Tensi Harian',
  icon: Activity,
  tagline: 'Pencatat Tekanan Darah',
} as const
