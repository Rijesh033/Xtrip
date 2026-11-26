import React, { useMemo, useState } from 'react';
import {
  ExternalLink,
  LayoutGrid,
  List,
  Loader2,
  MapPin,
  Navigation,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { formatDisplayDate, getTodayIsoDate } from '../../lib/constants';
import { createPlace, deletePlace, updatePlace } from '../../lib/db';
import type { PlaceVisited, Trip } from '../../types/xtrip';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { ImageUploadField } from '../common/ImageUploadField';
import { SmartImage } from '../common/SmartImage';

interface TripPlacesTabProps {
  trip: Trip;
  userId: string;
  places: PlaceVisited[];
  onNotify: (type: 'success' | 'error', text: string) => void;
}

function buildMapsUrl(place: PlaceVisited): string {
  if (place.latitude !== null && place.longitude !== null) {
    return `https://www.openstreetmap.org/?mlat=${place.latitude}&mlon=${place.longitude}#map=14/${place.latitude}/${place.longitude}`;
  }
  return `https://www.openstreetmap.org/search?query=${encodeURIComponent(`${place.name} ${place.location}`)}`;
}

export function TripPlacesTab({ trip, userId, places, onNotify }: TripPlacesTabProps) {
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlace, setEditingPlace] = useState<PlaceVisited | null>(null);
  const [deletingPlace, setDeletingPlace] = useState<PlaceVisited | null>(null);

  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [visitedDate, setVisitedDate] = useState(getTodayIsoDate());
  const [notes, setNotes] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [latInput, setLatInput] = useState('');
  const [lngInput, setLngInput] = useState('');
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = places.filter((p) => {
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q) ||
        p.notes.toLowerCase().includes(q)
      );
    });
    list.sort((a, b) =>
      sortOrder === 'newest'
        ? b.visitedDate.localeCompare(a.visitedDate)
        : a.visitedDate.localeCompare(b.visitedDate)
    );
    return list;
  }, [places, search, sortOrder]);

  const openCreate = () => {
    setEditingPlace(null);
    setName('');
    setLocation(trip.destination);
    setVisitedDate(getTodayIsoDate());
    setNotes('');
    setPhotoUrl('');
    setLatInput('');
    setLngInput('');
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (place: PlaceVisited) => {
    setEditingPlace(place);
    setName(place.name);
    setLocation(place.location);
    setVisitedDate(place.visitedDate);
    setNotes(place.notes);
    setPhotoUrl(place.photoUrl || '');
    setLatInput(place.latitude !== null ? String(place.latitude) : '');
    setLngInput(place.longitude !== null ? String(place.longitude) : '');
    setFormError(null);
    setModalOpen(true);
  };

  const handleUseCurrentGps = () => {
    if (!navigator.geolocation) {
      setFormError('Geolocation is not supported in this browser.');
      return;
    }
    setLocating(true);
    setFormError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatInput(pos.coords.latitude.toFixed(6));
        setLngInput(pos.coords.longitude.toFixed(6));
        setLocating(false);
      },
      () => {
        setFormError('Could not retrieve current coordinates. You can enter them manually.');
        setLocating(false);
      },
      { timeout: 8000 }
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('Please enter a place name.');
      return;
    }
    if (!location.trim()) {
      setFormError('Please enter a location.');
      return;
    }
    if (!visitedDate) {
      setFormError('Please pick the date visited.');
      return;
    }

    let latitude: number | null = null;
    let longitude: number | null = null;
    if (latInput.trim() !== '' || lngInput.trim() !== '') {
      const lat = Number(latInput);
      const lng = Number(lngInput);
      if (Number.isNaN(lat) || lat < -90 || lat > 90 || Number.isNaN(lng) || lng < -180 || lng > 180) {
        setFormError('Please enter valid coordinates (Latitude -90..90, Longitude -180..180) or leave both blank.');
        return;
      }
      latitude = lat;
      longitude = lng;
    }

    setSaving(true);
    try {
      if (editingPlace) {
        await updatePlace(
          editingPlace.id,
          { name, location, visitedDate, notes, photoUrl, latitude, longitude },
          editingPlace.photoUrl
        );
        onNotify('success', `Updated "${name.trim()}".`);
      } else {
        await createPlace({
          tripId: trip.id,
          userId,
          name,
          location,
          visitedDate,
          notes,
          photoUrl,
          latitude,
          longitude,
        });
        onNotify('success', `Saved "${name.trim()}".`);
      }
      setModalOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not save place.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingPlace) return;
    setDeleting(true);
    try {
      await deletePlace(deletingPlace);
      onNotify('success', `Removed "${deletingPlace.name}".`);
      setDeletingPlace(null);
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Could not delete place.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-1">
          {places.length > 0 ? (
            <>
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-[var(--xt-text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search places..."
                  aria-label="Search places"
                  className="w-full min-h-[42px] rounded-xl bg-[var(--xt-surface)] border border-[var(--xt-border)] pl-9 pr-3 text-sm text-[var(--xt-text)] focus:outline-none focus:border-[var(--xt-gold)]"
                />
              </div>

              <select
                aria-label="Sort places by date"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
                className="min-h-[42px] rounded-xl bg-[var(--xt-surface)] border border-[var(--xt-border)] px-3 text-xs font-medium text-[var(--xt-text)] focus:outline-none focus:border-[var(--xt-gold)]"
              >
                <option value="newest">Newest Visited</option>
                <option value="oldest">Oldest Visited</option>
              </select>

              <div className="inline-flex items-center p-1 rounded-xl bg-[var(--xt-surface)] border border-[var(--xt-border)]">
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  aria-label="Card view"
                  className={`p-2 rounded-lg cursor-pointer ${
                    viewMode === 'cards'
                      ? 'bg-[var(--xt-gold)] text-[#081411]'
                      : 'text-[var(--xt-text-muted)]'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  aria-label="List view"
                  className={`p-2 rounded-lg cursor-pointer ${
                    viewMode === 'list'
                      ? 'bg-[var(--xt-gold)] text-[#081411]'
                      : 'text-[var(--xt-text-muted)]'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : null}
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[var(--xt-gold)] text-[#081411] font-semibold text-sm inline-flex items-center justify-center gap-2 hover:opacity-90 cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Add Place
        </button>
      </div>

      {/* Places Content */}
      {places.length === 0 ? (
        <div className="rounded-2xl bg-[var(--xt-surface)] border border-[var(--xt-border)] p-10 text-center space-y-3">
          <MapPin className="w-9 h-9 text-[var(--xt-gold)] mx-auto" />
          <div className="space-y-1">
            <h3 className="font-display text-lg font-semibold text-[var(--xt-text)]">
              No places logged yet
            </h3>
            <p className="text-sm text-[var(--xt-text-muted)]">
              Record viewpoints, trails, cafes, and landmarks you visited during {trip.name}.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="min-h-[44px] px-5 py-2 rounded-xl bg-[var(--xt-gold)] text-[#081411] font-semibold text-sm inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add First Place
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl bg-[var(--xt-surface)] border border-[var(--xt-border)] p-8 text-center">
          <p className="text-sm text-[var(--xt-text-muted)]">No places match your search.</p>
        </div>
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((place) => (
            <article
              key={place.id}
              className="rounded-2xl bg-[var(--xt-surface)] border border-[var(--xt-border)] overflow-hidden flex flex-col"
            >
              <div className="relative h-44 w-full">
                <SmartImage
                  src={place.photoUrl}
                  alt={place.name}
                  fallbackLabel={place.location}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 right-3 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => openEdit(place)}
                    aria-label={`Edit ${place.name}`}
                    className="min-w-[36px] min-h-[36px] rounded-lg bg-[#081411]/75 backdrop-blur-md border border-white/15 text-[#F5F3EC] hover:text-[#C5A776] flex items-center justify-center cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingPlace(place)}
                    aria-label={`Delete ${place.name}`}
                    className="min-w-[36px] min-h-[36px] rounded-lg bg-[#081411]/75 backdrop-blur-md border border-white/15 text-[#F5F3EC] hover:text-[#D96B6B] flex items-center justify-center cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                <div className="space-y-1.5">
                  <p className="text-xs text-[var(--xt-text-muted)]">
                    {place.location} · {formatDisplayDate(place.visitedDate)}
                  </p>
                  <h4 className="font-display text-lg font-semibold text-[var(--xt-text)]">
                    {place.name}
                  </h4>
                  {place.notes ? (
                    <p className="text-sm text-[var(--xt-text-muted)] leading-relaxed line-clamp-3">
                      {place.notes}
                    </p>
                  ) : null}
                </div>

                <div className="pt-2 border-t border-[var(--xt-border)] flex items-center justify-between text-xs">
                  {place.latitude !== null && place.longitude !== null ? (
                    <span className="font-mono-num text-[var(--xt-text-muted)]">
                      {place.latitude.toFixed(4)}, {place.longitude.toFixed(4)}
                    </span>
                  ) : (
                    <span className="text-[var(--xt-text-muted)]">Map reference</span>
                  )}
                  <a
                    href={buildMapsUrl(place)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-medium text-[var(--xt-gold)] hover:underline"
                  >
                    View Map
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl bg-[var(--xt-surface)] border border-[var(--xt-border)] divide-y divide-[var(--xt-border)]">
          {filtered.map((place) => (
            <div key={place.id} className="p-4 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3.5 min-w-0">
                <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-[var(--xt-border)]">
                  <SmartImage
                    src={place.photoUrl}
                    alt={place.name}
                    fallbackLabel={place.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 space-y-1">
                  <h4 className="font-display text-base font-semibold text-[var(--xt-text)] truncate">
                    {place.name}
                  </h4>
                  <p className="text-xs text-[var(--xt-text-muted)]">
                    {place.location} · {formatDisplayDate(place.visitedDate)}
                  </p>
                  {place.notes ? (
                    <p className="text-xs text-[var(--xt-text-muted)] line-clamp-2">{place.notes}</p>
                  ) : null}
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <a
                  href={buildMapsUrl(place)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Open ${place.name} on map`}
                  className="min-w-[38px] min-h-[38px] rounded-lg text-[var(--xt-gold)] hover:bg-[var(--xt-surface-2)] flex items-center justify-center"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  type="button"
                  onClick={() => openEdit(place)}
                  aria-label={`Edit ${place.name}`}
                  className="min-w-[38px] min-h-[38px] rounded-lg text-[var(--xt-text-muted)] hover:text-[var(--xt-gold)] hover:bg-[var(--xt-surface-2)] flex items-center justify-center cursor-pointer"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeletingPlace(place)}
                  aria-label={`Delete ${place.name}`}
                  className="min-w-[38px] min-h-[38px] rounded-lg text-[var(--xt-text-muted)] hover:text-[var(--xt-danger)] hover:bg-[var(--xt-surface-2)] flex items-center justify-center cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Place Modal */}
      {modalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/65 backdrop-blur-sm p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full sm:max-w-lg max-h-[92dvh] flex flex-col rounded-t-3xl sm:rounded-2xl bg-[var(--xt-surface)] border border-[var(--xt-border)] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--xt-border)]">
              <h3 className="font-display text-xl font-semibold text-[var(--xt-text)]">
                {editingPlace ? 'Edit Place' : 'Add Place Visited'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="min-w-[40px] min-h-[40px] rounded-xl flex items-center justify-center text-[var(--xt-text-muted)] hover:text-[var(--xt-text)] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="overflow-y-auto px-6 py-5 space-y-4">
              {formError ? (
                <div className="rounded-xl bg-[#2a1416]/90 border border-[#D96B6B]/35 px-4 py-3 text-sm text-[#F4B4B4]">
                  {formError}
                </div>
              ) : null}

              <div className="space-y-1.5">
                <label htmlFor="plc-name" className="block text-sm font-medium text-[var(--xt-text)]">
                  Place Name
                </label>
                <input
                  id="plc-name"
                  type="text"
                  maxLength={120}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Laguna de los Tres"
                  className="w-full min-h-[44px] rounded-xl bg-[var(--xt-bg)] border border-[var(--xt-border)] px-3.5 py-2 text-sm text-[var(--xt-text)] focus:outline-none focus:border-[var(--xt-gold)]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="plc-loc" className="block text-sm font-medium text-[var(--xt-text)]">
                    Location
                  </label>
                  <input
                    id="plc-loc"
                    type="text"
                    maxLength={200}
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Los Glaciares National Park"
                    className="w-full min-h-[44px] rounded-xl bg-[var(--xt-bg)] border border-[var(--xt-border)] px-3.5 py-2 text-sm text-[var(--xt-text)] focus:outline-none focus:border-[var(--xt-gold)]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="plc-date" className="block text-sm font-medium text-[var(--xt-text)]">
                    Date Visited
                  </label>
                  <input
                    id="plc-date"
                    type="date"
                    value={visitedDate}
                    onChange={(e) => setVisitedDate(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl bg-[var(--xt-bg)] border border-[var(--xt-border)] px-3.5 py-2 text-sm text-[var(--xt-text)] focus:outline-none focus:border-[var(--xt-gold)]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="plc-notes" className="block text-sm font-medium text-[var(--xt-text)]">
                  Personal Notes
                </label>
                <textarea
                  id="plc-notes"
                  rows={3}
                  maxLength={2000}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Trail conditions, highlights, or recommendations..."
                  className="w-full rounded-xl bg-[var(--xt-bg)] border border-[var(--xt-border)] px-3.5 py-2 text-sm text-[var(--xt-text)] focus:outline-none focus:border-[var(--xt-gold)]"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[var(--xt-text)]">
                    Map Coordinates (Optional)
                  </span>
                  <button
                    type="button"
                    onClick={handleUseCurrentGps}
                    disabled={locating}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--xt-gold)] hover:underline cursor-pointer"
                  >
                    {locating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5" />}
                    Use Current GPS
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    step="any"
                    value={latInput}
                    onChange={(e) => setLatInput(e.target.value)}
                    placeholder="Latitude (-49.28)"
                    aria-label="Latitude"
                    className="w-full min-h-[42px] rounded-xl bg-[var(--xt-bg)] border border-[var(--xt-border)] px-3 text-sm font-mono-num text-[var(--xt-text)] focus:outline-none focus:border-[var(--xt-gold)]"
                  />
                  <input
                    type="number"
                    step="any"
                    value={lngInput}
                    onChange={(e) => setLngInput(e.target.value)}
                    placeholder="Longitude (-72.98)"
                    aria-label="Longitude"
                    className="w-full min-h-[42px] rounded-xl bg-[var(--xt-bg)] border border-[var(--xt-border)] px-3 text-sm font-mono-num text-[var(--xt-text)] focus:outline-none focus:border-[var(--xt-gold)]"
                  />
                </div>
              </div>

              <ImageUploadField
                userId={userId}
                tripId={trip.id}
                value={photoUrl}
                onChange={setPhotoUrl}
                label="Place Photo (Optional)"
                aspectClass="h-36"
              />

              <div className="pt-2 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={saving}
                  className="min-h-[44px] px-4 py-2 rounded-xl border border-[var(--xt-border)] text-sm font-medium text-[var(--xt-text)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="min-h-[44px] px-6 py-2 rounded-xl bg-[var(--xt-gold)] text-[#081411] font-semibold text-sm inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {editingPlace ? 'Save Place' : 'Add Place'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(deletingPlace)}
        title="Delete Place"
        message={
          deletingPlace
            ? `Remove "${deletingPlace.name}" from your places visited log?`
            : ''
        }
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeletingPlace(null)}
      />
    </div>
  );
}
