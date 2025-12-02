/**
 * Tournament Code Utilities
 * 
 * Functions for generating and validating tournament codes.
 */

/**
 * Generate a 6-digit numerical code for tournaments
 * @returns A 6-digit numerical code as a string
 */
export function generateTournamentCode(): string {
  // Generate a random 6-digit number between 100000 and 999999
  const min = 100000
  const max = 999999
  return String(Math.floor(Math.random() * (max - min + 1)) + min)
}

/**
 * Validate that a tournament code is a valid 6-digit number
 * @param code - The code to validate
 * @returns True if valid, false otherwise
 */
export function validateTournamentCode(code: string | number): boolean {
  const codeStr = String(code)
  return /^\d{6}$/.test(codeStr)
}

