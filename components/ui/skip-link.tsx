/**
 * SkipLink — accessible skip-to-main-content link for keyboard / screen reader
 * users. WCAG 2.4.1 "Bypass Blocks". Hidden by default, becomes visible on
 * focus so it doesn't distract sighted mouse users but stays reachable via Tab.
 *
 * Dipasang di paling atas dokumen (di RootLayout) sebelum konten apapun
 * sehingga reader pertama kali menemukan link ini.
 */
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="
        sr-only
        focus:not-sr-only
        focus:absolute
        focus:left-4
        focus:top-4
        focus:z-[100]
        focus:inline-flex
        focus:items-center
        focus:gap-2
        focus:rounded-lg
        focus:bg-blue-600
        focus:px-4
        focus:py-2.5
        focus:text-sm
        focus:font-semibold
        focus:text-white
        focus:shadow-xl
        focus:outline-none
        focus:ring-2
        focus:ring-blue-300
        focus:ring-offset-2
        focus:dark:ring-offset-gray-950
      "
    >
      Lewati ke konten utama
    </a>
  )
}
