import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { AuthFlow } from './components/auth/AuthFlow';
import { ConfirmDialog } from './components/common/ConfirmDialog';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { RedPandaEmblem } from './components/common/RedPandaEmblem';
import { ToastBanner, type ToastMessage } from './components/common/Toast';
import { DashboardView } from './components/dashboard/DashboardView';
import { AppShell } from './components/layout/AppShell';
import { AllPlacesView } from './components/places/AllPlacesView';
import { SettingsView } from './components/settings/SettingsView';
import { TripDetailView } from './components/trips/TripDetailView';
import { TripFormModal } from './components/trips/TripFormModal';
import { TripsView } from './components/trips/TripsView';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import {
  deleteTripCascade,
  subscribeUserExpenses,
  subscribeUserMemories,
  subscribeUserPlaces,
  subscribeUserTrips,
} from './lib/db';
import type { AppTab, Expense, PlaceVisited, TravelMemory, Trip } from './types/xtrip';

function AuthenticatedWorkspace() {
  const { user, profile, profileReady } = useAuth();
  const [activeTab, setActiveTab] = useState<AppTab>('home');
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);

  const [trips, setTrips] = useState<Trip[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [places, setPlaces] = useState<PlaceVisited[]>([]);
  const [memories, setMemories] = useState<TravelMemory[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const [tripModalOpen, setTripModalOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [deletingTrip, setDeletingTrip] = useState<Trip | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const notify = useCallback((type: 'success' | 'error', text: string) => {
    setToast({ id: Date.now(), type, text });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4200);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!user) return;
    setDataLoading(true);
    let tripsLoaded = false;

    const unsubTrips = subscribeUserTrips(
      user.uid,
      (list) => {
        setTrips(list);
        tripsLoaded = true;
        setDataLoading(false);
      },
      (err) => {
        notify('error', err.message || 'Could not load trips.');
        setDataLoading(false);
      }
    );

    const unsubExpenses = subscribeUserExpenses(
      user.uid,
      (list) => setExpenses(list),
      (err) => notify('error', err.message || 'Could not load expenses.')
    );

    const unsubPlaces = subscribeUserPlaces(
      user.uid,
      (list) => setPlaces(list),
      (err) => notify('error', err.message || 'Could not load places.')
    );

    const unsubMemories = subscribeUserMemories(
      user.uid,
      (list) => setMemories(list),
      (err) => notify('error', err.message || 'Could not load memories.')
    );

    const fallbackTimer = setTimeout(() => {
      if (!tripsLoaded) setDataLoading(false);
    }, 5000);

    return () => {
      clearTimeout(fallbackTimer);
      unsubTrips();
      unsubExpenses();
      unsubPlaces();
      unsubMemories();
    };
  }, [user, notify]);

  const selectedTrip = useMemo(
    () => (selectedTripId ? trips.find((t) => t.id === selectedTripId) || null : null),
    [selectedTripId, trips]
  );

  const tripExpenses = useMemo(
    () => (selectedTrip ? expenses.filter((e) => e.tripId === selectedTrip.id) : []),
    [selectedTrip, expenses]
  );
  const tripPlaces = useMemo(
    () => (selectedTrip ? places.filter((p) => p.tripId === selectedTrip.id) : []),
    [selectedTrip, places]
  );
  const tripMemories = useMemo(
    () => (selectedTrip ? memories.filter((m) => m.tripId === selectedTrip.id) : []),
    [selectedTrip, memories]
  );

  const handleOpenCreateTrip = () => {
    setEditingTrip(null);
    setTripModalOpen(true);
  };

  const handleOpenEditTrip = (trip: Trip) => {
    setEditingTrip(trip);
    setTripModalOpen(true);
  };

  const handleOpenTrip = (trip: Trip) => {
    setSelectedTripId(trip.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectTab = (tab: AppTab) => {
    setSelectedTripId(null);
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleConfirmDeleteTrip = async () => {
    if (!deletingTrip || !user) return;
    setDeleting(true);
    try {
      await deleteTripCascade(user.uid, deletingTrip);
      if (selectedTripId === deletingTrip.id) {
        setSelectedTripId(null);
      }
      notify('success', `Deleted "${deletingTrip.name}".`);
      setDeletingTrip(null);
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Failed to delete trip.');
    } finally {
      setDeleting(false);
    }
  };

  if (!user || !profileReady || !profile) {
    return (
      <div className="min-h-dvh bg-[var(--xt-bg)] flex flex-col items-center justify-center gap-3 text-[var(--xt-text)]">
        <RedPandaEmblem size={44} />
        <Loader2 className="w-5 h-5 animate-spin text-[var(--xt-gold)]" />
        <p className="text-sm text-[var(--xt-text-muted)]">Preparing your travel workspace...</p>
      </div>
    );
  }

  return (
    <ThemeProvider initialPreference={profile.themePreference}>
      <AppShell
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        onNewTrip={handleOpenCreateTrip}
      >
        {dataLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-[var(--xt-gold)]" />
            <p className="text-sm text-[var(--xt-text-muted)]">Syncing your trips...</p>
          </div>
        ) : selectedTrip ? (
          <TripDetailView
            trip={selectedTrip}
            userId={user.uid}
            expenses={tripExpenses}
            places={tripPlaces}
            memories={tripMemories}
            onBack={() => setSelectedTripId(null)}
            onEditTrip={handleOpenEditTrip}
            onDeleteTrip={(t) => setDeletingTrip(t)}
            onNotify={notify}
          />
        ) : activeTab === 'home' ? (
          <DashboardView
            profile={profile}
            trips={trips}
            expenses={expenses}
            places={places}
            memories={memories}
            onNewTrip={handleOpenCreateTrip}
            onOpenTrip={handleOpenTrip}
            onEditTrip={handleOpenEditTrip}
            onDeleteTrip={(t) => setDeletingTrip(t)}
          />
        ) : activeTab === 'trips' ? (
          <TripsView
            trips={trips}
            expenses={expenses}
            places={places}
            memories={memories}
            onNewTrip={handleOpenCreateTrip}
            onOpenTrip={handleOpenTrip}
            onEditTrip={handleOpenEditTrip}
            onDeleteTrip={(t) => setDeletingTrip(t)}
          />
        ) : activeTab === 'places' ? (
          <AllPlacesView places={places} trips={trips} onOpenTrip={handleOpenTrip} />
        ) : (
          <SettingsView profile={profile} onNotify={notify} />
        )}

        <TripFormModal
          open={tripModalOpen}
          userId={user.uid}
          defaultCurrency={profile.preferredCurrency}
          editingTrip={editingTrip}
          onClose={() => setTripModalOpen(false)}
          onSaved={(msg, createdId) => {
            notify('success', msg);
            if (createdId) {
              setSelectedTripId(createdId);
            }
          }}
        />

        <ConfirmDialog
          open={Boolean(deletingTrip)}
          title="Delete Trip"
          message={
            deletingTrip
              ? `Delete "${deletingTrip.name}" along with all of its expenses, places visited, and memories? This cannot be undone.`
              : ''
          }
          loading={deleting}
          onConfirm={handleConfirmDeleteTrip}
          onCancel={() => setDeletingTrip(null)}
        />

        <ToastBanner toast={toast} onDismiss={() => setToast(null)} />
      </AppShell>
    </ThemeProvider>
  );
}

function RootRouter() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-dvh bg-[#081411] flex flex-col items-center justify-center gap-3 text-[#F5F3EC]">
        <RedPandaEmblem size={48} />
        <Loader2 className="w-5 h-5 animate-spin text-[#C5A776]" />
      </div>
    );
  }

  if (!user) {
    return <AuthFlow />;
  }

  return <AuthenticatedWorkspace />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider initialPreference="dark">
          <RootRouter />
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
