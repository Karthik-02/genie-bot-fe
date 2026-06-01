import { BOT_NAME } from '../config.js';
import { motion } from 'framer-motion';
import { useStream } from '../hooks/useStream.js';
import InputBox from './InputBox.jsx';
import MessageList from './MessageList.jsx';
import SuggestedPrompts from './SuggestedPrompts.jsx';
import LeadCapturePrompt from './LeadCapturePrompt.jsx';

function getActiveSuggestedPrompts(messages) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];

    if (message.role === 'user') {
      return [];
    }

    if (
      message.role === 'bot' &&
      message.isComplete &&
      Array.isArray(message.suggestedQuestions) &&
      message.suggestedQuestions.length > 0
    ) {
      return message.suggestedQuestions;
    }
  }

  return [];
}

function getLeadCaptureMessage(messages, sessionId) {
  // Look for most recent bot message with readyForCapture = true
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];

    if (
      message.role === 'bot' &&
      message.isComplete &&
      message.readyForCapture === true &&
      !message.leadCaptureShown
    ) {
      return {
        message,
        sessionId,
      };
    }
  }

  return null;
}

export default function ChatPanel({ onMinimize, backendUrl, brandColor, welcomeMessage, prompts = [], iframeMode = false }) {
  const { messages, isStreaming, error, sendMessage, sessionId } = useStream({
    backendUrl,
    welcomeMessage,
    initialPrompts: prompts,
  });
  const suggestedPrompts = getActiveSuggestedPrompts(messages);
  const leadCaptureData = getLeadCaptureMessage(messages, sessionId);
  const style = brandColor ? { '--jg-brand-color': brandColor } : null;
  const className = iframeMode ? 'jg-chat-panel jg-iframe-mode' : 'jg-chat-panel';

  return (
    <motion.section
      className={className}
      style={style}
      aria-label={`${BOT_NAME} chat panel`}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <header className="jg-chat-header">
        <div className="jg-chat-avatar" aria-hidden="true">
          JG
        </div>
        <div className="jg-chat-title-block">
          <h1 className="jg-chat-title">{BOT_NAME}</h1>
          <div className="jg-chat-status">
            <span className="jg-online-dot" aria-hidden="true" />
            <span>Online</span>
          </div>
        </div>
        {onMinimize ? (
          <button
            type="button"
            className="jg-minimize-button"
            onClick={onMinimize}
            aria-label="Minimize chat"
          >
            −
          </button>
        ) : null}
      </header>

      {error ? <div className="jg-error-banner">{error}</div> : null}

      <MessageList messages={messages} isStreaming={isStreaming} />

      {leadCaptureData ? (
        <LeadCapturePrompt
          sessionId={leadCaptureData.sessionId}
          conversationId={leadCaptureData.message.conversationId}
          leadScore={leadCaptureData.message.leadScore}
          extractedEntities={leadCaptureData.message.extractedEntities}
          interests={leadCaptureData.message.interests}
          handoffSummary={leadCaptureData.message.handoffSummary}
        />
      ) : null}

      <SuggestedPrompts
        prompts={suggestedPrompts}
        onPromptClick={sendMessage}
        disabled={isStreaming}
      />
      <InputBox onSendMessage={sendMessage} isStreaming={isStreaming} />
    </motion.section>
  );
}
