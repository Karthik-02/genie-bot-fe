import { useEffect, useLayoutEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

import TypingIndicator from './TypingIndicator.jsx';
import RecommendationCards from './RecommendationCards.jsx';
import ClarifyingQuestion from './ClarifyingQuestion.jsx';

function getSourceLabel(source) {
  if (!source || source === 'unknown') {
    return 'Source';
  }

  try {
    const url = new URL(source);
    const path = url.pathname.replace(/^\/|\/$/g, '');
    return path || url.hostname;
  } catch {
    return source;
  }
}

function SourcePills({ sources }) {
  const visibleSources = Array.isArray(sources) ? sources.slice(0, 3) : [];

  if (visibleSources.length === 0) {
    return null;
  }

  return (
    <div className="jg-source-pills" aria-label="Sources">
      {visibleSources.map((source, index) => (
        <span
          key={`${source.id || source.source}-${index}`}
          className="jg-source-pill"
          title={source.source}
        >
          {source.title || 'Justo'} · {getSourceLabel(source.source)}
        </span>
      ))}
    </div>
  );
}

export default function MessageList({ messages, isStreaming }) {
  const listRef = useRef(null);
  const isPinnedToBottomRef = useRef(true);
  const lastMessage = messages[messages.length - 1];

  useEffect(() => {
    const list = listRef.current;

    if (!list) {
      return undefined;
    }

    function updatePinnedState() {
      const distanceFromBottom = list.scrollHeight - list.scrollTop - list.clientHeight;
      isPinnedToBottomRef.current = distanceFromBottom < 80;
    }

    updatePinnedState();
    list.addEventListener('scroll', updatePinnedState, { passive: true });

    return () => {
      list.removeEventListener('scroll', updatePinnedState);
    };
  }, []);

  useLayoutEffect(() => {
    const list = listRef.current;

    if (!list || !isPinnedToBottomRef.current) {
      return;
    }

    list.scrollTop = list.scrollHeight;
  }, [messages, isStreaming]);

  const messageVariants = {
    hidden: (role) => ({ opacity: 0, x: role === 'user' ? 40 : -40, scale: 0.995 }),
    enter: { opacity: 1, x: 0, scale: 1, transition: { type: 'spring', stiffness: 400, damping: 30 } },
    exit: { opacity: 0, scale: 0.995, transition: { duration: 0.12 } },
  };

  return (
    <div
      ref={listRef}
      className="jg-message-list"
      role="log"
      aria-live="polite"
      aria-relevant="additions"
    >
      <AnimatePresence initial={false} mode="popLayout">
        {messages.map((message) => {
          const shouldShowTyping =
            isStreaming && message.id === lastMessage?.id && message.role === 'bot' && !message.content;

          return (
            <motion.div
              layout
              key={message.id}
              custom={message.role}
              initial="hidden"
              animate="enter"
              exit="exit"
              variants={messageVariants}
            >
              <div className={`jg-message-row jg-message-row-${message.role}`}>
                <div className="jg-message-stack">
                  <div className={`jg-message-bubble jg-message-bubble-${message.role}`}>
                    {shouldShowTyping ? (
                      <TypingIndicator label={message.thinkingStatus} />
                    ) : message.role === 'bot' ? (
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    ) : (
                      message.content
                    )}
                  </div>
                  {message.role === 'bot' ? <SourcePills sources={message.sources} /> : null}
                </div>
              </div>
              {message.role === 'bot' && message.isComplete ? (
                <>
                  {message.clarifyingQuestion ? (
                    <div className="jg-message-row jg-message-row-bot">
                      <ClarifyingQuestion question={message.clarifyingQuestion} />
                    </div>
                  ) : null}
                  {message.topRecommendations && message.topRecommendations.length > 0 ? (
                    <div className="jg-message-row jg-message-row-bot">
                      <RecommendationCards recommendations={message.topRecommendations} />
                    </div>
                  ) : null}
                </>
              ) : null}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
