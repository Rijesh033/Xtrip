import { Loader2 } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  destructive = true,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/65 backdrop-blur-sm p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl bg-[var(--xt-surface)] border border-[var(--xt-border)] p-6 shadow-2xl space-y-4">
        <div className="space-y-1.5">
          <h3 id="confirm-dialog-title" className="font-display text-xl font-semibold text-[var(--xt-text)]">
            {title}
          </h3>
          <p className="text-sm leading-relaxed text-[var(--xt-text-muted)]">{message}</p>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="min-h-[44px] px-4 py-2.5 rounded-xl border border-[var(--xt-border)] text-sm font-medium text-[var(--xt-text)] hover:bg-[var(--xt-surface-2)] transition-colors cursor-pointer whitespace-nowrap"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`min-h-[44px] px-5 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
              destructive
                ? 'bg-[#B94A4A] text-white hover:bg-[#a23f3f]'
                : 'bg-[var(--xt-gold)] text-[#081411] hover:opacity-90'
            }`}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
