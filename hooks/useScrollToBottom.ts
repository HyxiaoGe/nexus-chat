
import { useRef, useState, useEffect, useCallback } from 'react';

export const useScrollToBottom = (dependencies: any[]) => {
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
      behavior
    });
    setIsAtBottom(true);
    setShowScrollButton(false);
  }, []);

  // Auto-scroll effect
  useEffect(() => {
    if (isAtBottom) {
      scrollToBottom('smooth');
    }
  }, [...dependencies, isAtBottom, scrollToBottom]);

  return {
    scrollRef,
    onScroll: handleScroll,
    scrollToBottom,
    showScrollButton
  };
};
