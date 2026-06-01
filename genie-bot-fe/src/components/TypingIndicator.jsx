export default function TypingIndicator({ label = '' }) {
  return (
    <span className="jg-typing-wrap" aria-label="Justo Genie is typing">
      <span className="jg-typing-indicator">
        <span className="dot dot-1" />
        <span className="dot dot-2" />
        <span className="dot dot-3" />
      </span>
      {label ? <span className="jg-thinking-label">{label}</span> : null}
    </span>
  );
}
