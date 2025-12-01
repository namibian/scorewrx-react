# Player Import/Export - Quick Reference

## Features Overview

```
Players Page
    │
    ├── Export Players → Downloads CSV with all players
    ├── Import Players → Upload CSV to create players
    ├── Download Template → Get sample CSV file
    └── Import Handicaps → Update handicaps from CSV
```

## 1. Export Players

**Button:** Export (with download icon)

**Action:** Downloads CSV file with all current players

**File Format:** `players_2024-12-01.csv`

**CSV Structure:**
```csv
firstName,lastName,shortName,email,affiliation,handicapIndex
John,Doe,John D,john@example.com,Country Club,12.4
Jane,Smith,Jane S,jane@example.com,Golf Club,8.2
```

**Use Cases:**
- Backup player data
- Transfer to another system
- Edit in spreadsheet and re-import
- Share with other admins

---

## 2. Import Players (Full)

**Button:** Import (with upload icon)

**Action:** Creates new players from CSV file

**CSV Format:**
```csv
firstName,lastName,shortName,email,affiliation,handicapIndex
John,Doe,John D,john@example.com,Country Club,12.4
Jane,Smith,Jane S,jane@example.com,Golf Club,8.2
```

**Required Fields:**
- ✅ firstName
- ✅ lastName
- ✅ shortName

**Optional Fields:**
- email
- affiliation
- handicapIndex

**Process:**
1. Click "Import" button
2. Select CSV file
3. System validates and creates players
4. Shows success/error count

**Validation:**
- Required fields must be present
- Email format checked (if provided)
- Handicap range: -10 to 54 (if provided)
- Invalid rows are skipped with warning

---

## 3. Download Template

**Button:** Template (with download icon)

**Action:** Downloads sample CSV with correct format

**File:** `players_template.csv`

**Contents:**
```csv
firstName,lastName,shortName,email,affiliation,handicapIndex
John,Doe,John D,,,12.4
Jane,Smith,Jane S,jane.smith@example.com,,8.2
```

**Use Cases:**
- First-time CSV import
- Learning correct format
- Base template for data entry
- Reference for column names

---

## 4. Import Handicaps Only

**Button:** Import Handicaps (with upload icon)

**Action:** Updates only handicap values for existing players

**CSV Format:**
```csv
Name,Hdcp
John D,12.4
Jane S,8.2
Bob M,15.6
```

**Required Columns:**
- `Name` - Must match player's shortName exactly
- `Hdcp` - New handicap value

**Process:**
1. Click "Import Handicaps" button
2. Select handicap CSV file
3. System matches by shortName
4. Updates only handicapIndex field
5. Shows update count

**Matching:**
- Uses player's **shortName** field
- Case-sensitive match
- Players not found are skipped
- Only updates handicapIndex, preserves all other data

**Use Cases:**
- Periodic handicap updates
- Import from GHIN or other handicap systems
- Bulk handicap adjustments
- Update without affecting other player data

---

## CSV Best Practices

### Special Characters
- **Commas in data:** Wrap field in quotes: `"Golf Club, Inc."`
- **Quotes in data:** Double them: `"John ""The Pro"" Doe"`
- **Line breaks:** Avoid or wrap in quotes

### Encoding
- Use UTF-8 encoding
- Save as `.csv` format
- Avoid special Excel formatting

### Headers
- First row must be column names
- Column names are case-sensitive
- Match exact names from template

---

## Common Workflows

### Workflow 1: Bulk Player Import
```
1. Click "Template" → Download template
2. Open in Excel/Sheets
3. Fill in player data
4. Save as CSV
5. Click "Import" → Select file
6. Review success/error messages
```

### Workflow 2: Update All Handicaps
```
1. Click "Export" → Save current data
2. Open CSV in spreadsheet
3. Update handicap column
4. Save Name,Hdcp columns only
5. Click "Import Handicaps" → Select file
6. Verify updates
```

### Workflow 3: Data Migration
```
1. Export from old system
2. Format to match template structure
3. Validate required fields
4. Click "Import" → Select file
5. Check for errors
6. Fix errors and re-import if needed
```

### Workflow 4: Backup and Restore
```
Backup:
1. Click "Export" → Save CSV
2. Store file safely

Restore:
1. Delete players if needed
2. Click "Import" → Select backup file
3. Verify all players restored
```

---

## Error Messages

### Export Errors
| Message | Meaning | Solution |
|---------|---------|----------|
| "No players to export" | No players in system | Add players first |
| "Failed to export" | System error | Check console, try again |

### Import Errors
| Message | Meaning | Solution |
|---------|---------|----------|
| "Error parsing CSV" | Invalid file format | Check CSV format |
| "Missing required fields" | firstName/lastName/shortName missing | Add missing columns |
| "Failed to import X players" | Some creations failed | Check console logs |
| "Some rows were skipped" | Invalid data in rows | Fix data and re-import |

### Handicap Import Errors
| Message | Meaning | Solution |
|---------|---------|----------|
| "Invalid CSV format" | Missing Name or Hdcp column | Add required columns |
| "No valid players found" | No matching shortNames | Check shortName spelling |
| "Error updating handicaps" | System error | Check console, try again |

---

## Tips & Tricks

### 💡 Tip 1: Start with Template
Always download the template first to see the exact format needed.

### 💡 Tip 2: Test with Small Files
Test import with 2-3 players before bulk importing hundreds.

### 💡 Tip 3: Keep Backup
Always export current data before doing bulk imports.

### 💡 Tip 4: Use Short Names Wisely
Short names are used for handicap matching - keep them unique and consistent.

### 💡 Tip 5: Check Console for Details
If imports fail, check browser console for detailed error messages.

### 💡 Tip 6: Sequential Processing
Imports happen one player at a time - be patient with large files.

### 💡 Tip 7: Partial Success is OK
If 50 out of 55 players import successfully, fix the 5 errors and import again.

---

## Button States

### Normal State
```
[Export] [Import] [Template] [Import Handicaps] [Add Player]
```

### During Import
```
[Export] [Importing...] [Template] [Importing...] [Add Player]
                ↑ disabled            ↑ disabled
```

### Empty State (No Players)
```
[Add Player] [Import CSV] [Template]
```

---

## File Requirements

### CSV File
- Extension: `.csv`
- Encoding: UTF-8
- Format: Comma-separated values
- Headers: Required in first row

### Size Limits
- Browser dependent
- Generally 5-10MB max
- ~10,000 players max recommended

### Browser Compatibility
- Chrome: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Edge: ✅ Full support

---

## Keyboard Shortcuts

No keyboard shortcuts currently implemented. All actions require button clicks.

---

## API Integration

### Store Methods Used
```typescript
createPlayer(playerData)  // Creates new player
updatePlayer(id, data)    // Updates existing player
fetchPlayers()            // Refreshes player list
```

### Data Flow
```
CSV File → Papa Parse → Validation → Store → Firebase → UI Update
```

---

## Troubleshooting

### Problem: Import button does nothing
**Solution:** Check browser console for errors, verify file is .csv format

### Problem: All players fail to import
**Solution:** Check CSV has required columns: firstName, lastName, shortName

### Problem: Some players import, others don't
**Solution:** Check failed rows for missing required fields or invalid data

### Problem: Handicap import finds no players
**Solution:** Verify Name column matches player shortNames exactly

### Problem: Export downloads empty file
**Solution:** Ensure players exist in system, check browser download settings

### Problem: Special characters are corrupted
**Solution:** Save CSV with UTF-8 encoding

---

## Related Features

- **Add Player:** Manual single player creation
- **Edit Player:** Update individual player details
- **Delete Player:** Remove single player
- **Delete Selected:** Bulk delete multiple players

---

## Version Information

**Implementation Date:** December 2024
**Based On:** Vue.js implementation from scorewrx
**Dependencies:** Papa Parse 5.5.3
**Compatible With:** React 18+, TypeScript 5+

