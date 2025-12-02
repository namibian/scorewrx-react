# Tournament Creation Wizard - Quick Reference

## Visual Flow

```
┌─────────────────────────────────────────────────────┐
│                    STEP 1 of 3                      │
│              Tournament Information                 │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Tournament Name:  [_____________________] *        │
│                                                     │
│  Tournament Date:  [____/__/____] *                │
│                                                     │
│  Select Course:    [▼ Choose course...  ] *        │
│                                                     │
│  ┌───────────────────────────────────────────┐    │
│  │ Use online registration          [ ] OFF  │    │
│  └───────────────────────────────────────────┘    │
│                                                     │
│  (If enabled)                                       │
│  Maximum Registrations: [_____] (optional)         │
│                                                     │
├─────────────────────────────────────────────────────┤
│                              [Cancel]  [Next →]     │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│                    STEP 2 of 3                      │
│            Tournament Configuration                 │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Play Type:         [▼ Stroke Play    ] *          │
│                       • Stroke Play                 │
│                       • Match Play                  │
│                                                     │
│  Scoring Format:    [▼ Individual      ] *          │
│                       • Individual                  │
│                       • Team                        │
│                                                     │
│  Handicap Format:   [▼ Custom          ] *          │
│                       • Custom                      │
│                       • Standard                    │
│                                                     │
│  ┌───────────────────────────────────────────┐    │
│  │ Shotgun Start                    [ ] OFF  │    │
│  └───────────────────────────────────────────┘    │
│                                                     │
│  (If shotgun enabled)                               │
│  Start Time:        [__:__] *                      │
│                                                     │
│  (If shotgun disabled)                              │
│  Starting Tee:      [▼ 1st Tee        ]            │
│                       • 1st Tee                     │
│                       • 10th Tee                    │
│                                                     │
├─────────────────────────────────────────────────────┤
│                   [← Back]        [Next →]          │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│                    STEP 3 of 3                      │
│                  Competitions                       │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ╔═══════════════════════════════════════════╗    │
│  ║ Closest to Pin                  [ ] OFF   ║    │
│  ╚═══════════════════════════════════════════╝    │
│    (If enabled)                                     │
│    Select Holes (Par 3s):                          │
│    [ ] Hole 3  [ ] Hole 5  [ ] Hole 12  [ ] Hole 17│
│    Buy-in Amount: $[_____]                         │
│                                                     │
│  ╔═══════════════════════════════════════════╗    │
│  ║ Long Drive                      [ ] OFF   ║    │
│  ╚═══════════════════════════════════════════╝    │
│    (If enabled)                                     │
│    Select Holes (Par 4s & 5s):                     │
│    [ ] Hole 1  [ ] Hole 2  [ ] Hole 4  [ ] Hole 6 │
│    [ ] Hole 7  [ ] Hole 8  ...                     │
│    Buy-in Amount: $[_____]                         │
│                                                     │
│  ╔═══════════════════════════════════════════╗    │
│  ║ Skins                           [✓] ON    ║    │
│  ╚═══════════════════════════════════════════╝    │
│    (If enabled)                                     │
│    [ ✓] Handicap Skins                             │
│         Handicap Buy-in: $[5.00]                   │
│         [ ✓] Use Half Stroke on Par 3s             │
│                                                     │
│    [ ✓] Scratch Skins                              │
│         Scratch Buy-in: $[5.00]                    │
│                                                     │
├─────────────────────────────────────────────────────┤
│            [← Back]  [Cancel]  [Create Tournament]  │
└─────────────────────────────────────────────────────┘
```

## Field Reference

### Step 1: Tournament Information
| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| Tournament Name | Text | ✓ | - | Unique name recommended |
| Tournament Date | Date | ✓ | - | YYYY-MM-DD format |
| Select Course | Dropdown | ✓ | - | Filtered by affiliation |
| Use Online Registration | Toggle | - | OFF | Enables player registration |
| Maximum Registrations | Number | - | null | Leave empty for unlimited |

### Step 2: Tournament Configuration
| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| Play Type | Select | ✓ | Stroke Play | Stroke Play or Match Play |
| Scoring Format | Select | ✓ | Individual | Individual or Team |
| Handicap Format | Select | ✓ | Custom | Custom or Standard |
| Shotgun Start | Toggle | - | OFF | All groups start simultaneously |
| Start Time | Time | Conditional | 08:00 | Required if shotgun enabled |
| Starting Tee | Select | - | 1st Tee | Used when shotgun disabled |

### Step 3: Competitions

#### Closest to Pin
| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| Enabled | Toggle | - | OFF | - |
| Holes | Multi-select | - | [] | Auto-filtered to Par 3s only |
| Buy-in | Number | - | 0 | Per player amount |

#### Long Drive
| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| Enabled | Toggle | - | OFF | - |
| Holes | Multi-select | - | [] | Auto-filtered to Par 4s & 5s |
| Buy-in | Number | - | 0 | Per player amount |

#### Skins
| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| Enabled | Toggle | - | ON | Default enabled |
| Handicap Skins | Toggle | - | ON | Handicap-adjusted scoring |
| Handicap Buy-in | Number | - | 5.00 | Per player amount |
| Half Stroke on Par 3s | Toggle | - | ON | Apply half strokes on Par 3s |
| Scratch Skins | Toggle | - | ON | No handicap adjustment |
| Scratch Buy-in | Number | - | 5.00 | Per player amount |

## Validation Rules

### Step 1
- ❌ Cannot proceed if: Name, Date, or Course is empty
- ❌ Cannot proceed if: No courses available
- ⚠️ Warning if: Maximum registrations < 1 (when enabled)

### Step 2
- ❌ Cannot proceed if: Shotgun Start enabled but Start Time is empty
- ✅ All other fields have defaults

### Step 3
- ✅ All competitions are optional
- ✅ No validation required

## Workflow

```
Create Tournament Button
    ↓
Step 1: Basic Info
    ↓ (validates)
Step 2: Configuration  
    ↓ (validates)
Step 3: Competitions
    ↓
Create Tournament
    ↓
Save to Firestore
    ↓
Refresh Tournament List
    ↓
Close Dialog
```

## Data Structure Created

```javascript
{
  // Basic Info
  name: "Summer Championship 2024",
  date: "2024-07-15",
  course: "course-id-123",
  affiliation: "user-affiliation",
  state: "Created",
  code: "123456", // Auto-generated
  
  // Registration
  useOnlineRegistration: false,
  maxRegistrations: null,
  registeredPlayers: [],
  waitingList: [],
  
  // Configuration
  playType: "Stroke Play",
  scoringFormat: "Individual",
  handicapFormat: "Custom",
  shotgunStart: {
    enabled: false,
    startTime: "08:00"
  },
  defaultStartingTee: 1,
  
  // Competitions
  competitions: {
    closestToPin: {
      enabled: true,
      holes: [3, 5, 12, 17],
      buyIn: 5.00
    },
    longDrive: {
      enabled: true,
      holes: [2, 9],
      buyIn: 5.00
    },
    skins: {
      enabled: true,
      scratchBuyIn: 5.00,
      handicapBuyIn: 5.00,
      useHalfStrokeOnPar3: true
    }
  },
  
  // Metadata
  createdBy: "user-uid",
  createdAt: Timestamp,
  lastUpdated: Timestamp
}
```

## Key Features

✅ **Progressive Disclosure** - Information organized into logical steps
✅ **Smart Defaults** - Sensible defaults for all optional fields
✅ **Dynamic Filtering** - Hole selections filtered by par value
✅ **Context-Aware** - Fields show/hide based on other selections
✅ **Validation** - Clear error messages at each step
✅ **Type Safety** - Full TypeScript support
✅ **Backward Compatible** - Works with existing tournaments
✅ **Responsive** - Works on all screen sizes

## Testing Scenarios

1. **Minimal Tournament**: Name + Date + Course only (all other defaults)
2. **Full Tournament**: All fields configured
3. **Online Registration**: With max registrations set
4. **Shotgun Start**: With custom start time
5. **Multiple Competitions**: All three enabled with custom settings
6. **Par 3 Holes**: Verify only Par 3s show in Closest to Pin
7. **Par 4/5 Holes**: Verify only Par 4s & 5s show in Long Drive




