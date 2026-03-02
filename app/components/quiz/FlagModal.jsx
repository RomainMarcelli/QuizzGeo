"use client";

import React from "react";

export default function FlagModal({ flagModalCountry, flagModalPresentation, onClose }) {
  return (
    <div id="flagModal" className={`flag-modal ${flagModalCountry ? "" : "hidden"}`} aria-hidden={!flagModalCountry}>
      <div id="flagModalBackdrop" className="flag-modal-backdrop" onClick={onClose}></div>
      <div className="flag-modal-content" role="dialog" aria-modal="true" aria-label="Drapeau en plein ecran">
        <button id="flagModalClose" className="flag-modal-close" type="button" aria-label="Fermer" onClick={onClose}>
          Fermer
        </button>
        <div className="flag-modal-visual">
          {flagModalCountry && flagModalPresentation ? (
            <>
              <img
                id="flagModalImage"
                className="flag-modal-image"
                src={`https://flagcdn.com/w1280/${flagModalCountry.code}.png`}
                alt={flagModalPresentation.alt}
              />
              <p id="flagModalLabel" className={`flag-modal-label ${flagModalPresentation.showLabel ? "" : "hidden"}`}>
                {flagModalPresentation.label}
              </p>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
