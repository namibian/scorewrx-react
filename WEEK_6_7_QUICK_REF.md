# Week 6-7: Quick Reference & Next Steps

## ✅ What's Complete

### Game Setup (Week 6) ✅
- Full wizard flow with 3 steps
- All 4 game types (Sixes, Nines, Nassau, Dots)
- Cart assignments for Sixes
- Player skins pool selection
- Validation and error handling
- **Files**: 8 components, 1 page

### Scorecard Viewing (Week 6) ✅
- Scorecard grid with 18 holes
- Header with navigation and badges
- Score display with color coding
- Stroke indicators
- Subtotals and net scores
- **Files**: 4 components, 1 page

## ⏳ What's Missing (Week 7)

### 1. Stroke Calculation Integration ⚠️ CRITICAL
**Why**: Game setup saves without calculating stroke holes
**Impact**: Stroke indicators won't work in scorecard

**What to do**:
```typescript
// In game-setup.tsx, saveGameSetup():

import {
  calculateTotalStrokes,
  distributeSixesGameStrokes,
  distributeDotsStrokes,
} from '@/lib/game-logic/stroke-calculation'

// For each player, calculate strokes:
const updatedPlayers = players.map(player => {
  const strokeHoles = {
    sixes: games.sixes.enabled ? distributeSixesGameStrokes(...) : {},
    nines: games.nines.enabled ? distributeDotsStrokes(...) : [],
    dots: games.dots.enabled ? distributeDotsStrokes(...) : [],
    nassau: games.nassau.enabled ? distributeDotsStrokes(...) : []
  }
  
  return {
    ...player,
    strokeHoles
  }
})
```

**Files to reference**:
- `/Users/coosthuizen/Development/scorewrx/src/pages/GameSetupPage.vue` (lines 320-430)
- `/Users/coosthuizen/Development/scorewrx-react/src/lib/game-logic/stroke-calculation.ts`

### 2. Score Entry Dialog 🎯 HIGH PRIORITY
**Why**: Cannot enter scores without this
**Impact**: Core functionality blocked

**What to create**:
- `score-entry-dialog.tsx` - Main dialog component
  - Number pad (0-15)
  - Dots buttons (+1, +2, +3)
  - Greenie toggle (Par 3s only)
  - Sandy toggle
  - DNF checkbox
  - Navigation: Previous/Next/Jump to hole
  - Save button

**Reference**:
- `/Users/coosthuizen/Development/scorewrx/src/components/scorecard/ScorerEntryContent.vue`
- `/Users/coosthuizen/Development/scorewrx/src/components/ScoreEntryDialog.vue`

**Key features**:
```typescript
interface ScoreEntryProps {
  hole: number
  players: Player[]
  par: number
  hdcp: number
  isVerifier?: boolean
  onSave: (updates: ScoreUpdate[]) => void
  onNavigate: (direction: 'prev' | 'next') => void
  onJumpToHole: (hole: number) => void
}
```

### 3. Match Panel (Sixes Results) 📊 MEDIUM
**Why**: Show Sixes game results
**Impact**: Cannot view match standings

**What to create**:
- `match-panel.tsx`
- Team formations display (Cart 1 vs Cart 2, etc.)
- Points per game (6 holes each)
- Current standings
- Money owed calculation

**Reference**:
- `/Users/coosthuizen/Development/scorewrx/src/components/scorecard/MatchPanel.vue`
- Use `src/lib/game-logic/sixes-match.ts` for calculations

### 4. Bets Panel (Nines/Nassau Results) 💰 MEDIUM
**Why**: Show Nines and Nassau game results
**Impact**: Cannot view bet standings

**What to create**:
- `bets-panel.tsx`
- Nines: Point distribution per hole (5-3-1, 4-4-1, 3-3-3)
- Nassau: Match play standings (Front/Back/Overall)
- Money owed calculations

**Reference**:
- `/Users/coosthuizen/Development/scorewrx/src/components/scorecard/BetsPanel.vue`
- Use `src/lib/game-logic/nines-match.ts` and `nassau-match.ts`

### 5. Skins Panel 🎲 MEDIUM
**Why**: Show skins competition results
**Impact**: Optional feature, but important

**What to create**:
- `skins-panel.tsx`
- Scratch and handicap skins separate
- Winners per hole
- Carry-over logic
- Pot distribution

**Reference**:
- `/Users/coosthuizen/Development/scorewrx/src/components/scorecard/SkinsPanel.vue`
- Use `src/lib/game-logic/skins-calculation.ts`

### 6. Leaderboard Tab 📈 MEDIUM
**Why**: Show tournament standings
**Impact**: Nice-to-have feature

**What to create**:
- `leaderboard-tab.tsx`
- List all groups
- Sort by score (relative to par)
- Show gross and net scores
- Tiebreakers: back 9, last 6

**Reference**:
- `/Users/coosthuizen/Development/scorewrx/src/components/scorecard/LeaderboardTab.vue`

### 7. Real-time Updates 🔄 IMPORTANT
**Why**: Multiple users need to see updates
**Impact**: Poor UX without real-time sync

**What to add**:
In `scorecard.tsx`:
```typescript
useEffect(() => {
  const unsubscribe = tournamentsStore.subscribeToGroupUpdates(
    tournamentId,
    groupId,
    (updatedGroup) => {
      setGroup(updatedGroup)
      // Update local scores map
      const scoresMap = new Map()
      updatedGroup.players.forEach(p => scoresMap.set(p.id, p))
      setLocalPlayerScores(scoresMap)
    }
  )
  
  return () => unsubscribe()
}, [tournamentId, groupId])
```

**Reference**:
- `/Users/coosthuizen/Development/scorewrx/src/pages/ScorecardPage.vue` (lines 558-600)

## 🔨 Implementation Order

### Phase 1: Core Functionality (Do First)
1. ⚠️ **Stroke Calculation** (2-3 hours)
   - Critical for scorecard to work correctly
   - Integrate existing business logic
   - Test with different game combinations

2. 🎯 **Score Entry Dialog** (4-5 hours)
   - Core mobile scoring feature
   - Number pad interface
   - Dots assignment
   - Greenie/Sandy toggles
   - Navigation

3. 🔄 **Real-time Updates** (2 hours)
   - Essential for multi-user experience
   - Add Firestore listeners
   - Handle state updates

### Phase 2: Game Results (Do Second)
4. 📊 **Match Panel** (2-3 hours)
   - Sixes game results
   - Use existing business logic

5. 💰 **Bets Panel** (2-3 hours)
   - Nines and Nassau results
   - Money calculations

6. 🎲 **Skins Panel** (3-4 hours)
   - More complex calculations
   - Carry-over logic
   - Pot distribution

### Phase 3: Nice-to-Have (Do Last)
7. 📈 **Leaderboard** (2-3 hours)
   - Tournament standings
   - Sorting and tiebreakers

## 📝 Testing Checklist

Once components are built:

### Functional Testing
- [ ] Game setup saves correctly
- [ ] Stroke indicators show in scorecard
- [ ] Can enter scores for all 18 holes
- [ ] Dots calculate correctly
- [ ] Greenies only on Par 3s
- [ ] Sandies work correctly
- [ ] DNF marks score correctly
- [ ] Sixes calculations match Vue app
- [ ] Nines calculations match Vue app
- [ ] Nassau calculations match Vue app
- [ ] Skins calculations match Vue app

### Mobile Testing
- [ ] Test on iPhone (Safari)
- [ ] Test on Android (Chrome)
- [ ] Number pad is touch-friendly
- [ ] Buttons are large enough (44px min)
- [ ] Scrolling works smoothly
- [ ] No horizontal scroll
- [ ] Header stays fixed

### Real-time Testing
- [ ] Two users can score simultaneously
- [ ] Updates appear immediately
- [ ] No conflicts or lost data
- [ ] Scorer role changes handled
- [ ] Verifier workflow works

## 🚨 Critical Warnings

1. **Preserve strokeHoles**: Always preserve strokeHoles in player updates
   ```typescript
   const updatedPlayer = {
     ...player,
     score: newScore,
     strokeHoles: player.strokeHoles // CRITICAL!
   }
   ```

2. **Cart Ordering**: Maintain cart order in Sixes games
   - Cart 1 Driver, Cart 1 Rider, Cart 2 Driver, Cart 2 Rider

3. **Dots Carry-over**: Implement dots carry-over logic correctly
   - If no winner, dots carry to next hole
   - All players get carry-over on next hole win

4. **Greenie Validation**: Only allow greenies on Par 3s
   ```typescript
   const canHaveGreenie = getHolePar(hole) === 3
   ```

## 📚 Reference Files

### Vue Project (Original Implementation)
- Game Setup: `/Users/coosthuizen/Development/scorewrx/src/pages/GameSetupPage.vue`
- Scorecard: `/Users/coosthuizen/Development/scorewrx/src/pages/ScorecardPage.vue`
- Score Entry: `/Users/coosthuizen/Development/scorewrx/src/components/ScoreEntryDialog.vue`
- Match Panel: `/Users/coosthuizen/Development/scorewrx/src/components/scorecard/MatchPanel.vue`
- Bets Panel: `/Users/coosthuizen/Development/scorewrx/src/components/scorecard/BetsPanel.vue`
- Skins Panel: `/Users/coosthuizen/Development/scorewrx/src/components/scorecard/SkinsPanel.vue`

### React Project (New Implementation)
- Business Logic: `/Users/coosthuizen/Development/scorewrx-react/src/lib/game-logic/`
- Stores: `/Users/coosthuizen/Development/scorewrx-react/src/stores/`
- Components: `/Users/coosthuizen/Development/scorewrx-react/src/components/`

## 🎯 Success Criteria

Week 6-7 is complete when:
- ✅ Can set up a game (all 4 types)
- ✅ Scorecard displays correctly
- ⏳ Can enter scores for all 18 holes
- ⏳ Stroke indicators work
- ⏳ All game calculations match Vue version
- ⏳ Real-time updates work
- ⏳ Works on mobile devices

---

**Estimated Remaining Time**: 18-22 hours
**Priority**: HIGH - Core mobile functionality
**Next Session**: Focus on stroke calculation and score entry dialog

