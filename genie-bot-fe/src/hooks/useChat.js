import { useCallback, useState } from 'react';

import { BACKEND_URL } from '../config.js';

function createMessage(role, content) {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    role,
    content,
  };
}

function getErrorMessage(error) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Something went wrong. Please try again.';
}

export function useChat() {
  const [messages, setMessages] = useState([
    createMessage('bot', 'Hi! I’m Justo Genie. Ask me anything about Justo Global.'),
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const sendMessage = useCallback(
    async (text) => {
      const message = typeof text === 'string' ? text.trim() : '';

      if (!message || isLoading) {
        return;
      }

      setError('');
      setIsLoading(true);
      setMessages((currentMessages) => [...currentMessages, createMessage('user', message)]);

      try {
        const response = await fetch(`${BACKEND_URL}/chat`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify({ message }),
        });

        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(payload.message || `Chat request failed with HTTP ${response.status}`);
        }

        if (!payload.answer || typeof payload.answer !== 'string') {
          throw new Error('Chat response did not include an answer');
        }

        setMessages((currentMessages) => [...currentMessages, createMessage('bot', payload.answer)]);
      } catch (sendError) {
        const errorMessage = getErrorMessage(sendError);
        setError(errorMessage);
        setMessages((currentMessages) => [
          ...currentMessages,
          createMessage('bot', 'I’m sorry, I could not reach Justo Genie right now. Please try again.'),
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading]
  );

  return {
    messages,
    isLoading,
    error,
    sendMessage,
  };
}
