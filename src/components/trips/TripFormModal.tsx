import React, { useEffect, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { CURRENCIES, getTodayIsoDate, PRESET_TRIP_COVERS } from '../../lib/constants';
import { createTrip, updateTrip } from '../../lib/db';
import type { CurrencyCode, Trip } from '../../types/xtrip';
import { ImageUploadField } from '../common/ImageUploadField';
import { SmartImage } from '../common/SmartImage';

interface TripFormModalProps {
  open: boolean;
  userId: string;
  defaultCurrency: CurrencyCode;
  editingTrip: Trip | null;
  onClose: () => void;
  onSaved: (message: string, createdId?: string) => void;
}

export function TripFormModal({
  open,
  userId,
  defaultCurrency,
  editingTrip,
  onClose,
  onSaved,
}: TripFormModalProps) {
  const [name, setName] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState(getTodayIsoDate());
  const [endDate, setEndDate] = useState(getTodayIsoDate());
  const [budget, setBudget] = useState('');
  const [currency, setCurrency] = useState<CurrencyCode>(defaultCurrency);
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState<string>(PRESET_TRIP_COVERS[0].url);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (editingTrip) {
      setName(editingTrip.name);
      setDestination(editingTrip.destination);
      setStartDate(editingTrip.startDate);
      setEndDate(editingTrip.endDate);
      setBudget(String(editingTrip.budget));
      setCurrency(editingTrip.currency);
      setDescription(editingTrip.description);
      setCoverImage(editingTrip.coverImage || PRESET_TRIP_COVERS[0].url);
    } else {
      const today = getTodayIsoDate();
      setName('');
      setDestination('');
      setStartDate(today);
      setEndDate(today);
      setBudget('');
      setCurrency(defaultCurrency);
      setDescription('');
      setCoverImage(PRESET_TRIP_COVERS[0].url);
    }
  }, [open, editingTrip, defaultCurrency]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please enter a trip name.');
      return;
    }
    if (!destination.trim()) {
      setError('Please enter a destination.');
      return;
    }
    if (!startDate || !endDate) {
      setError('Please select both start and end dates.');
      return;
    }
    if (endDate < startDate) {
      setError('End date cannot be earlier than the start date.');
      return;
    }
    const parsedBudget = Number(budget);
    if (budget.trim() === '' || Number.isNaN(parsedBudget) || parsedBudget < 0) {
      setError('Please enter a valid non-negative budget amount.');
      return;
    }

    setSaving(true);
    try {
      if (editingTrip) {
        await updateTrip(
          editingTrip.id,
          {
            name,
            destination,
            startDate,
            endDate,
            budget: parsedBudget,
            currency,
            description,
            coverImage,
          },
          editingTrip.coverImage
        );
        onSaved(`Updated "${name.trim()}".`);
      } else {
        const newId = await createTrip({
          userId,
          name,
          destination,
          startDate,
          endDate,
          budget: parsedBudget,
          currency,
          description,
          coverImage,
        });
        onSaved(`Created "${name.trim()}".`, newId);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save trip. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/65 backdrop-blur-sm p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="trip-modal-title"
    >
      <div className="w-full sm:max-w-xl max-h-[92dvh] flex flex-col rounded-t-3xl sm:rounded-2xl bg-[var(--xt-surface)] border border-[var(--xt-border)] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--xt-border)]">
          <h2 id="trip-modal-title" className="font-display text-xl font-semibold text-[var(--xt-text)]">
            {editingTrip ? 'Edit Trip' : 'Plan a New Trip'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close trip dialog"
            className="min-w-[40px] min-h-[40px] rounded-xl flex items-center justify-center text-[var(--xt-text-muted)] hover:text-[var(--xt-text)] hover:bg-[var(--xt-surface-2)] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto px-6 py-5 space-y-4">
          {error ? (
            <div className="rounded-xl bg-[#2a1416]/90 border border-[#D96B6B]/35 px-4 py-3 text-sm text-[#F4B4B4]">
              {error}
            </div>
          ) : null}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="trip-name" className="block text-sm font-medium text-[var(--xt-text)]">
                Trip Name
              </label>
              <input
                id="trip-name"
                type="text"
                maxLength={120}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Autumn in Patagonia"
                className="w-full min-h-[44px] rounded-xl bg-[var(--xt-bg)] border border-[var(--xt-border)] px-3.5 py-2 text-sm text-[var(--xt-text)] focus:outline-none focus:border-[var(--xt-gold)]"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="trip-dest" className="block text-sm font-medium text-[var(--xt-text)]">
                Destination
              </label>
              <input
                id="trip-dest"
                type="text"
                maxLength={120}
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="El Chaltén, Argentina"
                className="w-full min-h-[44px] rounded-xl bg-[var(--xt-bg)] border border-[var(--xt-border)] px-3.5 py-2 text-sm text-[var(--xt-text)] focus:outline-none focus:border-[var(--xt-gold)]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="trip-start" className="block text-sm font-medium text-[var(--xt-text)]">
                Start Date
              </label>
              <input
                id="trip-start"
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (endDate && e.target.value > endDate) {
                    setEndDate(e.target.value);
                  }
                }}
                className="w-full min-h-[44px] rounded-xl bg-[var(--xt-bg)] border border-[var(--xt-border)] px-3.5 py-2 text-sm text-[var(--xt-text)] focus:outline-none focus:border-[var(--xt-gold)]"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="trip-end" className="block text-sm font-medium text-[var(--xt-text)]">
                End Date
              </label>
              <input
                id="trip-end"
                type="date"
                min={startDate}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full min-h-[44px] rounded-xl bg-[var(--xt-bg)] border border-[var(--xt-border)] px-3.5 py-2 text-sm text-[var(--xt-text)] focus:outline-none focus:border-[var(--xt-gold)]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="trip-budget" className="block text-sm font-medium text-[var(--xt-text)]">
                Total Budget
              </label>
              <input
                id="trip-budget"
                type="number"
                step="0.01"
                min="0"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="3500"
                className="w-full min-h-[44px] rounded-xl bg-[var(--xt-bg)] border border-[var(--xt-border)] px-3.5 py-2 text-sm font-mono-num text-[var(--xt-text)] focus:outline-none focus:border-[var(--xt-gold)]"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="trip-currency" className="block text-sm font-medium text-[var(--xt-text)]">
                Currency
              </label>
              <select
                id="trip-currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className="w-full min-h-[44px] rounded-xl bg-[var(--xt-bg)] border border-[var(--xt-border)] px-3.5 py-2 text-sm text-[var(--xt-text)] focus:outline-none focus:border-[var(--xt-gold)]"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} ({c.symbol}) — {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="trip-desc" className="block text-sm font-medium text-[var(--xt-text)]">
              Description & Notes
            </label>
            <textarea
              id="trip-desc"
              rows={3}
              maxLength={2000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Outline key routes, stays, or packing reminders..."
              className="w-full rounded-xl bg-[var(--xt-bg)] border border-[var(--xt-border)] px-3.5 py-2.5 text-sm text-[var(--xt-text)] focus:outline-none focus:border-[var(--xt-gold)]"
            />
          </div>

          <div className="space-y-2.5">
            <p className="text-sm font-medium text-[var(--xt-text)]">Curated Scenic Covers</p>
            <div className="grid grid-cols-4 gap-2">
              {PRESET_TRIP_COVERS.map((preset) => {
                const selected = coverImage === preset.url;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setCoverImage(preset.url)}
                    className={`relative h-16 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                      selected ? 'border-[var(--xt-gold)] scale-[1.02]' : 'border-transparent opacity-75 hover:opacity-100'
                    }`}
                  >
                    <SmartImage src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                  </button>
                );
              })}
            </div>

            <ImageUploadField
              userId={userId}
              tripId={editingTrip?.id || ''}
              value={coverImage}
              onChange={setCoverImage}
              label="Or Upload Custom Cover Photo"
              aspectClass="h-36"
            />
          </div>

          <div className="pt-2 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-[var(--xt-border)] text-sm font-medium text-[var(--xt-text)] hover:bg-[var(--xt-surface-2)] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="min-h-[44px] px-6 py-2 rounded-xl bg-[var(--xt-gold)] text-[#081411] font-semibold text-sm inline-flex items-center justify-center gap-2 hover:opacity-90 cursor-pointer"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {editingTrip ? 'Save Changes' : 'Create Trip'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
