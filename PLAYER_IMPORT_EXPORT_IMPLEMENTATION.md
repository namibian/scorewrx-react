# Player Import/Export Implementation

## Overview
Implemented comprehensive CSV import/export functionality for the Players page based on the Vue.js implementation.

## Features Implemented

### 1. **Export Players to CSV**
- Exports all players to a CSV file
- Includes: firstName, lastName, shortName, email, affiliation, handicapIndex
- Filename format: `players_YYYY-MM-DD.csv`
- Proper CSV escaping for fields containing commas, quotes, or newlines
- Toast notification on success/error

**Usage:**
- Click "Export" button in the page header
- CSV file automatically downloads

### 2. **Import Players from CSV**
- Bulk import players from a CSV file
- Uses Papa Parse for robust CSV parsing
- Validates required fields (firstName, lastName, shortName)
- Optional fields: email, affiliation, handicapIndex
- Shows progress and result notifications
- Handles partial failures gracefully

**CSV Format:**
```csv
firstName,lastName,shortName,email,affiliation,handicapIndex
John,Doe,John D,john@example.com,Country Club,12.4
Jane,Smith,Jane S,jane@example.com,Golf Club,8.2
```

**Usage:**
- Click "Import" button in the page header
- Select CSV file from your computer
- Import process runs automatically
- See success/error messages for each player

### 3. **Download CSV Template**
- Provides a sample CSV template for users
- Pre-filled with example data
- Shows correct format and field names
- Helps users create properly formatted CSV files

**Usage:**
- Click "Template" button in the page header
- Template file downloads as `players_template.csv`

### 4. **Import Handicaps Only**
- Update player handicaps in bulk without affecting other data
- CSV format: `Name,Hdcp`
- Matches players by their shortName field
- Only updates handicapIndex field
- Useful for periodic handicap updates from external systems

**CSV Format:**
```csv
Name,Hdcp
John D,12.4
Jane S,8.2
```

**Usage:**
- Click "Import Handicaps" button in the page header
- Select handicap CSV file
- System matches by shortName and updates handicaps
- See results in notification

## Technical Implementation

### State Management
```typescript
const [importing, setImporting] = useState(false)
const csvFileInputRef = useRef<HTMLInputElement>(null)
const handicapFileInputRef = useRef<HTMLInputElement>(null)
```

### Export Function
```typescript
const handleExport = () => {
  // Creates CSV with proper escaping
  // Downloads with timestamped filename
  // Shows success/error toast
}
```

### Import Function
```typescript
const handleCsvUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
  // Parses CSV with Papa Parse
  // Validates required fields
  // Creates players sequentially
  // Reports success/error counts
}
```

### Handicap Import Function
```typescript
const handleHandicapUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
  // Parses simple Name,Hdcp CSV format
  // Matches players by shortName
  // Updates only handicapIndex
  // Shows update count
}
```

### Template Download Function
```typescript
const downloadTemplate = () => {
  // Creates sample CSV with Papa.unparse
  // Downloads as players_template.csv
  // Includes example data
}
```

## UI Components

### Button Layout (Page Header)
```tsx
<Button onClick={handleExport}>Export</Button>
<Button onClick={handleImport}>Import</Button>
<Button onClick={downloadTemplate}>Template</Button>
<Button onClick={handleImportHandicaps}>Import Handicaps</Button>
<Button onClick={handleCreate}>Add Player</Button>
```

### Hidden File Inputs
```tsx
<input ref={csvFileInputRef} type="file" accept=".csv" onChange={handleCsvUpload} />
<input ref={handicapFileInputRef} type="file" accept=".csv" onChange={handleHandicapUpload} />
```

## Validation

### Player Import Validation
- **Required:** firstName, lastName, shortName
- **Optional:** email, affiliation, handicapIndex
- **Email:** Format validation (if provided)
- **Handicap:** -10 to 54 range (if provided)

### Handicap Import Validation
- **Required:** Name (shortName), Hdcp (handicap value)
- **Format:** Must have "Name" and "Hdcp" columns
- **Matching:** Player must exist with matching shortName

## Error Handling

### Parse Errors
- CSV parsing errors show user-friendly message
- Invalid format notifications
- Missing required fields warnings

### Import Errors
- Individual player creation failures are caught
- Shows count of successful vs failed imports
- Logs detailed errors to console

### File Handling
- File input is reset after each upload
- Handles empty files gracefully
- Validates file exists before processing

## User Feedback

### Toast Notifications

| Action | Success | Error | Warning |
|--------|---------|-------|---------|
| Export | "Players exported successfully" | "Failed to export players" | "No players to export" |
| Import | "Successfully imported X players" | "Failed to import X players" | "Some rows were skipped" |
| Template | "Template downloaded successfully" | - | - |
| Handicap Import | "Successfully updated X handicaps" | "Error updating handicaps" | "No valid players found" |

### Loading States
- Import button shows "Importing..." during processing
- Buttons disabled during import operations
- File input resets after completion

## CSV Escaping
Proper CSV escaping for special characters:
- Commas: Field wrapped in quotes
- Quotes: Escaped as double quotes (`""`)
- Newlines: Field wrapped in quotes
- Example: `"John ""The Pro"" Doe"` for name with quotes

## Dependencies
- **Papa Parse** (`papaparse`): CSV parsing library
- Already installed in package.json

## Comparison with Vue Implementation

### Similarities
✅ Same CSV format and structure
✅ Same validation rules
✅ Same error handling approach
✅ Same user notifications
✅ Same feature set (export, import, template, handicaps)

### Differences
- React uses `useRef` instead of Vue's `ref()`
- React uses hooks instead of Vue composition API
- TypeScript typing for better type safety
- Toast notifications instead of Quasar notify

## Files Modified
- `/Users/coosthuizen/Development/scorewrx-react/src/pages/players.tsx`

## New Dependencies
None - Papa Parse was already installed

## Testing

### Manual Testing Steps

1. **Export Test**
   - Navigate to Players page with some players
   - Click Export button
   - Verify CSV downloads with correct data
   - Open CSV in spreadsheet to verify format

2. **Import Test**
   - Click Template button to download template
   - Edit template with test data
   - Click Import button and select file
   - Verify players are created
   - Check success notification

3. **Import with Errors Test**
   - Create CSV with missing required fields
   - Import and verify error handling
   - Check that partial imports work

4. **Handicap Import Test**
   - Create CSV with Name,Hdcp columns
   - Use existing player shortNames
   - Import and verify handicaps update
   - Check players not in system are skipped

5. **Edge Cases**
   - Empty CSV file
   - CSV with special characters (commas, quotes)
   - CSV with wrong headers
   - CSV with invalid handicap values
   - Import with no existing players

## Known Limitations
- Sequential import (not batched) to avoid race conditions
- Imports can be slow for large player lists
- No progress bar for long imports
- File size limits apply (browser dependent)

## Future Enhancements
- Batch import for better performance
- Progress bar for large imports
- Import preview before committing
- Export filtering (selected players only)
- Import undo/rollback feature
- Duplicate detection and handling

