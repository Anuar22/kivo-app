export default function SuccessModal({ title = "Success!", message, buttonLabel = "Go Back", onClose }) {
  return (
    <div className="success-modal-overlay" onClick={onClose}>
      <div className="success-modal-card" onClick={e => e.stopPropagation()}>
        <div className="success-modal-icon">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 className="success-modal-title">{title}</h2>
        {message && <p className="success-modal-text">{message}</p>}
        <button className="success-modal-btn" onClick={onClose}>{buttonLabel}</button>
      </div>
    </div>
  );
}
