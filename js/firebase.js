// ══════════════════════════════════════════════════════════════
//  VisionCheck — firebase.js
//  Handles all Firebase Firestore operations
//  Setup guide: https://firebase.google.com
// ══════════════════════════════════════════════════════════════


const firebaseConfig = {
  apiKey: "AIzaSyBureWNhFiGsVcV3n6I0OoH6T8yd119EM4",
  authDomain: "visioncheck-69fb4.firebaseapp.com",
  projectId: "visioncheck-69fb4",
  storageBucket: "visioncheck-69fb4.firebasestorage.app",
  messagingSenderId: "1042198685870",
  appId: "1:1042198685870:web:c15488cc7124d74948653f",
  measurementId: "G-CTX5LVHBQ2"
};

// ── STEP 2: Initialize Firebase ────────────────────────────────
import { initializeApp }                        from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, addDoc,
         getDocs, query, orderBy, limit,
         doc, getDoc, serverTimestamp }          from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

// ── CHECK IF FIREBASE IS CONFIGURED ───────────────────────────
function isConfigured() {
  return firebaseConfig.apiKey !== "YOUR_API_KEY";
}


// ══════════════════════════════════════════════════════════════
//  SAVE RESULTS
//  Call this from results.html after all 4 tests are done.
//  Reads from localStorage and saves to Firestore.
// ══════════════════════════════════════════════════════════════

/**
 * Saves all 4 test results to Firebase Firestore.
 * Returns the saved document ID on success, null on failure.
 */
export async function saveResults() {
  if (!isConfigured()) {
    console.warn("VisionCheck: Firebase not configured. Skipping save.");
    return null;
  }

  // Pull results from localStorage
  const acuity = JSON.parse(localStorage.getItem('acuityScore') || 'null');
  const color  = JSON.parse(localStorage.getItem('colorScore')  || 'null');
  const astig  = JSON.parse(localStorage.getItem('astigScore')  || 'null');
  const quiz   = JSON.parse(localStorage.getItem('quizScore')   || 'null');

  // Don't save if no tests completed
  if (!acuity && !color && !astig && !quiz) {
    console.warn("VisionCheck: No test results found in localStorage.");
    return null;
  }

  // Build the document to save
  const resultDoc = {
    timestamp: serverTimestamp(),
    testsCompleted: [acuity, color, astig, quiz].filter(Boolean).length,

    acuity: acuity ? {
      rating:     acuity.rating     || null,
      percentage: acuity.percentage || null,
      testDate:   acuity.testDate   || null,
    } : null,

    color: color ? {
      status:  color.status  || null,
      correct: color.correct || 0,
      wrong:   color.wrong   || 0,
      pct:     color.pct     || 0,
    } : null,

    astigmatism: astig ? {
      detected: astig.detected || false,
      status:   astig.status   || null,
      eye1:     astig.eye1     || null,
      eye2:     astig.eye2     || null,
      overall:  astig.overall  || null,
    } : null,

    eyeStrain: quiz ? {
      level: quiz.level || null,
      score: quiz.score || 0,
      pct:   quiz.pct   || 0,
    } : null,
  };

  try {
    const docRef = await addDoc(collection(db, "results"), resultDoc);
    console.log("VisionCheck: Results saved with ID:", docRef.id);
    // Store the doc ID so we can retrieve it later
    localStorage.setItem('visioncheck_doc_id', docRef.id);
    return docRef.id;
  } catch (err) {
    console.error("VisionCheck: Error saving results:", err);
    return null;
  }
}


// ══════════════════════════════════════════════════════════════
//  GET SINGLE RESULT
//  Fetch one result document by its Firestore document ID.
// ══════════════════════════════════════════════════════════════

/**
 * Fetches a single result document by ID.
 * @param {string} docId - Firestore document ID
 * @returns {Object|null} The result data or null if not found
 */
export async function getResultById(docId) {
  if (!isConfigured()) return null;

  try {
    const docRef  = doc(db, "results", docId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      console.warn("VisionCheck: No document found with ID:", docId);
      return null;
    }
  } catch (err) {
    console.error("VisionCheck: Error fetching result:", err);
    return null;
  }
}


// ══════════════════════════════════════════════════════════════
//  GET RECENT RESULTS
//  Fetch the last N results (useful for a leaderboard/history).
// ══════════════════════════════════════════════════════════════

/**
 * Fetches the most recent results from Firestore.
 * @param {number} count - How many results to fetch (default 10)
 * @returns {Array} Array of result objects
 */
export async function getRecentResults(count = 10) {
  if (!isConfigured()) return [];

  try {
    const q = query(
      collection(db, "results"),
      orderBy("timestamp", "desc"),
      limit(count)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error("VisionCheck: Error fetching recent results:", err);
    return [];
  }
}


// ══════════════════════════════════════════════════════════════
//  AUTO-SAVE HOOK
//  Call this once on results.html page load.
//  Saves automatically if all 4 tests are done.
// ══════════════════════════════════════════════════════════════

/**
 * Auto-saves results to Firebase when results.html loads.
 * Shows a small status indicator on the page.
 * @param {string} statusElementId - ID of element to show save status
 */
export async function autoSave(statusElementId = null) {
  const acuity = localStorage.getItem('acuityScore');
  const color  = localStorage.getItem('colorScore');
  const astig  = localStorage.getItem('astigScore');
  const quiz   = localStorage.getItem('quizScore');

  const allDone = acuity && color && astig && quiz;

  const setStatus = (msg, color) => {
    if (!statusElementId) return;
    const el = document.getElementById(statusElementId);
    if (el) { el.textContent = msg; el.style.color = color; }
  };

  if (!allDone) {
    setStatus("⚠️ Complete all 4 tests to save to database.", "#ffc107");
    return;
  }

  // Don't save twice (check if already saved this session)
  const existingId = localStorage.getItem('visioncheck_doc_id');
  if (existingId) {
    setStatus("✓ Already saved to database.", "var(--accent)");
    return;
  }

  setStatus("Saving to database...", "var(--text-dim)");

  const docId = await saveResults();

  if (docId) {
    setStatus("✓ Results saved successfully.", "var(--accent)");
  } else {
    setStatus("Could not save to database — check Firebase config.", "#ff6b6b");
  }
}
