"use client";

import React from "react";

export default function QuizProgress({ completionPercent }) {
  return (
    <div
      className="progress-track"
      role="progressbar"
      aria-valuemin="0"
      aria-valuemax="100"
      aria-valuenow={completionPercent}
    >
      <div id="progressBar" className="progress-bar" style={{ width: `${completionPercent}%` }}></div>
    </div>
  );
}
