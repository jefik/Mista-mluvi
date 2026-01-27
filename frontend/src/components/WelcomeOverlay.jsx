import { useState } from "react";

export const WelcomeOverlay = () => {
  const [isVisible, setIsVisible] = useState(true);

  return (
    <div className={`app-container ${isVisible ? "welcome-open" : "welcome-closed"}`}>
      <div className="welcome-message">
        <button className="toggle-welcome" onClick={() => setIsVisible(!isVisible)} type="button">
          <div className="button-inner">
            {isVisible ? (
              <svg
                className="icon"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="3"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            ) : (
              <svg
                className="icon"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="3"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
              </svg>
            )}
            <span className="button-text">{isVisible ? "Schovat Informace" : "Zobrazit Informace"}</span>
          </div>
        </button>
        <div className="welcome-content">
          <h2>Místa mluví</h2>
          <p>Mapa vzpomínek - Kliknutím na mapu zanecháte vzkaz</p>
        </div>
      </div>
    </div>
  );
};
