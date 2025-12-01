# Courses Dropdown Fix - Tournament Creation

## Problem
When creating a tournament, the courses dropdown was not populated with any courses.

## Root Cause Analysis

### Issue 1: Courses Not Fetched
The `TournamentsPage` component was importing `useCoursesStore` but **only** extracting `getCourseById` and `fetchCourseById`. It was **not**:
1. Getting the `courses` array from the store
2. Getting the `fetchCourses` function
3. Calling `fetchCourses()` on component mount

**Result**: The courses array in the store remained empty, so the dialog had no courses to display.

### Issue 2: Double Filtering
The `CreateTournamentDialog` was filtering courses by affiliation:
```typescript
courses.filter(course => course.affiliation === userProfile?.affiliation)
```

However, the `fetchCourses()` function in the store **already filters by affiliation** when fetching from Firestore. This double-filtering was unnecessary and could hide courses if there was any mismatch.

### Issue 3: No Loading State
The dialog didn't show a loading state while courses were being fetched, so users couldn't tell if:
- Courses were loading
- No courses existed
- There was an error

## Solution Implemented

### Fix 1: Fetch Courses on Mount (`tournaments.tsx`)

**Before:**
```typescript
const { getCourseById, fetchCourseById } = useCoursesStore()

useEffect(() => {
  fetchTournaments()
}, [fetchTournaments])
```

**After:**
```typescript
const { courses, getCourseById, fetchCourseById, fetchCourses } = useCoursesStore()

useEffect(() => {
  fetchTournaments()
  fetchCourses()  // ✅ Now fetches courses on mount
}, [fetchTournaments, fetchCourses])
```

### Fix 2: Remove Double Filtering (`create-tournament-dialog.tsx`)

**Before:**
```typescript
courses
  .filter(course => course.affiliation === userProfile?.affiliation)
  .map((course) => (
    <SelectItem key={course.id} value={course.id}>
      {course.name}
    </SelectItem>
  ))
```

**After:**
```typescript
courses.map((course) => (
  <SelectItem key={course.id} value={course.id}>
    {course.name}
  </SelectItem>
))
```

Courses are already filtered by affiliation in the store's `fetchCourses()` function, so no need to filter again.

### Fix 3: Add Loading State (`create-tournament-dialog.tsx`)

**Before:**
```typescript
const { courses } = useCoursesStore()
```

**After:**
```typescript
const { courses, loading: coursesLoading } = useCoursesStore()
```

**Updated UI:**
```typescript
<SelectTrigger className="h-11">
  <SelectValue placeholder={coursesLoading ? "Loading courses..." : "Select a course"} />
</SelectTrigger>
<SelectContent>
  {coursesLoading ? (
    <div className="p-2 text-sm text-slate-500">
      Loading courses...
    </div>
  ) : courses.length === 0 ? (
    <div className="p-2 text-sm text-slate-500">
      No courses available. Create a course first.
    </div>
  ) : (
    courses.map((course) => (
      <SelectItem key={course.id} value={course.id}>
        {course.name}
      </SelectItem>
    ))
  )}
</SelectContent>
```

**Added Helper Text:**
```typescript
{!coursesLoading && courses.length > 0 && (
  <p className="text-xs text-slate-500">
    {courses.length} course{courses.length !== 1 ? 's' : ''} available
  </p>
)}
```

## Files Modified

1. **`src/pages/tournaments.tsx`**
   - Added `courses` to store destructuring
   - Added `fetchCourses` to store destructuring
   - Added `fetchCourses()` call in useEffect

2. **`src/components/tournaments/create-tournament-dialog.tsx`**
   - Added `loading: coursesLoading` to store destructuring
   - Removed unnecessary affiliation filtering
   - Added loading state to dropdown placeholder
   - Added loading state check in dropdown content
   - Added course count helper text

## Result

✅ **Courses now load** when the tournaments page mounts
✅ **Dropdown is populated** with all available courses (filtered by affiliation in store)
✅ **Loading state** shows feedback while courses are being fetched
✅ **Helper text** shows how many courses are available
✅ **Better UX** - users can see what's happening at all times

## Testing Checklist

- [x] Courses load when tournaments page opens
- [x] Courses appear in dropdown when creating tournament
- [x] Loading state shows while fetching
- [x] "No courses available" message shows when empty
- [x] Course count displays correctly
- [x] Only courses matching user's affiliation appear
- [x] Selected course persists when navigating between steps

## Notes

- Courses are already filtered by affiliation in `fetchCourses()`, so no additional filtering is needed
- The loading state prevents confusion about whether courses are being fetched
- The course count provides quick feedback about available options

