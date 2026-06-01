import { useCallback, useRef, useState } from 'react';

import { BACKEND_URL } from '../config.js';
import seedPrompts from '../seedPrompts.js';

const SESSION_STORAGE_KEY = 'jg_session_id';
const CONVERSATION_STORAGE_KEY = 'jg_conversation_id';
const EMAIL_STORAGE_KEY = 'jg_email';
const NAME_STORAGE_KEY = 'jg_name';
const COMPANY_STORAGE_KEY = 'jg_company';
const EMAIL_PROMPT = 'Before we start, please enter your business email so I can keep this session connected to your inquiry.';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function createMessage(role, content, extras = {}) {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    role,
    content,
    ...extras,
  };
}

function canUseLocalStorage() {
  try {
    const testKey = '__jg_storage_test__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

function readLocalStorage(key) {
  if (!canUseLocalStorage()) {
    return '';
  }

  return window.localStorage.getItem(key) || '';
}

function writeLocalStorage(key, value) {
  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.setItem(key, value);
}

function createSessionId() {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `jg-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getOrCreateSessionId() {
  const existingSessionId = readLocalStorage(SESSION_STORAGE_KEY);

  if (existingSessionId) {
    return existingSessionId;
  }

  const sessionId = createSessionId();
  writeLocalStorage(SESSION_STORAGE_KEY, sessionId);
  return sessionId;
}

function getOrCreateConversationId() {
  const existingConversationId = readLocalStorage(CONVERSATION_STORAGE_KEY);

  if (existingConversationId) {
    return existingConversationId;
  }

  const conversationId = createSessionId();
  writeLocalStorage(CONVERSATION_STORAGE_KEY, conversationId);
  return conversationId;
}

function getErrorMessage(error) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Something went wrong. Please try again.';
}

function parseSseEvent(rawEvent) {
  const eventName = rawEvent
    .split('\n')
    .find((line) => line.startsWith('event:'))
    ?.slice(6)
    .trim() || 'message';

  const dataLines = rawEvent
    .split('\n')
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).trimStart());

  if (dataLines.length === 0) {
    return null;
  }

  return {
    event: eventName,
    data: JSON.parse(dataLines.join('\n')),
  };
}

function appendToMessage(messageId, token) {
  return (currentMessages) =>
    currentMessages.map((message) => {
      if (message.id !== messageId) {
        return message;
      }

      return {
        ...message,
        content: `${message.content}${token}`,
      };
    });
}

function attachFinalMetadata(messageId, payload) {
  const lead = payload.lead || {};

  return (currentMessages) =>
    currentMessages.map((message) => {
      if (message.id !== messageId) {
        return message;
      }

      return {
        ...message,
        sources: Array.isArray(payload.sources) ? payload.sources : [],
        suggestedQuestions: Array.isArray(payload.suggestedQuestions) ? payload.suggestedQuestions : [],
        intent: lead.intent || 'general inquiry',
        urgency: lead.urgency || 'unknown',
        leadSignals: lead,
        leadScore: typeof lead.score === 'number' ? lead.score : 0,
        readyForCapture: Boolean(lead.email) && typeof lead.score === 'number' && lead.score >= 70,
        extractedEntities: {
          email: lead.email || '',
        },
        interests: Array.isArray(lead.sessionInterests) ? lead.sessionInterests : [],
        recommendations: payload.recommendations || { services: [], caseStudies: [], products: [] },
        topRecommendations: Array.isArray(payload.topRecommendations) ? payload.topRecommendations : [],
        clarifyingQuestion: typeof payload.clarifyingQuestion === 'string' ? payload.clarifyingQuestion : null,
        agentBehavior: payload.agentBehavior || null,
        nextActions: Array.isArray(payload.nextActions) ? payload.nextActions : [],
        handoffSummary: typeof payload.handoffSummary === 'string' ? payload.handoffSummary : null,
        conversationId: payload.conversationId || '',
        sessionId: payload.sessionId || '',
        isComplete: true,
      };
    });
}

export function useStream({ backendUrl, welcomeMessage, initialPrompts = [] } = {}) {
  const sessionIdRef = useRef(getOrCreateSessionId());
  const conversationIdRef = useRef(getOrCreateConversationId());
  
  // Check if user has already provided email in THIS browser session (during this open/close cycle)
  // If this is a new session (new window/tab), ask for email again even if localStorage has it
  const hasEmailInThisSession = readLocalStorage(`${EMAIL_STORAGE_KEY}_session`) === sessionIdRef.current;
  const initialEmail = hasEmailInThisSession ? readLocalStorage(EMAIL_STORAGE_KEY) : '';
  const emailPromptPendingRef = useRef(!initialEmail);
  const hasAskedEmailRef = useRef(Boolean(initialEmail));
  const backendBaseUrl = backendUrl ? backendUrl.replace(/\/+$/, '') : BACKEND_URL;
  const initialBotText = typeof welcomeMessage === 'string' && welcomeMessage.trim()
    ? welcomeMessage.trim()
    : 'Hi! I’m Justo Genie. Ask me anything about Justo Global.';
  const initialSuggested = Array.isArray(initialPrompts) && initialPrompts.length > 0
    ? initialPrompts.slice(0, 3)
    : seedPrompts.slice(0, 3);

  const [messages, setMessages] = useState([
    createMessage('bot', initialEmail ? initialBotText : EMAIL_PROMPT, {
      isComplete: true,
      sources: [],
      suggestedQuestions: initialEmail ? initialSuggested : [],
    }),
  ]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState('');

  const sendMessage = useCallback(
    async (text) => {
      const message = typeof text === 'string' ? text.trim() : '';

      if (!message || isStreaming) {
        return;
      }

      if (emailPromptPendingRef.current) {
        if (EMAIL_PATTERN.test(message)) {
          writeLocalStorage(EMAIL_STORAGE_KEY, message);
          // Mark that email was provided in THIS session
          writeLocalStorage(`${EMAIL_STORAGE_KEY}_session`, sessionIdRef.current);
          hasAskedEmailRef.current = true;
          emailPromptPendingRef.current = false;
          setError('');
          setMessages((currentMessages) => [
            ...currentMessages,
            createMessage('user', message),
            createMessage('bot', initialBotText, {
              isComplete: true,
              sources: [],
              suggestedQuestions: initialSuggested,
            }),
          ]);
          return;
        }

        setError('Please enter a valid business email to start the chat.');
        return;
      }

      const botMessage = createMessage('bot', '', {
        sources: [],
        suggestedQuestions: [],
        isComplete: false,
      });

      setError('');
      setIsStreaming(true);
      setMessages((currentMessages) => [
        ...currentMessages.map((currentMessage) => ({
          ...currentMessage,
          suggestedQuestions: [],
        })),
        createMessage('user', message),
        botMessage,
      ]);

      try {
        const visitorEmail = readLocalStorage(EMAIL_STORAGE_KEY);
        const visitorName = readLocalStorage(NAME_STORAGE_KEY);
        const visitorCompany = readLocalStorage(COMPANY_STORAGE_KEY);

        const response = await fetch(`${backendBaseUrl}/stream`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            message,
            conversationId: conversationIdRef.current,
            sessionId: sessionIdRef.current,
            metadata: {
              visitor: {
                name: visitorName,
                email: visitorEmail,
                company: visitorCompany,
              },
            },
          }),
        });

        if (!response.ok || !response.body) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.message || `Stream request failed with HTTP ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let isDone = false;

        while (!isDone) {
          const result = await reader.read();
          isDone = result.done;
          buffer += decoder.decode(result.value || new Uint8Array(), { stream: !isDone });

          const events = buffer.split('\n\n');
          buffer = events.pop() ?? '';

          for (const rawEvent of events) {
            const parsedEvent = parseSseEvent(rawEvent);

            if (!parsedEvent) {
              continue;
            }

            if (parsedEvent.event === 'status') {
              setMessages((currentMessages) =>
                currentMessages.map((currentMessage) => {
                  if (currentMessage.id !== botMessage.id || currentMessage.content) {
                    return currentMessage;
                  }

                  return {
                    ...currentMessage,
                    thinkingStatus: parsedEvent.data.message || '',
                  };
                })
              );
            }

            if (parsedEvent.event === 'token') {
              setMessages(appendToMessage(botMessage.id, parsedEvent.data.text || ''));
            }

            if (parsedEvent.event === 'final') {
              setMessages(attachFinalMetadata(botMessage.id, parsedEvent.data));
            }

            if (parsedEvent.event === 'error') {
              const debugInfo = parsedEvent.data.debug ? ` [Debug: ${parsedEvent.data.debug}]` : '';
              throw new Error((parsedEvent.data.message || 'Streaming failed') + debugInfo);
            }
          }
        }

        const remainingEvent = buffer.trim() ? parseSseEvent(buffer) : null;

        if (remainingEvent?.event === 'error') {
          throw new Error(remainingEvent.data.message || 'Streaming failed');
        }

        if (remainingEvent?.event === 'final') {
          setMessages(attachFinalMetadata(botMessage.id, remainingEvent.data));
        }

        if (!hasAskedEmailRef.current && !readLocalStorage(EMAIL_STORAGE_KEY)) {
          hasAskedEmailRef.current = true;
          emailPromptPendingRef.current = true;
          setMessages((currentMessages) => [
            ...currentMessages,
            createMessage('bot', EMAIL_PROMPT, {
              isComplete: true,
              sources: [],
              suggestedQuestions: [],
            }),
          ]);
        }
      } catch (streamError) {
        const errorMessage = getErrorMessage(streamError);
        setError(errorMessage);
        setMessages((currentMessages) =>
          currentMessages.map((currentMessage) => {
            if (currentMessage.id !== botMessage.id) {
              return currentMessage;
            }

            return {
              ...currentMessage,
              content:
                currentMessage.content ||
                'I’m sorry, I could not stream a response right now. Please try again.',
              isComplete: true,
            };
          })
        );
      } finally {
        setIsStreaming(false);
      }
    },
    [isStreaming]
  );

  return {
    messages,
    isStreaming,
    error,
    sendMessage,
    sessionId: sessionIdRef.current,
    conversationId: conversationIdRef.current,
  };
}
