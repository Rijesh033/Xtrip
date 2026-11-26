import { useMemo, useState } from 'react';
import { Compass, Plus, Search } from 'lucide-react';
import { getTripStatus } from '../../lib/constants';
import type { Expense, PlaceVisited, TravelMemory, Trip, TripStatus } from '../../types/xtrip';
import { TripCard } from './TripCard';

type SortOption = 'date_asc' | 'date_desc' | 'budget_desc' | 'name_asc';
type StatusFilter = 'All' | TripStatus;

interface TripsViewProps {
  trips: Trip[];
  expenses: Expense[];
  places: PlaceVisited[];
  memories: TravelMemory[];
  onNewTrip: () => void;
  onOpenTrip: (trip: Trip) => void;
  onEditTrip: (trip: Trip) => void;
  onDeleteTrip: (trip: Trip) => void;
}

export function TripsView({
  trips,
  expenses,
  places,
  memories,
  onNewTrip,
  onOpenTrip,
  onEditTrip,
  onDeleteTrip,
}: TripsViewProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [sortBy, setSortBy] = useState<SortOption>('date_asc');

  const spentByTrip = useMemo(() => {
    const map = new Map<string, number>();
    expenses.forEach((e) => map.set(e.tripId, (map.get(e.tripId) || 0) + e.amount));
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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = trips.filter((t) => {
      if (statusFilter !== 'All' && getTripStatus(t) !== statusFilter) return false;
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        t.destination.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-[var(--xt-text)]">All Trips</h1>
          <p className="text-sm text-[var(--xt-text-muted)]">
            {trips.length} {trips.length === 1 ? 'expedition' : 'expeditions'} planned and archived.
          </p>
        </div>
        <button
          type="button"
          onClick={onNewTrip}
          className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[var(--xt-gold)] text-[#081411] font-semibold text-sm inline-flex items-center justify-center gap-2 hover:opacity-90 cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          New Trip
        </button>
      </div>

      {trips.length > 0 ? (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[var(--xt-text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by trip name or destination..."
              aria-label="Search trips"
              className="w-full min-h-[44px] rounded-xl bg-[var(--xt-surface)] border border-[var(--xt-border)] pl-9 pr-3 text-sm text-[var(--xt-text)] focus:outline-none focus:border-[var(--xt-gold)]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-[var(--xt-surface)] border border-[var(--xt-border)]">
              {(['All', 'Upcoming', 'Active', 'Completed'] as StatusFilter[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap cursor-pointer ${
                    statusFilter === s
                      ? 'bg-[var(--xt-gold)] text-[#081411]'
                      : 'text-[var(--xt-text-muted)] hover:text-[var(--xt-text)]'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            <select
              aria-label="Sort trips"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="min-h-[42px] rounded-xl bg-[var(--xt-surface)] border border-[var(--xt-border)] px-3 text-xs font-medium text-[var(--xt-text)] focus:outline-none focus:border-[var(--xt-gold)]"
            >
              <option value="date_asc">Earliest Start</option>
              <option value="date_desc">Latest Start</option>
              <option value="budget_desc">Highest Budget</option>
              <option value="name_asc">Alphabetical</option>
            </select>
          </div>
        </div>
      ) : null}

      {trips.length === 0 ? (
        <div className="rounded-2xl bg-[var(--xt-surface)] border border-[var(--xt-border)] p-12 text-center space-y-4">
          <Compass className="w-10 h-10 text-[var(--xt-gold)] mx-auto" />
          <div className="space-y-1">
            <h2 className="font-display text-xl font-semibold text-[var(--xt-text)]">No trips yet</h2>
            <p className="text-sm text-[var(--xt-text-muted)]">
              Start by adding your next destination, travel dates, and budget.
            </p>
          </div>
          <button
            type="button"
            onClick={onNewTrip}
            className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[var(--xt-gold)] text-[#081411] font-semibold text-sm inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create Trip
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl bg-[var(--xt-surface)] border border-[var(--xt-border)] p-10 text-center space-y-3">
          <p className="text-sm text-[var(--xt-text-muted)]">No trips match your filters.</p>
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setStatusFilter('All');
            }}
            className="min-h-[40px] px-4 py-2 rounded-xl bg-[var(--xt-surface-2)] text-xs font-medium text-[var(--xt-gold)] cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((trip) => (
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
    </div>
  );
}
