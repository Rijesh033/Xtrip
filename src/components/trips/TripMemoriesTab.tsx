import React, { useState } from 'react';
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { formatDisplayDate, getTodayIsoDate } from '../../lib/constants';
import { createMemory, deleteMemory, updateMemory } from '../../lib/db';
import type { TravelMemory, Trip } from '../../types/xtrip';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { ImageUploadField } from '../common/ImageUploadField';
import { SmartImage } from '../common/SmartImage';

interface TripMemoriesTabProps {
  trip: Trip;
  userId: string;
  memories: TravelMemory[];
  onNotify: (type: 'success' | 'error', text: string) => void;
}

export function TripMemoriesTab({ trip, userId, memories, onNotify }: TripMemoriesTabProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMemory, setEditingMemory] = useState<TravelMemory | null>(null);
  const [deletingMemory, setDeletingMemory] = useState<TravelMemory | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const [photoUrl, setPhotoUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [memoryDate, setMemoryDate] = useState(getTodayIsoDate());
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const openCreate = () => {
    setEditingMemory(null);
    setPhotoUrl('');
    setCaption('');
    setMemoryDate(getTodayIsoDate());
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (mem: TravelMemory) => {
    setEditingMemory(mem);
    setPhotoUrl(mem.photoUrl);
    setCaption(mem.caption);
    setMemoryDate(mem.memoryDate);
    setFormError(null);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!photoUrl) {
      setFormError('Please upload a photo from your device.');
      return;
    }
    if (!memoryDate) {
      setFormError('Please select a date.');
      return;
    }

    setSaving(true);
    try {
      if (editingMemory) {
        await updateMemory(
          editingMemory.id,
          { photoUrl, caption, memoryDate },
          editingMemory.photoUrl
        );
        onNotify('success', 'Memory updated.');
      } else {
        await createMemory({
          tripId: trip.id,
          userId,
          photoUrl,
          caption,
          memoryDate,
        });
        onNotify('success', 'Memory added to your travel journal.');
      }
      setModalOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not save memory.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingMemory) return;
    setDeleting(true);
    try {
      await deleteMemory(deletingMemory);
      onNotify('success', 'Memory deleted.');
      setDeletingMemory(null);
      setLightboxIndex(null);
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Could not delete memory.');
    } finally {
      setDeleting(false);
    }
  };

  const currentLightbox = lightboxIndex !== null ? memories[lightboxIndex] : null;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="font-display text-lg font-semibold text-[var(--xt-text)]">
            Visual Travel Journal
          </h3>
          <p className="text-xs text-[var(--xt-text-muted)]">
            {memories.length} {memories.length === 1 ? 'memory' : 'memories'} preserved for {trip.name}
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[var(--xt-gold)] text-[#081411] font-semibold text-sm inline-flex items-center gap-2 hover:opacity-90 cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Add Memory
        </button>
      </div>

      {memories.length === 0 ? (
        <div className="rounded-2xl bg-[var(--xt-surface)] border border-[var(--xt-border)] p-10 text-center space-y-3">
          <Camera className="w-9 h-9 text-[var(--xt-gold)] mx-auto" />
          <div className="space-y-1">
            <h4 className="font-display text-lg font-semibold text-[var(--xt-text)]">
              Capture your journey
            </h4>
            <p className="text-sm text-[var(--xt-text-muted)]">
              Upload photos from your phone gallery and attach captions and dates.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="min-h-[44px] px-5 py-2 rounded-xl bg-[var(--xt-gold)] text-[#081411] font-semibold text-sm inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Upload First Photo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {memories.map((mem, idx) => (
            <article
              key={mem.id}
              className="group relative rounded-2xl overflow-hidden bg-[var(--xt-surface)] border border-[var(--xt-border)] flex flex-col"
            >
              <button
                type="button"
                onClick={() => setLightboxIndex(idx)}
                className="relative aspect-[4/5] w-full overflow-hidden cursor-pointer focus:outline-none"
              >
                <SmartImage
                  src={mem.photoUrl}
                  alt={mem.caption || `Travel photo ${idx + 1}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                />
                <div
                  className="absolute inset-0 bg-gradient-to-t from-[#081411]/90 via-transparent to-transparent"
                  aria-hidden="true"
                />
                <div className="absolute bottom-3 left-3 right-3 text-left text-[#F5F3EC]">
                  <p className="text-[11px] text-[#C5A776]">{formatDisplayDate(mem.memoryDate)}</p>
                  {mem.caption ? (
                    <p className="text-xs font-medium line-clamp-2 mt-0.5">{mem.caption}</p>
                  ) : null}
                </div>
              </button>

              <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => openEdit(mem)}
                  aria-label="Edit memory"
                  className="min-w-[34px] min-h-[34px] rounded-lg bg-[#081411]/75 backdrop-blur-md border border-white/15 text-[#F5F3EC] hover:text-[#C5A776] flex items-center justify-center cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeletingMemory(mem)}
                  aria-label="Delete memory"
                  className="min-w-[34px] min-h-[34px] rounded-lg bg-[#081411]/75 backdrop-blur-md border border-white/15 text-[#F5F3EC] hover:text-[#D96B6B] flex items-center justify-center cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Upload / Edit Modal */}
      {modalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/65 backdrop-blur-sm p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full sm:max-w-lg max-h-[92dvh] flex flex-col rounded-t-3xl sm:rounded-2xl bg-[var(--xt-surface)] border border-[var(--xt-border)] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--xt-border)]">
              <h3 className="font-display text-xl font-semibold text-[var(--xt-text)]">
                {editingMemory ? 'Edit Memory' : 'Add Travel Memory'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="min-w-[40px] min-h-[40px] rounded-xl flex items-center justify-center text-[var(--xt-text-muted)] cursor-pointer"
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

              <ImageUploadField
                userId={userId}
                tripId={trip.id}
                value={photoUrl}
                onChange={setPhotoUrl}
                label="Memory Photo"
                aspectClass="h-52"
              />

              <div className="space-y-1.5">
                <label htmlFor="mem-date" className="block text-sm font-medium text-[var(--xt-text)]">
                  Date
                </label>
                <input
                  id="mem-date"
                  type="date"
                  value={memoryDate}
                  onChange={(e) => setMemoryDate(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl bg-[var(--xt-bg)] border border-[var(--xt-border)] px-3.5 py-2 text-sm text-[var(--xt-text)] focus:outline-none focus:border-[var(--xt-gold)]"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="mem-cap" className="block text-sm font-medium text-[var(--xt-text)]">
                  Caption
                </label>
                <textarea
                  id="mem-cap"
                  rows={3}
                  maxLength={500}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Write the story behind this moment..."
                  className="w-full rounded-xl bg-[var(--xt-bg)] border border-[var(--xt-border)] px-3.5 py-2 text-sm text-[var(--xt-text)] focus:outline-none focus:border-[var(--xt-gold)]"
                />
              </div>

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
                  {editingMemory ? 'Save Memory' : 'Save Photo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Full-Screen Gallery Lightbox */}
      {currentLightbox && lightboxIndex !== null ? (
        <div
          className="fixed inset-0 z-50 bg-black/92 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6"
          onClick={() => setLightboxIndex(null)}
        >
          <div className="flex items-center justify-between text-[#F5F3EC]" onClick={(e) => e.stopPropagation()}>
            <div>
              <p className="text-xs text-[#C5A776]">{formatDisplayDate(currentLightbox.memoryDate)}</p>
              <p className="text-sm font-medium text-[#F5F3EC]">
                {trip.name} ({lightboxIndex + 1} / {memories.length})
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const target = currentLightbox;
                  setLightboxIndex(null);
                  openEdit(target);
                }}
                aria-label="Edit caption"
                className="min-w-[44px] min-h-[44px] rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-[#F5F3EC] cursor-pointer"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setDeletingMemory(currentLightbox)}
                aria-label="Delete memory"
                className="min-w-[44px] min-h-[44px] rounded-xl bg-white/10 hover:bg-[#B94A4A]/80 flex items-center justify-center text-[#F5F3EC] cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setLightboxIndex(null)}
                aria-label="Close full-screen photo"
                className="min-w-[44px] min-h-[44px] rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-[#F5F3EC] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div
            className="relative flex-1 flex items-center justify-center my-4 min-h-0"
            onClick={(e) => e.stopPropagation()}
          >
            {memories.length > 1 ? (
              <button
                type="button"
                onClick={() =>
                  setLightboxIndex((lightboxIndex - 1 + memories.length) % memories.length)
                }
                aria-label="Previous photo"
                className="absolute left-1 sm:left-3 z-10 min-w-[44px] min-h-[44px] rounded-full bg-black/60 border border-white/15 text-[#F5F3EC] flex items-center justify-center hover:bg-black/85 cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            ) : null}

            <SmartImage
              src={currentLightbox.photoUrl}
              alt={currentLightbox.caption || 'Memory photo'}
              className="max-h-[72dvh] max-w-full rounded-xl object-contain"
            />

            {memories.length > 1 ? (
              <button
                type="button"
                onClick={() => setLightboxIndex((lightboxIndex + 1) % memories.length)}
                aria-label="Next photo"
                className="absolute right-1 sm:right-3 z-10 min-w-[44px] min-h-[44px] rounded-full bg-black/60 border border-white/15 text-[#F5F3EC] flex items-center justify-center hover:bg-black/85 cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : null}
          </div>

          <div className="text-center max-w-2xl mx-auto" onClick={(e) => e.stopPropagation()}>
            <p className="text-sm sm:text-base text-[#F5F3EC] leading-relaxed">
              {currentLightbox.caption || 'Untitled moment'}
            </p>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(deletingMemory)}
        title="Delete Memory"
        message="Permanently delete this photo and caption from your travel journal?"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeletingMemory(null)}
      />
    </div>
  );
}
