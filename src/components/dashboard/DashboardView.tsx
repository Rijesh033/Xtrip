import { useMemo, useState } from 'react';
import { Compass, Plus, Search, SlidersHorizontal } from 'lucide-react';
import { formatMoney, getTimeGreeting, getTripStatus } from '../../lib/constants';
import type { CurrencyCode, Expense, PlaceVisited, TravelMemory, Trip, TripStatus, UserProfile } from '../../types/xtrip';
import { RedPandaEmblem } from '../common/RedPandaEmblem';
import { TripCard } from '../trips/TripCard';

type SortOption = 'date_asc' | 'date_desc' | 'budget_desc' | 'name_asc';
type StatusFilter = 'All' | TripStatus;

interface DashboardViewProps {
  profile: UserProfile;
  trips: Trip[];
  expenses: Expense[];
  places: PlaceVisited[];
  memories: TravelMemory[];
  onNewTrip: () => void;
  onOpenTrip: (trip: Trip) => void;
  onEditTrip: (trip: Trip) => void;
  onDeleteTrip: (trip: Trip) => void;
}

function summarizeByCurrency(items: { currency: CurrencyCode; amount: number }[], preferred: CurrencyCode) {
  const totals = new Map<CurrencyCode, number>();
  for (const item of items) {
    totals.set(item.currency, (totals.get(item.currency) || 0) + item.amount);
  }
  if (totals.size === 0) {
    return { primary: formatMoney(0, preferred), secondary: '' };
  }
  const preferredTotal = totals.get(preferred);
  const entries = Array.from(totals.entries());
  const primaryEntry =
    preferredTotal !== undefined
      ? ([preferred, preferredTotal] as [CurrencyCode, number])
      : entries[0];
  const others = entries.filter(([code]) => code !== primaryEntry[0]);
  return {
    primary: formatMoney(primaryEntry[1], primaryEntry[0]),
    secondary: others.map(([code, val]) => formatMoney(val, code)).join(' · '),
  };
}

export function DashboardView({
  profile,
  trips,
  expenses,
  places,
  memories,
  onNewTrip,
  onOpenTrip,
  onEditTrip,
  onDeleteTrip,
}: DashboardViewProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [sortBy, setSortBy] = useState<SortOption>('date_asc');

  const tripById = useMemo(() => {
    const map = new Map<string, Trip>();
    trips.forEach((t) => map.set(t.id, t));
    return map;
  }, [trips]);

  const spentByTrip = useMemo(() => {
    const map = new Map<string, number>();
    expenses.forEach((exp) => {
      map.set(exp.tripId, (map.get(exp.tripId) || 0) + exp.amount);
    });
    return map;
  }, [expenses]);

  const placesByTrip = useMemo(() => {
    const map = new Map<string, number>();
    places.forEach((p) => map.set(p.tripId, (map.get(p.tripId) || 0) + 1));
    return map;
  }, [places]);

  const memoriesByTrip = useMemo(() => {
    const map = new Map<string, number>();
    memories.forEach((m) => map.set(m.tripId, (map.get(m.tripId) || 0) + 1));
    return map;
  }, [memories]);

  const stats = useMemo(() => {
    const upcomingCount = trips.filter((t) => getTripStatus(t) === 'Upcoming').length;
    const budgetSummary = summarizeByCurrency(
      trips.map((t) => ({ currency: t.currency, amount: t.budget })),
      profile.preferredCurrency
    );
    const expenseSummary = summarizeByCurrency(
      expenses
        .map((e) => {
          const trip = tripById.get(e.tripId);
          return trip ? { currency: trip.currency, amount: e.amount } : null;
        })
        .filter((x): x is { currency: CurrencyCode; amount: number } => x !== null),
      profile.preferredCurrency
    );
    return {
      totalTrips: trips.length,
      upcomingCount,
      budgetSummary,
      expenseSummary,
    };
  }, [trips, expenses, tripById, profile.preferredCurrency]);

  const filteredTrips = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = trips.filter((trip) => {
      const status = getTripStatus(trip);
      if (statusFilter !== 'All' && status !== statusFilter) return false;
      if (!q) return true;
      return (
        trip.name.toLowerCase().includes(q) ||
        trip.destination.toLowerCase().includes(q) ||
        trip.description.toLowerCase().includes(q)
      );
    });

    list.sort((a, b) => {
      switch (sortBy) {
        case 'date_desc':
          return b.startDate.localeCompare(a.startDate);
        case 'budget_desc':
          return b.budget - a.budget;
        case 'name_asc':
          return a.name.localeCompare(b.name);
        case 'date_asc':
        default:
          return a.startDate.localeCompare(b.startDate);
      }
    });

    return list;
  }, [trips, search, statusFilter, sortBy]);

  const firstName = profile.fullName.split(' ')[0] || 'Explorer';

  return (
    <div className="space-y-8">
      {/* Greeting Banner */}
      <section className="rounded-2xl bg-[var(--xt-surface)] border border-[var(--xt-border)] p-5 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <RedPandaEmblem size={52} className="shrink-0" />
          <div className="space-y-1">
            <p className="text-xs font-medium tracking-[0.14em] uppercase text-[var(--xt-gold)]">
              {getTimeGreeting()}
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[var(--xt-text)] [text-wrap:balance]">
              Ready for the trail, {firstName}
            </h1>
            <p className="text-sm text-[var(--xt-text-muted)]">
              Track expedition budgets, log places visited, and keep every memory in one place.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onNewTrip}
          className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[var(--xt-gold)] text-[#081411] font-semibold text-sm inline-flex items-center justify-center gap-2 hover:opacity-90 cursor-pointer whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          Plan New Trip
        </button>
      </section>

      {/* 4-column Statistics */}
      <section aria-label="Travel statistics" className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl bg-[var(--xt-surface)] border border-[var(--xt-border)] p-4 sm:p-5 space-y-1">
          <p className="text-xs text-[var(--xt-text-muted)]">Total Trips</p>
          <p className="font-mono-num text-2xl sm:text-3xl font-semibold text-[var(--xt-text)]">
            {stats.totalTrips}
          </p>
          <p className="text-xs text-[var(--xt-text-muted)]">
            {places.length} places · {memories.length} photos
          </p>
        </div>

        <div className="rounded-2xl bg-[var(--xt-surface)] border border-[var(--xt-border)] p-4 sm:p-5 space-y-1">
          <p className="text-xs text-[var(--xt-text-muted)]">Total Expenses</p>
          <p className="font-mono-num text-2xl sm:text-3xl font-semibold text-[var(--xt-text)] truncate">
            {stats.expenseSummary.primary}
          </p>
          <p className="text-xs text-[var(--xt-text-muted)] truncate">
            {stats.expenseSummary.secondary || `${expenses.length} recorded entries`}
          </p>
        </div>

        <div className="rounded-2xl bg-[var(--xt-surface)] border border-[var(--xt-border)] p-4 sm:p-5 space-y-1">
          <p className="text-xs text-[var(--xt-text-muted)]">Total Budget</p>
          <p className="font-mono-num text-2xl sm:text-3xl font-semibold text-[var(--xt-gold)] truncate">
            {stats.budgetSummary.primary}
          </p>
          <p className="text-xs text-[var(--xt-text-muted)] truncate">
            {stats.budgetSummary.secondary || `Default currency ${profile.preferredCurrency}`}
          </p>
        </div>

        <div className="rounded-2xl bg-[var(--xt-surface)] border border-[var(--xt-border)] p-4 sm:p-5 space-y-1">
          <p className="text-xs text-[var(--xt-text-muted)]">Upcoming Trips</p>
          <p className="font-mono-num text-2xl sm:text-3xl font-semibold text-[var(--xt-success)]">
            {stats.upcomingCount}
          </p>
          <p className="text-xs text-[var(--xt-text-muted)]">Scheduled departures</p>
        </div>
      </section>

      {/* Trips Section */}
      <section className="space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-semibold text-[var(--xt-text)]">
              Your Journeys
            </h2>
            <p className="text-sm text-[var(--xt-text-muted)]">
              Open any trip to manage expenses, places visited, and memories.
            </p>
          </div>

          {trips.length > 0 ? (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="relative flex-1 sm:w-56">
                <Search className="w-4 h-4 text-[var(--xt-text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search trips..."
                  aria-label="Search trips"
                  className="w-full min-h-[42px] rounded-xl bg-[var(--xt-surface)] border border-[var(--xt-border)] pl-9 pr-3 text-sm text-[var(--xt-text)] placeholder:text-[var(--xt-text-muted)]/60 focus:outline-none focus:border-[var(--xt-gold)]"
                />
              </div>

              <div className="flex items-center gap-2">
                <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-[var(--xt-surface)] border border-[var(--xt-border)] overflow-x-auto">
                  {(['All', 'Upcoming', 'Active', 'Completed'] as StatusFilter[]).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setStatusFilter(status)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                        statusFilter === status
                          ? 'bg-[var(--xt-gold)] text-[#081411]'
                          : 'text-[var(--xt-text-muted)] hover:text-[var(--xt-text)]'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-[var(--xt-text-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    aria-label="Sort trips"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="min-h-[42px] rounded-xl bg-[var(--xt-surface)] border border-[var(--xt-border)] pl-8 pr-3 text-xs font-medium text-[var(--xt-text)] focus:outline-none focus:border-[var(--xt-gold)]"
                  >
                    <option value="date_asc">Earliest First</option>
                    <option value="date_desc">Latest First</option>
                    <option value="budget_desc">Highest Budget</option>
                    <option value="name_asc">Name (A–Z)</option>
                  </select>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {trips.length === 0 ? (
          <div className="rounded-2xl bg-[var(--xt-surface)] border border-[var(--xt-border)] p-10 sm:p-14 text-center space-y-4">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-[var(--xt-surface-2)] flex items-center justify-center text-[var(--xt-gold)]">
              <Compass className="w-7 h-7" />
            </div>
            <div className="max-w-md mx-auto space-y-1.5">
              <h3 className="font-display text-xl font-semibold text-[var(--xt-text)]">
                Your expedition log is waiting
              </h3>
              <p className="text-sm text-[var(--xt-text-muted)] leading-relaxed">
                Create your first trip to set a budget, log daily expenses, bookmark places visited,
                and curate a personal photo journal.
              </p>
            </div>
            <button
              type="button"
              onClick={onNewTrip}
              className="min-h-[46px] px-6 py-2.5 rounded-xl bg-[var(--xt-gold)] text-[#081411] font-semibold text-sm inline-flex items-center gap-2 hover:opacity-90 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Create First Trip
            </button>
          </div>
        ) : filteredTrips.length === 0 ? (
          <div className="rounded-2xl bg-[var(--xt-surface)] border border-[var(--xt-border)] p-10 text-center space-y-3">
            <p className="text-sm font-medium text-[var(--xt-text)]">
              No trips match your current search or filter.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setStatusFilter('All');
              }}
              className="min-h-[40px] px-4 py-2 rounded-xl bg-[var(--xt-surface-2)] text-xs font-medium text-[var(--xt-gold)] hover:opacity-80 cursor-pointer"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTrips.map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip}
                spent={spentByTrip.get(trip.id) || 0}
                placesCount={placesByTrip.get(trip.id) || 0}
                memoriesCount={memoriesByTrip.get(trip.id) || 0}
                onOpen={onOpenTrip}
                onEdit={onEditTrip}
                onDelete={onDeleteTrip}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
