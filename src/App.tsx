import React, { useEffect } from 'react';
import { KohlDashboard } from './components/kohl/KohlDashboard';
import { buildTrackingFromUrl, saveTrackingToSession, mergeTracking, getTrackingFromSession } from './services/leadTrackingService';

function App() {
  useEffect(() => {
    const incoming = buildTrackingFromUrl(window.location.search, document.referrer || undefined);
    if (incoming) {
      const existing = getTrackingFromSession();
      const merged = mergeTracking(existing ?? undefined, incoming);
      if (merged) saveTrackingToSession(merged);
    }
  }, []);

  return (
    <KohlDashboard />
  );
}

export default App;
