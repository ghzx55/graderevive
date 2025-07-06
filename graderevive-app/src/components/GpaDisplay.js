import React from 'react';

function GpaDisplay({ label, gpa, isRetake = false, retakeLabelPrefix = "예상" }) {
  const displayGpa = gpa ? gpa.toFixed(2) : 'N/A';

  let fullLabel = label;
  if (isRetake && gpa !== null && gpa !== undefined) { // Only add prefix if it's a retake AND gpa is a valid number
    fullLabel = `${retakeLabelPrefix} ${label}`;
  }

  return (
    <p>
      {fullLabel}: <span>{displayGpa}</span>
    </p>
  );
}

export default GpaDisplay;
