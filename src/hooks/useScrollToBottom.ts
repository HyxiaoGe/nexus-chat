import { useRef, useState, useEffect, useCallback } from 'react';

export const useScrollToBottom = (dependencies: unknown[]) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Threshold in pixels to consider "at bottom"
  const BOTTOM_THRESHOLD = 100;

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const distanceToBottom = scrollHeight - scrollTop - clientHeight;

    const currentlyAtBottom = distanceToBottom < BOTTOM_THRESHOLD;
    setIsAtBottom(currentlyAtBottom);
    setShowScrollButton(!currentlyAtBottom);
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior,
    });
    setIsAtBottom(true);
    setShowScrollButton(false);
  }, []);

  // Auto-scroll effect
  useEffect(() => {
    if (isAtBottom && scrollRef.current) {
      // Directly scroll without calling setState to avoid sync updates in effect
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencies, isAtBottom]);

  return {
    scrollRef,
    onScroll: handleScroll,
    scrollToBottom,
    showScrollButton,
  };
};
