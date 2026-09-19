import React from 'react';
import ReactDOM from 'react-dom/client';
import { MusicCreationFlow } from './features/music-flow/MusicCreationFlow';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MusicCreationFlow />
  </React.StrictMode>
);
