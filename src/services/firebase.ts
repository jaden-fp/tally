import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';
import type { Habit, NewHabit, Entry } from '../types';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
const db = getFirestore(app);

// --- Habits ---

export async function getHabits(userId: string): Promise<Habit[]> {
  const q = query(
    collection(db, 'habits'),
    where('userId', '==', userId),
  );
  const snapshot = await getDocs(q);
  const habits = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Habit));
  // Sort client-side by order (asc), then createdAt (asc) as fallback
  return habits.sort((a, b) => {
    if (a.order !== undefined && b.order !== undefined) return a.order - b.order;
    if (a.order !== undefined) return -1;
    if (b.order !== undefined) return 1;
    return a.createdAt.localeCompare(b.createdAt);
  });
}

function stripUndefined<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined),
  ) as Partial<T>;
}

export async function createHabit(habit: NewHabit): Promise<Habit> {
  const createdAt = new Date().toISOString();
  const ref = await addDoc(collection(db, 'habits'), stripUndefined({
    ...habit,
    createdAt,
  }));
  return { id: ref.id, ...habit, createdAt };
}

export async function updateHabit(
  id: string,
  updates: Partial<Habit>,
): Promise<void> {
  await updateDoc(doc(db, 'habits', id), stripUndefined(updates) as Record<string, unknown>);
}

export async function deleteHabit(id: string): Promise<void> {
  await deleteDoc(doc(db, 'habits', id));
}

// --- Entries ---

export async function getEntries(
  habitId: string,
  year: number,
): Promise<Entry[]> {
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;

  const q = query(
    collection(db, 'entries'),
    where('habitId', '==', habitId),
    where('date', '>=', startDate),
    where('date', '<=', endDate),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Entry));
}

export async function setEntry(
  habitId: string,
  date: string,
  count: number,
): Promise<void> {
  // Use a deterministic document ID so upserts are idempotent
  const entryId = `${habitId}_${date}`;
  await setDoc(
    doc(db, 'entries', entryId),
    { habitId, date, count },
    { merge: true },
  );
}
