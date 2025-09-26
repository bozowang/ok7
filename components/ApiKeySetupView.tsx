import React from 'react';

/**
 * @fileoverview This component is intentionally not a form.
 * Per security and configuration guidelines, the Gemini API key is managed
 * exclusively via the `API_KEY` environment variable on the server or during
 * the build process. It should not be handled or exposed in the client-side UI.
 */
const ApiKeySetupView: React.FC = () => {
  return (
    <div className="p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 my-4 rounded">
      <p className="font-bold">設定資訊</p>
      <p>API 金鑰已透過安全的環境變數進行設定，無需在此處進行任何操作。</p>
    </div>
  );
};

export default ApiKeySetupView;
