import { useState } from 'react';

import ChatPanel from './components/ChatPanel.jsx';
import FloatingButton from './components/FloatingButton.jsx';

export default function App() {
  const [isOpen, setIsOpen] = useState(false);

  function toggleChat() {
    setIsOpen((currentValue) => !currentValue);
  }

  function minimizeChat() {
    setIsOpen(false);
  }

  return (
    <div className="jg-widget-root">
      {isOpen ? <ChatPanel onMinimize={minimizeChat} /> : null}
      <FloatingButton isOpen={isOpen} onClick={toggleChat} />
    </div>
  );
}
