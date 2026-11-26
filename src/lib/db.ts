import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { deleteMediaAsset } from './storage';
import type {
  CurrencyCode,
  Expense,
  ExpenseCategory,
  PlaceVisited,
  ThemePreference,
  TravelMemory,
  Trip,
  UserProfile,
} from '../types/xtrip';

function generateId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}_${rand}`;
}

export function subscribeUserProfile(
  uid: string,
  onData: (profile: UserProfile | null) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = `profiles/${uid}`;
  return onSnapshot(
    doc(db, 'profiles', uid),
    (snap) => {
      if (!snap.exists()) {
        onData(null);
        return;
      }
      onData(snap.data() as UserProfile);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, path);
      } catch (wrapped) {
        onError?.(wrapped as Error);
      }
    }
  );
}

export async function createUserProfile(input: {
  uid: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  preferredCurrency?: CurrencyCode;
  themePreference?: ThemePreference;
}): Promise<void> {
  const path = `profiles/${input.uid}`;
  const cleanName = input.fullName.trim().slice(0, 100) || 'Explorer';
  const cleanEmail = input.email.trim().slice(0, 254);
  try {
    await setDoc(doc(db, 'profiles', input.uid), {
      uid: input.uid,
      fullName: cleanName,
      email: cleanEmail,
      avatarUrl: (input.avatarUrl || '').slice(0, 500),
      preferredCurrency: input.preferredCurrency || 'USD',
      themePreference: input.themePreference || 'dark',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateUserProfileDoc(
  uid: string,
  updates: {
    fullName: string;
    email: string;
    avatarUrl: string;
    preferredCurrency: CurrencyCode;
    themePreference: ThemePreference;
  }
): Promise<void> {
  const path = `profiles/${uid}`;
  try {
    await updateDoc(doc(db, 'profiles', uid), {
      fullName: updates.fullName.trim().slice(0, 100) || 'Explorer',
      email: updates.email.trim().slice(0, 254),
      avatarUrl: updates.avatarUrl.slice(0, 500),
      preferredCurrency: updates.preferredCurrency,
      themePreference: updates.themePreference,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export function subscribeUserTrips(
  userId: string,
  onData: (trips: Trip[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(collection(db, 'trips'), where('userId', '==', userId));
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Trip);
      items.sort((a, b) => a.startDate.localeCompare(b.startDate));
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'trips');
      } catch (wrapped) {
        onError?.(wrapped as Error);
      }
    }
  );
}

export function subscribeUserExpenses(
  userId: string,
  onData: (expenses: Expense[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(collection(db, 'expenses'), where('userId', '==', userId));
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Expense);
      items.sort((a, b) => b.expenseDate.localeCompare(a.expenseDate));
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'expenses');
      } catch (wrapped) {
        onError?.(wrapped as Error);
      }
    }
  );
}

export function subscribeUserPlaces(
  userId: string,
  onData: (places: PlaceVisited[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(collection(db, 'places'), where('userId', '==', userId));
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as PlaceVisited);
      items.sort((a, b) => b.visitedDate.localeCompare(a.visitedDate));
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'places');
      } catch (wrapped) {
        onError?.(wrapped as Error);
      }
    }
  );
}

export function subscribeUserMemories(
  userId: string,
  onData: (memories: TravelMemory[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(collection(db, 'memories'), where('userId', '==', userId));
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as TravelMemory);
      items.sort((a, b) => b.memoryDate.localeCompare(a.memoryDate));
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'memories');
      } catch (wrapped) {
        onError?.(wrapped as Error);
      }
    }
  );
}

export async function createTrip(input: {
  userId: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  budget: number;
  currency: CurrencyCode;
  description: string;
  coverImage: string;
}): Promise<string> {
  const tripId = generateId('trp');
  const path = `trips/${tripId}`;
  try {
    await setDoc(doc(db, 'trips', tripId), {
      userId: input.userId,
      name: input.name.trim().slice(0, 120),
      destination: input.destination.trim().slice(0, 120),
      startDate: input.startDate,
      endDate: input.endDate,
      budget: Number(input.budget),
      currency: input.currency,
      description: input.description.trim().slice(0, 2000),
      coverImage: input.coverImage.slice(0, 500),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return tripId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateTrip(
  tripId: string,
  updates: {
    name: string;
    destination: string;
    startDate: string;
    endDate: string;
    budget: number;
    currency: CurrencyCode;
    description: string;
    coverImage: string;
  },
  previousCoverImage?: string
): Promise<void> {
  const path = `trips/${tripId}`;
  try {
    await updateDoc(doc(db, 'trips', tripId), {
      name: updates.name.trim().slice(0, 120),
      destination: updates.destination.trim().slice(0, 120),
      startDate: updates.startDate,
      endDate: updates.endDate,
      budget: Number(updates.budget),
      currency: updates.currency,
      description: updates.description.trim().slice(0, 2000),
      coverImage: updates.coverImage.slice(0, 500),
      updatedAt: serverTimestamp(),
    });
    if (previousCoverImage && previousCoverImage !== updates.coverImage) {
      await deleteMediaAsset(previousCoverImage);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteTripCascade(userId: string, trip: Trip): Promise<void> {
  const tripPath = `trips/${trip.id}`;
  try {
    const [expSnap, plcSnap, memSnap] = await Promise.all([
      getDocs(query(collection(db, 'expenses'), where('userId', '==', userId), where('tripId', '==', trip.id))),
      getDocs(query(collection(db, 'places'), where('userId', '==', userId), where('tripId', '==', trip.id))),
      getDocs(query(collection(db, 'memories'), where('userId', '==', userId), where('tripId', '==', trip.id))),
    ]);

    const mediaRefs: string[] = [];
    if (trip.coverImage) mediaRefs.push(trip.coverImage);

    const refsToDelete = [];
    for (const d of expSnap.docs) {
      const rec = d.data().receiptImage as string | undefined;
      if (rec) mediaRefs.push(rec);
      refsToDelete.push(d.ref);
    }
    for (const d of plcSnap.docs) {
      const photo = d.data().photoUrl as string | undefined;
      if (photo) mediaRefs.push(photo);
      refsToDelete.push(d.ref);
    }
    for (const d of memSnap.docs) {
      const photo = d.data().photoUrl as string | undefined;
      if (photo) mediaRefs.push(photo);
      refsToDelete.push(d.ref);
    }
    refsToDelete.push(doc(db, 'trips', trip.id));

    const chunkSize = 400;
    for (let i = 0; i < refsToDelete.length; i += chunkSize) {
      const batch = writeBatch(db);
      refsToDelete.slice(i, i + chunkSize).forEach((r) => batch.delete(r));
      await batch.commit();
    }

    await Promise.all(mediaRefs.map((ref) => deleteMediaAsset(ref)));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, tripPath);
  }
}

export async function createExpense(input: {
  tripId: string;
  userId: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  expenseDate: string;
  notes: string;
  receiptImage: string;
}): Promise<string> {
  const expenseId = generateId('exp');
  const path = `expenses/${expenseId}`;
  try {
    await setDoc(doc(db, 'expenses', expenseId), {
      tripId: input.tripId,
      userId: input.userId,
      title: input.title.trim().slice(0, 120),
      amount: Number(input.amount),
      category: input.category,
      expenseDate: input.expenseDate,
      notes: input.notes.trim().slice(0, 1000),
      receiptImage: input.receiptImage.slice(0, 500),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return expenseId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateExpense(
  expenseId: string,
  updates: {
    title: string;
    amount: number;
    category: ExpenseCategory;
    expenseDate: string;
    notes: string;
    receiptImage: string;
  },
  previousReceipt?: string
): Promise<void> {
  const path = `expenses/${expenseId}`;
  try {
    await updateDoc(doc(db, 'expenses', expenseId), {
      title: updates.title.trim().slice(0, 120),
      amount: Number(updates.amount),
      category: updates.category,
      expenseDate: updates.expenseDate,
      notes: updates.notes.trim().slice(0, 1000),
      receiptImage: updates.receiptImage.slice(0, 500),
      updatedAt: serverTimestamp(),
    });
    if (previousReceipt && previousReceipt !== updates.receiptImage) {
      await deleteMediaAsset(previousReceipt);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteExpense(expense: Expense): Promise<void> {
  const path = `expenses/${expense.id}`;
  try {
    await deleteDoc(doc(db, 'expenses', expense.id));
    if (expense.receiptImage) {
      await deleteMediaAsset(expense.receiptImage);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function createPlace(input: {
  tripId: string;
  userId: string;
  name: string;
  location: string;
  visitedDate: string;
  notes: string;
  photoUrl: string;
  latitude: number | null;
  longitude: number | null;
}): Promise<string> {
  const placeId = generateId('plc');
  const path = `places/${placeId}`;
  try {
    await setDoc(doc(db, 'places', placeId), {
      tripId: input.tripId,
      userId: input.userId,
      name: input.name.trim().slice(0, 120),
      location: input.location.trim().slice(0, 200),
      visitedDate: input.visitedDate,
      notes: input.notes.trim().slice(0, 2000),
      photoUrl: input.photoUrl.slice(0, 500),
      latitude: input.latitude,
      longitude: input.longitude,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return placeId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updatePlace(
  placeId: string,
  updates: {
    name: string;
    location: string;
    visitedDate: string;
    notes: string;
    photoUrl: string;
    latitude: number | null;
    longitude: number | null;
  },
  previousPhoto?: string
): Promise<void> {
  const path = `places/${placeId}`;
  try {
    await updateDoc(doc(db, 'places', placeId), {
      name: updates.name.trim().slice(0, 120),
      location: updates.location.trim().slice(0, 200),
      visitedDate: updates.visitedDate,
      notes: updates.notes.trim().slice(0, 2000),
      photoUrl: updates.photoUrl.slice(0, 500),
      latitude: updates.latitude,
      longitude: updates.longitude,
      updatedAt: serverTimestamp(),
    });
    if (previousPhoto && previousPhoto !== updates.photoUrl) {
      await deleteMediaAsset(previousPhoto);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deletePlace(place: PlaceVisited): Promise<void> {
  const path = `places/${place.id}`;
  try {
    await deleteDoc(doc(db, 'places', place.id));
    if (place.photoUrl) {
      await deleteMediaAsset(place.photoUrl);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function createMemory(input: {
  tripId: string;
  userId: string;
  photoUrl: string;
  caption: string;
  memoryDate: string;
}): Promise<string> {
  const memoryId = generateId('mem');
  const path = `memories/${memoryId}`;
  try {
    await setDoc(doc(db, 'memories', memoryId), {
      tripId: input.tripId,
      userId: input.userId,
      photoUrl: input.photoUrl.slice(0, 500),
      caption: input.caption.trim().slice(0, 500),
      memoryDate: input.memoryDate,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return memoryId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateMemory(
  memoryId: string,
  updates: {
    photoUrl: string;
    caption: string;
    memoryDate: string;
  },
  previousPhoto?: string
): Promise<void> {
  const path = `memories/${memoryId}`;
  try {
    await updateDoc(doc(db, 'memories', memoryId), {
      photoUrl: updates.photoUrl.slice(0, 500),
      caption: updates.caption.trim().slice(0, 500),
      memoryDate: updates.memoryDate,
      updatedAt: serverTimestamp(),
    });
    if (previousPhoto && previousPhoto !== updates.photoUrl) {
      await deleteMediaAsset(previousPhoto);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteMemory(memory: TravelMemory): Promise<void> {
  const path = `memories/${memory.id}`;
  try {
    await deleteDoc(doc(db, 'memories', memory.id));
    if (memory.photoUrl) {
      await deleteMediaAsset(memory.photoUrl);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function deleteAllUserData(uid: string): Promise<void> {
  const collectionsToPurge = ['memories', 'places', 'expenses', 'trips', 'media'];
  try {
    for (const colName of collectionsToPurge) {
      const snap = await getDocs(query(collection(db, colName), where('userId', '==', uid)));
      const docs = snap.docs;
      for (let i = 0; i < docs.length; i += 400) {
        const batch = writeBatch(db);
        docs.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
        await batch.commit();
      }
    }
    await deleteDoc(doc(db, 'profiles', uid));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `profiles/${uid}`);
  }
}
