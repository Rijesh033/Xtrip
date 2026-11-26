import { useMemo, useState } from 'react';
import { ArrowRight, Camera, MapPin, Receipt } from 'lucide-react';
import { CATEGORY_COLORS, EXPENSE_CATEGORIES, formatDisplayDate, formatMoney } from '../../lib/constants';
import type { Expense, ExpenseCategory, PlaceVisited, TravelMemory, Trip, TripDetailTab } from '../../types/xtrip';
import { SmartImage } from '../common/SmartImage';

interface TripOverviewTabProps {
  trip: Trip;
  expenses: Expense[];
  places: PlaceVisited[];
  memories: TravelMemory[];
  onSwitchTab: (tab: TripDetailTab) => void;
}

export function TripOverviewTab({
  trip,
  expenses,
  places,
  memories,
  onSwitchTab,
}: TripOverviewTabProps) {
  const [hoveredCat, setHoveredCat] = useState<ExpenseCategory | null>(null);

  const totalSpent = useMemo(
    () => expenses.reduce((sum, e) => sum + e.amount, 0),
    [expenses]
  );

  const remaining = trip.budget - totalSpent;
  const rawPct = trip.budget > 0 ? (totalSpent / trip.budget) * 100 : 0;
  const spentPct = Math.round(rawPct);
  const clampedPct = Math.min(100, Math.max(0, rawPct));
  const overBudget = totalSpent > trip.budget && trip.budget > 0;

  const categoryBreakdown = useMemo(() => {
    const map = new Map<ExpenseCategory, number>();
    EXPENSE_CATEGORIES.forEach((c) => map.set(c, 0));
    expenses.forEach((e) => {
      map.set(e.category, (map.get(e.category) || 0) + e.amount);
    });
    return EXPENSE_CATEGORIES.map((category) => {
      const amount = map.get(category) || 0;
      const share = totalSpent > 0 ? (amount / totalSpent) * 100 : 0;
      return {
        category,
        amount,
        share,
        color: CATEGORY_COLORS[category],
      };
    })
      .filter((item) => item.amount > 0)
      .sort((a, b) => b.amount - a.amount);
  }, [expenses, totalSpent]);

  const recentExpenses = useMemo(() => expenses.slice(0, 4), [expenses]);
  const recentPlaces = useMemo(() => places.slice(0, 4), [places]);
  const recentMemories = useMemo(() => memories.slice(0, 6), [memories]);

  // SVG Donut geometry
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  let cumulativeOffset = 0;

  const activeCategoryData = hoveredCat
    ? categoryBreakdown.find((c) => c.category === hoveredCat) || null
    : null;

  const maxComparison = Math.max(trip.budget, totalSpent, 1);

  return (
    <div className="space-y-6">
      {/* 4 Financial KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl bg-[var(--xt-surface)] border border-[var(--xt-border)] p-4 sm:p-5 space-y-1">
          <p className="text-xs text-[var(--xt-text-muted)]">Total Budget</p>
          <p className="font-mono-num text-xl sm:text-2xl font-semibold text-[var(--xt-text)] truncate">
            {formatMoney(trip.budget, trip.currency)}
          </p>
          <p className="text-xs text-[var(--xt-text-muted)]">{trip.currency} allocation</p>
        </div>

        <div className="rounded-2xl bg-[var(--xt-surface)] border border-[var(--xt-border)] p-4 sm:p-5 space-y-1">
          <p className="text-xs text-[var(--xt-text-muted)]">Total Expenses</p>
          <p className="font-mono-num text-xl sm:text-2xl font-semibold text-[var(--xt-gold)] truncate">
            {formatMoney(totalSpent, trip.currency)}
          </p>
          <p className="text-xs text-[var(--xt-text-muted)]">
            {expenses.length} {expenses.length === 1 ? 'expense' : 'expenses'}
          </p>
        </div>

        <div className="rounded-2xl bg-[var(--xt-surface)] border border-[var(--xt-border)] p-4 sm:p-5 space-y-1">
          <p className="text-xs text-[var(--xt-text-muted)]">Remaining Balance</p>
          <p
            className={`font-mono-num text-xl sm:text-2xl font-semibold truncate ${
              overBudget ? 'text-[var(--xt-danger)]' : 'text-[var(--xt-success)]'
            }`}
          >
            {formatMoney(remaining, trip.currency)}
          </p>
          <p className="text-xs text-[var(--xt-text-muted)]">
            {overBudget ? 'Over budget' : 'Available to spend'}
          </p>
        </div>

        <div className="rounded-2xl bg-[var(--xt-surface)] border border-[var(--xt-border)] p-4 sm:p-5 space-y-1">
          <p className="text-xs text-[var(--xt-text-muted)]">Budget Utilized</p>
          <p className="font-mono-num text-xl sm:text-2xl font-semibold text-[var(--xt-text)]">
            {trip.budget > 0 ? `${spentPct}%` : '—'}
          </p>
          <div className="h-1.5 w-full rounded-full bg-[var(--xt-surface-2)] overflow-hidden mt-2">
            <div
              className={`h-full rounded-full ${
                overBudget ? 'bg-[var(--xt-danger)]' : 'bg-[var(--xt-gold)]'
              }`}
              style={{ width: `${clampedPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Trip Description */}
      {trip.description ? (
        <div className="rounded-2xl bg-[var(--xt-surface)] border border-[var(--xt-border)] p-5">
          <h3 className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--xt-gold)] mb-2">
            Expedition Notes
          </h3>
          <p className="text-sm text-[var(--xt-text)] leading-relaxed whitespace-pre-line">
            {trip.description}
          </p>
        </div>
      ) : null}

      {/* Visual Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Expense Category Breakdown Chart */}
        <section className="rounded-2xl bg-[var(--xt-surface)] border border-[var(--xt-border)] p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="font-display text-lg font-semibold text-[var(--xt-text)]">
                Expense Breakdown
              </h3>
              <p className="text-xs text-[var(--xt-text-muted)]">
                Spending distribution by category
              </p>
            </div>
            <button
              type="button"
              onClick={() => onSwitchTab('expenses')}
              className="text-xs font-medium text-[var(--xt-gold)] hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              View all
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {categoryBreakdown.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <Receipt className="w-8 h-8 text-[var(--xt-text-muted)]/50 mx-auto" />
              <p className="text-sm text-[var(--xt-text-muted)]">
                Add expenses to see your category breakdown chart.
              </p>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="relative w-40 h-40 shrink-0 flex items-center justify-center">
                <svg viewBox="0 0 150 150" className="w-full h-full -rotate-90" aria-label="Expense category donut chart">
                  <circle
                    cx="75"
                    cy="75"
                    r={radius}
                    fill="none"
                    stroke="var(--xt-surface-2)"
                    strokeWidth="16"
                  />
                  {categoryBreakdown.map((seg) => {
                    const segLength = (seg.share / 100) * circumference;
                    const dashArray = `${segLength} ${circumference - segLength}`;
                    const dashOffset = -cumulativeOffset;
                    cumulativeOffset += segLength;
                    const isHovered = hoveredCat === seg.category;

                    return (
                      <circle
                        key={seg.category}
                        cx="75"
                        cy="75"
                        r={radius}
                        fill="none"
                        stroke={seg.color}
                        strokeWidth={isHovered ? 20 : 16}
                        strokeDasharray={dashArray}
                        strokeDashoffset={dashOffset}
                        className="transition-all duration-200 cursor-pointer"
                        onMouseEnter={() => setHoveredCat(seg.category)}
                        onMouseLeave={() => setHoveredCat(null)}
                      />
                    );
                  })}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-3">
                  <span className="text-[11px] text-[var(--xt-text-muted)] truncate max-w-full">
                    {activeCategoryData ? activeCategoryData.category : 'Total Spent'}
                  </span>
                  <span className="font-mono-num text-sm font-semibold text-[var(--xt-text)] truncate max-w-full">
                    {activeCategoryData
                      ? formatMoney(activeCategoryData.amount, trip.currency)
                      : formatMoney(totalSpent, trip.currency)}
                  </span>
                </div>
              </div>

              <div className="flex-1 w-full space-y-2.5">
                {categoryBreakdown.map((item) => (
                  <div
                    key={item.category}
                    onMouseEnter={() => setHoveredCat(item.category)}
                    onMouseLeave={() => setHoveredCat(null)}
                    className="space-y-1 cursor-default"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="inline-flex items-center gap-2 font-medium text-[var(--xt-text)]">
                        <span
                          className="w-2.5 h-2.5 rounded-sm shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        {item.category}
                      </span>
                      <span className="font-mono-num text-[var(--xt-text-muted)]">
                        {formatMoney(item.amount, trip.currency)} ({Math.round(item.share)}%)
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-[var(--xt-surface-2)] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${item.share}%`, backgroundColor: item.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Budget vs Spent Chart */}
        <section className="rounded-2xl bg-[var(--xt-surface)] border border-[var(--xt-border)] p-5 sm:p-6 flex flex-col justify-between space-y-5">
          <div>
            <h3 className="font-display text-lg font-semibold text-[var(--xt-text)]">
              Budget vs Spent
            </h3>
            <p className="text-xs text-[var(--xt-text-muted)]">
              Real-time pacing against planned trip budget
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-[var(--xt-text)]">Planned Budget</span>
                <span className="font-mono-num font-semibold text-[var(--xt-text)]">
                  {formatMoney(trip.budget, trip.currency)}
                </span>
              </div>
              <div className="h-7 w-full rounded-lg bg-[var(--xt-surface-2)] overflow-hidden p-1">
                <div
                  className="h-full rounded-md bg-[#4D9B78] transition-all duration-300"
                  style={{ width: `${(trip.budget / maxComparison) * 100}%` }}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-[var(--xt-text)]">Actual Expenses</span>
                <span
                  className={`font-mono-num font-semibold ${
                    overBudget ? 'text-[var(--xt-danger)]' : 'text-[var(--xt-gold)]'
                  }`}
                >
                  {formatMoney(totalSpent, trip.currency)}
                </span>
              </div>
              <div className="h-7 w-full rounded-lg bg-[var(--xt-surface-2)] overflow-hidden p-1">
                <div
                  className={`h-full rounded-md transition-all duration-300 ${
                    overBudget ? 'bg-[var(--xt-danger)]' : 'bg-[var(--xt-gold)]'
                  }`}
                  style={{ width: `${(totalSpent / maxComparison) * 100}%` }}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-[var(--xt-text)]">
                  {overBudget ? 'Over Budget By' : 'Remaining Balance'}
                </span>
                <span
                  className={`font-mono-num font-semibold ${
                    overBudget ? 'text-[var(--xt-danger)]' : 'text-[var(--xt-success)]'
                  }`}
                >
                  {formatMoney(Math.abs(remaining), trip.currency)}
                </span>
              </div>
              <div className="h-7 w-full rounded-lg bg-[var(--xt-surface-2)] overflow-hidden p-1">
                <div
                  className={`h-full rounded-md transition-all duration-300 ${
                    overBudget ? 'bg-[var(--xt-danger)]/60' : 'bg-[#6EC492]/70'
                  }`}
                  style={{ width: `${(Math.abs(remaining) / maxComparison) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[var(--xt-border)] flex items-center justify-between text-xs text-[var(--xt-text-muted)]">
            <span>
              {places.length} {places.length === 1 ? 'place visited' : 'places visited'}
            </span>
            <span>
              {memories.length} {memories.length === 1 ? 'memory saved' : 'memories saved'}
            </span>
          </div>
        </section>
      </div>

      {/* Recent Activity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Expenses */}
        <section className="rounded-2xl bg-[var(--xt-surface)] border border-[var(--xt-border)] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold text-[var(--xt-text)]">
              Recent Expenses
            </h3>
            <button
              type="button"
              onClick={() => onSwitchTab('expenses')}
              className="text-xs font-medium text-[var(--xt-gold)] hover:underline cursor-pointer"
            >
              Manage
            </button>
          </div>
          {recentExpenses.length === 0 ? (
            <p className="text-sm text-[var(--xt-text-muted)] py-4">No expenses logged yet.</p>
          ) : (
            <ul className="divide-y divide-[var(--xt-border)]">
              {recentExpenses.map((exp) => (
                <li key={exp.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--xt-text)] truncate">{exp.title}</p>
                    <p className="text-xs text-[var(--xt-text-muted)] truncate">
                      {exp.category} · {formatDisplayDate(exp.expenseDate)}
                    </p>
                  </div>
                  <span className="font-mono-num text-sm font-semibold text-[var(--xt-text)] shrink-0">
                    {formatMoney(exp.amount, trip.currency)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Places Visited Preview */}
        <section className="rounded-2xl bg-[var(--xt-surface)] border border-[var(--xt-border)] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold text-[var(--xt-text)]">
              Places Visited
            </h3>
            <button
              type="button"
              onClick={() => onSwitchTab('places')}
              className="text-xs font-medium text-[var(--xt-gold)] hover:underline cursor-pointer"
            >
              View ({places.length})
            </button>
          </div>
          {recentPlaces.length === 0 ? (
            <p className="text-sm text-[var(--xt-text-muted)] py-4">No places added yet.</p>
          ) : (
            <ul className="divide-y divide-[var(--xt-border)]">
              {recentPlaces.map((place) => (
                <li key={place.id} className="py-2.5 flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-[var(--xt-gold)] shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[var(--xt-text)] truncate">{place.name}</p>
                    <p className="text-xs text-[var(--xt-text-muted)] truncate">
                      {place.location} · {formatDisplayDate(place.visitedDate)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Memories Preview */}
        <section className="rounded-2xl bg-[var(--xt-surface)] border border-[var(--xt-border)] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold text-[var(--xt-text)]">
              Travel Memories
            </h3>
            <button
              type="button"
              onClick={() => onSwitchTab('memories')}
              className="text-xs font-medium text-[var(--xt-gold)] hover:underline cursor-pointer"
            >
              Gallery ({memories.length})
            </button>
          </div>
          {recentMemories.length === 0 ? (
            <div className="py-4 flex items-center gap-2.5 text-sm text-[var(--xt-text-muted)]">
              <Camera className="w-4 h-4 shrink-0" />
              <span>No photos captured for this trip yet.</span>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {recentMemories.map((mem) => (
                <button
                  key={mem.id}
                  type="button"
                  onClick={() => onSwitchTab('memories')}
                  className="aspect-square rounded-xl overflow-hidden border border-[var(--xt-border)] cursor-pointer hover:opacity-90"
                >
                  <SmartImage
                    src={mem.photoUrl}
                    alt={mem.caption || 'Trip memory'}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
