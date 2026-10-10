import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from './hooks/useAuth';
import { TrackPage } from './views/TrackPage';
import './index.css';

// Public live-tracking page for SOS links: /track/<sessionId>. No sign-in needed.
const track = window.location.pathname.match(/^\/track\/([A-Za-z0-9]{20,40})\/?$/);

createRoot(document.getElementById('root')!).render(
  track ? (
    <TrackPage sessionId={track[1]} />
  ) : (
    <AuthProvider>
      <App />
    </AuthProvider>
  )
);
