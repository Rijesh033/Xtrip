import { useMemo, useState } from 'react';
import { ArrowLeft, Calendar, MapPin, Pencil, Trash2 } from 'lucide-react';
import { formatDateRange, formatMoney, getTripStatus } from '../../lib/constants';
import type { Expense, PlaceVisited, TravelMemory, Trip, TripDetailTab } from '../../types/xtrip';
import { SmartImage } from '../common/SmartImage';
import { TripExpensesTab } from './TripExpensesTab';
import { TripMemoriesTab } from './TripMemoriesTab';
import { TripOverviewTab } from './TripOverviewTab';
import { TripPlacesTab } from './TripPlacesTab';

interface TripDetailViewProps {
  trip: Trip;
  userId: string;
  expenses: Expense[];
  places: PlaceVisited[];
  memories: TravelMemory[];
  onBack: () => void;
  onEditTrip: (trip: Trip) => void;
  onDeleteTrip: (trip: Trip) => void;
  onNotify: (type: 'success' | 'error', text: string) => void;
}

export function TripDetailView({
  trip,
  userId,
  expenses,
  places,
  memories,
  onBack,
  onEditTrip,
  onDeleteTrip,
  onNotify,
}: TripDetailViewProps) {
  const [activeTab, setActiveTab] = useState<TripDetailTab>('overview');

  const spent = useMemo(
    () => expenses.reduce((sum, e) => sum + e.amount, 0),
    [expenses]
  );
  const remaining = trip.budget - spent;
  const status = getTripStatus(trip);

  const tabs: { id: TripDetailTab; label: string; count?: number }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'expenses', label: 'Expenses', count: expenses.length },
    { id: 'places', label: 'Places', count: places.length },
    { id: 'memories', label: 'Memories', count: memories.length },
  ];

  return (
    <div className="space-y-6">
      {/* Cinematic Trip Header */}
      <section className="relative rounded-2xl overflow-hidden border border-[var(--xt-border)] bg-[var(--xt-surface)]">
        <div className="relative h-56 sm:h-72 w-full">
          <SmartImage
            src={trip.coverImage}
            alt={trip.name}
            fallbackLabel={trip.destination}
            className="w-full h-full object-cover"
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-[#081411] via-[#081411]/55 to-[#081411]/30"
            aria-hidden="true"
          />

          {/* Top Bar Actions */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onBack}
              className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#081411]/75 backdrop-blur-md border border-white/15 text-xs font-medium text-[#F5F3EC] hover:bg-[#081411] inline-flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onEditTrip(trip)}
                className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#081411]/75 backdrop-blur-md border border-white/15 text-xs font-medium text-[#F5F3EC] hover:text-[#C5A776] inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit
              </button>
              <button
                type="button"
                onClick={() => onDeleteTrip(trip)}
                aria-label="Delete trip"
                className="min-w-[40px] min-h-[40px] rounded-xl bg-[#081411]/75 backdrop-blur-md border border-white/15 text-[#F5F3EC] hover:text-[#D96B6B] inline-flex items-center justify-center cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Header Metadata Overlay */}
          <div className="absolute bottom-5 left-5 right-5 text-[#F5F3EC] space-y-1.5">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-[#D6DDD8]">
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#C5A776]" />
                {trip.destination}
              </span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#C5A776]" />
                {formatDateRange(trip.startDate, trip.endDate)}
              </span>
              <span aria-hidden="true">·</span>
              <span className="text-[#C5A776] font-medium">{status}</span>
            </div>
            <h1 className="font-display text-2xl sm:text-4xl font-semibold tracking-tight">
              {trip.name}
            </h1>
          </div>
        </div>

        {/* Budget Summary Strip + Navigation Tabs */}
        <div className="px-4 sm:px-6 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-t border-[var(--xt-border)]">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <div>
              <span className="text-xs text-[var(--xt-text-muted)] block">Budget</span>
              <span className="font-mono-num font-semibold text-[var(--xt-text)]">
                {formatMoney(trip.budget, trip.currency)}
              </span>
            </div>
            <div>
              <span className="text-xs text-[var(--xt-text-muted)] block">Spending</span>
              <span className="font-mono-num font-semibold text-[var(--xt-gold)]">
                {formatMoney(spent, trip.currency)}
              </span>
            </div>
            <div>
              <span className="text-xs text-[var(--xt-text-muted)] block">Remaining</span>
              <span
                className={`font-mono-num font-semibold ${
                  remaining < 0 ? 'text-[var(--xt-danger)]' : 'text-[var(--xt-success)]'
                }`}
              >
                {formatMoney(remaining, trip.currency)}
              </span>
            </div>
          </div>

          <div
            className="flex items-center gap-1 p-1 rounded-xl bg-[var(--xt-surface-2)] overflow-x-auto"
            role="tablist"
            aria-label="Trip sections"
          >
            {tabs.map((t) => {
              const active = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveTab(t.id)}
                  className={`min-h-[40px] px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    active
                      ? 'bg-[var(--xt-gold)] text-[#081411] font-semibold'
                      : 'text-[var(--xt-text-muted)] hover:text-[var(--xt-text)]'
                  }`}
                >
                  {t.label}
                  {t.count !== undefined ? ` (${t.count})` : ''}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Active Workspace Tab */}
      {activeTab === 'overview' && (
        <TripOverviewTab
          trip={trip}
          expenses={expenses}
          places={places}
          memories={memories}
          onSwitchTab={setActiveTab}
        />
      )}
      {activeTab === 'expenses' && (
        <TripExpensesTab
          trip={trip}
          userId={userId}
          expenses={expenses}
          onNotify={onNotify}
        />
      )}
      {activeTab === 'places' && (
        <TripPlacesTab
          trip={trip}
          userId={userId}
          places={places}
          onNotify={onNotify}
        />
      )}
      {activeTab === 'memories' && (
        <TripMemoriesTab
          trip={trip}
          userId={userId}
          memories={memories}
          onNotify={onNotify}
        />
      )}
    </div>
  );
}
