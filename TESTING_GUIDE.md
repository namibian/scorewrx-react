# Quick Start Guide - Testing the Admin Components

## Prerequisites

1. **Firebase Configuration**
   - Copy Firebase credentials from the Vue project
   - Create `.env.local` in the project root:

   ```bash
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   ```

2. **Install Dependencies** (if not already done)
   ```bash
   npm install
   ```

## Running the Application

1. **Start Development Server**
   ```bash
   npm run dev
   ```

2. **Open in Browser**
   - Navigate to `http://localhost:5173`
   - You should be redirected to `/login`

## Testing Flow

### 1. Authentication
- **Register a New Account**
  - Navigate to `/register`
  - Fill in: First Name, Last Name, Email, Password, Organization
  - Click "Create Account"
  - Should redirect to dashboard

- **Login**
  - Navigate to `/login`
  - Enter email and password
  - Click "Sign In"
  - Should redirect to dashboard

- **Logout**
  - Click "Logout" button in dashboard header
  - Should redirect to login page

### 2. Dashboard
- **View Stats**
  - See counts for Tournaments, Courses, Players
  - Click on stat cards to navigate to respective pages

- **Quick Actions**
  - Test navigation buttons to different sections

- **Recent Activity**
  - View recent tournaments (if any exist)

### 3. Courses
- **View Courses**
  - Navigate to `/courses`
  - View all courses in grid layout
  - Check course cards show: name, location, teebox count

- **Create Course**
  - Click "Add Course" button
  - Note: Full course form not yet implemented
  - For now, create courses directly in Firebase or wait for form implementation

- **Delete Course**
  - Click trash icon on course card
  - Confirm deletion
  - Course should disappear from list

### 4. Players
- **View Players**
  - Navigate to `/players`
  - View all players in table format
  - Check table shows: Name, Email, Handicap, Affiliation

- **Bulk Selection**
  - Use checkboxes to select multiple players
  - See selection count appear
  - Test "Delete Selected" button

- **Delete Player**
  - Click trash icon for individual player
  - Confirm deletion
  - Player should be removed from table

### 5. Tournaments
- **View Tournaments**
  - Navigate to `/tournaments`
  - See tournaments split into "Upcoming" and "Past"
  - Check tournament cards show: name, date, code, state

- **Create Tournament**
  - Click "Create Tournament" button
  - Fill in: Name, Date
  - Select a Course from dropdown
  - Click "Create Tournament"
  - New tournament should appear in list

- **Tournament Actions**
  - **Edit**: Click Edit button (shows console log for now)
  - **Groups**: Click Groups button (disabled until implemented)
  - **Code**: Click Code button (shows console log for now)
  - **Finalize**: For Active tournaments, click Finalize
  - **Delete**: Click trash icon, confirm deletion

- **Delete All Past Tournaments**
  - In Past Tournaments section, click "Delete All"
  - Confirm bulk deletion
  - All past tournaments removed

## Route Testing

### Protected Routes (Require Login)
- `/dashboard` ✅
- `/tournaments` ✅
- `/courses` ✅
- `/players` ✅

### Public Routes (Redirect if Logged In)
- `/login` ✅
- `/register` ✅

### Redirects
- `/` → `/dashboard` ✅
- Any unknown route → `/dashboard` ✅

## Known Limitations (Deferred to Later)

1. **Tournament Management**
   - No tournament editing dialog
   - No group manager
   - No QR code display
   - No export functionality

2. **Course Management**
   - No course creation/edit form
   - No teebox configuration
   - No hole-by-hole setup

3. **Player Management**
   - No player creation/edit form
   - No CSV import/export
   - No handicap update functionality

4. **General**
   - Using browser `alert()` and `confirm()` - should use toast notifications
   - No search/filter functionality
   - No pagination for large lists
   - No real-time updates (needs testing)

## Troubleshooting

### Firebase Connection Issues
```typescript
// Check browser console for errors
// Verify .env.local file exists and has correct values
console.log('Firebase config:', {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ? '✓' : '✗',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ? '✓' : '✗',
})
```

### TypeScript Errors
```bash
# Clear cache and rebuild
rm -rf node_modules/.cache
npm run build
```

### Linting Errors
```bash
# Check for errors
npm run lint

# Auto-fix where possible
npm run lint -- --fix
```

## Development Workflow

1. **Before Making Changes**
   ```bash
   git status
   git pull origin main
   ```

2. **While Developing**
   - Watch terminal for TypeScript errors
   - Check browser console for runtime errors
   - Test in different screen sizes (responsive)

3. **Before Committing**
   ```bash
   npm run test:unit  # Run tests
   npm run build      # Check build
   npm run lint       # Check linting
   ```

## Next Steps

After verifying everything works:

1. **Add Toast Notifications**
   - Replace `alert()` with toast library (e.g., sonner)
   - Better user experience for success/error messages

2. **Implement Edit Dialogs**
   - Tournament edit dialog
   - Course form (multi-step wizard)
   - Player form

3. **Add CSV Import/Export**
   - Export players to CSV
   - Import players from CSV
   - Template download

4. **Tournament Details**
   - Full editing interface
   - Group manager
   - QR code generation
   - Scoring link display

5. **Mobile Scoring Components** (Week 6-7)
   - Game setup pages
   - Scorecard grid
   - Score entry
   - Real-time updates

---

**Happy Testing! 🎉**

Report any issues or unexpected behavior.


