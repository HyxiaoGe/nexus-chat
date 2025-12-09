import { useState, useEffect } from 'react';

export const useVersionCheck = () => {
  const [hasUpdate, setHasUpdate] = useState(false);

  // __APP_VERSION__ is injected by Vite at build time
  // Use useState to lazily initialize the version to avoid calling Date.now() during render
  const [currentVersion] = useState(() =>
    typeof __APP_VERSION__ !== 'undefined' ? Number(__APP_VERSION__) : Date.now()
  );

  const checkForUpdate = async () => {
    try {
      // Append timestamp to query to prevent caching of the JSON file itself
      const response = await fetch(`/version.json?t=${Date.now()}`);
      if (!response.ok) return;

      const data = await response.json();
      const latestVersion = Number(data.version);

      // Compare the version embedded in the running JS code with the version on the server
      if (latestVersion > currentVersion) {
        console.log(`Update available: ${currentVersion} -> ${latestVersion}`);
        setHasUpdate(true);
      }
    } catch {
      console.debug('Version check skipped or failed');
    }
  };

  const reloadPage = () => {
    // Force a reload by appending the new version as a query parameter.
    // This bypasses the browser cache for index.html without needing Ctrl+F5.
    const url = new URL(window.location.href);
    url.searchParams.set('v', Date.now().toString());
    window.location.href = url.toString();
  };

  useEffect(() => {
    // Check immediately on mount
    checkForUpdate();

    // Check every 60 seconds
    const interval = setInterval(checkForUpdate, 60 * 1000);

    // Check when window regains focus
    const onFocus = () => checkForUpdate();
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { hasUpdate, reloadPage };
};
