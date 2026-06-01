import { useState } from 'react';
import { FiCheckCircle } from 'react-icons/fi';
import { BACKEND_URL } from '../config.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LeadCapturePrompt({
  sessionId,
  conversationId,
  leadScore = 0,
  extractedEntities = {},
  interests = [],
  handoffSummary = '',
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState(extractedEntities.email || '');
  const [company, setCompany] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const backendUrl = (window.__BACKEND_URL__ || BACKEND_URL || '').replace(/\/+$/, '');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    // Validate email
    if (!EMAIL_PATTERN.test(email)) {
      setError('Please enter a valid business email.');
      return;
    }

    setIsSubmitting(true);

    try {
      const leadData = {
        email,
        name: name || null,
        company: company || null,
        sessionId,
        conversationId,
        leadScore,
        interests,
        handoffSummary,
        timestamp: new Date().toISOString(),
      };

      if (backendUrl) {
        const response = await fetch(`${backendUrl}/lead`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(leadData),
        });

        if (!response.ok) {
          throw new Error('Lead capture failed');
        }
      }

      // Save to localStorage
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('jg_email', email);
        if (name) window.localStorage.setItem('jg_name', name);
        if (company) window.localStorage.setItem('jg_company', company);
      }

      setSubmitted(true);
    } catch (err) {
      setError('Failed to save. Please try again or contact support.');
      console.error('Lead capture error:', err);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="jg-lead-capture-prompt jg-lead-capture-success">
        <div className="jg-lead-capture-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiCheckCircle style={{ color: '#166534', fontSize: '20px' }} />
            <p className="jg-lead-capture-message">Thanks! We'll be in touch soon.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="jg-lead-capture-prompt">
      <div className="jg-lead-capture-content">
        <h3 className="jg-lead-capture-title">Continue the conversation</h3>
        <p className="jg-lead-capture-description">
          Share your details so our team can follow up with personalized solutions.
        </p>

        {handoffSummary && (
          <div className="jg-lead-capture-summary">
            <p className="jg-lead-capture-summary-label">What we understand:</p>
            <p className="jg-lead-capture-summary-text">{handoffSummary}</p>
          </div>
        )}

        <form className="jg-lead-capture-form" onSubmit={handleSubmit}>
          <div className="jg-form-group">
            <label className="jg-form-label" htmlFor="lead-name">
              Full name (optional)
            </label>
            <input
              id="lead-name"
              type="text"
              className="jg-form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              disabled={isSubmitting}
            />
          </div>

          <div className="jg-form-group">
            <label className="jg-form-label" htmlFor="lead-email">
              Business email
            </label>
            <input
              id="lead-email"
              type="email"
              className="jg-form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="jg-form-group">
            <label className="jg-form-label" htmlFor="lead-company">
              Company (optional)
            </label>
            <input
              id="lead-company"
              type="text"
              className="jg-form-input"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Your Company"
              disabled={isSubmitting}
            />
          </div>

          {error && <div className="jg-form-error">{error}</div>}

          <button
            type="submit"
            className="jg-lead-capture-submit"
            disabled={isSubmitting || !email}
          >
            {isSubmitting ? 'Saving...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
