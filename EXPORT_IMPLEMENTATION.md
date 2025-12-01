# Tournament Export Implementation

## Overview
This document describes the **exact** tournament export functionality implemented in the React project, matching the Vue project's implementation.

## Implementation Date
December 1, 2025

## Source Reference
Vue project path: `/Users/coosthuizen/Development/scorewrx/src/pages/TournamentsPage.vue`
- `exportTournament()` function (lines 1351-1455)
- `canExportTournament()` function (lines 1457-1512)

## Files Modified

### 1. `/src/lib/export-utils.ts` (Complete Rewrite)
**Purpose**: Core export logic for tournament data

**Key Functions**:

#### `exportTournamentToCSV(data: ExportData): Promise<void>`
Exports tournament player scores to a CSV file with handicap-adjusted scores.

**Export Format**:
- **Filename**: `ScoreWRX-scores-{tournament.date}.csv`
- **CSV Structure**:
  ```
  Name, Hdcp, 1, 2, 3, 4, 5, 6, 7, 8, 9, Out, 10, 11, 12, 13, 14, 15, 16, 17, 18, In, Total
  ```

**Score Adjustment Logic**:
- Scores are adjusted based on **max score rules** per hole:
  - If `playerHandicap < holeHandicap`: max score = `par + 2`
  - If `playerHandicap >= holeHandicap`: max score = `par + 3`
  - Actual score is capped at max (e.g., if player scores 9 but max is 6, export shows 6)

**Processing Steps**:
1. Validates course data exists with 18 holes
2. Iterates through all groups and players
3. Applies handicap-based score adjustments per hole
4. Calculates:
   - **Out**: Sum of adjusted scores for holes 1-9
   - **In**: Sum of adjusted scores for holes 10-18
   - **Total**: Out + In
5. Generates CSV content with headers and data rows
6. Creates blob and triggers browser download

#### `canExportTournament(tournament: Tournament): boolean`
Determines if a tournament can be exported based on completion status and date.

**Export Enabled When**:

**Option 1: All Scores Complete**
- Tournament has groups with players
- Every player has a score array
- All 18 holes have either:
  - A valid score value, OR
  - Are marked as DNF (Did Not Finish)
- ✅ Returns `true` immediately regardless of date

**Option 2: Past Tournament (Incomplete Scores Allowed)**
- Tournament date is **at least 1 day in the past**
- Calculation: current date (00:00:00) ≥ (tournament date + 1 day at 00:00:00)
- Note: Tournament date has "T12:00:00" appended to ensure correct timezone handling
- ✅ Returns `true` for incomplete historical tournaments

### 2. `/src/pages/tournaments.tsx` (Updated)
**Changes**:

1. **Import Addition**:
   ```typescript
   import { exportTournamentToCSV, canExportTournament } from '@/lib/export-utils'
   ```

2. **Store Hook Update**:
   Added `getTournament` to destructured hooks:
   ```typescript
   const { 
     tournaments, 
     loading, 
     error,
     fetchTournaments,
     getTournament,  // NEW
     deleteTournament,
     updateTournamentState,
     fetchTournamentGroups
   } = useTournamentsStore()
   ```

3. **`handleExport()` Function** (Lines 89-122):
   - Fetches latest tournament data with groups using `getTournament()`
   - Validates tournament data and groups exist
   - Gets course data and validates 18 holes structure
   - Calls `exportTournamentToCSV()` with complete data
   - Shows appropriate error messages on failure

### 3. `/src/components/tournaments/tournament-card.tsx` (Updated)
**Changes**:

1. **Import Addition**:
   ```typescript
   import { canExportTournament } from '@/lib/export-utils'
   ```

2. **Export Button Logic**:
   - Calculates `exportEnabled` using `canExportTournament(tournament)`
   - Added Export button for **upcoming tournaments** (when groups exist)
   - Button is disabled when `!exportEnabled`
   - Tooltip explains when export is available
   - Already present for **past tournaments** (always enabled)

3. **UI Structure**:
   - **Past Tournaments (Archived)**: Export always visible and enabled
   - **Upcoming Tournaments**: Export visible when groups exist, enabled based on `canExportTournament()`

## Data Flow

```
User clicks "Export" button
    ↓
handleExport(tournament)
    ↓
Fetch latest tournament data (getTournament)
    ↓
Validate tournament data, groups, and course
    ↓
exportTournamentToCSV({ tournament, groups, course })
    ↓
Process each player in each group:
  - Get scores array
  - Apply handicap-based max score adjustments per hole
  - Calculate Out, In, Total
    ↓
Generate CSV with headers and adjusted scores
    ↓
Create blob and trigger browser download
    ↓
File downloaded: ScoreWRX-scores-{date}.csv
```

## Export Behavior Examples

### Example 1: Complete Tournament (All Scores Entered)
- **Tournament Date**: Dec 1, 2025
- **Current Date**: Dec 1, 2025 (same day)
- **Scores**: All 18 holes complete for all players
- **Export Enabled**: ✅ YES (complete scores override date check)

### Example 2: Incomplete Tournament - Same Day
- **Tournament Date**: Dec 1, 2025
- **Current Date**: Dec 1, 2025
- **Scores**: Only 12 holes completed
- **Export Enabled**: ❌ NO (incomplete and not past tournament)

### Example 3: Incomplete Tournament - Next Day
- **Tournament Date**: Dec 1, 2025
- **Current Date**: Dec 2, 2025
- **Scores**: Only 12 holes completed
- **Export Enabled**: ✅ YES (past tournament day)

### Example 4: Archived Tournament
- **Tournament State**: Archived
- **Export Enabled**: ✅ YES (always enabled for past tournaments)

## CSV Output Example

```csv
Name,Hdcp,1,2,3,4,5,6,7,8,9,Out,10,11,12,13,14,15,16,17,18,In,Total
John Smith,12,4,5,6,4,5,4,6,5,4,43,5,4,6,5,4,5,6,4,5,44,87
Jane Doe,8,4,4,5,4,4,5,5,4,4,39,4,5,5,4,5,4,5,5,4,41,80
Bob Wilson,15,5,6,7,5,6,5,7,6,5,52,6,5,7,6,5,6,7,5,6,53,105
```

## Score Adjustment Example

**Scenario**:
- Player Handicap: 10
- Hole #5: Par 4, Handicap 8
- Player's Actual Score: 9

**Calculation**:
- Player Handicap (10) > Hole Handicap (8)
- Max Score = Par + 3 = 4 + 3 = 7
- Player scored 9, which exceeds max
- **Exported Score**: 7 (capped at max)

## Testing Checklist

- [x] TypeScript compilation successful
- [ ] Export button shows for tournaments with groups
- [ ] Export button disabled for incomplete current-day tournaments
- [ ] Export button enabled for complete tournaments (any date)
- [ ] Export button enabled for past tournaments (even incomplete)
- [ ] CSV file downloads with correct filename format
- [ ] CSV contains correct headers
- [ ] Scores are properly adjusted based on handicap rules
- [ ] Out, In, and Total calculations are correct
- [ ] Empty scores show as blank in CSV

## Technical Notes

1. **Timezone Handling**: Tournament date has "T12:00:00" appended to ensure correct timezone interpretation
2. **Max Score Rule**: Different max scores based on player vs hole handicap comparison
3. **DNF Handling**: DNF (Did Not Finish) holes are treated as valid for completion check
4. **Null Scores**: Export as empty string in CSV
5. **Browser Download**: Uses Blob API and temporary anchor element for download

## Differences from Original Implementation

**None**. This is an **exact** implementation of the Vue project's export functionality with:
- Same logic
- Same calculations
- Same CSV format
- Same validation rules
- Same date handling
- Same max score adjustments

## Future Enhancements (Not Implemented)

The following were NOT implemented (as they don't exist in Vue project):
- Game results export (Sixes, Nines, Nassau, Dots)
- Skins results export
- Overall leaderboard export
- Special competitions export (Closest to Pin, Long Drive)
- PDF export format
- Excel/XLSX export format
- Email export functionality

## Maintenance

When updating this implementation:
1. Refer to Vue project as source of truth
2. Maintain exact parity with Vue logic
3. Test all edge cases (complete, incomplete, past tournaments)
4. Verify CSV format matches expected structure
5. Ensure handicap adjustments follow max score rules

---

**Implementation Status**: ✅ COMPLETE
**Last Updated**: December 1, 2025
**Tested**: TypeScript compilation successful

