import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConsoleChrome } from './components/ConsoleChrome';
import { Landing } from './views/Landing';
import { Builder } from './views/Builder';
import { DeployManagedSuccess } from './views/DeployManagedSuccess';
import { DeployGitHubSuccess } from './views/DeployGitHubSuccess';
import { DeployDownloadSuccess } from './views/DeployDownloadSuccess';

const basename = import.meta.env.BASE_URL.replace(/\/$/, '');

export default function App() {
  return (
    <BrowserRouter basename={basename || '/'}>
      <ConsoleChrome>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/builder" element={<Builder />} />
          <Route path="/deploy/managed" element={<DeployManagedSuccess />} />
          <Route path="/deploy/github" element={<DeployGitHubSuccess />} />
          <Route path="/deploy/download" element={<DeployDownloadSuccess />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ConsoleChrome>
    </BrowserRouter>
  );
}
