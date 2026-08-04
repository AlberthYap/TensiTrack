'use client'

import { useState } from 'react'
import { User } from 'lucide-react'
import { loginAsDemo } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'

export function DemoLoginButton() {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setPending(true)
    setError(null)
    try {
      const result = await loginAsDemo()
      if (result?.error) {
        setError(result.error)
      }
    } finally {
      setPending(false)
    }
  }

  return (
    <form action={handleSubmit} className="space-y-3">
      {error && (
        <p className="text-sm text-center text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      <Button
        type="submit"
        variant="outline"
        className="w-full"
        disabled={pending}
      >
        <User className="w-4 h-4 mr-2" />
        {pending ? 'Memproses...' : 'Masuk sebagai Demo'}
      </Button>
    </form>
  )
}
