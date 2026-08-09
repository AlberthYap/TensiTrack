'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Mic, MicOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { parseBloodPressureTranscript } from '@/lib/voice-parse'

// ── Web Speech API types ─────────────────────────────────────────────────

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
  resultIndex: number
}

interface SpeechRecognitionError extends Event {
  error: string
  message: string
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  lang: string
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionError) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance
  }
}

interface VoiceInputProps {
  onResult: (systolic: string, diastolic: string, pulse: string | null) => void
  className?: string
}

// Chrome/Chromium/Brave on Linux never ship Google's cloud speech service,
// so recognition.start() always fails with a 'network' error there — even
// over HTTPS. Detect it to show an honest, actionable message.
function isLinuxChromium(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  const isLinux = /Linux/i.test(ua) && !/Android/i.test(ua)
  const isChromium = /Chrome|Chromium|Edg|Brave/i.test(ua)
  return isLinux && isChromium
}

function isLocalhost(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.protocol === 'http:'
  )
}

/**
 * Voice input button for blood pressure form.
 *
 * Uses Web Speech API (id-ID). Chrome/Edge will prompt for mic permission
 * on first use — no pre-flight getUserMedia call needed.
 */
export function VoiceInput({ onResult, className }: VoiceInputProps) {
  const [listening, setListening] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [supported, setSupported] = useState(true)
  const [lastTranscript, setLastTranscript] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)

  // Check browser support on mount — hide button immediately if unsupported.
  useEffect(() => {
    if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
      setSupported(false)
    }
  }, [])

  const handleTranscript = useCallback(
    (text: string) => {
      setLastTranscript(text)
      const result = parseBloodPressureTranscript(text)

      if (result.systolic !== null && result.diastolic !== null) {
        onResult(
          String(result.systolic),
          String(result.diastolic),
          result.pulse !== null ? String(result.pulse) : null
        )
      } else if (result.systolic !== null && result.partial) {
        // Only systolic recognized — fill it and nudge for the diastolic.
        onResult(String(result.systolic), '', null)
        setError('Hanya sistolik yang terbaca. Bilang lagi, misalnya: "120 80"')
      } else {
        setError('Tidak dapat mengenali angka. Coba: "120 80" atau "seratus dua puluh per delapan puluh"')
      }
    },
    [onResult]
  )

  const startListening = useCallback(() => {
    setError(null)

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setSupported(false)
      setError('Browser tidak mendukung input suara. Gunakan Chrome/Edge.')
      return
    }

    // getUserMedia triggers the browser's mic permission dialog.
    // SpeechRecognition.start() alone often fails "not-allowed" without
    // ever showing a prompt — this pre-flight call fixes that.
    const requestMic = navigator.mediaDevices?.getUserMedia
      ? navigator.mediaDevices.getUserMedia({ audio: true })
      : Promise.resolve(null as unknown as MediaStream)

    requestMic
      .then((stream) => {
        stream?.getTracks().forEach((t) => t.stop())

        const recognition = new SpeechRecognition()
        recognition.lang = 'id-ID'
        recognition.interimResults = false
        recognition.continuous = false
        // Chrome returns up to N alternative transcripts when it is unsure
        // (e.g. "140 90" heard as several wordings). Try them all and use
        // the first one that parses to valid numbers.
        recognition.maxAlternatives = 5

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          const alternatives = event.results[0]
          let matched = false
          for (let i = 0; i < alternatives.length; i++) {
            const text = alternatives[i].transcript
            const result = parseBloodPressureTranscript(text)
            if (result.systolic !== null && result.diastolic !== null) {
              onResult(
                String(result.systolic),
                String(result.diastolic),
                result.pulse !== null ? String(result.pulse) : null
              )
              setLastTranscript(text)
              matched = true
              break
            }
          }
          // No alternative parsed — fall back to the primary transcript
          // so the user sees the debug line + a targeted error/hint.
          if (!matched) handleTranscript(event.results[0][0].transcript)
          setListening(false)
        }

        recognition.onerror = (event: SpeechRecognitionError) => {
          if (event.error === 'no-speech') {
            setError('Tidak ada suara terdeteksi. Coba lagi.')
          } else if (event.error === 'not-allowed') {
            setError('Izin mikrofon diperlukan. Izinkan akses di pengaturan browser.')
          } else if (event.error === 'network') {
            if (isLinuxChromium()) {
              setError(
                'Input suara tidak didukung Chrome/Brave di Linux. '
                + 'Coba di HP Android atau Chrome di Windows/macOS.'
              )
            } else if (isLocalhost()) {
              setError(
                'Input suara tidak tersedia di localhost. '
                + 'Gunakan HTTPS (ngrok) atau deploy ke production untuk mencoba fitur ini.'
              )
            } else {
              setError('Koneksi ke layanan input suara gagal. Periksa internet lalu coba lagi.')
            }
          } else if (event.error !== 'aborted') {
            setError(`Gagal: ${event.error}`)
          }
          setListening(false)
        }

        recognition.onend = () => setListening(false)

        recognition.start()
        setListening(true)
        recognitionRef.current = recognition
      })
      .catch((err: Error) => {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setError('Izin mikrofon diperlukan. Izinkan akses di pengaturan browser.')
        } else {
          setError('Mikrofon tidak tersedia.')
        }
      })
  }, [handleTranscript])

  const stopListening = useCallback(() => {
    recognitionRef.current?.abort()
    setListening(false)
  }, [])

  if (!supported && !listening) return null

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <button
        type="button"
        onClick={listening ? stopListening : startListening}
        className={cn(
          'w-full inline-flex items-center justify-center gap-2 h-11 rounded-xl border-2 transition-all text-sm font-medium',
          listening
            ? 'border-red-400 bg-red-50 dark:bg-red-950 text-red-600 animate-pulse'
            : 'border-dashed border-gray-300 dark:border-gray-600 text-gray-500 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 dark:hover:text-blue-400 hover:text-blue-600'
        )}
        title={listening ? 'Berhenti' : 'Input suara'}
      >
        {listening ? (
          <Mic className="w-5 h-5" />
        ) : (
          <MicOff className="w-5 h-5" />
        )}
        {listening ? 'Mendengarkan...' : 'Input Suara'}
      </button>

      {error ? (
        <span className="text-xs text-amber-600 dark:text-amber-400 leading-snug">
          {error}
        </span>
      ) : (
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-snug">
          Bilang misalnya: &quot;120 80&quot; atau &quot;seratus dua puluh per delapan puluh&quot;
        </p>
      )}

      {lastTranscript && (
        <p className="text-xs text-gray-400 dark:text-gray-500 leading-snug break-words">
          Terdeteksi: &quot;{lastTranscript}&quot;
        </p>
      )}
    </div>
  )
}
