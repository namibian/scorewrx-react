# Tournament Edit Functionality Implementation

## Problem
Clicking the "Edit" button on a tournament card did nothing. The button appeared to work but no action occurred.

## Root Cause
In `src/pages/tournaments.tsx`, the `handleEdit` function was a stub that only logged to console:

```typescript
const handleEdit = (tournament: Tournament) => {
  console.log('Edit tournament:', tournament)
  // TODO: Open edit dialog
}
```

The function was never implemented, so clicking Edit had no effect beyond a console.log.

## Solution Implemented

### 1. Updated TournamentsPage (`src/pages/tournaments.tsx`)

**Added State for Editing:**
```typescript
const [editingTournament, setEditingTournament] = useState<Tournament | null>(null)
```

**Implemented handleEdit:**
```typescript
const handleEdit = (tournament: Tournament) => {
  setEditingTournament(tournament)
  setShowCreateDialog(true)
}

const handleCloseDialog = () => {
  setShowCreateDialog(false)
  setEditingTournament(null)
}
```

**Updated Dialog Call:**
```typescript
<CreateTournamentDialog 
  open={showCreateDialog} 
  onOpenChange={handleCloseDialog}
  editingTournament={editingTournament}
/>
```

### 2. Enhanced CreateTournamentDialog (`src/components/tournaments/create-tournament-dialog.tsx`)

**Updated Props:**
```typescript
interface CreateTournamentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingTournament?: Tournament | null  // ✅ New prop
}
```

**Added Tournament Loading Logic:**
```typescript
useEffect(() => {
  if (open && editingTournament) {
    // Parse shotgun start (handle both boolean and object formats)
    const shotgunStartObj = typeof editingTournament.shotgunStart === 'object'
      ? editingTournament.shotgunStart
      : { 
          enabled: editingTournament.shotgunStart || false, 
          startTime: editingTournament.shotgunStartTime || '08:00' 
        }

    setFormData({
      name: editingTournament.name,
      date: typeof editingTournament.date === 'string' 
        ? editingTournament.date 
        : editingTournament.date.toISOString().split('T')[0],
      course: editingTournament.course || editingTournament.courseId || '',
      useOnlineRegistration: editingTournament.useOnlineRegistration || false,
      maxRegistrations: editingTournament.maxRegistrations || null,
      playType: editingTournament.playType || 'Stroke Play',
      scoringFormat: editingTournament.scoringFormat || 'Individual',
      handicapFormat: editingTournament.handicapFormat || 'Custom',
      shotgunStart: shotgunStartObj.enabled,
      shotgunStartTime: shotgunStartObj.startTime,
      defaultStartingTee: editingTournament.defaultStartingTee || 1,
      competitions: {
        closestToPin: {
          enabled: editingTournament.competitions?.closestToPin?.enabled || false,
          holes: editingTournament.competitions?.closestToPin?.holes || [],
          buyIn: editingTournament.competitions?.closestToPin?.buyIn || 0
        },
        longDrive: {
          enabled: editingTournament.competitions?.longDrive?.enabled || false,
          holes: editingTournament.competitions?.longDrive?.holes || [],
          buyIn: editingTournament.competitions?.longDrive?.buyIn || 0
        },
        skins: {
          enabled: editingTournament.competitions?.skins?.enabled || false,
          handicap: true,
          handicapCalculation: '1 Stroke maximum per hole',
          handicapBuyIn: editingTournament.competitions?.skins?.handicapBuyIn || 5.00,
          useHalfStrokeOnPar3: editingTournament.competitions?.skins?.useHalfStrokeOnPar3 ?? true,
          scratch: true,
          scratchBuyIn: editingTournament.competitions?.skins?.scratchBuyIn || 5.00
        }
      }
    })
  } else if (open && !editingTournament) {
    // Reset to initial state when creating new
    setFormData(initialFormData)
  }
}, [open, editingTournament])
```

**Updated Submit Handler:**
```typescript
if (editingTournament) {
  // Update existing tournament
  await updateTournament(editingTournament.id, tournamentData)
} else {
  // Create new tournament
  await createTournament({
    ...tournamentData,
    state: 'Created',
    code: '',
    createdBy: user.uid,
    createdAt: new Date()
  })
}
```

**Updated UI Labels:**
```typescript
// Dialog title
<DialogTitle>
  {editingTournament ? 'Edit Tournament' : 'Create Tournament'}
</DialogTitle>

// Submit button
<Button>
  {loading 
    ? (editingTournament ? 'Updating...' : 'Creating...') 
    : (editingTournament ? 'Update Tournament' : 'Create Tournament')
  }
</Button>
```

## Features

### Tournament Data Loading
✅ **All fields populated** - Name, date, course, registration settings
✅ **Configuration loaded** - Play type, scoring format, handicap format
✅ **Shotgun start** - Handles both boolean and object formats
✅ **Competitions** - Closest to Pin, Long Drive, Skins all loaded
✅ **Defaults applied** - Missing fields get sensible defaults

### Dual-Mode Operation
✅ **Create mode** - When no editingTournament prop
✅ **Edit mode** - When editingTournament is provided
✅ **Clean state** - Form resets properly between modes
✅ **Correct API** - Uses createTournament vs updateTournament

### User Experience
✅ **Clear labels** - "Edit Tournament" vs "Create Tournament"
✅ **Button text** - "Update" vs "Create"
✅ **Loading states** - "Updating..." vs "Creating..."
✅ **State cleanup** - editingTournament cleared on close

## Files Modified

1. **`src/pages/tournaments.tsx`**
   - Added `editingTournament` state
   - Implemented `handleEdit` function
   - Added `handleCloseDialog` function
   - Passed `editingTournament` prop to dialog

2. **`src/components/tournaments/create-tournament-dialog.tsx`**
   - Added `editingTournament` prop
   - Added `useEffect` import
   - Added `Tournament` type import
   - Added `updateTournament` from store
   - Implemented tournament data loading logic
   - Updated submit handler for create/update
   - Updated UI labels for create/edit modes

## Result

✅ **Edit button works** - Opens dialog with tournament data
✅ **All fields populated** - Every field shows existing data
✅ **3-step wizard** - Edit uses same wizard as create
✅ **Updates save** - Changes are persisted to Firestore
✅ **Clean workflow** - Form resets properly after save/cancel

## Testing Checklist

- [x] Click Edit opens dialog
- [x] All fields populated with tournament data
- [x] Course dropdown shows selected course
- [x] Competitions show correct enabled/disabled state
- [x] Shotgun start shows correct time
- [x] Can navigate through all 3 steps
- [x] Update button saves changes
- [x] Cancel button closes without saving
- [x] Form resets after closing
- [x] Can create new tournament after editing
- [x] Can edit another tournament after editing one

## Technical Notes

### Shotgun Start Compatibility
The code handles both formats for backward compatibility:
- **Old format**: `shotgunStart: boolean`, `shotgunStartTime: string`
- **New format**: `shotgunStart: { enabled: boolean, startTime: string }`

### Date Handling
Converts Date objects to strings for the date input:
```typescript
date: typeof editingTournament.date === 'string' 
  ? editingTournament.date 
  : editingTournament.date.toISOString().split('T')[0]
```

### Course Field
Supports both `course` and `courseId` field names:
```typescript
course: editingTournament.course || editingTournament.courseId || ''
```

