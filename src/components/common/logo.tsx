interface LogoProps {
  size?: number
  className?: string
}

export function Logo({ size = 48, className = '' }: LogoProps) {
  return (
    <img
      src="/favicon.svg"
      alt="ScoreWrx Logo"
      width={size}
      height={size}
      className={className}
    />
  )
}
