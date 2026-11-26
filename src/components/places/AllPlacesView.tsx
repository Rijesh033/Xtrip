import { useMemo, useState } from 'react';
import { ArrowUpRight, ExternalLink, LayoutGrid, List, MapPin, Search } from 'lucide-react';
import { formatDisplayDate } from '../../lib/constants';
import type { PlaceVisited, Trip } from '../../types/xtrip';
import { SmartImage } from '../common/SmartImage';

interface AllPlacesViewProps {
  places: PlaceVisited[];
  trips: Trip[];
  onOpenTrip: (trip: Trip) => void;
}

export function AllPlacesView({ places, trips, onOpenTrip }: AllPlacesViewProps) {
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');

  const tripById = useMemo(() => {
    const map = new Map<string, Trip>();
    trips.forEach((t) => map.set(t.id, t));
    return map;
  }, [trips]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = places.filter((p) => {
      if (!q) return true;
      const tripName = tripById.get(p.tripId)?.name || '';
      return (
        p.name.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q) ||
        p.notes.toLowerCase().includes(q) ||
        tripName.toLowerCase().includes(q)
      );
    });
    list.sort((a, b) =>
      sortOrder === 'newest'
        ? b.visitedDate.localeCompare(a.visitedDate)
        : a.visitedDate.localeCompare(b.visitedDate)
    );
    return list;
  }, [places, search, sortOrder, tripById]);

  const buildMapsUrl = (place: PlaceVisited) => {
    if (place.latitude !== null && place.longitude !== null) {
      return `https://www.openstreetmap.org/?mlat=${place.latitude}&mlon=${place.longitude}#map=14/${place.latitude}/${place.longitude}`;
    }
    return `https://www.openstreetmap.org/search?query=${encodeURIComponent(`${place.name} ${place.location}`)}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-[var(--xt-text)]">
            Places Visited
          </h1>
          <p className="text-sm text-[var(--xt-text-muted)]">
            Every landmark, trailhead, and waypoint across your trips.
          </p>
        </div>
      </div>

      {places.length > 0 ? (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[var(--xt-text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search places, locations, or trips..."
              aria-label="Search places"
              className="w-full min-h-[44px] rounded-xl bg-[var(--xt-surface)] border border-[var(--xt-border)] pl-9 pr-3 text-sm text-[var(--xt-text)] focus:outline-none focus:border-[var(--xt-gold)]"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              aria-label="Sort places"
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
          </div>
        </div>
      ) : null}

      {places.length === 0 ? (
        <div className="rounded-2xl bg-[var(--xt-surface)] border border-[var(--xt-border)] p-12 text-center space-y-3">
          <MapPin className="w-10 h-10 text-[var(--xt-gold)] mx-auto" />
          <h2 className="font-display text-xl font-semibold text-[var(--xt-text)]">
            No places logged yet
          </h2>
          <p className="text-sm text-[var(--xt-text-muted)] max-w-md mx-auto">
            Open any trip and visit its Places tab to record landmarks, coordinates, and personal notes.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl bg-[var(--xt-surface)] border border-[var(--xt-border)] p-8 text-center">
          <p className="text-sm text-[var(--xt-text-muted)]">No places match your search.</p>
        </div>
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((place) => {
            const parentTrip = tripById.get(place.tripId);
            return (
              <article
                key={place.id}
                className="rounded-2xl bg-[var(--xt-surface)] border border-[var(--xt-border)] overflow-hidden flex flex-col"
              >
                <div className="h-44 w-full">
                  <SmartImage
                    src={place.photoUrl}
                    alt={place.name}
                    fallbackLabel={place.location}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                  <div className="space-y-1.5">
                    <p className="text-xs text-[var(--xt-text-muted)]">
                      {place.location} · {formatDisplayDate(place.visitedDate)}
                    </p>
                    <h3 className="font-display text-lg font-semibold text-[var(--xt-text)]">
                      {place.name}
                    </h3>
                    {place.notes ? (
                      <p className="text-sm text-[var(--xt-text-muted)] line-clamp-2">{place.notes}</p>
                    ) : null}
                  </div>
                  <div className="pt-2.5 border-t border-[var(--xt-border)] flex items-center justify-between gap-2 text-xs">
                    {parentTrip ? (
                      <button
                        type="button"
                        onClick={() => onOpenTrip(parentTrip)}
                        className="inline-flex items-center gap-1 font-medium text-[var(--xt-text)] hover:text-[var(--xt-gold)] truncate cursor-pointer"
                      >
                        <span className="truncate">{parentTrip.name}</span>
                        <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                      </button>
                    ) : (
                      <span />
                    )}
                    <a
                      href={buildMapsUrl(place)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-medium text-[var(--xt-gold)] hover:underline shrink-0"
                    >
                      Map
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl bg-[var(--xt-surface)] border border-[var(--xt-border)] divide-y divide-[var(--xt-border)]">
          {filtered.map((place) => {
            const parentTrip = tripById.get(place.tripId);
            return (
              <div key={place.id} className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-[var(--xt-border)]">
                    <SmartImage
                      src={place.photoUrl}
                      alt={place.name}
                      fallbackLabel={place.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-display text-base font-semibold text-[var(--xt-text)] truncate">
                      {place.name}
                    </h3>
                    <p className="text-xs text-[var(--xt-text-muted)] truncate">
                      {place.location} · {formatDisplayDate(place.visitedDate)}
                      {parentTrip ? ` · ${parentTrip.name}` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {parentTrip ? (
                    <button
                      type="button"
                      onClick={() => onOpenTrip(parentTrip)}
                      className="min-h-[38px] px-3 rounded-lg bg-[var(--xt-surface-2)] text-xs font-medium text-[var(--xt-text)] hover:text-[var(--xt-gold)] cursor-pointer"
                    >
                      Open Trip
                    </button>
                  ) : null}
                  <a
                    href={buildMapsUrl(place)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`View ${place.name} on map`}
                    className="min-w-[38px] min-h-[38px] rounded-lg text-[var(--xt-gold)] hover:bg-[var(--xt-surface-2)] flex items-center justify-center"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
