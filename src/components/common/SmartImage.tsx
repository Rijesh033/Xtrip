import { useEffect, useState } from 'react';
import { Mountain } from 'lucide-react';
import { resolveMediaUrl } from '../../lib/storage';

interface SmartImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackLabel?: string;
}

export function SmartImage({ src, alt, className = '', fallbackLabel }: SmartImageProps) {
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(() =>
    src && !src.startsWith('media:') ? src : null
  );
  const [loading, setLoading] = useState<boolean>(() => Boolean(src && src.startsWith('media:')));
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    let active = true;
    setErrored(false);

    if (!src) {
      setResolvedUrl(null);
      setLoading(false);
      return;
    }

    if (!src.startsWith('media:')) {
      setResolvedUrl(src);
      setLoading(false);
      return;
    }

    setLoading(true);
    resolveMediaUrl(src)
      .then((url) => {
        if (!active) return;
        setResolvedUrl(url);
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setResolvedUrl(null);
        setLoading(false);
        setErrored(true);
      });

    return () => {
      active = false;
    };
  }, [src]);

  if (loading) {
    return (
      <div
        className={`animate-pulse bg-[var(--xt-surface-2)] flex items-center justify-center ${className}`}
        aria-label={alt}
      />
    );
  }

  if (!resolvedUrl || errored) {
    return (
      <div
        className={`bg-gradient-to-br from-[#152820] via-[#10211B] to-[#081411] flex flex-col items-center justify-center gap-2 text-[#A8B3AC] p-4 ${className}`}
        role="img"
        aria-label={alt}
      >
        <Mountain className="w-6 h-6 text-[#C5A776]/70" />
        {fallbackLabel ? (
          <span className="text-xs font-medium text-center line-clamp-1 text-[#F5F3EC]/80">
            {fallbackLabel}
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <img
      src={resolvedUrl}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setErrored(true)}
      className={className}
    />
  );
}
