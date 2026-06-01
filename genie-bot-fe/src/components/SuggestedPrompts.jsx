export default function SuggestedPrompts({ prompts, onPromptClick, disabled }) {
  const visiblePrompts = Array.isArray(prompts) ? prompts.slice(0, 3) : [];

  if (visiblePrompts.length === 0) {
    return null;
  }

  return (
    <div className="jg-suggested-prompts" aria-label="Suggested questions">
      {visiblePrompts.map((prompt) => (
        <button
          key={prompt}
          type="button"
          className="jg-suggested-chip"
          onClick={() => onPromptClick(prompt)}
          disabled={disabled}
        >
          {prompt}
        </button>
      ))}
    </div>
  );
}
