import { AlertTriangle, Phone } from 'lucide-react'
import { CRISIS_INFO, isHypertensionCrisis } from '@/lib/blood-pressure'
import { cn } from '@/lib/utils'

interface CrisisAlertProps {
  systolic: number
  diastolic: number
  variant?: 'banner' | 'card' | 'inline'
  className?: string
}

/**
 * Crisis Alert — surface pembacaan krisis hipertensi (AHA: ≥180/≥120).
 * Hanya render ketika isHypertensionCrisis() true.
 *
 * Variants:
 *  - `banner` : tinggi, untuk top of dashboard / latest reading
 *  - `card`   : sedang, untuk record detail / list item
 *  - `inline` : kompak, untuk badge pada table row
 */
export function CrisisAlert({
  systolic,
  diastolic,
  variant = 'banner',
  className,
}: CrisisAlertProps) {
  if (!isHypertensionCrisis(systolic, diastolic)) return null

  if (variant === 'inline') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-red-600 text-white animate-pulse',
          className
        )}
        aria-label={CRISIS_INFO.label}
      >
        <AlertTriangle className="w-3 h-3" aria-hidden="true" />
        {CRISIS_INFO.shortLabel}
      </span>
    )
  }

  const isBanner = variant === 'banner'

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        'rounded-xl border-2 border-red-600 bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-100',
        isBanner ? 'p-4 sm:p-5' : 'p-3 sm:p-4',
        'animate-pulse-soft',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="inline-flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-red-600 text-white flex-shrink-0"
        >
          <AlertTriangle className={isBanner ? 'w-5 h-5' : 'w-4 h-4'} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3
              className={cn(
                'font-bold',
                isBanner ? 'text-base sm:text-lg' : 'text-sm'
              )}
            >
              {CRISIS_INFO.label}
            </h3>
            <span className="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-red-600 text-white">
              Darurat
            </span>
          </div>
          <p
            className={cn(
              'leading-relaxed',
              isBanner ? 'text-sm' : 'text-xs'
            )}
          >
            {CRISIS_INFO.recommendation}
          </p>
          {isBanner && (
            <div className="mt-3 flex flex-wrap gap-2">
              <a
                href="tel:119"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-red-50 dark:focus-visible:ring-offset-red-950"
              >
                <Phone className="w-3.5 h-3.5" aria-hidden="true" />
                Hubungi 119 (Ambulans)
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
