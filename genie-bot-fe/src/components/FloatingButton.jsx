import { BRAND_COLOR } from '../config.js';
import { FiMessageCircle, FiX } from 'react-icons/fi';

export default function FloatingButton({ isOpen, onClick }) {
  return (
    <button
      type="button"
      className="jg-floating-button"
      onClick={onClick}
      aria-label={isOpen ? 'Close Justo Genie chat' : 'Open Justo Genie chat'}
      aria-expanded={isOpen}
      style={{ backgroundColor: BRAND_COLOR }}
    >
      <span className="jg-floating-initials">JG</span>
      <span className="jg-floating-icon" aria-hidden="true">
        {isOpen ? <FiX /> : <FiMessageCircle />}
      </span>
    </button>
  );
}
