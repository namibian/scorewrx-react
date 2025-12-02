# Admin Components Architecture

## Overview

The admin interface provides tournament organizers with tools to manage tournaments, courses, players, and related data. Built with React, TypeScript, and Tailwind CSS, following modern best practices.

## Technology Stack

- **React 18**: Component-based UI
- **TypeScript**: Type-safe development
- **React Router v7**: Client-side routing
- **Zustand**: State management
- **Shadcn/ui**: UI component library
- **Tailwind CSS**: Utility-first styling
- **Lucide React**: Icon library
- **Firebase**: Backend services (Auth, Firestore)
- **Vite**: Build tool and dev server

## Architecture Patterns

### 1. State Management (Zustand)
```typescript
// Stores handle all data operations
const { fetchTournaments, createTournament, deleteTournament } = useTournamentsStore()

// Stores maintain loading, error, and data states
const { tournaments, loading, error } = useTournamentsStore()
```

**Benefits:**
- Centralized data management
- No prop drilling
- Simple API (no reducers, actions)
- DevTools support

### 2. Route Protection
```typescript
// AuthGuard: Requires authentication
<Route path="/dashboard" element={
  <AuthGuard>
    <Dashboard />
  </AuthGuard>
} />

// GuestGuard: Redirects if authenticated
<Route path="/login" element={
  <GuestGuard>
    <LoginPage />
  </GuestGuard>
} />
```

**Benefits:**
- Declarative route protection
- Automatic redirects
- Loading states during auth check

### 3. Component Composition
```typescript
// Pages compose smaller components
<TournamentsPage>
  <TournamentCard />
  <CreateTournamentDialog />
</TournamentsPage>
```

**Benefits:**
- Reusable components
- Single Responsibility Principle
- Easier testing

### 4. Form Handling
```typescript
// Controlled components with useState
const [name, setName] = useState('')
const [date, setDate] = useState('')

// Client-side validation
if (!name || !date) {
  setError('Please fill in all fields')
  return
}

// Async submission
await createTournament({ name, date, ... })
```

**Benefits:**
- Predictable form state
- Easy validation
- Type safety

## Component Structure

### Page Components (`src/pages/`)
Full-page views with routing and data fetching:
- `login.tsx` - Authentication
- `register.tsx` - User registration
- `dashboard.tsx` - Main overview
- `tournaments.tsx` - Tournament list
- `courses.tsx` - Course management
- `players.tsx` - Player database

**Responsibilities:**
- Fetch data from stores
- Handle page-level state
- Compose smaller components
- Handle routing

### Feature Components (`src/components/`)
Reusable, focused components:
- `auth/auth-guard.tsx` - Route protection
- `tournaments/tournament-card.tsx` - Tournament display
- `tournaments/create-tournament-dialog.tsx` - Tournament creation

**Responsibilities:**
- Display specific data
- Handle user interactions
- Emit events to parent
- Maintain internal state

### UI Components (`@/components/ui/`)
Low-level, unstyled components from Shadcn/ui:
- `button.tsx`, `card.tsx`, `input.tsx`, etc.
- Accessible, customizable
- Consistent styling

## Data Flow

```
Firebase ←→ Zustand Stores ←→ Pages ←→ Components
                ↓
           Local State (useState)
```

### Example: Creating a Tournament

1. **User Action**: Click "Create Tournament"
2. **Page State**: `setShowCreateDialog(true)`
3. **Component**: Dialog opens, shows form
4. **Form Submit**: Validate inputs
5. **Store Action**: `createTournament(data)`
6. **Firebase**: Save to Firestore
7. **Store Update**: Add to tournaments array
8. **Component Update**: Re-render with new data
9. **User Feedback**: Success message, close dialog

## Styling Approach

### Tailwind CSS Utilities
```typescript
// Utility classes for rapid development
<div className="flex items-center space-x-3">
  <Button className="bg-gradient-to-r from-blue-600 to-blue-700">
```

### Design Tokens
- **Colors**: Blue (primary), Green (success), Red (danger)
- **Spacing**: 4px base unit (space-1 = 4px)
- **Typography**: Font sizes, weights from Tailwind
- **Shadows**: Elevation for cards, dialogs

### Responsive Design
```typescript
// Mobile-first breakpoints
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
// cols-1 on mobile, 2 on tablet, 3 on desktop
```

## Error Handling

### Pattern
```typescript
try {
  await someOperation()
  // Success feedback
} catch (err: any) {
  // Error feedback
  setError(err.message || 'Operation failed')
}
```

### Levels
1. **Store Level**: Catch Firebase errors, set error state
2. **Component Level**: Display errors to user
3. **Validation**: Prevent invalid operations

## Loading States

### Pattern
```typescript
if (loading) {
  return <LoadingSpinner />
}
```

### Implementation
- Store maintains `loading` boolean
- Set true before async operation
- Set false in finally block
- Components show spinner or skeleton

## Empty States

### Pattern
```typescript
if (!hasTournaments) {
  return <EmptyState
    icon={<Trophy />}
    title="No Tournaments Yet"
    description="Create your first tournament"
    action={<Button onClick={create}>Create Tournament</Button>}
  />
}
```

### Purpose
- Onboard new users
- Provide clear next steps
- Reduce confusion

## Type Safety

### TypeScript Interfaces
```typescript
interface Tournament {
  id: string
  name: string
  date: Date | string
  courseId: string
  state: 'Created' | 'Open' | 'Active' | 'Archived'
  // ... more fields
}
```

### Benefits
- Catch errors at compile time
- IntelliSense in IDE
- Self-documenting code
- Refactoring confidence

## Accessibility

### Built-in from Shadcn/ui
- ARIA labels
- Keyboard navigation
- Focus management
- Screen reader support

### Additional Considerations
- Semantic HTML (`<button>`, `<form>`, etc.)
- Contrast ratios meet WCAG standards
- Alt text for icons (via `aria-label`)
- Focus visible styles

## Performance Considerations

### Current State
- No optimization needed at current scale
- Direct re-renders acceptable

### Future Optimizations
- **Lazy Loading**: Code split routes
- **Memoization**: `useMemo`, `React.memo` for expensive components
- **Virtual Scrolling**: Large player/course lists
- **Pagination**: Backend pagination for large datasets
- **Debouncing**: Search input, form validation

## Security

### Authentication
- Firebase Auth handles sessions
- JWT tokens in httpOnly cookies
- Auto-refresh tokens

### Authorization
- Route guards check authentication
- Firestore rules enforce permissions
- User affiliation filtering

### Data Validation
- Client-side validation (UX)
- Server-side rules (security)
- TypeScript types (correctness)

## Testing Strategy

### Current State
- TypeScript compilation
- ESLint for code quality
- Manual testing

### Future Tests
- **Unit Tests**: Vitest for components
- **Integration Tests**: Test pages with stores
- **E2E Tests**: Playwright for user flows
- **Visual Regression**: Screenshot comparisons

## File Organization

```
src/
├── pages/              # Route components
├── components/         # Feature components
│   ├── auth/          # Auth-related
│   └── tournaments/   # Tournament-related
├── stores/            # Zustand stores
├── types/             # TypeScript types
├── lib/               # Utilities
│   ├── firebase/      # Firebase config
│   ├── game-logic/    # Business logic
│   └── utils.ts       # Helpers
└── App.tsx            # Root component with routing
```

## Conventions

### Naming
- **Components**: PascalCase (`TournamentCard.tsx`)
- **Functions**: camelCase (`createTournament`)
- **Constants**: UPPER_CASE (`MAX_PLAYERS`)
- **Types**: PascalCase (`Tournament`)

### File Structure
```typescript
// 1. Imports
import { useState } from 'react'
import { Component } from '@/components/ui/component'

// 2. Types/Interfaces
interface Props {
  // ...
}

// 3. Component
export default function MyComponent({ prop }: Props) {
  // Hooks
  const [state, setState] = useState()
  
  // Handlers
  const handleClick = () => {}
  
  // Render
  return <div>...</div>
}
```

### Comments
- Explain **why**, not **what**
- TSDoc for public APIs
- Inline for complex logic

## Common Patterns

### Conditional Rendering
```typescript
// Loading
{loading && <Spinner />}

// Error
{error && <ErrorMessage>{error}</ErrorMessage>}

// Empty
{items.length === 0 && <EmptyState />}

// Data
{items.map(item => <Item key={item.id} {...item} />)}
```

### Event Handlers
```typescript
// Inline for simple
<Button onClick={() => setOpen(true)}>

// Named for complex
const handleSubmit = async (e: FormEvent) => {
  e.preventDefault()
  // ... logic
}
<form onSubmit={handleSubmit}>
```

### API Calls
```typescript
useEffect(() => {
  fetchData()
}, [fetchData])

// In store
const fetchData = async () => {
  set({ loading: true, error: null })
  try {
    const data = await api.getData()
    set({ data, loading: false })
  } catch (err) {
    set({ error: err.message, loading: false })
  }
}
```

## Migration from Vue

### Key Differences

| Vue | React |
|-----|-------|
| `v-if` | `{condition && <Component />}` |
| `v-for` | `{items.map(item => ...)}` |
| `v-model` | `value={x} onChange={e => setX(e.target.value)}` |
| `computed` | `useMemo` |
| `watch` | `useEffect` |
| Pinia | Zustand |
| Quasar | Shadcn/ui |

### Preserved from Vue
- Business logic (ported exactly)
- Firebase schema (unchanged)
- Component structure (similar)
- Styling approach (utility-first)

## Future Enhancements

1. **Toast Notifications**: Replace alerts with library (sonner, react-hot-toast)
2. **Form Library**: React Hook Form for complex forms
3. **Data Tables**: TanStack Table for advanced tables
4. **Charts**: Recharts for analytics
5. **Date Picker**: react-day-picker for better date inputs
6. **File Upload**: react-dropzone for CSV import
7. **QR Codes**: qrcode.react for tournament codes

---

**For more details, see:**
- `MIGRATION_GUIDE.md` - Overall migration plan
- `WEEK_4_5_COMPLETE.md` - Implementation summary
- `TESTING_GUIDE.md` - Testing instructions



