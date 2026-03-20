import { useCallback } from 'react';

interface UseReelPlayerProps {
  /** The index of the currently visible reel (from FlatList viewability). */
  activeIndex: number;
}

interface UseReelPlayerReturn {
  /**
   * Returns true if the reel at `index` is the currently visible one.
   * Pass the result as the `isActive` prop to ReelPlayer.
   */
  isActive: (index: number) => boolean;
  /**
   * Convenience: returns `{ shouldPlay: boolean }` for the reel at `index`.
   * `shouldPlay` is true only for the active reel.
   */
  getPlayerProps: (index: number) => { shouldPlay: boolean };
}

/**
 * Manages play/pause state for the TikTok-style reel feed.
 *
 * Only the reel at `activeIndex` is allowed to play; all others are paused.
 * This hook is intentionally stateless (it reads `activeIndex` from the
 * parent) so it can be called once at the screen level and passed down.
 */
export function useReelPlayer({ activeIndex }: UseReelPlayerProps): UseReelPlayerReturn {
  const isActive = useCallback(
    (index: number) => index === activeIndex,
    [activeIndex],
  );

  const getPlayerProps = useCallback(
    (index: number) => ({ shouldPlay: index === activeIndex }),
    [activeIndex],
  );

  return { isActive, getPlayerProps };
}
