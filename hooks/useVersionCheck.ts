import { useState, useEffect, useRef } from 'react';

export const useVersionCheck = () => {
  const [hasUpdate, setHasUpdate] = useState(false);
  const initialVersionRef = useRef<number | null>(null);

  const checkForUpdate = async () => {
    try {
      // Append timestamp to prevent caching
      const response = await fetch(`/version.json?t=${Date.now()}`);
      if (!response.ok) return;

      const data = await response.json();
      const latestVersion = data.version;

      if (initialVersionRef.current === null) {
        // First load: set the initial version
        initialVersionRef.current = latestVersion;
      } else if (latestVersion !== initialVersionRef.current) {
        // Subsequent loads: check if version changed
        setHasUpdate(true);
      }
    } catch (error) {
      // Ignore errors (e.g., network offline, file not found in dev)
      console.debug('Version check skipped');
    }
  };

  const reloadPage = () => {
    window.location.reload();
  };

  useEffect(() => {
    // Check immediately on mount
    checkForUpdate();

    // Then check every 60 seconds
    // Increased frequency slightly to ensure users get updates reasonably fast
    // but not too aggressive to spam the server.
    const interval = setInterval(checkForUpdate, 60 * 1000);

    // Also check when the window regains focus (user comes back to tab)
    const onFocus = () => checkForUpdate();
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  return { hasUpdate, reloadPage };
};