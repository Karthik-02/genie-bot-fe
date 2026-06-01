import PropTypes from 'prop-types';

export default function ClarifyingQuestion({ question, onAnswer }) {
  if (!question) {
    return null;
  }

  return (
    <div className="jg-clarifying-question">
      <div className="jg-clarifying-question-icon" aria-hidden="true">
        💡
      </div>
      <p className="jg-clarifying-question-text">{question}</p>
      <button
        type="button"
        className="jg-clarifying-question-dismiss"
        onClick={() => onAnswer?.()}
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}

ClarifyingQuestion.propTypes = {
  question: PropTypes.string,
  onAnswer: PropTypes.func,
};

ClarifyingQuestion.defaultProps = {
  question: null,
  onAnswer: null,
};
