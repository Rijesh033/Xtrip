import { Calendar, MapPin, Pencil, Trash2, ArrowUpRight } from 'lucide-react';
import { formatDateRange, formatMoney, getTripStatus } from '../../lib/constants';
import type { Trip } from '../../types/xtrip';
import { SmartImage } from '../common/SmartImage';

interface TripCardProps {
  trip: Trip;
  spent: number;
  placesCount: number;
  memoriesCount: number;
  onOpen: (trip: Trip) => void;
  onEdit: (trip: Trip) => void;
  onDelete: (trip: Trip) => void;
}

export function TripCard({
  trip,
  spent,
  placesCount,
  memoriesCount,
  onOpen,
  onEdit,
  onDelete,
}: TripCardProps) {
  const status = getTripStatus(trip);
  const remaining = trip.budget - spent;
  const pct = trip.budget > 0 ? Math.min(100, Math.round((spent / trip.budget) * 100)) : 0;
  const overBudget = spent > trip.budget && trip.budget > 0;

  return (
    <article className="group rounded-2xl bg-[var(--xt-surface)] border border-[var(--xt-border)] overflow-hidden flex flex-col transition-transform duration-200 hover:-translate-y-0.5">
      {/* Cover media */}
      <div
        onClick={() => onOpen(trip)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onOpen(trip);
          }
        }}
        className="relative h-48 w-full overflow-hidden cursor-pointer focus:outline-none"
      >
        <SmartImage
          src={trip.coverImage}
          alt={trip.name}
          fallbackLabel={trip.destination}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-[#081411]/90 via-[#081411]/30 to-transparent"
          aria-hidden="true"
        />

        {/* Quick actions top-right */}
        <div
          className="absolute top-3 right-3 flex items-center gap-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => onEdit(trip)}
            aria-label={`Edit ${trip.name}`}
            className="min-w-[38px] min-h-[38px] rounded-lg bg-[#081411]/75 backdrop-blur-md border border-white/15 text-[#F5F3EC] hover:text-[#C5A776] flex items-center justify-center transition-colors cursor-pointer"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(trip)}
            aria-label={`Delete ${trip.name}`}
            className="min-w-[38px] min-h-[38px] rounded-lg bg-[#081411]/75 backdrop-blur-md border border-white/15 text-[#F5F3EC] hover:text-[#D96B6B] flex items-center justify-center transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Title overlay */}
        <div className="absolute bottom-3.5 left-4 right-4 text-[#F5F3EC]">
          <div className="flex items-center gap-2 text-xs text-[#D6DDD8] mb-1">
            <span className="inline-flex items-center gap-1 truncate">
              <MapPin className="w-3.5 h-3.5 text-[#C5A776] shrink-0" />
              <span className="truncate">{trip.destination}</span>
            </span>
            <span aria-hidden="true">·</span>
            <span
              className={
                status === 'Active'
                  ? 'text-[#6EC492] font-medium shrink-0'
                  : status === 'Upcoming'
                  ? 'text-[#C5A776] font-medium shrink-0'
                  : 'text-[#A8B3AC] shrink-0'
              }
            >
              {status}
            </span>
          </div>
          <h3 className="font-display text-xl font-semibold leading-snug truncate">
            {trip.name}
          </h3>
        </div>
      </div>

      {/* Card body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2 text-xs text-[var(--xt-text-muted)]">
            <span className="inline-flex items-center gap-1.5 truncate">
              <Calendar className="w-3.5 h-3.5 text-[var(--xt-gold)] shrink-0" />
              <span className="truncate">{formatDateRange(trip.startDate, trip.endDate)}</span>
            </span>
            <span className="shrink-0 tabular-nums">
              {placesCount} {placesCount === 1 ? 'place' : 'places'} · {memoriesCount}{' '}
              {memoriesCount === 1 ? 'photo' : 'photos'}
            </span>
          </div>

          {/* Budget metrics */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[var(--xt-border)]">
            <div>
              <p className="text-[11px] text-[var(--xt-text-muted)]">Budget</p>
              <p className="font-mono-num text-sm font-semibold text-[var(--xt-text)] truncate">
                {formatMoney(trip.budget, trip.currency)}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-[var(--xt-text-muted)]">Spent</p>
              <p className="font-mono-num text-sm font-semibold text-[var(--xt-text)] truncate">
                {formatMoney(spent, trip.currency)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-[var(--xt-text-muted)]">Remaining</p>
              <p
                className={`font-mono-num text-sm font-semibold truncate ${
                  overBudget ? 'text-[var(--xt-danger)]' : 'text-[var(--xt-success)]'
                }`}
              >
                {formatMoney(remaining, trip.currency)}
              </p>
            </div>
          </div>

          {/* Budget utilization bar */}
          <div className="space-y-1">
            <div className="h-1.5 w-full rounded-full bg-[var(--xt-surface-2)] overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  overBudget ? 'bg-[var(--xt-danger)]' : 'bg-[var(--xt-gold)]'
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onOpen(trip)}
          className="w-full min-h-[42px] rounded-xl bg-[var(--xt-surface-2)] hover:bg-[var(--xt-gold)] hover:text-[#081411] text-[var(--xt-text)] text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <span>Open Trip Workspace</span>
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>
    </article>
  );
}
