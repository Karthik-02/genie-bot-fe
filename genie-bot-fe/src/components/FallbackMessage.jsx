export default function FallbackMessage({ type = 'no_answer' }) {
  const messages = {
    no_answer: "I couldn't find a clear answer from our knowledge base. Try rephrasing or ask a different question.",
    llm_error: "Something went wrong while generating the response. Please try again in a moment.",
    network_error: "I couldn't reach the server — check your connection and try again.",
  };

  return (
    <div className="jg-fallback-message" role="status">
      <div className="jg-fallback-title">Heads up</div>
      <div className="jg-fallback-body">{messages[type] || messages.no_answer}</div>
    </div>
  );
}
