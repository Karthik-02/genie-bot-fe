import React from 'react';
import { createRoot } from 'react-dom/client';

import ChatPanel from './components/ChatPanel.jsx';
import './styles.css';

const params = new URLSearchParams(window.location.search);
const backendUrl = params.get('backendUrl') || undefined;
const brandColor = params.get('brandColor') || undefined;
const welcomeMessage = params.get('welcomeMessage') || undefined;
const prompts = params
  .get('prompts')
  ?.split(',')
  .map((prompt) => prompt.trim())
  .filter(Boolean) || [];

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <div className="jg-widget-root jg-iframe-root">
      <ChatPanel
        backendUrl={backendUrl}
        brandColor={brandColor}
        welcomeMessage={welcomeMessage}
        prompts={prompts}
        iframeMode
      />
    </div>
  </React.StrictMode>
);
