import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

// StrictMode removed: it double-invokes effects in dev, which conflicts
// with our intentional side-effects in mount-time effects (clearChat +
// autoplay dispatch in ChatSidebar). The wizard's effect orchestration
// is too coupled to absorb the double-invoke without spurious chat dupes.
createRoot(document.getElementById('root')!).render(<App />);
