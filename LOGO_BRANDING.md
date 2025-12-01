# ScoreWrx Logo & Branding

## Overview

The ScoreWrx logo and icon system is inspired by the **Softspikes spider golf spike** design, incorporating elements that represent both golf and precision scoring.

## Design Philosophy

The logo features:
- **6 radiating spikes** - Mimicking the spider-like design of golf shoe spikes
- **Blue color scheme** - Primary: `#1e40af` (blue-800), Secondary: `#2563eb` (blue-600)
- **Whitesmoke accents** - `#f5f5f5` for contrast and detail
- **Golf ball texture** - Subtle dimple pattern on the center circle
- **No text** - Clean, modern, icon-first approach

## Files Created

### SVG Assets (Public Directory)
1. **`/public/logo.svg`** - Main logo (200x200px)
   - Use for general branding purposes
   - Scalable for various sizes

2. **`/public/icon-512.svg`** - Large app icon (512x512px)
   - PWA icon
   - High-resolution displays

3. **`/public/icon-192.svg`** - Medium app icon (192x192px)
   - PWA icon
   - Apple touch icon

4. **`/public/favicon.svg`** - Favicon (32x32px)
   - Browser tab icon
   - Bookmarks

### React Components

**`/src/components/common/logo.tsx`**

Two components for use in the React app:

#### `<Logo />`
Main logo component for use throughout the application.

```tsx
import { Logo } from '@/components/common/logo'

// Usage
<Logo size={200} className="drop-shadow-xl" />
```

**Props:**
- `size?: number` - Width/height in pixels (default: 200)
- `className?: string` - Additional CSS classes

#### `<LogoIcon />`
Compact icon version for navigation, headers, etc.

```tsx
import { LogoIcon } from '@/components/common/logo'

// Usage
<LogoIcon size={32} className="mr-2" />
```

**Props:**
- `size?: number` - Width/height in pixels (default: 32)
- `className?: string` - Additional CSS classes

## Configuration Files

### `index.html`
Updated with:
- New favicon reference
- Apple touch icon
- Theme color metadata
- Updated title

### `manifest.json`
PWA manifest with:
- App name: "ScoreWrx"
- Theme colors (blue and whitesmoke)
- Icon references for all sizes
- Display mode: standalone

## Color Palette

```css
/* Primary Colors */
--blue-800: #1e40af;  /* Dark blue - primary spike color */
--blue-600: #2563eb;  /* Medium blue - secondary spike color */
--whitesmoke: #f5f5f5; /* Background and highlights */

/* Usage in Tailwind */
bg-blue-800
text-blue-600
bg-[#f5f5f5]
```

## Implementation Examples

### Login/Register Pages
The logo has been integrated into the authentication pages:
- Replaces the generic trophy icon
- Positioned prominently on the branded side panel
- Uses `size={100}` with drop shadow

### Future Usage Suggestions
1. **Navigation Header** - Use `<LogoIcon size={40} />`
2. **Loading Screens** - Animated `<Logo size={150} />`
3. **Email Templates** - Export PNG versions from SVGs
4. **Print Materials** - SVGs scale perfectly for any size

## Design Inspiration

The logo design is directly inspired by the **Softspikes Black Widow golf spike**, which features:
- Multi-legged spider-like structure
- Counter-rotational design for grip
- Durable, flexible construction
- A perfect metaphor for ScoreWrx: precise, reliable, and grounded in golf

## Benefits of This Design

1. **Unique Identity** - Instantly recognizable golf-related iconography
2. **Scalable** - SVG format ensures crisp display at any size
3. **Modern** - Clean, geometric design without text clutter
4. **Meaningful** - Direct connection to golf equipment and precision
5. **Professional** - Serious enough for tournaments, approachable for casual use

## Next Steps

If you want to extend the branding:
1. **PNG Exports** - Use a tool to convert SVGs to PNG for email/social media
2. **Loading Animation** - Animate the spikes rotating
3. **Theme Variations** - Create dark mode version with inverted colors
4. **Merchandise** - The clean design works well for apparel/accessories
5. **Tournament Branding** - Overlay on scorecards and reports

---

*Logo inspired by Softspikes golf spike design - no text, blue and whitesmoke colors*

