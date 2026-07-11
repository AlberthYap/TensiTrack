import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { SkipLink } from "@/components/ui/skip-link";
import { PwaRegister } from "@/components/pwa-register";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://tensi-harian.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "Tensi Harian - Pencatat Tekanan Darah",
    template: "%s | Tensi Harian",
  },
  description:
    "Aplikasi untuk mencatat, memantau, dan menganalisis tekanan darah harian Anda. Dilengkapi dengan grafik, statistik, dan fitur berbagi dengan dokter.",
  keywords: [
    "tekanan darah",
    "tensi",
    "kesehatan",
    "blood pressure",
    "tracker",
    "Indonesia",
  ],
  authors: [{ name: "Tensi Harian" }],
  creator: "Tensi Harian",
  applicationName: "Tensi Harian",
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: APP_URL,
    title: "Tensi Harian - Pencatat Tekanan Darah",
    description:
      "Catat dan pantau tekanan darah harian Anda dengan mudah. Dilengkapi analitik dan fitur berbagi dengan dokter.",
    siteName: "Tensi Harian",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tensi Harian - Pencatat Tekanan Darah",
    description:
      "Catat dan pantau tekanan darah harian Anda dengan mudah.",
  },
  robots: {
    index: true,
    follow: true,
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Tensi Harian",
  },
  icons: {
    icon: [
      {
        url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='%233b82f6'/%3E%3Cstop offset='1' stop-color='%238b5cf6'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='32' height='32' rx='8' fill='url(%23g)'/%3E%3Cpath d='M6 17h4l2-4 4 8 2-4h8' stroke='white' stroke-width='2.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E",
        type: "image/svg+xml",
      },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", type: "image/png", sizes: "180x180" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${inter.variable} font-sans antialiased min-h-screen`}
      >
        {/* WCAG 2.4.1 — bypass blocks link */}
        <SkipLink />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
        {/* Service worker registration (production only) */}
        <PwaRegister />
      </body>
    </html>
  );
}
