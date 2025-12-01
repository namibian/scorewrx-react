interface LogoProps {
  className?: string;
  size?: number;
}

export function Logo({ className = "", size = 200 }: LogoProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 200 200" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="ScoreWrx Logo"
    >
      <g transform="translate(100, 100)">
        {/* Center circle */}
        <circle cx="0" cy="0" r="20" fill="#1e40af" stroke="#f5f5f5" strokeWidth="2"/>
        
        {/* 6 spider legs/spikes radiating outward */}
        {/* Leg 1 (top) */}
        <path d="M 0,-20 L 8,-50 L 18,-75 L 15,-78 L 5,-55 L 0,-25 Z" fill="#1e40af"/>
        <path d="M 0,-20 L -8,-50 L -18,-75 L -15,-78 L -5,-55 L 0,-25 Z" fill="#2563eb"/>
        
        {/* Leg 2 (top right) */}
        <g transform="rotate(60)">
          <path d="M 0,-20 L 8,-50 L 18,-75 L 15,-78 L 5,-55 L 0,-25 Z" fill="#1e40af"/>
          <path d="M 0,-20 L -8,-50 L -18,-75 L -15,-78 L -5,-55 L 0,-25 Z" fill="#2563eb"/>
        </g>
        
        {/* Leg 3 (bottom right) */}
        <g transform="rotate(120)">
          <path d="M 0,-20 L 8,-50 L 18,-75 L 15,-78 L 5,-55 L 0,-25 Z" fill="#1e40af"/>
          <path d="M 0,-20 L -8,-50 L -18,-75 L -15,-78 L -5,-55 L 0,-25 Z" fill="#2563eb"/>
        </g>
        
        {/* Leg 4 (bottom) */}
        <g transform="rotate(180)">
          <path d="M 0,-20 L 8,-50 L 18,-75 L 15,-78 L 5,-55 L 0,-25 Z" fill="#1e40af"/>
          <path d="M 0,-20 L -8,-50 L -18,-75 L -15,-78 L -5,-55 L 0,-25 Z" fill="#2563eb"/>
        </g>
        
        {/* Leg 5 (bottom left) */}
        <g transform="rotate(240)">
          <path d="M 0,-20 L 8,-50 L 18,-75 L 15,-78 L 5,-55 L 0,-25 Z" fill="#1e40af"/>
          <path d="M 0,-20 L -8,-50 L -18,-75 L -15,-78 L -5,-55 L 0,-25 Z" fill="#2563eb"/>
        </g>
        
        {/* Leg 6 (top left) */}
        <g transform="rotate(300)">
          <path d="M 0,-20 L 8,-50 L 18,-75 L 15,-78 L 5,-55 L 0,-25 Z" fill="#1e40af"/>
          <path d="M 0,-20 L -8,-50 L -18,-75 L -15,-78 L -5,-55 L 0,-25 Z" fill="#2563eb"/>
        </g>
        
        {/* Golf ball dimple texture on center */}
        <circle cx="-6" cy="-6" r="2" fill="#f5f5f5" opacity="0.3"/>
        <circle cx="6" cy="-6" r="2" fill="#f5f5f5" opacity="0.3"/>
        <circle cx="-6" cy="6" r="2" fill="#f5f5f5" opacity="0.3"/>
        <circle cx="6" cy="6" r="2" fill="#f5f5f5" opacity="0.3"/>
        <circle cx="0" cy="0" r="2" fill="#f5f5f5" opacity="0.4"/>
      </g>
    </svg>
  );
}

interface LogoIconProps {
  className?: string;
  size?: number;
}

export function LogoIcon({ className = "", size = 32 }: LogoIconProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 32 32" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="ScoreWrx Icon"
    >
      <g transform="translate(16, 16)">
        <circle cx="0" cy="0" r="3" fill="#1e40af"/>
        
        <path d="M 0,-3 L 1,-7 L 3,-12 L 2,-13 L 0.5,-8 L 0,-4 Z" fill="#1e40af"/>
        <path d="M 0,-3 L -1,-7 L -3,-12 L -2,-13 L -0.5,-8 L 0,-4 Z" fill="#2563eb"/>
        
        <g transform="rotate(60)">
          <path d="M 0,-3 L 1,-7 L 3,-12 L 2,-13 L 0.5,-8 L 0,-4 Z" fill="#1e40af"/>
          <path d="M 0,-3 L -1,-7 L -3,-12 L -2,-13 L -0.5,-8 L 0,-4 Z" fill="#2563eb"/>
        </g>
        
        <g transform="rotate(120)">
          <path d="M 0,-3 L 1,-7 L 3,-12 L 2,-13 L 0.5,-8 L 0,-4 Z" fill="#1e40af"/>
          <path d="M 0,-3 L -1,-7 L -3,-12 L -2,-13 L -0.5,-8 L 0,-4 Z" fill="#2563eb"/>
        </g>
        
        <g transform="rotate(180)">
          <path d="M 0,-3 L 1,-7 L 3,-12 L 2,-13 L 0.5,-8 L 0,-4 Z" fill="#1e40af"/>
          <path d="M 0,-3 L -1,-7 L -3,-12 L -2,-13 L -0.5,-8 L 0,-4 Z" fill="#2563eb"/>
        </g>
        
        <g transform="rotate(240)">
          <path d="M 0,-3 L 1,-7 L 3,-12 L 2,-13 L 0.5,-8 L 0,-4 Z" fill="#1e40af"/>
          <path d="M 0,-3 L -1,-7 L -3,-12 L -2,-13 L -0.5,-8 L 0,-4 Z" fill="#2563eb"/>
        </g>
        
        <g transform="rotate(300)">
          <path d="M 0,-3 L 1,-7 L 3,-12 L 2,-13 L 0.5,-8 L 0,-4 Z" fill="#1e40af"/>
          <path d="M 0,-3 L -1,-7 L -3,-12 L -2,-13 L -0.5,-8 L 0,-4 Z" fill="#2563eb"/>
        </g>
      </g>
    </svg>
  );
}

