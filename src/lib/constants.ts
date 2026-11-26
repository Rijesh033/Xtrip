import type { CurrencyCode, ExpenseCategory, Trip, TripStatus } from '../types/xtrip';

export interface CurrencyMeta {
  code: CurrencyCode;
  symbol: string;
  label: string;
  locale: string;
}

export const CURRENCIES: CurrencyMeta[] = [
  { code: 'USD', symbol: '$', label: 'US Dollar', locale: 'en-US' },
  { code: 'INR', symbol: '₹', label: 'Indian Rupee', locale: 'en-IN' },
  { code: 'EUR', symbol: '€', label: 'Euro', locale: 'de-DE' },
  { code: 'GBP', symbol: '£', label: 'British Pound', locale: 'en-GB' },
  { code: 'AED', symbol: 'AED', label: 'UAE Dirham', locale: 'en-AE' },
  { code: 'JPY', symbol: '¥', label: 'Japanese Yen', locale: 'ja-JP' },
  { code: 'AUD', symbol: 'A$', label: 'Australian Dollar', locale: 'en-AU' },
  { code: 'CAD', symbol: 'C$', label: 'Canadian Dollar', locale: 'en-CA' },
  { code: 'CHF', symbol: 'CHF', label: 'Swiss Franc', locale: 'de-CH' },
  { code: 'SGD', symbol: 'S$', label: 'Singapore Dollar', locale: 'en-SG' },
];

export const CURRENCY_MAP: Record<CurrencyCode, CurrencyMeta> = CURRENCIES.reduce(
  (acc, item) => {
    acc[item.code] = item;
    return acc;
  },
  {} as Record<CurrencyCode, CurrencyMeta>
);

export function formatMoney(amount: number, currency: CurrencyCode): string {
  const meta = CURRENCY_MAP[currency] || CURRENCY_MAP.USD;
  const fractionDigits = currency === 'JPY' ? 0 : 2;
  try {
    return new Intl.NumberFormat(meta.locale, {
      style: 'currency',
      currency: meta.code,
      minimumFractionDigits: amount % 1 === 0 ? 0 : fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(amount);
  } catch {
    return `${meta.symbol}${amount.toLocaleString(undefined, {
      minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    })}`;
  }
}

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Food',
  'Accommodation',
  'Transport',
  'Shopping',
  'Activities',
  'Places',
  'Other',
];

export const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  Food: '#C5A776',
  Accommodation: '#4D9B78',
  Transport: '#7CA89C',
  Shopping: '#D69F6E',
  Activities: '#86B87F',
  Places: '#A5B8A9',
  Other: '#76827B',
};

export const WELCOME_HERO_IMAGE = '/src/assets/images/welcome_expedition_hero_1795712347188.jpg';

export interface PresetCover {
  id: string;
  label: string;
  url: string;
}

export const PRESET_TRIP_COVERS: PresetCover[] = [
  {
    id: 'patagonia',
    label: 'Patagonia Peaks',
    url: '/src/assets/images/trip_cover_patagonia_1795712347357.jpg',
  },
  {
    id: 'kyoto',
    label: 'Kyoto Bamboo',
    url: '/src/assets/images/trip_cover_kyoto_1795712350377.jpg',
  },
  {
    id: 'iceland',
    label: 'Iceland Coast',
    url: '/src/assets/images/trip_cover_iceland_1795712348995.jpg',
  },
  {
    id: 'dolomites',
    label: 'Dolomites Ridge',
    url: '/src/assets/images/trip_cover_dolomites_1795712350525.jpg',
  },
];

export function getTodayIsoDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getTripStatus(trip: Pick<Trip, 'startDate' | 'endDate'>): TripStatus {
  const today = getTodayIsoDate();
  if (today < trip.startDate) return 'Upcoming';
  if (today > trip.endDate) return 'Completed';
  return 'Active';
}

export function formatDisplayDate(isoDate: string): string {
  if (!isoDate) return '';
  const parts = isoDate.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return isoDate;
  const date = new Date(parts[0], parts[1] - 1, parts[2]);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateRange(startDate: string, endDate: string): string {
  if (!startDate || !endDate) return '';
  const s = startDate.split('-').map(Number);
  const e = endDate.split('-').map(Number);
  if (s.length !== 3 || e.length !== 3) return `${startDate} – ${endDate}`;
  const sd = new Date(s[0], s[1] - 1, s[2]);
  const ed = new Date(e[0], e[1] - 1, e[2]);
  if (s[0] === e[0]) {
    const startStr = sd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endStr = ed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${startStr} – ${endStr}`;
  }
  return `${formatDisplayDate(startDate)} – ${formatDisplayDate(endDate)}`;
}

export function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}
