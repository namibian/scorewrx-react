# Tournament Creation Undefined Fields Fix

## Problem
When creating a tournament with all fields provided correctly, the following error occurred:

```
Error loading tournaments

Function setDoc() called with invalid data. Unsupported field value: undefined 
(found in field competitions.closestToPin in document tournaments/PJKizet6upNKZhbyWasp)
```

## Root Cause

### Issue 1: Undefined Competition Fields
In `create-tournament-dialog.tsx`, when building the competitions object, disabled competitions were set to `undefined`:

```typescript
const competitions: Competitions = {
  closestToPin: formData.competitions.closestToPin.enabled ? {
    enabled: true,
    holes: [...],
    buyIn: 5.00
  } : undefined,  // ❌ Firestore doesn't allow undefined
  longDrive: ...,
  skins: ...
}
```

**Problem**: Firestore doesn't allow `undefined` as a field value. When a competition was disabled, it would create a field with an undefined value, causing the error.

### Issue 2: Undefined defaultStartingTee
In `tournaments-store.ts`, the `defaultStartingTee` field was conditionally set to `undefined`:

```typescript
{
  // ...other fields
  defaultStartingTee: tournamentData.shotgunStart ? undefined : 1,  // ❌ undefined not allowed
}
```

**Problem**: Again, Firestore rejects `undefined` values.

## Solution

### Fix 1: Only Include Enabled Competitions (`create-tournament-dialog.tsx`)

**Before:**
```typescript
const competitions: Competitions = {
  closestToPin: enabled ? {...} : undefined,
  longDrive: enabled ? {...} : undefined,
  skins: enabled ? {...} : undefined
}

await createTournament({
  // ...other fields
  competitions  // Contains undefined values
})
```

**After:**
```typescript
// Build competitions object - only include enabled competitions
const competitions: Competitions = {}

if (formData.competitions.closestToPin.enabled) {
  competitions.closestToPin = {
    enabled: true,
    holes: formData.competitions.closestToPin.holes,
    buyIn: formData.competitions.closestToPin.buyIn
  }
}

if (formData.competitions.longDrive.enabled) {
  competitions.longDrive = {
    enabled: true,
    holes: formData.competitions.longDrive.holes,
    buyIn: formData.competitions.longDrive.buyIn
  }
}

if (formData.competitions.skins.enabled) {
  competitions.skins = {
    enabled: true,
    scratchBuyIn: formData.competitions.skins.scratchBuyIn,
    handicapBuyIn: formData.competitions.skins.handicapBuyIn,
    useHalfStrokeOnPar3: formData.competitions.skins.useHalfStrokeOnPar3
  }
}

await createTournament({
  // ...other fields
  competitions: Object.keys(competitions).length > 0 ? competitions : undefined
})
```

### Fix 2: Conditionally Add Fields (`tournaments-store.ts`)

**Before:**
```typescript
await setDoc(tournamentRef, {
  // ...fields
  defaultStartingTee: tournamentData.shotgunStart ? undefined : 1,  // ❌ undefined
  competitions: tournamentData.competitions || {...}
})
```

**After:**
```typescript
// Build the tournament document, excluding undefined fields
const tournamentDoc: any = {
  name: tournamentData.name,
  date: dateValue,
  // ...other required fields
  shotgunStart: { ... }
}

// Only add defaultStartingTee if shotgun start is disabled
if (!tournamentData.shotgunStart) {
  tournamentDoc.defaultStartingTee = 1
}

// Only add competitions if they exist
if (tournamentData.competitions && Object.keys(tournamentData.competitions).length > 0) {
  tournamentDoc.competitions = tournamentData.competitions
} else {
  // Default: skins enabled
  tournamentDoc.competitions = {
    skins: {
      enabled: true,
      scratchBuyIn: 5.00,
      handicapBuyIn: 5.00,
      useHalfStrokeOnPar3: true
    }
  }
}

await setDoc(tournamentRef, tournamentDoc)
```

## Key Changes

### 1. Dialog - Build Competitions Dynamically
- Start with empty object: `const competitions: Competitions = {}`
- Only add enabled competitions to the object
- Pass `undefined` to store if no competitions enabled (which is then handled properly)

### 2. Store - Build Document Without Undefined
- Create document object progressively
- Use conditional checks to add optional fields
- Never set a field to `undefined`

## Firestore Rules

### ❌ Invalid (causes error)
```javascript
{
  field1: "value",
  field2: undefined,  // NOT ALLOWED
  field3: null        // OK, but different meaning
}
```

### ✅ Valid
```javascript
// Option 1: Omit the field entirely
{
  field1: "value"
  // field2 doesn't exist in document
}

// Option 2: Use null if you need explicit absence
{
  field1: "value",
  field2: null  // Explicitly null
}

// Option 3: Conditionally add fields
const doc = { field1: "value" }
if (condition) {
  doc.field2 = "value2"
}
```

## Files Modified

1. **`src/components/tournaments/create-tournament-dialog.tsx`**
   - Changed competition building from ternary with `undefined` to progressive object building
   - Only include enabled competitions
   - Pass `undefined` for competitions only if none are enabled

2. **`src/stores/tournaments-store.ts`**
   - Changed from inline object literal to progressive document building
   - Conditionally add `defaultStartingTee` instead of setting to `undefined`
   - Validate competitions object before adding

## Result

✅ **Tournament creation works** with all field combinations
✅ **No undefined values** sent to Firestore
✅ **Disabled competitions** are simply omitted from the document
✅ **Optional fields** are conditionally added
✅ **Default skins** still works when no competitions are specified

## Testing Scenarios

- [x] Tournament with all competitions enabled
- [x] Tournament with some competitions enabled
- [x] Tournament with only skins enabled (default)
- [x] Tournament with no competitions enabled
- [x] Tournament with shotgun start enabled
- [x] Tournament with shotgun start disabled
- [x] Tournament with online registration
- [x] Tournament with minimal fields

## Technical Note

**Firestore Behavior:**
- `undefined` → Error (not a valid Firestore value)
- `null` → Stored as explicit null value
- Omitted field → Field doesn't exist in document

**Best Practice**: For optional fields in Firestore, either:
1. Omit the field entirely (preferred)
2. Use `null` if you need to explicitly represent "no value"
3. Never use `undefined`


