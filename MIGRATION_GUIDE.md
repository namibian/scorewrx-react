# ScoreWrx Migration Guide: Vue → React

## 📋 Overview

This guide provides step-by-step instructions for migrating the ScoreWrx application from Vue 3 + Quasar to React + Shadcn/ui.

**Timeline**: 10-11 weeks (solo developer)
**Approach**: Incremental migration with parallel deployment
**Risk Level**: Low (Firebase backend unchanged, subdomain deployment)

## 🎯 Migration Philosophy

### What's Changing
- ✅ Frontend framework (Vue → React)
- ✅ UI library (Quasar → Shadcn/ui)
- ✅ State management (Pinia → Zustand)
- ✅ Build tool (Quasar CLI → Vite)

### What's NOT Changing
- ✅ Firebase backend (Firestore, Auth, Storage)
- ✅ Database schema (100% identical)
- ✅ Business logic algorithms (ported exactly)
- ✅ PWA functionality (maintained)
- ✅ Game rules and calculations (identical)

## 📅 Week-by-Week Implementation Plan

### Week 1: Foundation ✅ COMPLETED

**Status**: Initial setup complete

**Completed Tasks**:
- [x] Vite + React + TypeScript project created
- [x] Tailwind CSS configured
- [x] Shadcn/ui installed with base components
- [x] PWA plugin configured
- [x] Firebase configuration created
- [x] TypeScript types defined (complete schema)
- [x] Directory structure established
- [x] Testing frameworks configured (Vitest + Playwright)

**Next Steps**:
1. Copy Firebase credentials from Vue project to `.env.local`
2. Test Firebase connection
3. Verify PWA installation works

### Week 2: Business Logic Migration ✅ COMPLETED

**Goal**: Port all game calculation logic to pure TypeScript functions

**Files Created**:

1. `src/lib/game-logic/stroke-calculation.ts` ✅
   - Port from: `src/composables/useStrokeCalculation.js`
   - Functions: All stroke calculation logic
   - Status: Complete with 17 passing tests

2. `src/lib/game-logic/sixes-match.ts` ✅
   - Port from: `src/composables/useSixesMatch.js`
   - Functions: Team formation, point calculation
   - Status: Complete with 10 passing tests

3. `src/lib/game-logic/nines-match.ts` ✅
   - Port from: `src/composables/useNinesMatch.js`
   - Functions: Point distribution (5-3-1, 4-4-1, 3-3-3)
   - Status: Complete with 5 passing tests

4. `src/lib/game-logic/nassau-match.ts` ✅
   - Port from: `src/composables/useNassauMatch.js`
   - Functions: Match play calculations
   - Status: Complete with 5 passing tests

5. `src/lib/game-logic/dots-game.ts` ✅
   - Port from: Dots logic in composables/components
   - Functions: Dots calculation, greenie/sandy tracking, carry-over logic
   - Status: Complete with 18 passing tests

6. `src/lib/game-logic/skins-calculation.ts` ✅
   - Port from: Skins logic in components/scorecard/SkinsPanel.vue
   - Functions: Skins winners, pot calculation, residual distribution
   - Status: Complete with 16 passing tests

**Testing**: ✅
- ✅ Created unit tests for all functions (71 tests total)
- ✅ All calculations verified to match Vue version
- ✅ Edge cases tested (ties, DNF, strokes, carry-overs)

**Checkpoint**: ✅ All business logic tests passing (71/71)

### Week 3: State Management ✅ COMPLETED

**Goal**: Implement Zustand stores for all data management

**Files Created**:

1. `src/stores/auth-store.ts` ✅
   - Port from: `src/stores/auth.js`
   - Functions: login, signup, logout, fetchUserProfile
   - Status: Complete - Zustand store with Firebase auth integration

2. `src/stores/tournaments-store.ts` ✅
   - Port from: `src/stores/tournaments.js`
   - Functions: ALL tournament and group operations
   - **CRITICAL**: Preserve strokeHoles in all operations ✅
   - Status: Complete - Full tournament management with real-time updates

3. `src/stores/courses-store.ts` ✅
   - Port from: `src/stores/courses.js`
   - Functions: Course CRUD operations
   - Status: Complete - Course management with affiliation filtering

4. `src/stores/players-store.ts` ✅
   - Port from: `src/stores/players.js`
   - Functions: Player CRUD operations
   - Status: Complete - Player management with public/protected operations

5. `src/stores/game-results-store.ts` ✅
   - Port from: `src/stores/gameResults.js`
   - Functions: Game result calculations and caching
   - Status: Complete - Sixes game results storage

**Testing**:
- ⏳ Test Firebase operations (next step)
- ⏳ Verify real-time listeners work (next step)
- ⏳ Test offline persistence (next step)

**Checkpoint**: ✅ All stores created and linted successfully

### Week 4-5: Admin Components

**Goal**: Build complete admin interface for tournament management

**Week 4 Components**:

1. Authentication
   - `src/pages/login.tsx`
   - `src/pages/register.tsx`
   - `src/components/auth/auth-guard.tsx`

2. Tournament Management
   - `src/pages/tournaments.tsx`
   - `src/components/tournaments/tournament-card.tsx`
   - `src/components/tournaments/create-tournament-dialog.tsx`
   - `src/components/tournaments/tournament-details.tsx`
   - `src/components/tournaments/group-manager-dialog.tsx`

**Week 5 Components**:

3. Course Management
   - `src/pages/courses.tsx`
   - `src/components/courses/course-list.tsx`
   - `src/components/courses/course-form.tsx`
   - `src/components/courses/hole-editor.tsx`

4. Player Management
   - `src/pages/players.tsx`
   - `src/components/players/player-table.tsx`
   - `src/components/players/player-form.tsx`
   - `src/components/players/bulk-import.tsx`

**Testing**:
- Manual testing of all CRUD operations
- Verify data persistence
- Test validation

**Checkpoint**: Complete admin interface functional

### Week 6-7: Mobile Scoring Components

**Goal**: Build mobile-only scoring interface

**Week 6 Components**:

1. Game Setup
   - `src/pages/game-setup.tsx`
   - `src/components/game-setup/sixes-setup.tsx`
   - `src/components/game-setup/nines-setup.tsx`
   - `src/components/game-setup/nassau-setup.tsx`
   - `src/components/game-setup/dots-setup.tsx`
   - `src/components/game-setup/cart-assignments.tsx`

2. Scorecard Grid
   - `src/pages/scorecard.tsx`
   - `src/components/scorecard/scorecard-grid.tsx`
   - `src/components/scorecard/scorecard-header.tsx`

**Week 7 Components**:

3. Score Entry
   - `src/components/scorecard/score-entry-dialog.tsx`
   - `src/components/scorecard/player-scores-dialog.tsx`

4. Game Panels
   - `src/components/scorecard/match-panel.tsx` (Sixes)
   - `src/components/scorecard/bets-panel.tsx` (Nines/Nassau)
   - `src/components/scorecard/skins-panel.tsx` (with optimization)
   - `src/components/scorecard/leaderboard-tab.tsx`

**Testing**:
- Test on real mobile devices (iOS + Android)
- Verify touch interactions
- Test offline scoring
- Verify real-time updates

**Checkpoint**: Full mobile scoring working

### Week 8: Routing & Layouts

**Goal**: Complete app navigation and layouts

**Components to Create**:

1. `src/App.tsx` - Main router setup
2. `src/layouts/admin-layout.tsx` - Desktop admin layout
3. `src/layouts/scoring-layout.tsx` - Mobile scoring layout
4. `src/components/common/mobile-only-warning.tsx`
5. `src/hooks/use-mobile-check.ts` - Device detection

**Testing**:
- Test all navigation flows
- Verify route guards work
- Test mobile/desktop detection

**Checkpoint**: Complete navigation working

### Week 9: Testing & Bug Fixes

**Goal**: Comprehensive testing and issue resolution

**Testing Checklist**:

**Admin Flow**:
- [ ] Login/logout
- [ ] Create tournament
- [ ] Add course with 18 holes
- [ ] Add players
- [ ] Create groups
- [ ] Assign carts (for Sixes)
- [ ] View tournament code

**Scoring Flow**:
- [ ] Enter tournament code
- [ ] Select player
- [ ] Complete game setup (all 4 games)
- [ ] Enter scores for all 18 holes
- [ ] Verify stroke indicators appear
- [ ] Check Sixes calculations
- [ ] Check Nines calculations
- [ ] Check Nassau calculations
- [ ] Check Dots calculations
- [ ] Verify real-time updates
- [ ] Test offline mode
- [ ] Test verifier feature

**E2E Tests**:
- Write Playwright tests for critical flows
- Test on multiple browsers
- Test on mobile devices

**Checkpoint**: All tests passing, no critical bugs

### Week 10: Beta Deployment

**Goal**: Deploy to beta subdomain for user testing

**Steps**:

1. **Firebase Setup**:
   ```bash
   firebase init hosting
   # Select existing project: scorewrx
   # Create two hosting targets: beta and production
   ```

2. **Deploy to Beta**:
   ```bash
   npm run deploy:beta
   ```

3. **DNS Configuration**:
   - Add CNAME record: `app.scorewrx.com` → `scorewrx-beta.web.app`

4. **Beta Testing**:
   - Recruit 2-3 beta users
   - Provide beta URL and test tournament
   - Collect feedback via Google Form
   - Monitor Firebase console for errors

**Checkpoint**: Beta users successfully complete tournament

### Week 11: Production Deployment

**Goal**: Deploy to production and monitor

**Steps**:

1. **Final Fixes**: Address critical beta feedback

2. **Deploy to Production**:
   ```bash
   npm run deploy:prod
   ```

3. **DNS Cutover**:
   - Update DNS: `scorewrx.com` → new React app
   - Keep old app accessible at `legacy.scorewrx.com`

4. **Monitoring**:
   - Set up Firebase Analytics
   - Monitor error rates
   - Track user adoption

5. **Rollback Plan**:
   - If issues arise, revert DNS to old app
   - No data loss (same Firebase backend)

**Checkpoint**: Production deployment successful

## 🔧 Development Workflow

### Daily Workflow

```bash
# Start development server
npm run dev

# Run tests (in another terminal)
npm run test

# Check for linting errors
npm run lint
```

### Before Committing

```bash
# Run all tests
npm run test:unit

# Build to check for errors
npm run build

# Commit with descriptive message
git add .
git commit -m "feat: implement tournament list page"
```

### Testing on Mobile

1. **Get local IP**:
   ```bash
   ifconfig | grep "inet "
   ```

2. **Access on mobile**:
   - Navigate to `http://YOUR_IP:5173`
   - Test PWA installation
   - Test offline mode

## 🚨 Critical Migration Rules

### 1. Preserve strokeHoles

**ALWAYS** preserve `strokeHoles` in player updates:

```typescript
// ✅ CORRECT
const updatedPlayer = {
  ...player,
  score: newScore,
  strokeHoles: player.strokeHoles // Explicitly preserve
}

// ❌ WRONG
const updatedPlayer = {
  ...player,
  score: newScore
  // Missing strokeHoles!
}
```

### 2. Use Helper Function

```typescript
import { preserveImmutablePlayerFields } from '@/lib/game-logic/stroke-calculation'

const updatedPlayer = preserveImmutablePlayerFields(player, {
  score: newScore
})
```

### 3. Real-Time Cleanup

Always cleanup Firestore listeners:

```typescript
useEffect(() => {
  const unsubscribe = onSnapshot(ref, callback)
  return () => unsubscribe() // CRITICAL
}, [dependencies])
```

## 📊 Progress Tracking

Update this section weekly:

- **Week 1**: ✅ Complete (Foundation setup)
- **Week 2**: ✅ Complete (Business logic ported - 71 tests passing)
- **Week 3**: ✅ Complete (State Management - All Zustand stores created)
- **Week 4**: ⏸️ Not Started (Admin Components Part 1)
- **Week 5**: ⏸️ Not Started (Admin Components Part 2)
- **Week 6**: ⏸️ Not Started (Mobile Scoring Part 1)
- **Week 7**: ⏸️ Not Started (Mobile Scoring Part 2)
- **Week 8**: ⏸️ Not Started (Routing & Layouts)
- **Week 9**: ⏸️ Not Started (Testing & Bug Fixes)
- **Week 10**: ⏸️ Not Started (Beta Deployment)
- **Week 11**: ⏸️ Not Started (Production Deployment)

## 🆘 Troubleshooting

### Firebase Connection Issues

```typescript
// Check if Firebase is configured
console.log('Firebase config:', {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ? '✓' : '✗',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ? '✓' : '✗',
})
```

### PWA Not Installing

1. Check manifest.json is accessible
2. Verify service worker is registered
3. Check for HTTPS (required for PWA)
4. Use Chrome DevTools → Application → Manifest

### TypeScript Errors

```bash
# Clear TypeScript cache
rm -rf node_modules/.cache

# Rebuild
npm run build
```

## 📚 Resources

- [React Documentation](https://react.dev)
- [Shadcn/ui Components](https://ui.shadcn.com)
- [Zustand Documentation](https://zustand-demo.pmnd.rs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Vite Documentation](https://vitejs.dev)

## ✅ Success Criteria

Migration is complete when:

- [ ] All admin features work identically to Vue version
- [ ] All mobile scoring features work identically
- [ ] All game calculations produce identical results
- [ ] PWA installs and works offline
- [ ] Real-time updates work across devices
- [ ] Beta users approve the new interface
- [ ] No critical bugs in production
- [ ] Performance is equal or better than Vue version

---

**Last Updated**: December 1, 2024
**Migration Status**: Week 3 Complete - State Management Implemented ✅

