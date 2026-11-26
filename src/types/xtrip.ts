export type CurrencyCode =
  | 'INR'
  | 'USD'
  | 'EUR'
  | 'GBP'
  | 'AED'
  | 'JPY'
  | 'AUD'
  | 'CAD'
  | 'CHF'
  | 'SGD';

export type ThemePreference = 'dark' | 'light' | 'system';

export type ExpenseCategory =
  | 'Food'
  | 'Accommodation'
  | 'Transport'
  | 'Shopping'
  | 'Activities'
  | 'Places'
  | 'Other';

export type TripStatus = 'Upcoming' | 'Active' | 'Completed';

export interface UserProfile {
  uid: string;
  fullName: string;
  email: string;
  avatarUrl: string;
  preferredCurrency: CurrencyCode;
  themePreference: ThemePreference;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Trip {
  id: string;
  userId: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  budget: number;
  currency: CurrencyCode;
  description: string;
  coverImage: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Expense {
  id: string;
  tripId: string;
  userId: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  expenseDate: string;
  notes: string;
  receiptImage: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface PlaceVisited {
  id: string;
  tripId: string;
  userId: string;
  name: string;
  location: string;
  visitedDate: string;
  notes: string;
  photoUrl: string;
  latitude: number | null;
  longitude: number | null;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface TravelMemory {
  id: string;
  tripId: string;
  userId: string;
  photoUrl: string;
  caption: string;
  memoryDate: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export type AppTab = 'home' | 'trips' | 'places' | 'settings';
export type TripDetailTab = 'overview' | 'expenses' | 'places' | 'memories';
