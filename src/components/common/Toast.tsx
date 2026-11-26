import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export interface ToastMessage {
  id: number;
  type: 'success' | 'error';
  text: string;
}

export function ToastBanner({
  toast,
  onDismiss,
}: {
  toast: ToastMessage | null;
  onDismiss: () => void;
}) {
  if (!toast) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 left-4 md:left-auto md:max-w-md z-50 pointer-events-none flex justify-end">
      <div
        role="status"
        className={`pointer-events-auto flex items-center gap-3 rounded-xl px-4 py-3 shadow-xl border backdrop-blur-md ${
          toast.type === 'success'
            ? 'bg-[#10211B]/95 border-[#5FB382]/40 text-[#F5F3EC]'
            : 'bg-[#1f1314]/95 border-[#D96B6B]/40 text-[#F5F3EC]'
        }`}
      >
        {toast.type === 'success' ? (
          <CheckCircle2 className="w-4 h-4 text-[#5FB382] shrink-0" />
        ) : (
          <AlertCircle className="w-4 h-4 text-[#D96B6B] shrink-0" />
        )}
        <p className="text-sm font-medium flex-1">{toast.text}</p>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss notification"
          className="p-1 text-[#A8B3AC] hover:text-[#F5F3EC] cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
