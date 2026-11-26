import React, { useId, useState } from 'react';
import { ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { uploadImageAsset } from '../../lib/storage';
import { SmartImage } from './SmartImage';

interface ImageUploadFieldProps {
  userId: string;
  tripId?: string;
  value: string;
  onChange: (value: string) => void;
  label: string;
  helperText?: string;
  aspectClass?: string;
}

export function ImageUploadField({
  userId,
  tripId = '',
  value,
  onChange,
  label,
  helperText = 'JPG, PNG, or WebP from your gallery',
  aspectClass = 'h-44',
}: ImageUploadFieldProps) {
  const inputId = useId();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setError(null);
    setUploading(true);
    try {
      const ref = await uploadImageAsset(userId, file, tripId);
      onChange(ref);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload photo.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label htmlFor={inputId} className="text-sm font-medium text-[var(--xt-text)]">
          {label}
        </label>
        {value && !uploading ? (
          <button
            type="button"
            onClick={() => onChange('')}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--xt-danger)] hover:opacity-80 min-h-[36px] px-2 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Remove
          </button>
        ) : null}
      </div>

      {value ? (
        <div className={`relative w-full overflow-hidden rounded-xl border border-[var(--xt-border)] ${aspectClass}`}>
          <SmartImage src={value} alt={label} className="w-full h-full object-cover" />
          <label
            htmlFor={inputId}
            className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-lg bg-[#081411]/85 backdrop-blur-md px-3 py-2 text-xs font-medium text-[#F5F3EC] border border-white/15 hover:bg-[#081411] cursor-pointer min-h-[40px]"
          >
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImagePlus className="w-3.5 h-3.5 text-[#C5A776]" />}
            {uploading ? 'Uploading...' : 'Replace Photo'}
          </label>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          className={`flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--xt-border)] bg-[var(--xt-surface-2)]/60 hover:border-[#C5A776]/60 transition-colors cursor-pointer px-4 text-center ${aspectClass}`}
        >
          {uploading ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin text-[var(--xt-gold)]" />
              <span className="text-sm font-medium text-[var(--xt-text)]">Optimizing & saving photo...</span>
            </>
          ) : (
            <>
              <ImagePlus className="w-6 h-6 text-[var(--xt-gold)]" />
              <span className="text-sm font-medium text-[var(--xt-text)]">Tap to upload photo</span>
              <span className="text-xs text-[var(--xt-text-muted)]">{helperText}</span>
            </>
          )}
        </label>
      )}

      <input
        id={inputId}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={uploading}
        className="sr-only"
      />

      {error ? <p className="text-xs text-[var(--xt-danger)]">{error}</p> : null}
    </div>
  );
}
