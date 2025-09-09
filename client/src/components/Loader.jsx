import React from 'react';

const Loader = () => {
  return (
    <div className="flex-center h-screen w-full bg-black/50">
      <div className="loader" />
      <span className="ml-4 text-white text-lg">Loading...</span>
    </div>
  );
};

// Inline styles for the loader (or move to a CSS file)
const styles = `
  .loader {
    width: 50px;
    height: 50px;
    border: 5px solid #ffffff;
    border-top: 5px solid #4c535b; /* Accent color */
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .flex-center {
    display: flex;
    justify-content: center;
    align-items: center;
  }
`;

// Inject styles into the document (for inline CSS)
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

export default Loader;