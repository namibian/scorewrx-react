# Player Edit Feature - Quick Reference

## User Flow

```
Players Page
    │
    ├─→ Click "Add Player" Button
    │       │
    │       └─→ Opens PlayerDialog (Create Mode)
    │               │
    │               ├─→ Fill in form fields
    │               ├─→ Short name auto-generates
    │               ├─→ Click "Save"
    │               │       │
    │               │       ├─→ Validation passes
    │               │       └─→ createPlayer() called
    │               │               │
    │               │               ├─→ Success: Dialog closes, toast shown, list refreshes
    │               │               └─→ Error: Toast shown, dialog stays open
    │               │
    │               └─→ Click "Cancel" → Dialog closes
    │
    └─→ Click "Edit" Icon (pencil) next to player
            │
            └─→ Opens PlayerDialog (Edit Mode)
                    │
                    ├─→ Form pre-filled with player data
                    ├─→ Modify fields as needed
                    ├─→ Short name updates automatically
                    ├─→ Click "Save"
                    │       │
                    │       ├─→ Validation passes
                    │       └─→ updatePlayer(id, data) called
                    │               │
                    │               ├─→ Success: Dialog closes, toast shown, list refreshes
                    │               └─→ Error: Toast shown, dialog stays open
                    │
                    └─→ Click "Cancel" → Dialog closes
```

## Component Architecture

```
PlayersPage
    │
    ├─→ State Management
    │   ├─→ players (from store)
    │   ├─→ selectedPlayers (checkboxes)
    │   ├─→ deleteConfirm (delete dialog state)
    │   ├─→ deleteMultipleConfirm (bulk delete state)
    │   └─→ playerDialog (edit/create dialog state)
    │           ├─→ open: boolean
    │           └─→ player: Player | null
    │
    ├─→ Handlers
    │   ├─→ handleEdit(player) → Opens dialog with player
    │   ├─→ handleCreate() → Opens dialog without player
    │   └─→ handleSavePlayer(data) → Calls create or update
    │
    └─→ Components
        ├─→ PlayerDialog
        │   ├─→ Props: open, player, onOpenChange, onSave
        │   ├─→ Form Fields: firstName, lastName, email, affiliation, handicapIndex, shortName
        │   ├─→ Validation: Required fields, email format, handicap range
        │   └─→ Auto-generation: Short name from first + last initial
        │
        ├─→ ConfirmDialog (for delete)
        └─→ Table with Edit/Delete buttons
```

## Data Flow

```
User Action → Handler → Dialog State Update → Dialog Opens
    │
    └─→ User Fills Form → Validation → Save Handler
            │
            ├─→ Create Mode: createPlayer(data) → Store → Firebase → Success
            │                                                           │
            │                                                           └─→ Store updates → UI refreshes
            │
            └─→ Edit Mode: updatePlayer(id, data) → Store → Firebase → Success
                                                                         │
                                                                         └─→ Store updates → UI refreshes
```

## Key Features

### 1. Dialog Modes
- **Create**: `player = null` → Empty form
- **Edit**: `player = Player object` → Pre-filled form

### 2. Short Name Auto-Generation
```
First Name: "John"
Last Name: "Doe"
→ Short Name: "John D"
```

### 3. Form Validation
- ✅ First Name (required)
- ✅ Last Name (required)  
- ✅ Email (optional, format validated)
- ✅ Handicap (-10 to 54 range)
- ✅ Short Name (auto-generated)

### 4. Store Integration
```typescript
// Create
await createPlayer({
  firstName, lastName, email, 
  affiliation, handicapIndex, shortName
})

// Update
await updatePlayer(playerId, {
  firstName, lastName, email,
  affiliation, handicapIndex, shortName
})
```

## Toast Notifications

| Action | Success | Error |
|--------|---------|-------|
| Create | "Player created successfully" | "Failed to save player" |
| Update | "Player updated successfully" | "Failed to save player" |
| Delete | "Player deleted successfully" | "Failed to delete player" |

## UI Components Used

- `Dialog` - Modal wrapper
- `DialogContent` - Content container
- `DialogHeader` - Title and description
- `DialogFooter` - Action buttons
- `Input` - Text/number/email fields
- `Label` - Field labels
- `Button` - Save/Cancel actions
- `toast` - Notifications

## File Structure

```
src/
├── components/
│   └── players/
│       └── player-dialog.tsx       (new)
├── pages/
│   └── players.tsx                 (updated)
└── stores/
    └── players-store.ts            (existing, no changes)
```

