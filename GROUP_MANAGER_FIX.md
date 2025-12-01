# Group Manager Button Fix

## Problem
Clicking the "Groups" button on tournament cards or the "Manage Groups" menu item did nothing.

## Root Cause
The `handleManageGroups` function was just a stub with a TODO comment:

```typescript
const handleManageGroups = (tournament: Tournament) => {
  console.log('Manage groups for tournament:', tournament)
  // TODO: Open group manager  ← Never implemented!
}
```

## Original Vue Implementation
The original Vue app uses a `GroupManagerDialog` component - a full-featured dialog that handles:
- Creating and managing groups
- Assigning players to groups
- Setting tee times and starting tees
- CSV import/export of groups
- Drag-and-drop group reordering
- Player selection dialogs

This is a complex component with multiple sub-components located at:
`/Users/coosthuizen/Development/scorewrx/src/components/tournaments/GroupManager/`

## Solution Implemented

### Phase 1: Placeholder Dialog (Current)
Created a placeholder `GroupManagerDialog` component that:
- ✅ Opens when "Manage Groups" is clicked
- ✅ Shows tournament ID
- ✅ Displays migration status message
- ✅ Provides temporary workaround instructions
- ✅ Lists implementation requirements

### Files Created/Modified

#### 1. Created `group-manager-dialog.tsx`
```typescript
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Info } from 'lucide-react'

interface GroupManagerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tournamentId: string
}

export function GroupManagerDialog({ open, onOpenChange, tournamentId }: GroupManagerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Manage Groups</DialogTitle>
          <DialogDescription>
            Tournament ID: {tournamentId}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert>
            <Info className="h-4 h-4" />
            <AlertDescription>
              {/* Migration status and instructions */}
            </AlertDescription>
          </Alert>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

#### 2. Updated `tournaments.tsx`
**Added Import:**
```typescript
import { GroupManagerDialog } from '@/components/tournaments/group-manager-dialog'
```

**Added State:**
```typescript
const [showGroupManager, setShowGroupManager] = useState(false)
const [selectedTournamentId, setSelectedTournamentId] = useState<string>('')
```

**Implemented Handler:**
```typescript
const handleManageGroups = (tournament: Tournament) => {
  setSelectedTournamentId(tournament.id)
  setShowGroupManager(true)
}
```

**Added Dialog:**
```typescript
<GroupManagerDialog
  open={showGroupManager}
  onOpenChange={setShowGroupManager}
  tournamentId={selectedTournamentId}
/>
```

## Current Status

✅ **Buttons work** - Both Groups button and menu item now open the dialog
✅ **Dialog displays** - Shows placeholder with migration info
✅ **Tournament ID passed** - Correct tournament ID is provided
✅ **Temporary solution** - Users know to use Vue app for now

❌ **Not fully functional** - Full group manager needs to be built

## Phase 2: Full Implementation (Required)

The complete Group Manager needs these components migrated from Vue:

### Main Component: GroupManagerDialog
**Features:**
- Maximized dialog with header/body/footer layout
- 3-dot menu with: Download Template, Import Groups, Add Group
- Tee time interval input (when not shotgun start)
- Shotgun start info banner (when shotgun start enabled)
- Scrollable group list
- Save/Cancel actions

### Sub-Components Needed:

#### 1. GroupList
- Display all groups with players
- Drag-and-drop reordering
- Collapse/expand groups
- Delete group button
- Add players button per group
- Shows group number, tee time, starting tee

#### 2. PlayerSelectionDialog
- Shows available players (not already in groups)
- Multi-select players
- Search/filter players
- Add selected to group

#### 3. TeeTimeIntervalInput
- Input for tee time interval (minutes)
- Automatically updates all group tee times
- Only shown when shotgun start is disabled

#### 4. UnmatchedPlayersDialog
- Shows players in CSV that don't match existing players
- Allows mapping to existing or creating new players

### Store Functions Needed:
Already exist in tournaments-store.ts:
- ✅ `fetchTournamentGroups(tournamentId)`
- ✅ `saveGroups(tournamentId, groups)`
- ✅ `getGroup(tournamentId, groupId)`
- ✅ `updateGroup(tournamentId, group)`

### Utils Needed:
From Vue app: `src/utils/groupImportExport.js`
- `generateTemplateCSV()` - Creates CSV template
- `parseGroupsCSV()` - Parses uploaded CSV
- `downloadCSV()` - Triggers CSV download

## Temporary Workaround

Until Phase 2 is complete, users should:
1. Click "Manage Groups" to see the tournament ID
2. Open the original Vue app
3. Navigate to Tournaments
4. Find the tournament by ID
5. Manage groups in the Vue app
6. Changes will sync to Firebase and appear in React app

## Files Modified

1. **`src/components/tournaments/group-manager-dialog.tsx`** (NEW)
   - Placeholder dialog component
   - Migration status message
   - Implementation requirements

2. **`src/pages/tournaments.tsx`**
   - Imported GroupManagerDialog
   - Added state for dialog and tournament ID
   - Implemented handleManageGroups
   - Added dialog to render

## Result

✅ **Groups button functional** - Opens dialog
✅ **Menu item functional** - Opens dialog
✅ **Tournament ID tracked** - Correct ID passed
✅ **User informed** - Clear message about status
✅ **Workaround provided** - Users can still manage groups in Vue app

## Next Steps for Full Implementation

1. **Create sub-components:**
   - GroupList with drag-and-drop
   - PlayerSelectionDialog
   - TeeTimeIntervalInput
   - UnmatchedPlayersDialog

2. **Implement CSV utilities:**
   - Template generation
   - CSV parsing
   - Import/export logic

3. **Implement group management logic:**
   - Add group
   - Delete group
   - Reorder groups
   - Add players to group
   - Remove players from group
   - Update tee times

4. **Connect to store:**
   - Load groups on open
   - Save groups on save button
   - Update tournament state after save

5. **Add validation:**
   - Minimum players per group
   - Unique player assignments
   - Valid tee times
   - Starting tee validation

## Migration Complexity: HIGH

The Group Manager is one of the most complex components in the app with:
- Multiple nested dialogs
- CSV import/export
- Drag-and-drop functionality
- Complex state management
- Player assignment logic
- Validation rules

Estimated effort: 8-12 hours for full implementation.

