# User Profile Fix - Missing Affiliation

## The Problem

Your console logs show:
```
Failed to fetch user profile: TypeError: data.createdAt?.toDate is not a function
[Tournaments Store] User profile: null
[Tournaments Store] Affiliation: undefined
```

This means:
1. ✅ Your user IS authenticated (email: chrisoosty@gmail.com)
2. ❌ The user profile fetch is FAILING due to a date format issue
3. ❌ Without a user profile, there's no affiliation
4. ❌ Without an affiliation, no data can be fetched

## The Solution

I've fixed the code to handle different date formats. Now you need to **check/fix your Firebase user document**.

---

## Step 1: Check Your Firebase User Document

### Go to Firebase Console:
1. Open Firebase Console: https://console.firebase.google.com/
2. Select your project
3. Click "Firestore Database" in the left menu
4. Click on the "users" collection
5. Find your user document (look for your UID)

### What to Look For:

Your user document should look like this:

```javascript
{
  email: "chrisoosty@gmail.com",
  affiliation: "Your Golf Club Name",  // ← THIS IS REQUIRED!
  firstName: "Chris",                   // ← Optional but nice to have
  lastName: "Oosthuizen",               // ← Optional but nice to have
  createdAt: Timestamp or Date,
  updatedAt: Timestamp or Date
}
```

---

## Step 2: Fix Missing Fields

### If the document doesn't exist at all:
You need to create it. Click "Start collection" if needed, then "Add document":

**Document ID:** (use your Firebase Auth UID)

**Fields:**
- `email` (string): "chrisoosty@gmail.com"
- `affiliation` (string): "Your Golf Club Name" (or whatever you want to use)
- `firstName` (string): "Chris"
- `lastName` (string): "Oosthuizen"
- `createdAt` (timestamp): Click "Add field" → Select type "timestamp" → Use current time
- `updatedAt` (timestamp): Same as above

### If the document exists but is missing `affiliation`:
1. Click on your user document
2. Click "Add field"
3. Field name: `affiliation`
4. Type: string
5. Value: "Your Golf Club Name" (you can use any name you want)
6. Click "Update"

---

## Step 3: Refresh Your App

After fixing the Firebase document:
1. Go back to your browser at http://localhost:5173
2. **Refresh the page** (Cmd+R or Ctrl+R)
3. Open DevTools Console (F12)
4. Look for these new log messages:

### Expected Success Logs:
```
[Auth Store] Fetching user profile for UID: xxxxxxxxx
[Auth Store] User document data: {...}
[Auth Store] Processed user profile: {...}
[Tournaments Store] User profile: {affiliation: "Your Golf Club Name", ...}
[Tournaments Store] Affiliation: Your Golf Club Name
[Tournaments Store] Query results: 0 tournaments  (or more if you have data)
```

### If You See This Warning:
```
[Auth Store] ⚠️ USER PROFILE IS MISSING AFFILIATION FIELD!
[Auth Store] Please add an "affiliation" field to this user document in Firebase.
```
→ Go back to Step 2 and add the affiliation field

### If You See This Error:
```
[Auth Store] ⚠️ USER DOCUMENT DOES NOT EXIST!
```
→ Go back to Step 2 and create the user document

---

## Step 4: Create Sample Data

Once your user profile has an affiliation, you can create data:

### Create a Tournament:
1. Click "Create Tournament" button
2. Fill in the form
3. The tournament will be created with YOUR affiliation automatically

### Add a Course:
1. Go to "Courses" tab
2. Click "Add Course"
3. The course will be created with YOUR affiliation automatically

### Add Players:
1. Go to "Players" tab
2. Click "Add Player"
3. The players will be created with YOUR affiliation automatically

**Important:** All data you create will automatically get your affiliation, so you'll be able to see it!

---

## Why This Happened

The Vue version probably used a different date format or the Firebase rules were set up differently. The React version expects:
1. A user document in the `users` collection
2. With an `affiliation` field
3. All tournaments/courses/players must have matching `affiliation` to be visible

This is actually a **security feature** - it ensures users only see data from their own golf club/organization.

---

## Quick Checklist

- [ ] Open Firebase Console
- [ ] Navigate to Firestore → users collection
- [ ] Find/create your user document
- [ ] Ensure `affiliation` field exists with a value
- [ ] Refresh your app
- [ ] Check console logs for success
- [ ] Create sample data if needed

---

## Need Help?

If you're still stuck, please share:
1. A screenshot of your user document from Firebase Console
2. The NEW console logs after refreshing
3. Whether you see the warning messages I added

The code is now fixed to:
- ✅ Handle different date formats
- ✅ Show clear error messages
- ✅ Tell you exactly what's wrong and where to fix it

