import PropTypes from 'prop-types';

export default function RecommendationCards({ recommendations, onLinkClick }) {
  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  // Show max 3 cards
  const displayRecommendations = recommendations.slice(0, 3);

  return (
    <div className="jg-recommendation-cards">
      {displayRecommendations.map((rec) => (
        <a
          key={rec.id}
          href={rec.url}
          target="_blank"
          rel="noopener noreferrer"
          className="jg-recommendation-card"
          onClick={() => onLinkClick?.(rec)}
        >
          <div className="jg-recommendation-card-content">
            <div className="jg-recommendation-card-badge">{rec.category === 'case_study' ? 'Case Study' : rec.category}</div>
            <h4 className="jg-recommendation-card-title">{rec.title}</h4>
            <p className="jg-recommendation-card-source">{rec.source}</p>
          </div>
          <div className="jg-recommendation-card-icon" aria-hidden="true">
            →
          </div>
        </a>
      ))}
    </div>
  );
}

RecommendationCards.propTypes = {
  recommendations: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      title: PropTypes.string,
      source: PropTypes.string,
      url: PropTypes.string,
      category: PropTypes.string,
    })
  ),
  onLinkClick: PropTypes.func,
};

RecommendationCards.defaultProps = {
  recommendations: [],
  onLinkClick: null,
};
