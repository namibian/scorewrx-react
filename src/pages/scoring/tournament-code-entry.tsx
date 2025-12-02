import { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent, ChangeEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Info, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTournamentsStore } from '@/stores/tournaments-store'
import { setTournamentSession } from '@/hooks/use-tournament-session'
import { validateTournamentCode } from '@/lib/utils/tournament-code'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/common/logo'

export default function TournamentCodeEntryPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const tournamentsStore = useTournamentsStore()
  
  // Preserve debug mode through navigation
  const debugParam = searchParams.get('debug') === 'true' ? '?debug=true' : ''

  // State
  const [codeDigits, setCodeDigits] = useState<string[]>(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  
  // Refs for input elements
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Computed
  const code = codeDigits.join('')
  const canContinue = validateTournamentCode(code) && !loading

  // Auto-focus first input on mount
  useEffect(() => {
    setTimeout(() => {
      inputRefs.current[0]?.focus()
    }, 300)
  }, [])

  const handleDigitInput = (index: number, event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    
    // Only allow numeric input
    const digit = value.replace(/[^0-9]/g, '')
    
    // Update the digit at this index
    const newDigits = [...codeDigits]
    newDigits[index] = digit
    setCodeDigits(newDigits)

    // Clear error when user starts typing
    if (errorMessage) {
      setErrorMessage('')
    }

    // Auto-advance to next input if a digit was entered
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-submit if all 6 digits are filled
    const newCode = newDigits.join('')
    if (newCode.length === 6 && validateTournamentCode(newCode)) {
      // Small delay to let the UI update
      setTimeout(() => validateAndContinue(newCode), 100)
    }
  }

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace
    if (event.key === 'Backspace') {
      if (!codeDigits[index] && index > 0) {
        // If current box is empty, go back and clear previous box
        event.preventDefault()
        inputRefs.current[index - 1]?.focus()
        const newDigits = [...codeDigits]
        newDigits[index - 1] = ''
        setCodeDigits(newDigits)
      }
    }
    // Handle left arrow
    else if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault()
      inputRefs.current[index - 1]?.focus()
    }
    // Handle right arrow
    else if (event.key === 'ArrowRight' && index < 5) {
      event.preventDefault()
      inputRefs.current[index + 1]?.focus()
    }
    // Handle Enter
    else if (event.key === 'Enter' && canContinue) {
      validateAndContinue(code)
    }
  }

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault()
    const pastedData = event.clipboardData.getData('text').replace(/[^0-9]/g, '')

    // Fill the boxes with pasted data
    const newDigits = [...codeDigits]
    for (let i = 0; i < Math.min(6, pastedData.length); i++) {
      newDigits[i] = pastedData[i]
    }
    setCodeDigits(newDigits)

    // Focus the last filled box or the next empty one
    const lastIndex = Math.min(5, pastedData.length - 1)
    inputRefs.current[lastIndex]?.focus()

    // Auto-submit if 6 digits were pasted
    const newCode = newDigits.join('')
    if (pastedData.length >= 6 && validateTournamentCode(newCode)) {
      setTimeout(() => validateAndContinue(newCode), 100)
    }
  }

  const validateAndContinue = async (codeToValidate?: string) => {
    const finalCode = codeToValidate || code
    
    if (!validateTournamentCode(finalCode)) {
      setErrorMessage('Please enter a valid 6-digit code')
      return
    }

    setLoading(true)
    setErrorMessage('')

    try {
      // Fetch tournament by code
      const tournament = await tournamentsStore.getTournamentByCode(finalCode)

      if (!tournament) {
        setErrorMessage('Tournament not found. Please check your code and try again.')
        return
      }

      // Handle different tournament states
      const tournamentState = tournament.state || 'Created'

      switch (tournamentState) {
        case 'Created':
          setErrorMessage('This tournament is not yet open. Please contact the organizer.')
          return

        case 'Open':
          // Redirect to registration page
          navigate(`/registration/${finalCode}`)
          return

        case 'Active':
          // Check if tournament has groups
          if (!tournament.groups || tournament.groups.length === 0) {
            setErrorMessage('This tournament has no groups set up yet. Please contact the organizer.')
            return
          }

          // Store tournament session
          setTournamentSession(tournament.id, finalCode)

          // Navigate to player selection page for scoring (preserve debug param)
          navigate(`/scoring/select${debugParam}`)

          toast.success(`Tournament found: ${tournament.name}`)
          return

        case 'Archived':
          setErrorMessage('This tournament has ended. Scoring is no longer available.')
          return

        default:
          setErrorMessage('Invalid tournament state. Please contact the organizer.')
          return
      }
    } catch (error) {
      console.error('Error validating tournament code:', error)
      setErrorMessage('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      {/* Clean Header - High contrast for outdoor visibility */}
      <header className="bg-emerald-700 text-white px-4 py-5">
        <h1 className="text-center text-lg font-medium tracking-wide">ScoreWRX™</h1>
      </header>

      {/* Main Content - Centered, clean */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-6 sm:p-8 w-full max-w-sm border border-neutral-200">
          {/* Logo */}
          <div className="text-center mb-6">
            <Logo size={64} className="mx-auto" />
          </div>

          {/* Title and Instructions - Clear hierarchy */}
          <div className="text-center mb-8">
            <h2 className="text-xl font-semibold text-neutral-900 mb-2">
              Enter Tournament Code
            </h2>
            <p className="text-sm text-neutral-600">
              6-digit code from your organizer
            </p>
          </div>

          {/* Code Input Boxes - Responsive, fits container */}
          <div className="mb-6">
            <div className="grid grid-cols-6 gap-2 max-w-[280px] mx-auto">
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={codeDigits[index]}
                  onChange={(e) => handleDigitInput(index, e)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  disabled={loading}
                  className={cn(
                    "aspect-[3/4] w-full text-2xl font-bold text-center",
                    "border-2 rounded-lg outline-none transition-all duration-150",
                    "bg-neutral-50 text-neutral-900",
                    "focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20",
                    errorMessage && "border-red-400 bg-red-50 animate-shake",
                    loading && "opacity-50 cursor-not-allowed"
                  )}
                />
              ))}
            </div>
            
            {/* Error Message */}
            {errorMessage && (
              <div className="text-red-600 text-sm text-center mt-4 font-medium animate-fadeIn">
                {errorMessage}
              </div>
            )}
          </div>

          {/* Continue Button - Large touch target */}
          <Button
            onClick={() => validateAndContinue()}
            disabled={!canContinue}
            className="w-full h-14 text-base font-medium bg-emerald-600 hover:bg-emerald-700 disabled:bg-neutral-300 disabled:text-neutral-500"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Checking...
              </>
            ) : (
              'Continue'
            )}
          </Button>

          {/* Help Text */}
          <div className="text-center mt-6">
            <p className="text-sm text-neutral-500 flex items-center justify-center gap-1.5">
              <Info className="h-4 w-4" />
              No code? Ask your organizer.
            </p>
          </div>

          {/* Version Display */}
          <div className="text-center mt-4">
            <p className="text-xs text-neutral-400">
              v1.0.0
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

