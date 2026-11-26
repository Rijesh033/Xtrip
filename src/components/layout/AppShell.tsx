import React from 'react';
import { Compass, Home, MapPin, Plus, Settings } from 'lucide-react';
import type { AppTab } from '../../types/xtrip';
import { RedPandaEmblem } from '../common/RedPandaEmblem';

interface AppShellProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  onNewTrip: () => void;
  children: React.ReactNode;
}

const NAV_ITEMS: { id: AppTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'trips', label: 'Trips', icon: Compass },
  { id: 'places', label: 'Places', icon: MapPin },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function AppShell({ activeTab, onSelectTab, onNewTrip, children }: AppShellProps) {
  return (
    <div className="min-h-dvh bg-[var(--xt-bg)] text-[var(--xt-text)] flex flex-col">
      {/* Desktop & Mobile Top Navigation */}
      <header className="sticky top-0 z-30 h-14 md:h-16 bg-[var(--xt-bg)]/90 backdrop-blur-md border-b border-[var(--xt-border)]">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-8">
          {/* Zone 1: Brand Wordmark */}
          <button
            type="button"
            onClick={() => onSelectTab('home')}
            className="inline-flex items-center gap-2.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RedPandaEmblem size={30} />
            <span className="font-display text-lg font-semibold tracking-tight text-[var(--xt-text)]">
              XTRIP
            </span>
          </button>

          {/* Zone 2: Desktop Single-Line Nav Links */}
          <nav className="hidden md:flex items-center gap-7" aria-label="Primary navigation">
            {NAV_ITEMS.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  className={`relative py-2 text-sm font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    active
                      ? 'text-[var(--xt-text)]'
                      : 'text-[var(--xt-text-muted)] hover:text-[var(--xt-text)]'
                  }`}
                >
                  {item.label}
                  {active ? (
                    <span
                      className="absolute left-0 right-0 -bottom-[1px] h-[2px] bg-[var(--xt-gold)] rounded-full"
                      aria-hidden="true"
                    />
                  ) : null}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Primary CTA */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={onNewTrip}
              className="min-h-[40px] px-4 py-2 rounded-xl bg-[var(--xt-gold)] text-[#081411] text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>New Trip</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 pt-5 sm:pt-8 pb-24 md:pb-12">
        {children}
      </main>

      {/* Mobile Fixed Bottom Tab Bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 pb-safe bg-[var(--xt-surface)]/95 backdrop-blur-md border-t border-[var(--xt-border)]"
        aria-label="Mobile navigation"
      >
        <div className="grid grid-cols-4 h-full">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer ${
                  active ? 'text-[var(--xt-gold)]' : 'text-[var(--xt-text-muted)]'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[11px] font-medium tracking-tight">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
