import { useEffect, useMemo, useRef, useState } from 'react';
import { useAppStore } from '../store';
import { useSelectionStore } from '../selectionStore';
import { fetchLoadingPhrases } from '../utils/loadingPhrases';
import './LoadingOverlay.css';

const ROTATE_MS = 2600;

function formatYear(year: number): string {
  if (year < 0) return `${Math.abs(year)} BCE`;
  return `${year} CE`;
}

function fallbackPhrases(location: string): string[] {
  const loc = location.toLowerCase();
  return [
    `gathering supplies for ${loc}...`,
    'checking maps under starlight...',
    'tightening straps on worn satchels...',
    'listening for distant footsteps...',
    'preparing provisions for the road...',
    'studying landmarks in the dark...',
    'packing tools for the journey...',
    'steadying breath before the crossing...',
    'tracing routes across the landscape...',
    'waiting for the right moment...',
  ];
}

export default function LoadingOverlay() {
  const location = useAppStore((s) => s.location);
  const year = useSelectionStore((s) => s.selectedYear);
  const era = useSelectionStore((s) => s.selectedEra);

  const locationLabel = location?.name ?? 'Unknown location';
  const yearLabel = useMemo(() => formatYear(year), [year]);
  const subtitle = `Preparing ${yearLabel} ${locationLabel} for exploration`;

  const [phrases, setPhrases] = useState<string[]>(() => fallbackPhrases(locationLabel));
  const [index, setIndex] = useState(0);
  const requestKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const requestKey = `${year}|${locationLabel}`;
    if (requestKeyRef.current === requestKey) return;
    requestKeyRef.current = requestKey;

    const controller = new AbortController();
    setPhrases(fallbackPhrases(locationLabel));
    setIndex(0);

    fetchLoadingPhrases(
      {
        location: locationLabel,
        year,
        era,
        lat: location?.lat,
        lng: location?.lng,
        count: 14,
      },
      controller.signal,
    )
      .then((next) => {
        if (controller.signal.aborted) return;
        if (next.length > 0) {
          setPhrases(next);
          setIndex(0);
        }
      })
      .catch(() => {
        // Keep fallback phrases on error.
      });

    return () => controller.abort();
  }, [era, location?.lat, location?.lng, locationLabel, year]);

  useEffect(() => {
    if (phrases.length <= 1) return;
    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % phrases.length);
    }, ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [phrases]);

  const rawPhrase = phrases[index] ?? 'preparing...';
  const phrase = rawPhrase.replace(/^[\s|¦│▏▌▍▎▏–—•·-]+/u, '');

  return (
    <div className="loading-overlay">
      <div className="loading-overlay__inner">
        <div
          key={`${index}-${phrase}`}
          className="loading-overlay__title"
          style={{ animationDuration: `${ROTATE_MS}ms` }}
        >
          {phrase}
        </div>
        <div className="loading-overlay__subtitle">{subtitle}</div>
      </div>
    </div>
  );
}
