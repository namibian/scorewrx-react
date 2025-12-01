import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') })

/**
 * Test Firebase Connection
 * This script tests:
 * 1. Firebase initialization
 * 2. Firestore connection
 * 3. Auth service availability
 * 4. Storage service availability
 */

async function testFirebaseConnection() {
  console.log('🔥 Testing Firebase Connection...\n')

  // Test 1: Check environment variables
  console.log('1️⃣ Checking Environment Variables...')
  const envVars = {
    'VITE_FIREBASE_API_KEY': process.env.VITE_FIREBASE_API_KEY,
    'VITE_FIREBASE_AUTH_DOMAIN': process.env.VITE_FIREBASE_AUTH_DOMAIN,
    'VITE_FIREBASE_PROJECT_ID': process.env.VITE_FIREBASE_PROJECT_ID,
    'VITE_FIREBASE_STORAGE_BUCKET': process.env.VITE_FIREBASE_STORAGE_BUCKET,
    'VITE_FIREBASE_MESSAGING_SENDER_ID': process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    'VITE_FIREBASE_APP_ID': process.env.VITE_FIREBASE_APP_ID,
  }

  let allSet = true
  for (const [key, value] of Object.entries(envVars)) {
    if (!value || value === 'undefined') {
      console.error(`❌ ${key} is not set`)
      allSet = false
    } else {
      // Show first few characters for verification
      const preview = value.length > 10 ? value.substring(0, 10) + '...' : value
      console.log(`✅ ${key}: ${preview}`)
    }
  }

  if (!allSet) {
    console.error('\n⚠️  Some environment variables are missing!')
    console.error('Make sure all variables are set in .env.local')
    return false
  }
  console.log()

  // Test 2: Initialize Firebase
  console.log('2️⃣ Initializing Firebase...')
  let auth: any, db: any, storage: any
  
  try {
    const firebaseConfig = {
      apiKey: process.env.VITE_FIREBASE_API_KEY,
      authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.VITE_FIREBASE_APP_ID
    }

    const app = initializeApp(firebaseConfig)
    auth = getAuth(app)
    db = getFirestore(app)
    storage = getStorage(app)
    
    console.log('✅ All Firebase services initialized')
    console.log(`   - Auth: ${auth.app.name}`)
    console.log(`   - Firestore: ${db.app.name}`)
    console.log(`   - Storage: ${storage.app.name}`)
    console.log(`   - Project ID: ${auth.app.options.projectId}\n`)
  } catch (error: any) {
    console.error('❌ Firebase initialization failed:', error.message)
    return false
  }

  // Test 3: Test Firestore connection with a test collection
  console.log('3️⃣ Testing Firestore Connection...')
  try {
    const testCollection = collection(db, 'connection_test')
    
    // Try to read from the collection (this will work even if empty)
    console.log('   - Attempting to read from Firestore...')
    const snapshot = await getDocs(testCollection)
    console.log(`✅ Firestore connection successful! Found ${snapshot.size} test documents`)

    // Try to write a test document
    console.log('   - Attempting to write a test document...')
    const testDoc = await addDoc(testCollection, {
      test: true,
      timestamp: new Date().toISOString(),
      message: 'Firebase connection test from Node.js'
    })
    console.log(`✅ Test document created with ID: ${testDoc.id}`)

    // Clean up - delete the test document
    console.log('   - Cleaning up test document...')
    await deleteDoc(doc(db, 'connection_test', testDoc.id))
    console.log('✅ Test document deleted\n')
    
  } catch (error: any) {
    console.error('❌ Firestore connection failed:', error.message)
    console.error('\nPossible issues:')
    console.error('   - Check if Firestore is enabled in Firebase Console')
    console.error('   - Verify your Firebase credentials in .env.local')
    console.error('   - Check Firestore security rules (they might be blocking writes)')
    console.error('   - Make sure the API key has the correct permissions')
    
    if (error.code) {
      console.error(`   - Error code: ${error.code}`)
    }
    return false
  }

  // Test 4: Check Auth configuration
  console.log('4️⃣ Testing Auth Configuration...')
  try {
    console.log(`✅ Auth domain: ${auth.config.authDomain}`)
    console.log(`✅ Auth API key: ${auth.config.apiKey ? '***' + auth.config.apiKey.slice(-4) : 'NOT SET'}\n`)
  } catch (error) {
    console.error('❌ Auth configuration error:', error)
    return false
  }

  console.log('🎉 All Firebase connection tests passed!')
  console.log('✅ Your Firebase setup is working correctly\n')
  return true
}

// Run the test
testFirebaseConnection()
  .then((success) => {
    if (success) {
      console.log('✨ You can now use Firebase in your application!')
      console.log('\n📝 Next steps:')
      console.log('   - Run "npm run dev" to start the development server')
      console.log('   - Your Firebase connection is ready to use')
      process.exit(0)
    } else {
      console.log('\n⚠️  Please fix the issues above and try again')
      process.exit(1)
    }
  })
  .catch((error) => {
    console.error('\n💥 Unexpected error:', error)
    process.exit(1)
  })
