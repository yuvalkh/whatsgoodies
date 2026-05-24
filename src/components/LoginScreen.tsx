'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { login } from '@/actions/goodies'
import { CreditCard, ArrowRight, Loader2 } from 'lucide-react'

export default function LoginScreen() {
  const [number, setNumber] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!/^\d{7}$/.test(number)) {
      setError('Please enter exactly 7 digits')
      return
    }

    setLoading(true)
    try {
      await login(number)
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Login failed')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-card w-full max-w-md p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex justify-center mb-6">
          <div className="bg-indigo-100 dark:bg-indigo-900 p-4 rounded-full">
            <CreditCard className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-center mb-2 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">
          Goodies Platform
        </h1>
        <p className="text-center text-gray-500 dark:text-gray-400 mb-8">
          Enter your 7-digit Goodies number to start sharing and claiming cards.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="number" className="block text-sm font-medium mb-2">
              Goodies Number
            </label>
            <input
              id="number"
              type="text"
              inputMode="numeric"
              pattern="\d*"
              maxLength={7}
              placeholder="e.g. 8464535"
              className="glass-input text-2xl tracking-widest text-center font-mono placeholder:text-gray-400/50"
              value={number}
              onChange={(e) => setNumber(e.target.value.replace(/\D/g, ''))}
              required
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center bg-red-100 dark:bg-red-900/30 p-2 rounded-md">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || number.length !== 7}
            className="primary-btn w-full group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Login / Register
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
