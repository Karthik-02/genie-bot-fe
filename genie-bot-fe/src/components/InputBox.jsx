import { useState } from 'react';
import { FiSend } from 'react-icons/fi';

export default function InputBox({ onSendMessage, isStreaming }) {
  const [text, setText] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();

    const message = text.trim();

    if (!message || isStreaming) {
      return;
    }

    setText('');
    await onSendMessage(message);
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  return (
    <form className="jg-input-form" onSubmit={handleSubmit}>
      <input
        className="jg-input"
        type="text"
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask about Justo Global..."
        disabled={isStreaming}
        aria-label="Message"
      />
      <button className="jg-send-button" type="submit" disabled={isStreaming || !text.trim()}>
        <FiSend aria-hidden="true" />
        <span>Send</span>
      </button>
    </form>
  );
}
