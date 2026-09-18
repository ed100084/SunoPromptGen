import React from 'react';
import ReactDOM from 'react-dom/client';
import { V6Workspace } from './features/workspace/V6Workspace';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <V6Workspace />
  </React.StrictMode>
);
