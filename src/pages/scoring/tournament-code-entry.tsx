import { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent, ChangeEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Trophy, Info, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTournamentsStore } from '@/stores/tournaments-store'
import { setTournamentSession } from '@/hooks/use-tournament-session'
import { validateTournamentCode } from '@/lib/utils/tournament-code'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-500 via-purple-500 to-purple-700">
      {/* Header */}
      <header className="bg-primary text-primary-foreground p-4 shadow-lg">
        <h1 className="text-center text-xl font-semibold">ScoreWRX™</h1>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-5">
        <div className="bg-white rounded-2xl p-8 sm:p-10 max-w-[450px] w-full shadow-2xl">
          {/* Logo/Icon */}
          <div className="text-center mb-8">
            <Trophy className="h-20 w-20 mx-auto text-primary" strokeWidth={1.5} />
          </div>

          {/* Title and Instructions */}
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold mb-2">Enter Tournament Code</h2>
            <p className="text-sm text-muted-foreground">
              Enter the 6-digit code provided by your tournament organizer
            </p>
          </div>

          {/* Code Input Boxes */}
          <div className="mb-6">
            <div className="flex gap-2 sm:gap-3 justify-center items-center">
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
                    "w-11 h-14 sm:w-12 sm:h-16 text-2xl sm:text-3xl font-semibold text-center",
                    "border-2 rounded-xl outline-none transition-all duration-200",
                    "bg-gray-50 text-primary caret-primary",
                    "focus:border-primary focus:bg-white focus:shadow-lg focus:shadow-primary/10 focus:scale-105",
                    errorMessage && "border-red-500 bg-red-50 animate-shake",
                    loading && "opacity-50 cursor-not-allowed"
                  )}
                />
              ))}
            </div>
            
            {/* Error Message */}
            {errorMessage && (
              <div className="text-red-500 text-sm text-center mt-3 animate-fadeIn">
                {errorMessage}
              </div>
            )}
          </div>

          {/* Continue Button */}
          <Button
            onClick={() => validateAndContinue()}
            disabled={!canContinue}
            className="w-full py-6 text-lg"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Validating...
              </>
            ) : (
              'Continue'
            )}
          </Button>

          {/* Help Text */}
          <div className="text-center mt-8">
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <Info className="h-4 w-4" />
              Don't have a code? Contact your tournament organizer.
            </p>
          </div>

          {/* Version Display */}
          <div className="text-center mt-4">
            <p className="text-sm text-muted-foreground font-medium">
              Version 1.0.0
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

