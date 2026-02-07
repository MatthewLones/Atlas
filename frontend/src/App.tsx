import { useCallback, useRef, useState } from 'react';
import Globe from './components/Globe';
import LocationCard from './components/LocationCard';
import GlobeControls from './components/GlobeControls';
import VersionBadge from './components/VersionBadge';
import TimeWheelSelector from './components/TimeWheelSelector';
import TravelTo from './components/TravelTo';
import GlobeStarfield from './components/GlobeStarfield';
import LoadingOverlay from './components/LoadingOverlay';
import HyperspaceCanvas, { DEFAULT_IDLE_VELOCITY } from './components/HyperspaceCanvas';
import type { HyperspaceHandle } from './components/HyperspaceCanvas';
import LandingWarp from './components/landing/LandingWarp';
import { useAppStore } from './store';
import { useSelectionStore } from './selectionStore';

/* ============================================================
   DEBUG: Module-level listener — fires for EVERY keydown on
   the page, regardless of React lifecycle or focus. If this
   doesn't log Enter, the browser itself is eating the event.
   ============================================================ */
if (typeof window !== 'undefined') {
  window.addEventListener(
    'keydown',
    (e) => {
      console.log('[GLOBAL-MODULE] keydown:', e.key, '| target:', (e.target as HTMLElement)?.tagName, '| activeElement:', document.activeElement?.tagName);
    },
    true
  );
}

type WarpState = 'idle' | 'initiating' | 'jumping';

function App() {
  const phase = useAppStore((s) => s.phase);
  const setPhase = useAppStore((s) => s.setPhase);
  const setSelectedYear = useSelectionStore((s) => s.setSelectedYear);
  const hyperspaceRef = useRef<HyperspaceHandle>(null);
  const [warpState, setWarpState] = useState<WarpState>('idle');
  const rootRef = useRef<HTMLDivElement>(null);
  const slowIdleVelocity = 1 + (DEFAULT_IDLE_VELOCITY - 1) * 0.5;
  const idleVelocity =
    (phase === 'globe' || phase === 'landing') && warpState === 'idle'
      ? slowIdleVelocity
      : DEFAULT_IDLE_VELOCITY;

  /* When the landing warp finishes:
     1. Set the chosen year in the selection store (updates era + meta)
     2. Switch phase to 'globe' — reveals the globe + UI controls */
  const handleLandingComplete = useCallback(
    (year: number) => {
      setSelectedYear(year);
      setPhase('globe');
    },
    [setSelectedYear, setPhase]
  );

  /* When the hyperspace jump finishes → transition to loading phase */
  const handleJumpComplete = useCallback(() => {
    setWarpState('idle');
    setPhase('loading');
  }, [setPhase]);

  const handleEnterButtonPress = useCallback(() => {
    if (phase !== 'globe' || warpState !== 'idle') return;

    setWarpState('initiating');
    hyperspaceRef.current?.initiate();

    let released = false;
    const endPress = () => {
      if (released) return;
      released = true;
      setWarpState('jumping');
      hyperspaceRef.current?.release();
    };

    window.addEventListener('pointerup', endPress, { once: true });
    window.addEventListener('pointercancel', endPress, { once: true });
  }, [phase, warpState]);

  /* Determine if globe + UI should be visible */
  const showGlobe = phase === 'globe' || phase === 'landing';
  const showGlobeUI = phase === 'globe' && warpState === 'idle';
  const globeFading = warpState === 'jumping';
  const showIdleStarfield = phase === 'globe' && warpState === 'idle';
  const showGlobeStarfield = phase === 'globe';

  return (
    <div
      ref={rootRef}
      tabIndex={-1}
      className="relative w-full h-full bg-[#000008] overflow-hidden"
      style={{ outline: 'none' }}
    >
      {/* Hyperspace canvas — always behind everything, runs during globe + loading */}
      {(showGlobe || phase === 'loading') && (
        <div
          className="globe-bg absolute inset-0 z-0"
          style={{ opacity: showIdleStarfield ? 0 : 1, transition: 'opacity 200ms ease' }}
        >
          <HyperspaceCanvas
            ref={hyperspaceRef}
            onJumpComplete={handleJumpComplete}
            idleVelocity={idleVelocity}
          />
        </div>
      )}

      {showGlobeStarfield && <GlobeStarfield visible={showIdleStarfield} />}

      {/* Globe — visible during landing (preloading) and globe phase */}
      {showGlobe && (
        <div
          className={`relative z-[1] ${globeFading ? 'globe-fade-out' : ''}`}
        >
          <Globe />
        </div>
      )}

      {/* UI controls — only when globe is idle (not warping) */}
      {showGlobeUI && (
        <>
          <VersionBadge />
          <GlobeControls />
          <TimeWheelSelector onEnterPress={handleEnterButtonPress} />
          <TravelTo />
          <LocationCard />
        </>
      )}

      {/* Landing overlay — sits on top (z-100), fades out to reveal globe */}
      {phase === 'landing' && (
        <LandingWarp onComplete={handleLandingComplete} />
      )}

      {/* Loading phase — just the hyperspace idle starfield, UI added later */}
      {phase === 'loading' && (
        <LoadingOverlay />
      )}

      {phase === 'exploring' && (
        <div className="flex items-center justify-center w-full h-full">
          <p className="text-white/30 text-lg">World explorer coming soon...</p>
        </div>
      )}
    </div>
  );
}

export default App;
