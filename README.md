# ScoreWrx React Migration

This is the React + TypeScript + Shadcn/ui migration of the ScoreWrx golf tournament scoring application.

## 🚀 Tech Stack

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **UI Components**: Shadcn/ui + Tailwind CSS
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Backend**: Firebase (Firestore, Auth, Storage)
- **PWA**: Vite PWA Plugin + Workbox
- **Routing**: React Router v6
- **Testing**: Vitest + Playwright
- **Utilities**: date-fns, papaparse, jszip

## 📁 Project Structure

```
scorewrx-react/
├── src/
│   ├── components/          # React components
│   │   ├── ui/             # Shadcn UI components
│   │   ├── auth/           # Authentication components
│   │   ├── tournaments/    # Tournament management
│   │   ├── courses/        # Course management
│   │   ├── players/        # Player management
│   │   ├── scorecard/      # Mobile scoring components
│   │   └── common/         # Shared components
│   ├── lib/                # Utilities and configurations
│   │   ├── firebase/       # Firebase config
│   │   ├── game-logic/     # Pure business logic
│   │   ├── constants/      # App constants
│   │   └── utils.ts        # Helper functions
│   ├── stores/             # Zustand state stores
│   │   ├── auth-store.ts
│   │   ├── tournaments-store.ts
│   │   ├── courses-store.ts
│   │   └── players-store.ts
│   ├── hooks/              # Custom React hooks
│   ├── pages/              # Route pages
│   ├── layouts/            # Layout components
│   ├── types/              # TypeScript types
│   └── App.tsx             # Main app component
├── public/                 # Static assets
│   └── icons/             # PWA icons
├── tests/                  # E2E tests
└── package.json
```

## 🔧 Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Firebase

Copy `.env.example` to `.env.local` and add your Firebase credentials:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Firebase project credentials from the existing ScoreWrx Vue app.

### 3. Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### 4. Build for Production

```bash
npm run build
```

## 🧪 Testing

### Unit Tests

```bash
npm run test
```

### E2E Tests

```bash
npm run test:e2e
```

## 📱 PWA Features

The app is configured as a Progressive Web App with:

- ✅ Offline support via service workers
- ✅ Installable on mobile devices
- ✅ Firebase offline persistence
- ✅ Optimized caching strategies

## 🎯 Migration Status

### ✅ Completed
- [x] Project setup
- [x] Vite + React + TypeScript configuration
- [x] Tailwind CSS + Shadcn/ui setup
- [x] PWA configuration
- [x] Firebase configuration
- [x] TypeScript types (complete schema)
- [x] Game constants
- [x] Directory structure

### 🚧 In Progress
- [ ] Business logic migration (Week 2)
- [ ] State management (Week 3)
- [ ] Admin components (Week 4-5)
- [ ] Mobile scoring components (Week 6-7)
- [ ] Routing & layouts (Week 8)
- [ ] Testing (Week 9)
- [ ] Deployment (Week 10-11)

## 📚 Key Differences from Vue Version

### State Management
- **Vue**: Pinia stores
- **React**: Zustand stores (similar API, lighter weight)

### Components
- **Vue**: Quasar components
- **React**: Shadcn/ui components (Tailwind-based)

### Reactivity
- **Vue**: Composition API with `ref()` and `reactive()`
- **React**: `useState()` and `useEffect()` hooks

### Business Logic
- **Both**: Pure TypeScript functions (framework-agnostic)
- All game calculations remain identical

## 🔒 Critical Architecture Rules

### 1. Stroke Calculation Immutability

⚠️ **CRITICAL**: `strokeHoles` must NEVER be recalculated after game setup.

```typescript
// ✅ CORRECT: Preserve strokeHoles
const updatedPlayer = {
  ...player,
  score: newScore,
  strokeHoles: player.strokeHoles // Always preserve
}

// ❌ WRONG: Missing strokeHoles
const updatedPlayer = {
  ...player,
  score: newScore
  // strokeHoles missing - will cause bugs!
}
```

### 2. Real-Time Synchronization

All score updates use Firestore's `onSnapshot` for real-time sync:

```typescript
useEffect(() => {
  const unsubscribe = onSnapshot(groupRef, (snapshot) => {
    // Update local state
  })
  return () => unsubscribe() // Cleanup on unmount
}, [groupId])
```

### 3. Offline Support

Firebase persistence is enabled automatically. Scores entered offline will sync when connection is restored.

## 🚀 Deployment

### Beta Deployment (Subdomain)

```bash
npm run deploy:beta
```

Deploys to: `https://app.scorewrx.com` (beta)

### Production Deployment

```bash
npm run deploy:prod
```

Deploys to: `https://scorewrx.com` (production)

## 📖 Documentation

- [Migration Plan](./docs/MIGRATION_PLAN.md) - Detailed week-by-week plan
- [Business Logic](./docs/BUSINESS_LOGIC.md) - Game rules and calculations
- [Firebase Schema](./docs/FIREBASE_SCHEMA.md) - Database structure
- [Testing Guide](./docs/TESTING.md) - Testing strategies

## 🤝 Contributing

This is a migration project. All business logic should match the Vue version exactly.

## 📝 License

Private project - All rights reserved

## 🆘 Support

For questions about the migration, refer to the detailed migration plan in the root directory of the Vue project.

---

**Migration Timeline**: 10-11 weeks (solo developer)
**Start Date**: TBD
**Target Completion**: TBD
