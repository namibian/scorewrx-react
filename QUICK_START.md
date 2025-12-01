# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Firebase

Copy your Firebase credentials from the Vue project:

```bash
# From the Vue project
cd /Users/coosthuizen/Development/scorewrx
cat src/firebase/config.js
```

Then create `.env.local` in the React project:

```bash
cd /Users/coosthuizen/Development/scorewrx-react
touch .env.local
```

Add your Firebase credentials to `.env.local`:

```env
VITE_FIREBASE_API_KEY=your_actual_api_key
VITE_FIREBASE_AUTH_DOMAIN=scorewrx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=scorewrx
VITE_FIREBASE_STORAGE_BUCKET=scorewrx.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_actual_sender_id
VITE_FIREBASE_APP_ID=your_actual_app_id
VITE_USE_EMULATORS=false
```

### 3. Start Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Verify Setup

You should see:
- ✅ Vite dev server running
- ✅ No TypeScript errors
- ✅ Tailwind CSS working
- ✅ PWA service worker registered (check console)

## 📁 Project Structure

```
src/
├── components/ui/     # Shadcn components (already installed)
├── lib/
│   ├── firebase/      # Firebase config (ready to use)
│   ├── constants/     # Game constants
│   └── utils.ts       # Helper functions
├── types/             # TypeScript types (complete)
└── App.tsx            # Main app (needs work)
```

## 🎯 Next Steps

### Week 2: Port Business Logic

Start with stroke calculation:

1. Open `src/lib/game-logic/stroke-calculation.ts` (create it)
2. Copy logic from Vue: `../scorewrx/src/composables/useStrokeCalculation.js`
3. Convert to TypeScript
4. Write tests in `src/lib/game-logic/__tests__/stroke-calculation.test.ts`

### Example Test

```typescript
import { describe, it, expect } from 'vitest'
import { calculateTotalStrokes } from '../stroke-calculation'

describe('Stroke Calculation', () => {
  it('calculates differential strokes correctly', () => {
    const players = [
      { id: '1', tournamentHandicap: 18 },
      { id: '2', tournamentHandicap: 2 }
    ]
    
    expect(calculateTotalStrokes(players[0], players, true, 'Standard')).toBe(16)
    expect(calculateTotalStrokes(players[1], players, true, 'Standard')).toBe(0)
  })
})
```

Run tests:
```bash
npm run test
```

## 🔍 Useful Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run preview          # Preview production build

# Testing
npm run test             # Run unit tests (watch mode)
npm run test:unit        # Run unit tests (once)
npm run test:e2e         # Run E2E tests
npm run test:e2e:ui      # Run E2E tests with UI

# Linting
npm run lint             # Check for errors
```

## 🐛 Troubleshooting

### "Cannot find module '@/...'"

The path alias is configured. If you see this error:
1. Restart your TypeScript server (VS Code: Cmd+Shift+P → "Restart TS Server")
2. Check `tsconfig.app.json` has the paths configured

### Firebase Connection Error

1. Verify `.env.local` has all credentials
2. Check credentials are correct (copy from Vue project)
3. Restart dev server after changing `.env.local`

### PWA Not Working

PWA requires HTTPS in production. In development:
1. Check console for service worker registration
2. Look for "Service worker registered" message
3. Check Application tab in Chrome DevTools

## 📚 Reference Documentation

- **Migration Plan**: See `MIGRATION_GUIDE.md` for detailed week-by-week plan
- **Vue Project**: `/Users/coosthuizen/Development/scorewrx`
- **Business Logic**: See Vue project's `prompts/BUSINESS_LOGIC.md`
- **Firebase Schema**: See Vue project's `prompts/FIREBASE_SCHEMA.md`

## ✅ Checklist

Before starting Week 2:

- [ ] Dependencies installed
- [ ] Firebase credentials configured
- [ ] Dev server running
- [ ] No console errors
- [ ] PWA service worker registered
- [ ] Shadcn components rendering
- [ ] TypeScript compiling without errors

## 🆘 Need Help?

Refer to the comprehensive migration plan in the Vue project root directory for detailed guidance on each phase.

---

**Ready to start?** Begin with Week 2 in `MIGRATION_GUIDE.md`!

