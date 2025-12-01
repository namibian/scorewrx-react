# Tournament 3-Dot Menu Fix

## Problem
The 3-dot menu button (MoreVertical icon) on upcoming tournament cards was not working - clicking it did nothing. The button appeared but had no dropdown menu functionality.

## Root Cause
In `src/components/tournaments/tournament-card.tsx`, the 3-dot menu was implemented as a simple button with no dropdown menu:

```typescript
{!isPastTournament && (
  <Button variant="ghost" size="icon" className="h-8 w-8">
    <MoreVertical className="w-4 h-4" />
  </Button>
)}
```

This was just a static icon with no menu attached, so clicking it did nothing.

## Original Vue Implementation
The original Vue app used Quasar's `<q-menu>` component with a full menu:

```vue
<q-btn flat round dense icon="more_vert" class="tournament-menu-btn">
  <q-menu class="modern-menu">
    <q-list style="min-width: 200px">
      <q-item clickable v-close-popup @click="editTournament(tournament)">
        <q-item-section avatar>
          <q-icon name="edit" color="primary" />
        </q-item-section>
        <q-item-section>Edit Tournament</q-item-section>
      </q-item>
      
      <q-item clickable v-close-popup @click="showGroupManager(tournament)">
        <q-item-section avatar>
          <q-icon name="groups" color="primary" />
        </q-item-section>
        <q-item-section>Manage Groups</q-item-section>
      </q-item>
      
      <q-separator class="q-my-sm" />
      
      <q-item clickable v-close-popup @click="generateScoringLink(tournament)" :disable="!hasGroups(tournament)">
        <q-item-section avatar>
          <q-icon name="qr_code" color="secondary" />
        </q-item-section>
        <q-item-section>Show Code & Link</q-item-section>
      </q-item>
      
      <q-item clickable v-close-popup @click="exportTournament(tournament)" :disable="!canExportTournament(tournament)">
        <q-item-section avatar>
          <q-icon name="download" color="info" />
        </q-item-section>
        <q-item-section>Export Data</q-item-section>
      </q-item>
      
      <q-separator class="q-my-sm" />
      
      <q-item clickable v-close-popup @click="confirmDelete(tournament)">
        <q-item-section avatar>
          <q-icon name="delete" color="negative" />
        </q-item-section>
        <q-item-section>Delete</q-item-section>
      </q-item>
    </q-list>
  </q-menu>
</q-btn>
```

## Solution Implemented

### Updated Imports
Added dropdown menu components and UsersRound icon:

```typescript
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { UsersRound } from 'lucide-react'
```

### Implemented Dropdown Menu
Replaced the static button with a proper dropdown menu:

```typescript
{!isPastTournament && (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="icon" className="h-8 w-8">
        <MoreVertical className="w-4 h-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-56">
      <DropdownMenuItem onClick={() => onEdit(tournament)}>
        <Edit className="w-4 h-4 mr-2" />
        Edit Tournament
      </DropdownMenuItem>
      
      <DropdownMenuItem 
        onClick={() => onManageGroups(tournament)}
        disabled={tournament.useOnlineRegistration && tournament.state !== 'Active'}
      >
        <UsersRound className="w-4 h-4 mr-2" />
        Manage Groups
      </DropdownMenuItem>
      
      <DropdownMenuSeparator />
      
      <DropdownMenuItem 
        onClick={() => onShowCode(tournament)}
        disabled={!hasGroups}
      >
        <QrCode className="w-4 h-4 mr-2" />
        Show Code & Link
      </DropdownMenuItem>
      
      <DropdownMenuItem 
        onClick={() => onExport(tournament)}
        disabled={!exportEnabled}
      >
        <FileDown className="w-4 h-4 mr-2" />
        Export Data
      </DropdownMenuItem>
      
      <DropdownMenuSeparator />
      
      <DropdownMenuItem 
        onClick={() => onDelete(tournament)}
        className="text-red-600 focus:text-red-600 focus:bg-red-50"
      >
        <Trash2 className="w-4 h-4 mr-2" />
        Delete
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
)}
```

## Menu Items

### 1. Edit Tournament
- **Icon**: Edit (pencil)
- **Action**: Opens edit dialog with tournament data
- **Enabled**: Always

### 2. Manage Groups
- **Icon**: UsersRound (group of people)
- **Action**: Opens group manager dialog
- **Enabled**: When `!tournament.useOnlineRegistration || tournament.state === 'Active'`
- **Disabled**: When online registration is enabled but tournament is not yet Active

### 3. Show Code & Link (Separator above)
- **Icon**: QrCode
- **Action**: Shows tournament code and registration link
- **Enabled**: When `hasGroups` (tournament has at least one group)
- **Disabled**: When no groups exist yet

### 4. Export Data
- **Icon**: FileDown (download)
- **Action**: Exports tournament data to CSV
- **Enabled**: When `exportEnabled` (all scores complete or tournament is past)
- **Disabled**: When tournament is ongoing with incomplete scores

### 5. Delete (Separator above, red text)
- **Icon**: Trash2 (trash can)
- **Action**: Opens delete confirmation dialog
- **Enabled**: Always
- **Style**: Red text to indicate destructive action

## Features

✅ **Dropdown menu** - Clicking 3-dot icon opens menu
✅ **All menu items** - Edit, Manage Groups, Show Code, Export, Delete
✅ **Icons** - Each item has appropriate icon
✅ **Conditional enabling** - Items disabled based on tournament state
✅ **Visual separators** - Groups related actions together
✅ **Destructive styling** - Delete in red to indicate caution
✅ **Proper alignment** - Menu aligns to the right ("end")
✅ **Click to close** - Clicking an item closes the menu

## Disabled States Logic

### Manage Groups
Disabled when online registration is enabled but tournament hasn't been activated:
```typescript
disabled={tournament.useOnlineRegistration && tournament.state !== 'Active'}
```

This prevents editing groups while registration is open, as groups should only be managed after registration closes.

### Show Code & Link
Disabled when tournament has no groups:
```typescript
disabled={!hasGroups}
```

The code is only useful once groups have been created.

### Export Data
Disabled based on export eligibility:
```typescript
disabled={!exportEnabled}
```

Export requires either complete scores or a past tournament date.

## Files Modified

**`src/components/tournaments/tournament-card.tsx`**
- Added DropdownMenu imports
- Added UsersRound icon import
- Replaced static button with DropdownMenu component
- Added 5 menu items with proper handlers and disabled states
- Added separators for visual grouping

## Result

✅ **3-dot menu works** - Opens dropdown on click
✅ **All actions accessible** - Edit, Groups, Code, Export, Delete
✅ **Smart disabling** - Actions disabled when not applicable
✅ **Clean UI** - Matches original Vue implementation
✅ **Better UX** - All actions in one organized menu
✅ **Visual hierarchy** - Separators group related items
✅ **Destructive action highlighted** - Delete in red

## Comparison to Footer Buttons

The original React implementation had action buttons in the footer:
- ❌ **Took up space** - Multiple buttons in footer
- ❌ **Cluttered** - Too many options visible at once
- ❌ **Conditional display** - Buttons appeared/disappeared

The 3-dot menu approach:
- ✅ **Cleaner** - Single icon, hidden menu
- ✅ **Consistent** - Always shows same icon
- ✅ **Organized** - Related actions grouped
- ✅ **Scalable** - Easy to add more actions

## Note

The footer buttons are still present and functional. The 3-dot menu provides an alternative, more organized way to access the same actions. In the future, you might want to remove the footer buttons and use only the dropdown menu for a cleaner UI, like the original Vue implementation.


